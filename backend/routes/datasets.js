const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// --- Multer Configuration for Dataset Files ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'datasets');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common data formats
    const allowedTypes = ['.csv', '.json', '.xlsx', '.txt', '.parquet', '.h5', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: ' + allowedTypes.join(', ')));
    }
  }
});

// Helper function to get user by wallet address
const getUserByWallet = async (walletAddress) => {
  return await db.getAsync('SELECT * FROM users WHERE wallet_address = ?', [walletAddress]);
};

// Helper function to log dataset usage
const logDatasetUsage = async (datasetId, userId, actionType, metadata = {}) => {
  await db.runAsync(
    'INSERT INTO dataset_usage (dataset_id, user_id, action_type, metadata) VALUES (?, ?, ?, ?)',
    [datasetId, userId, actionType, JSON.stringify(metadata)]
  );
};

// --- Dataset CRUD Operations ---

// Get all datasets for a user
router.get('/', async (req, res) => {
  try {
    const { wallet_address, project_id } = req.query;
    
    if (!wallet_address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const user = await getUserByWallet(wallet_address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let sql = `
      SELECT 
        d.*,
        u.username as owner_username,
        p.name as project_name,
        CASE 
          WHEN d.zk_proof_id IS NOT NULL THEN 'privacy_protected'
          ELSE d.privacy_level
        END as effective_privacy_level
      FROM datasets d
      LEFT JOIN users u ON d.owner_id = u.id
      LEFT JOIN projects p ON d.project_id = p.id
      WHERE d.owner_id = ?
    `;
    
    const params = [user.id];
    
    if (project_id) {
      sql += ' AND d.project_id = ?';
      params.push(project_id);
    }
    
    sql += ' ORDER BY d.updated_at DESC';

    const datasets = await db.allAsync(sql, params);
    res.json(datasets);
  } catch (error) {
    console.error('Failed to get datasets:', error);
    res.status(500).json({ error: 'Failed to get datasets' });
  }
});

// Get public datasets for explore
router.get('/explore', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let sql = `
      SELECT 
        d.*,
        u.username as owner_username,
        p.name as project_name
      FROM datasets d
      LEFT JOIN users u ON d.owner_id = u.id
      LEFT JOIN projects p ON d.project_id = p.id
      WHERE d.privacy_level = 'public' AND d.status = 'ready'
    `;
    
    const params = [];
    
    if (category) {
      sql += ' AND d.category = ?';
      params.push(category);
    }
    
    if (search) {
      sql += ' AND (d.name LIKE ? OR d.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    sql += ' ORDER BY d.access_count DESC, d.updated_at DESC LIMIT 50';

    const datasets = await db.allAsync(sql, params);
    res.json(datasets);
  } catch (error) {
    console.error('Failed to get public datasets:', error);
    res.status(500).json({ error: 'Failed to get public datasets' });
  }
});

// Get recommended datasets based on user interests
router.get('/explore/recommendations', async (req, res) => {
  try {
    const { user_id, limit = 20, offset = 0 } = req.query;
    
    if (user_id) {
      // Get user's research interests
      const user = await db.getAsync('SELECT research_interests FROM users WHERE id = ?', [user_id]);
      
      if (user && user.research_interests) {
        try {
          const userInterests = JSON.parse(user.research_interests);
          
          if (Array.isArray(userInterests) && userInterests.length > 0) {
            // Find datasets with matching interests based on category, description, name, or tags
            const searchConditions = [];
            const searchParams = [];
            
            // Search in category (exact match, case insensitive)
            userInterests.forEach(interest => {
              searchConditions.push('LOWER(d.category) LIKE ?');
              searchParams.push(`%${interest.toLowerCase()}%`);
            });
            
            // Search in name and description (partial match)
            userInterests.forEach(interest => {
              searchConditions.push('LOWER(d.name) LIKE ?');
              searchConditions.push('LOWER(d.description) LIKE ?');
              searchConditions.push('LOWER(d.tags) LIKE ?');
              searchParams.push(`%${interest.toLowerCase()}%`);
              searchParams.push(`%${interest.toLowerCase()}%`);
              searchParams.push(`%${interest.toLowerCase()}%`);
            });
            
            // First try to find datasets from other users
            let recommendedDatasets = await db.allAsync(`
              SELECT 
                d.*,
                u.username as owner_username,
                p.name as project_name
              FROM datasets d
              LEFT JOIN users u ON d.owner_id = u.id
              LEFT JOIN projects p ON d.project_id = p.id
              WHERE d.privacy_level = 'public' 
                AND d.status = 'ready'
                AND d.owner_id != ?
                AND (${searchConditions.join(' OR ')})
              ORDER BY d.access_count DESC, d.updated_at DESC
              LIMIT ? OFFSET ?
            `, [user_id, ...searchParams, parseInt(limit), parseInt(offset)]);
            
            // If no results from other users, include all matching datasets (including own)
            if (recommendedDatasets.length === 0 && offset === 0) {
              recommendedDatasets = await db.allAsync(`
                SELECT 
                  d.*,
                  u.username as owner_username,
                  p.name as project_name
                FROM datasets d
                LEFT JOIN users u ON d.owner_id = u.id
                LEFT JOIN projects p ON d.project_id = p.id
                WHERE d.privacy_level = 'public' 
                  AND d.status = 'ready'
                  AND (${searchConditions.join(' OR ')})
                ORDER BY d.access_count DESC, d.updated_at DESC
                LIMIT ? OFFSET ?
              `, [...searchParams, parseInt(limit), parseInt(offset)]);
            }
            
            if (recommendedDatasets.length > 0) {
              return res.json(recommendedDatasets);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse user interests:', parseError);
        }
      }
    }
    
    // Fallback: return random datasets (excluding user's own datasets if user_id provided)
    const randomDatasets = await db.allAsync(`
      SELECT 
        d.*,
        u.username as owner_username,
        p.name as project_name
      FROM datasets d
      LEFT JOIN users u ON d.owner_id = u.id
      LEFT JOIN projects p ON d.project_id = p.id
      WHERE d.privacy_level = 'public' 
        AND d.status = 'ready'
        ${user_id ? 'AND d.owner_id != ?' : ''}
      ORDER BY RANDOM()
      LIMIT ? OFFSET ?
    `, user_id ? [user_id, parseInt(limit), parseInt(offset)] : [parseInt(limit), parseInt(offset)]);
    
    res.json(randomDatasets);
  } catch (error) {
    console.error('Failed to get recommended datasets:', error);
    res.status(500).json({ error: 'Failed to get recommended datasets' });
  }
});

// Get public dataset by ID for explore
router.get('/explore/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const dataset = await db.getAsync(`
      SELECT 
        d.*,
        u.username as owner_username,
        p.name as project_name,
        zk.status as zk_proof_status
      FROM datasets d
      LEFT JOIN users u ON d.owner_id = u.id
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN zk_proofs zk ON d.zk_proof_id = zk.id
      WHERE d.id = ? AND d.privacy_level = 'public' AND d.status = 'ready'
    `, [id]);

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found or not publicly accessible' });
    }

    // Get all files for this dataset
    const files = await db.allAsync('SELECT * FROM dataset_files WHERE dataset_id = ? ORDER BY file_order', [id]);
    
    // Add files to dataset
    dataset.files = files;
    dataset.total_size = files.reduce((sum, file) => sum + (file.file_size || 0), 0);

    res.json(dataset);
  } catch (error) {
    console.error('Failed to get public dataset:', error);
    res.status(500).json({ error: 'Failed to get dataset' });
  }
});

// Get dataset by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { wallet_address } = req.query;

    const dataset = await db.getAsync(`
      SELECT 
        d.*,
        u.username as owner_username,
        p.name as project_name,
        zk.status as zk_proof_status,
        CASE 
          WHEN d.zk_proof_id IS NOT NULL THEN 'privacy_protected'
          ELSE d.privacy_level
        END as effective_privacy_level
      FROM datasets d
      LEFT JOIN users u ON d.owner_id = u.id
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN zk_proofs zk ON d.zk_proof_id = zk.id
      WHERE d.id = ?
    `, [id]);

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    // Check access permissions
    let hasAccess = dataset.privacy_level === 'public';
    
    if (wallet_address && !hasAccess) {
      const user = await getUserByWallet(wallet_address);
      if (user) {
        // Check if user is owner
        if (user.id === dataset.owner_id) {
          hasAccess = true;
        } else {
          // Check dataset permissions
          const permission = await db.getAsync(
            'SELECT * FROM dataset_permissions WHERE dataset_id = ? AND (user_id = ? OR wallet_address = ?) AND (expires_at IS NULL OR expires_at > datetime("now"))',
            [id, user.id, wallet_address]
          );
          hasAccess = !!permission;
        }
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Log access
    if (wallet_address) {
      const user = await getUserByWallet(wallet_address);
      if (user) {
        await logDatasetUsage(id, user.id, 'view');
        // Update access count
        await db.runAsync('UPDATE datasets SET access_count = access_count + 1 WHERE id = ?', [id]);
      }
    }

    // Get all files for this dataset
    const files = await db.allAsync('SELECT * FROM dataset_files WHERE dataset_id = ? ORDER BY file_order', [id]);

    // Parse tags - handle both JSON array and comma-separated string formats
    let parsedTags = []
    if (dataset.tags) {
      try {
        parsedTags = JSON.parse(dataset.tags)
        if (!Array.isArray(parsedTags)) {
          parsedTags = []
        }
      } catch (error) {
        // If JSON parsing fails, treat as comma-separated string (legacy format)
        console.warn('Tags not in JSON format, parsing as comma-separated string:', dataset.tags)
        parsedTags = dataset.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      }
    }

    res.json({
      ...dataset,
      files: files || [],
      tags: parsedTags
    });
  } catch (error) {
    console.error('Failed to get dataset:', error);
    res.status(500).json({ error: 'Failed to get dataset' });
  }
});

// Upload new dataset
router.post('/upload', upload.array('datasets', 10), async (req, res) => { // Support up to 10 files
  try {
    const {
      name,
      description,
      owner_wallet_address,
      project_id,
      external_link,
      privacy_level = 'public',
      category = 'Other',
      tags = '[]',
      status = 'ready'
    } = req.body;

    // Ensure tags is a valid JSON string
    let parsedTags = [];
    try {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      if (!Array.isArray(parsedTags)) {
        parsedTags = [];
      }
    } catch (error) {
      console.warn('Invalid tags format, using empty array:', error);
      parsedTags = [];
    }
    const tagsString = JSON.stringify(parsedTags);

    const user = await getUserByWallet(owner_wallet_address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For drafts, allow empty files but require at least a name
    if (status === 'draft' && (!req.files || req.files.length === 0)) {
      // Draft without files - just metadata
      const result = await db.runAsync(`
        INSERT INTO datasets (
          name, description, owner_id, project_id, external_link, privacy_level,
          category, tags, total_files, total_size, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, datetime('now'), datetime('now'))
      `, [
        name,
        description,
        user.id,
        project_id || null,
        external_link || null,
        privacy_level,
        category,
        tagsString,
        status
      ]);

      return res.json({
        id: result.lastID,
        message: 'Draft saved successfully',
        status: 'draft'
      });
    }

    // Regular upload with files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Calculate total size and file count
    const totalFiles = req.files.length;
    const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);

    // Get main file info (first file or largest file)
    const mainFile = req.files.reduce((largest, file) => 
      file.size > largest.size ? file : largest
    );

    // Regular upload with files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Create dataset record
    const result = await db.runAsync(`
      INSERT INTO datasets (
        name, description, owner_id, project_id, external_link, privacy_level,
        file_path, file_name, file_size, file_type, category, tags,
        total_files, total_size, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      name,
      description,
      user.id,
      project_id || null,
      external_link || null,
      privacy_level,
      mainFile.path, // Main file path for backward compatibility
      mainFile.originalname,
      mainFile.size,
      mainFile.mimetype,
      category,
      tagsString,
      totalFiles,
      totalSize,
      status
    ]);

    const datasetId = result.lastID;

    // Insert all files into dataset_files table
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const isPrimary = file === mainFile;
      
      await db.runAsync(`
        INSERT INTO dataset_files (
          dataset_id, file_name, original_name, file_path, file_size,
          file_type, mime_type, file_order, is_primary, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        datasetId,
        file.filename,
        file.originalname,
        file.path,
        file.size,
        file.originalname.split('.').pop().toLowerCase(), // file extension
        file.mimetype,
        i,
        isPrimary
      ]);
    }

    // Simulate processing delay and then mark as ready
    setTimeout(async () => {
      try {
        await db.runAsync('UPDATE datasets SET status = ?, updated_at = datetime("now") WHERE id = ?', ['ready', datasetId]);
      } catch (err) {
        console.error('Failed to update dataset status:', err);
      }
    }, 2000);

    res.json({
      id: datasetId,
      message: `Dataset uploaded successfully with ${totalFiles} file(s)`,
      status: 'processing',
      totalFiles,
      totalSize
    });
  } catch (error) {
    console.error('Failed to upload dataset:', error);
    res.status(500).json({ error: 'Failed to upload dataset' });
  }
});

// Update dataset
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      privacy_level,
      category,
      tags,
      owner_wallet_address
    } = req.body;

    const user = await getUserByWallet(owner_wallet_address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check ownership
    const dataset = await db.getAsync('SELECT * FROM datasets WHERE id = ? AND owner_id = ?', [id, user.id]);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found or access denied' });
    }

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (privacy_level) {
      updates.push('privacy_level = ?');
      params.push(privacy_level);
      
      // If privacy level is changed to special levels that need additional processing, set status to 'uploaded'
      if (['zk_proof_protected', 'encrypted'].includes(privacy_level)) {
        updates.push('status = ?');
        params.push('uploaded');
      }
    }
    if (category) {
      updates.push('category = ?');
      params.push(category);
    }
    if (tags !== undefined) {
      // Ensure tags is a valid JSON string
      let parsedTags = [];
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        if (!Array.isArray(parsedTags)) {
          parsedTags = [];
        }
      } catch (error) {
        console.warn('Invalid tags format during update, using empty array:', error);
        parsedTags = [];
      }
      updates.push('tags = ?');
      params.push(JSON.stringify(parsedTags));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = datetime("now")');
    params.push(id);

    await db.runAsync(
      `UPDATE datasets SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'Dataset updated successfully' });
  } catch (error) {
    console.error('Failed to update dataset:', error);
    res.status(500).json({ error: 'Failed to update dataset' });
  }
});

