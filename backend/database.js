const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./desci.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the desci.db SQLite database.');
});

// --- Promisify database methods ---
db.runAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

db.getAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
};

db.allAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};


const initializeDatabase = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT NOT NULL UNIQUE,
            did TEXT UNIQUE,
            username TEXT,
            email TEXT,
            github_username TEXT,
            organization TEXT,
            research_interests TEXT,
            personal_website TEXT,
            orcid_id TEXT,
            is_academically_verified BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    try {
        await db.runAsync(sql);
        console.log("Users table created or already exists.");

        const columns = await db.allAsync("PRAGMA table_info(users)");
        const columnNames = columns.map(c => c.name);

        if (!columnNames.includes('username')) {
            await db.runAsync('ALTER TABLE users ADD COLUMN username TEXT');
            console.log("Migration successful: Added 'username' column to 'users' table.");
        }
        if (!columnNames.includes('organization')) {
            await db.runAsync('ALTER TABLE users ADD COLUMN organization TEXT');
            console.log("Migration successful: Added 'organization' column to 'users' table.");
        }
        if (!columnNames.includes('research_interests')) {
            await db.runAsync('ALTER TABLE users ADD COLUMN research_interests TEXT');
            console.log("Migration successful: Added 'research_interests' column to 'users' table.");
        }
        if (!columnNames.includes('orcid_id')) {
            await db.runAsync('ALTER TABLE users ADD COLUMN orcid_id TEXT');
            console.log("Migration successful: Added 'orcid_id' column to 'users' table.");
        }
        if (!columnNames.includes('is_academically_verified')) {
            await db.runAsync('ALTER TABLE users ADD COLUMN is_academically_verified BOOLEAN DEFAULT 0');
            console.log("Migration successful: Added 'is_academically_verified' column to 'users' table.");
        }

        // Create Projects Table
        const createProjectsTableSql = `
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                visibility TEXT DEFAULT 'Private',
                status TEXT DEFAULT 'Unknown',
                category TEXT DEFAULT 'Other',
                start_date TEXT,
                owner_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users (id)
            )
        `;
        await db.runAsync(createProjectsTableSql);
        console.log("Projects table created or already exists.");

        // Check and add new columns if needed
        const tableInfo = await db.allAsync("PRAGMA table_info(projects)");

        // Add category column if not exists
        if (!tableInfo.find(c => c.name === 'category')) {
            await db.runAsync("ALTER TABLE projects ADD COLUMN category TEXT DEFAULT 'Other'");
            console.log("Migration successful: Added 'category' column to 'projects' table.");
        }

        // Add start_date column if not exists
        if (!tableInfo.find(c => c.name === 'start_date')) {
            await db.runAsync("ALTER TABLE projects ADD COLUMN start_date TEXT");
            await db.runAsync("UPDATE projects SET start_date = datetime('now') WHERE start_date IS NULL");
            console.log("Migration successful: Added 'start_date' column to 'projects' table.");
        }

        // Add status column if not exists
        if (!tableInfo.find(c => c.name === 'status')) {
            await db.runAsync("ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'Unknown'");
            console.log("Migration successful: Added 'status' column to 'projects' table.");
        }

        // Create Iterations Table
        const createIterationsTableSql = `
            CREATE TABLE IF NOT EXISTS iterations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                name TEXT NOT NULL, -- e.g., "Current Iteration", "Next Iteration", "Sprint 1"
                start_date DATE,
                end_date DATE,
                is_current BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects (id)
            )
        `;
        await db.runAsync(createIterationsTableSql);
        console.log("Iterations table created or already exists.");

        // Create Kanban Columns Table
        const createKanbanColumnsTableSql = `
            CREATE TABLE IF NOT EXISTS kanban_columns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                iteration_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                position INTEGER NOT NULL, -- To maintain column order
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (iteration_id) REFERENCES iterations (id)
            )
        `;
        await db.runAsync(createKanbanColumnsTableSql);
        console.log("Kanban columns table created or already exists.");

        // Create Kanban Cards Table
        const createKanbanCardsTableSql = `
            CREATE TABLE IF NOT EXISTS kanban_cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                column_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                position INTEGER NOT NULL, -- To maintain card order within a column
                creator_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (column_id) REFERENCES kanban_columns (id),
                FOREIGN KEY (creator_id) REFERENCES users (id)
            )
        `;
        await db.runAsync(createKanbanCardsTableSql);
        console.log("Kanban cards table created or already exists.");

        // Create Project Collaborators Table
        const createCollaboratorsTableSql = `
            CREATE TABLE IF NOT EXISTS project_collaborators (
                project_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                role TEXT NOT NULL DEFAULT 'viewer', -- e.g., 'editor', 'viewer'
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (project_id, user_id),
                FOREIGN KEY (project_id) REFERENCES projects (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `;
        await db.runAsync(createCollaboratorsTableSql);
        console.log("Project collaborators table created or already exists.");

        // Create Project Files Table
        const createFilesTableSql = `
            CREATE TABLE IF NOT EXISTS project_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                parent_id INTEGER, -- For folder structure. NULL for root.
                uploader_id INTEGER NOT NULL,
                file_name TEXT NOT NULL,
                file_path TEXT, -- Path where the file is stored on the server. NULL for folders.
                file_size INTEGER,
                file_type TEXT NOT NULL, -- 'file' or 'directory'
                description TEXT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects (id),
                FOREIGN KEY (uploader_id) REFERENCES users (id),
                FOREIGN KEY (parent_id) REFERENCES project_files (id)
            )
        `;
        await db.runAsync(createFilesTableSql);
        console.log("Project files table created or already exists.");

        // Create Proofs Table
        const createProofsTableSql = `
            CREATE TABLE IF NOT EXISTS proofs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                proof_data TEXT, -- JSON or text data for the proof
                creator_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects (id),
                FOREIGN KEY (creator_id) REFERENCES users (id)
            )
        `;
        await db.runAsync(createProofsTableSql);
        console.log("Proofs table created or already exists.");

        // Create NFTs Table
        const createNFTsTableSql = `
            CREATE TABLE IF NOT EXISTS nfts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                token_id TEXT,
                contract_address TEXT,
                metadata_uri TEXT,
                owner_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects (id),
                FOREIGN KEY (owner_id) REFERENCES users (id)
            )
        `;
        await db.runAsync(createNFTsTableSql);
        console.log("NFTs table created or already exists.");

        // Create Milestones Table
        const createMilestonesTableSql = `
            CREATE TABLE IF NOT EXISTS milestones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                type TEXT NOT NULL DEFAULT 'milestone', -- milestone, proof, verification, nft, publication, achievement
                date TEXT NOT NULL, -- ISO date string
                status TEXT NOT NULL DEFAULT 'planned', -- planned, in-progress, completed
                creator_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects (id),
                FOREIGN KEY (creator_id) REFERENCES users (id)
            )
        `;
        await db.runAsync(createMilestonesTableSql);
        console.log("Milestones table created or already exists.");

        // Create Datasets Table
        const createDatasetsTableSql = `
            CREATE TABLE IF NOT EXISTS datasets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                owner_id INTEGER NOT NULL,
                project_id INTEGER,
                privacy_level TEXT NOT NULL DEFAULT 'public', -- public, private, encrypted
                file_path TEXT,
                file_name TEXT,
                file_size INTEGER, -- in bytes
                file_type TEXT,
                category TEXT DEFAULT 'Other',
                tags TEXT, -- JSON array of tags
                access_count INTEGER DEFAULT 0,
                download_count INTEGER DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'processing', -- processing, ready, failed
                is_encrypted BOOLEAN DEFAULT FALSE,
                encryption_key_hash TEXT, -- for encrypted datasets
                zk_proof_id INTEGER, -- reference to zk proof if privacy protected
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users (id),
                FOREIGN KEY (project_id) REFERENCES projects (id),
                FOREIGN KEY (zk_proof_id) REFERENCES zk_proofs (id)
            )
        `;
        await db.runAsync(createDatasetsTableSql);
        console.log("Datasets table created or already exists.");

        // Check and add external_link column if not exists
        const datasetTableInfo = await db.allAsync("PRAGMA table_info(datasets)");
        if (!datasetTableInfo.find(c => c.name === 'external_link')) {
            await db.runAsync("ALTER TABLE datasets ADD COLUMN external_link TEXT");
            console.log("Migration successful: Added 'external_link' column to 'datasets' table.");
        }

        // Check and add multi-file support columns if not exists
        if (!datasetTableInfo.find(c => c.name === 'total_files')) {
            await db.runAsync("ALTER TABLE datasets ADD COLUMN total_files INTEGER DEFAULT 1");
            await db.runAsync("ALTER TABLE datasets ADD COLUMN total_size INTEGER DEFAULT 0");
            console.log("Migration successful: Added multi-file support columns to 'datasets' table.");
        }
        
        // Check and add encryption status columns if not exists
        if (!datasetTableInfo.find(c => c.name === 'encryption_status')) {
            await db.runAsync("ALTER TABLE datasets ADD COLUMN encryption_status TEXT");
            console.log("Migration successful: Added 'encryption_status' column to 'datasets' table.");
        }
        
        if (!datasetTableInfo.find(c => c.name === 'encryption_metadata')) {
            await db.runAsync("ALTER TABLE datasets ADD COLUMN encryption_metadata TEXT");
            console.log("Migration successful: Added 'encryption_metadata' column to 'datasets' table.");
        }

        // Create Dataset Files Table for multi-file support
        const createDatasetFilesTableSql = `
            CREATE TABLE IF NOT EXISTS dataset_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dataset_id INTEGER NOT NULL,
                file_name TEXT NOT NULL,
                original_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                file_type TEXT,
                mime_type TEXT,
                file_order INTEGER DEFAULT 0, -- for ordering files within a dataset
                is_primary BOOLEAN DEFAULT FALSE, -- mark the main file
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dataset_id) REFERENCES datasets (id) ON DELETE CASCADE
            )
        `;
        await db.runAsync(createDatasetFilesTableSql);
        console.log("Dataset files table created or already exists.");

        // Create Dataset Permissions Table
        const createDatasetPermissionsTableSql = `
            CREATE TABLE IF NOT EXISTS dataset_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dataset_id INTEGER NOT NULL,
                user_id INTEGER,
                wallet_address TEXT,
                permission_type TEXT NOT NULL DEFAULT 'read', -- read, write, admin
                access_conditions TEXT, -- JSON object with conditions
                granted_by INTEGER NOT NULL,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dataset_id) REFERENCES datasets (id),
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (granted_by) REFERENCES users (id)
            )
        `;
        await db.runAsync(createDatasetPermissionsTableSql);
        console.log("Dataset permissions table created or already exists.");

        // Create ZK Proofs Table
        const createZkProofsTableSql = `
            CREATE TABLE IF NOT EXISTS zk_proofs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dataset_id INTEGER NOT NULL,
                creator_id INTEGER NOT NULL,
                proof_type TEXT NOT NULL DEFAULT 'privacy', -- privacy, integrity, computation
                proof_data TEXT NOT NULL, -- JSON object with proof details
                verification_key TEXT,
                public_inputs TEXT, -- JSON array of public inputs
                circuit_hash TEXT,
                status TEXT NOT NULL DEFAULT 'pending', -- pending, verified, failed
                verification_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                verified_at TIMESTAMP,
                FOREIGN KEY (dataset_id) REFERENCES datasets (id),
                FOREIGN KEY (creator_id) REFERENCES users (id)
            )
        `;
        await db.runAsync(createZkProofsTableSql);
        console.log("ZK proofs table created or already exists.");

        // Create Dataset Usage Table
        const createDatasetUsageTableSql = `
            CREATE TABLE IF NOT EXISTS dataset_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dataset_id INTEGER NOT NULL,
                user_id INTEGER,
                wallet_address TEXT,
                action_type TEXT NOT NULL, -- view, download, query, compute
                query_hash TEXT, -- for private queries
                ip_address TEXT,
                user_agent TEXT,
                metadata TEXT, -- JSON object with additional metadata
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dataset_id) REFERENCES datasets (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `;
        await db.runAsync(createDatasetUsageTableSql);
        console.log("Dataset usage table created or already exists.");

    } catch (err) {
        console.error("Error during database initialization:", err.message);
    }
};

db.serialize(() => {
    initializeDatabase();
});

module.exports = db; 