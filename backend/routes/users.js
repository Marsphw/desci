const express = require('express');
const router = express.Router();
const db = require('../database');

// Get user by wallet address
router.get('/wallet/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  
  try {
    const user = await db.getAsync(
      'SELECT * FROM users WHERE wallet_address = ?',
      [walletAddress]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't expose sensitive information in public profile
    const publicUser = {
      id: user.id,
      username: user.username,
      wallet_address: user.wallet_address,
      did: user.did,
      organization: user.organization,
      research_interests: user.research_interests,
      personal_website: user.personal_website,
      orcid_id: user.orcid_id,
      github_username: user.github_username,
      is_academically_verified: user.is_academically_verified,
      created_at: user.created_at
      // Exclude email and other private fields
    };

    res.json(publicUser);
  } catch (error) {
    console.error('Failed to get user by wallet address:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get user by username
router.get('/username/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const user = await db.getAsync(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't expose sensitive information in public profile
    const publicUser = {
      id: user.id,
      username: user.username,
      wallet_address: user.wallet_address,
      did: user.did,
      organization: user.organization,
      research_interests: user.research_interests,
      personal_website: user.personal_website,
      orcid_id: user.orcid_id,
      github_username: user.github_username,
      is_academically_verified: user.is_academically_verified,
      created_at: user.created_at
      // Exclude email and other private fields
    };

    res.json(publicUser);
  } catch (error) {
    console.error('Failed to get user by username:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get user's public projects
router.get('/:userId/projects', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const projects = await db.allAsync(`
      SELECT p.*, u.username as owner_username
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.owner_id = ? AND p.visibility = 'Public'
      ORDER BY p.updated_at DESC
    `, [userId]);

    res.json(projects);
  } catch (error) {
    console.error('Failed to get user projects:', error);
    res.status(500).json({ error: 'Failed to get user projects' });
  }
});

module.exports = router; 