// Delete dataset
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { owner_wallet_address } = req.body;

    const user = await getUserByWallet(owner_wallet_address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check ownership
    const dataset = await db.getAsync('SELECT * FROM datasets WHERE id = ? AND owner_id = ?', [id, user.id]);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found or access denied' });
    }

    // Delete file if exists
    if (dataset.file_path) {
      try {
        await fs.unlink(dataset.file_path);
      } catch (err) {
        console.warn('Failed to delete file:', err.message);
      }
    }

    // Delete dataset and related records
    await db.runAsync('DELETE FROM dataset_usage WHERE dataset_id = ?', [id]);
    await db.runAsync('DELETE FROM dataset_permissions WHERE dataset_id = ?', [id]);
    await db.runAsync('DELETE FROM zk_proofs WHERE dataset_id = ?', [id]);
    await db.runAsync('DELETE FROM datasets WHERE id = ?', [id]);

    res.json({ message: 'Dataset deleted successfully' });
  } catch (error) {
    console.error('Failed to delete dataset:', error);
    res.status(500).json({ error: 'Failed to delete dataset' });
  }
});

// --- Permission Management ---

// Get dataset permissions
router.get('/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const { owner_wallet_address } = req.query;

    const user = await getUserByWallet(owner_wallet_address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check ownership
    const dataset = await db.getAsync('SELECT * FROM datasets WHERE id = ? AND owner_id = ?', [id, user.id]);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found or access denied' });
    }

    const permissions = await db.allAsync(`
      SELECT 
        dp.*,
        u.username,
        u.wallet_address
      FROM dataset_permissions dp
      LEFT JOIN users u ON dp.user_id = u.id
      WHERE dp.dataset_id = ?
      ORDER BY dp.created_at DESC
    `, [id]);

    res.json(permissions);
  } catch (error) {
    console.error('Failed to get permissions:', error);
    res.status(500).json({ error: 'Failed to get permissions' });
  }
});

