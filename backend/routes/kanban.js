const express = require('express');
const router = express.Router();
const db = require('../database');

// Helper function to create default columns for a new iteration
const createDefaultColumns = async (iterationId) => {
    const defaultColumns = ['Backlog', 'Ready', 'In progress', 'In review', 'Done'];
    for (let i = 0; i < defaultColumns.length; i++) {
        await db.runAsync(
            'INSERT INTO kanban_columns (iteration_id, title, position) VALUES (?, ?, ?)',
            [iterationId, defaultColumns[i], i]
        );
    }
};

// GET the current iteration's kanban board for a project
router.get('/iterations/:projectId/current', async (req, res) => {
    const { projectId } = req.params;
    try {
        // 1. Find the current iteration for the project
        let iteration = await db.getAsync(
            'SELECT * FROM iterations WHERE project_id = ? AND is_current = 1',
            [projectId]
        );

        // 2. If no current iteration exists, create one
        if (!iteration) {
            const result = await db.runAsync(
                'INSERT INTO iterations (project_id, name, is_current) VALUES (?, ?, ?)',
                [projectId, 'Current Iteration', 1]
            );
            iteration = { id: result.lastID, project_id: projectId, name: 'Current Iteration' };
            await createDefaultColumns(iteration.id);
        }

        // 3. Fetch all columns for the iteration
        const columns = await db.allAsync(
            'SELECT * FROM kanban_columns WHERE iteration_id = ? ORDER BY position ASC',
            [iteration.id]
        );

        // 4. Fetch all cards for each column (N+1 query pattern)
        const board = await Promise.all(columns.map(async (column) => {
            const cards = await db.allAsync(
                'SELECT * FROM kanban_cards WHERE column_id = ? ORDER BY position ASC',
                [column.id]
            );
            return { ...column, items: cards };
        }));

        res.json({ iteration, board });

    } catch (err) {
        console.error('Error fetching current kanban board:', err);
        res.status(500).json({ error: 'Failed to retrieve kanban board data.' });
    }
});

// POST a new card to a column
router.post('/cards', async (req, res) => {
    const { column_id, content, creator_wallet_address } = req.body;

    if (!column_id || !content || !creator_wallet_address) {
        return res.status(400).json({ error: 'Column ID, content, and creator wallet address are required.' });
    }

    try {
        // Find user by wallet address to get the creator_id
        const user = await db.getAsync('SELECT id FROM users WHERE wallet_address = ?', [creator_wallet_address]);
        if (!user) {
            return res.status(404).json({ error: 'Creator not found.' });
        }

        // Determine the position for the new card (append to the end)
        const maxPositionResult = await db.getAsync('SELECT MAX(position) as max_pos FROM kanban_cards WHERE column_id = ?', [column_id]);
        const position = (maxPositionResult?.max_pos ?? -1) + 1;

        const sql = 'INSERT INTO kanban_cards (column_id, content, position, creator_id) VALUES (?, ?, ?, ?)';
        const result = await db.runAsync(sql, [column_id, content, position, user.id]);

        res.status(201).json({ message: 'Card created successfully.', cardId: result.lastID });
    } catch (err) {
        console.error('Error creating new card:', err);
        res.status(500).json({ error: 'Failed to create new card.' });
    }
});




module.exports = router; 