// Grant dataset permission
router.post('/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      owner_wallet_address,
      target_wallet_address,
      permission_type = 'read',
      access_conditions,
      expires_at
    } = req.body;

    const user = await getUserByWallet(owner_wallet_address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check ownership
    const dataset = await db.getAsync('SELECT * FROM datasets WHERE id = ? AND owner_id = ?', [id, user.id]);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found or access denied' });
    }

    const targetUser = await getUserByWallet(target_wallet_address);
    
    const result = await db.runAsync(`
      INSERT INTO dataset_permissions (
        dataset_id, user_id, wallet_address, permission_type,
        access_conditions, granted_by, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      targetUser ? targetUser.id : null,
      target_wallet_address,
      permission_type,
      access_conditions ? JSON.stringify(access_conditions) : null,
      user.id,
      expires_at
    ]);

    res.json({
      id: result.lastID,
      message: 'Permission granted successfully'
    });
  } catch (error) {
    console.error('Failed to grant permission:', error);
    res.status(500).json({ error: 'Failed to grant permission' });
  }
});

// Revoke dataset permission
router.delete('/:id/permissions/:permissionId', async (req, res) => {
  try {
    const { id, permissionId } = req.params;
    const { owner_wallet_address } = req.body;

    const user = await getUserByWallet(owner_wallet_address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check ownership
    const dataset = await db.getAsync('SELECT * FROM datasets WHERE id = ? AND owner_id = ?', [id, user.id]);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found or access denied' });
    }

    await db.runAsync('DELETE FROM dataset_permissions WHERE id = ? AND dataset_id = ?', [permissionId, id]);

    res.json({ message: 'Permission revoked successfully' });
  } catch (error) {
    console.error('Failed to revoke permission:', error);
    res.status(500).json({ error: 'Failed to revoke permission' });
  }
});

// --- ZK Proof Operations ---

// Encrypt dataset
router.post('/:id/encrypt', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      creator_wallet_address,
      algorithm = 'AES-256-GCM',
      key_size = 256,
      access_controls = [],
      key_management = 'self_managed'
    } = req.body;

    const user = await getUserByWallet(creator_wallet_address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check ownership
    const dataset = await db.getAsync('SELECT * FROM datasets WHERE id = ? AND owner_id = ?', [id, user.id]);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found or access denied' });
    }

    // Generate mock encryption data
    const encryptionId = crypto.randomUUID();
    const keyFingerprint = crypto.randomBytes(32).toString('hex');
    const encryptionMetadata = {
      algorithm,
      key_size,
      access_controls,
      key_management,
      encrypted_at: new Date().toISOString()
    };

    // Update dataset with encryption info and set status to ready
    await db.runAsync(`
      UPDATE datasets SET 
        encryption_status = ?, 
        encryption_metadata = ?, 
        status = ?, 
        updated_at = datetime("now") 
      WHERE id = ?
    `, ['encrypted', JSON.stringify(encryptionMetadata), 'ready', id]);

    res.json({
      encryption_id: encryptionId,
      algorithm,
      key_fingerprint: keyFingerprint,
      message: 'Dataset encrypted successfully'
    });
  } catch (error) {
    console.error('Failed to encrypt dataset:', error);
    res.status(500).json({ error: 'Failed to encrypt dataset' });
  }
});

// Generate ZK proof for dataset
router.post('/:id/zk-proof', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      creator_wallet_address,
      proof_type = 'privacy',
      public_inputs = []
    } = req.body;

    const user = await getUserByWallet(creator_wallet_address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check ownership
    const dataset = await db.getAsync('SELECT * FROM datasets WHERE id = ? AND owner_id = ?', [id, user.id]);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found or access denied' });
    }

    // Generate mock proof data (in real implementation, this would call ZK proof generation)
    const proofData = {
      circuit: 'privacy_preserving_v1',
      witness: crypto.randomUUID(),
      commitment: crypto.randomBytes(32).toString('hex')
    };

    const verificationKey = crypto.randomBytes(32).toString('hex');
    const circuitHash = crypto.createHash('sha256').update(JSON.stringify(proofData)).digest('hex');

    const result = await db.runAsync(`
      INSERT INTO zk_proofs (
        dataset_id, creator_id, proof_type, proof_data,
        verification_key, public_inputs, circuit_hash, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      user.id,
      proof_type,
      JSON.stringify(proofData),
      verificationKey,
      JSON.stringify(public_inputs),
      circuitHash,
      'verified' // In real implementation, this would start as 'pending'
    ]);

    // Update dataset with ZK proof reference and set status to ready
    await db.runAsync('UPDATE datasets SET zk_proof_id = ?, status = ?, updated_at = datetime("now") WHERE id = ?', [result.lastID, 'ready', id]);

    res.json({
      id: result.lastID,
      message: 'ZK proof generated successfully',
      proof_id: result.lastID,
      verification_key: verificationKey
    });
  } catch (error) {
    console.error('Failed to generate ZK proof:', error);
    res.status(500).json({ error: 'Failed to generate ZK proof' });
  }
});

// Verify ZK proof
router.post('/zk-proof/:proofId/verify', async (req, res) => {
  try {
    const { proofId } = req.params;
    const { public_inputs } = req.body;

    const proof = await db.getAsync('SELECT * FROM zk_proofs WHERE id = ?', [proofId]);
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    // Mock verification (in real implementation, this would verify the actual proof)
    const isValid = Math.random() > 0.1; // 90% success rate for demo

    if (isValid) {
      await db.runAsync(
        'UPDATE zk_proofs SET status = ?, verification_count = verification_count + 1, verified_at = datetime("now") WHERE id = ?',
        ['verified', proofId]
      );
    } else {
      await db.runAsync('UPDATE zk_proofs SET status = ? WHERE id = ?', ['failed', proofId]);
    }

    res.json({
      valid: isValid,
      proof_id: proofId,
      verification_count: proof.verification_count + (isValid ? 1 : 0)
    });
  } catch (error) {
    console.error('Failed to verify ZK proof:', error);
    res.status(500).json({ error: 'Failed to verify ZK proof' });
  }
});

// --- Usage Analytics ---

// Get dataset usage analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const { owner_wallet_address } = req.query;

    const user = await getUserByWallet(owner_wallet_address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check ownership
    const dataset = await db.getAsync('SELECT * FROM datasets WHERE id = ? AND owner_id = ?', [id, user.id]);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found or access denied' });
    }

    // Get usage statistics
    const totalUsage = await db.getAsync(
      'SELECT COUNT(*) as total_usage FROM dataset_usage WHERE dataset_id = ?',
      [id]
    );

    const usageByAction = await db.allAsync(`
      SELECT action_type, COUNT(*) as count
      FROM dataset_usage
      WHERE dataset_id = ?
      GROUP BY action_type
      ORDER BY count DESC
    `, [id]);

    const recentUsage = await db.allAsync(`
      SELECT 
        du.*,
        u.username,
        u.wallet_address
      FROM dataset_usage du
      LEFT JOIN users u ON du.user_id = u.id
      WHERE du.dataset_id = ?
      ORDER BY du.created_at DESC
      LIMIT 50
    `, [id]);

    const dailyUsage = await db.allAsync(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as usage_count
      FROM dataset_usage
      WHERE dataset_id = ? AND created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [id]);

    res.json({
      dataset_id: id,
      total_usage: totalUsage.total_usage,
      usage_by_action: usageByAction,
      recent_usage: recentUsage,
      daily_usage: dailyUsage,
      access_count: dataset.access_count,
      download_count: dataset.download_count
    });
  } catch (error) {
    console.error('Failed to get analytics:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

module.exports = router; 