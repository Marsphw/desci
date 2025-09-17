const express = require('express');
const router = express.Router();
const db = require('../database');
const { ethers } = require('ethers');
const axios = require('axios');

// POST /api/auth/login
router.post('/login', async (req, res) => { // Make the function async
    const { walletAddress } = req.body;

    if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
        return res.status(400).json({ error: 'Valid wallet address is required.' });
    }

    try {
        const findUserSql = "SELECT * FROM users WHERE wallet_address = ?";
        let user = await db.getAsync(findUserSql, [walletAddress]);

        if (user) {
            // User exists, return user data
            return res.json({ message: 'Login successful.', user });
        } else {
            // User does not exist, create new user
            const did = `did:ethr:${walletAddress}`; // Generate DID
            const insertUserSql = "INSERT INTO users (wallet_address, did) VALUES (?, ?)";
            await db.runAsync(insertUserSql, [walletAddress, did]);

            // Fetch the newly created user
            user = await db.getAsync(findUserSql, [walletAddress]);
            return res.status(201).json({ message: 'User created successfully.', user });
        }
    } catch (err) {
        console.error("Database error in /login route:", err.message);
        return res.status(500).json({ error: "An internal server error occurred." });
    }
});

router.put('/profile', async (req, res) => {
    const { walletAddress, email, username, github_username, personal_website, organization, research_interests } = req.body;

    if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address is required.' });
    }
    if (!email || !username) {
        return res.status(400).json({ error: 'Email and username are required.' });
    }

    try {
        const sql = `
            UPDATE users 
            SET email = ?, username = ?, github_username = ?, personal_website = ?, organization = ?, research_interests = ?
            WHERE wallet_address = ?
        `;
        const params = [email, username, github_username, personal_website, organization, research_interests, walletAddress];
        const result = await db.runAsync(sql, params);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const updatedUser = await db.getAsync("SELECT * FROM users WHERE wallet_address = ?", [walletAddress]);
        res.json({ message: 'Profile updated successfully.', user: updatedUser });

    } catch (err) {
        console.error("Database error in /profile route:", err.message);
        res.status(500).json({ error: "An internal server error occurred." });
    }
});

router.put('/interests', async (req, res) => {
    const { walletAddress, interests } = req.body;

    if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address is required.' });
    }

    try {
        const interestsString = JSON.stringify(interests);
        const sql = `UPDATE users SET research_interests = ? WHERE wallet_address = ?`;
        const result = await db.runAsync(sql, [interestsString, walletAddress]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const updatedUser = await db.getAsync("SELECT * FROM users WHERE wallet_address = ?", [walletAddress]);
        res.json({ message: 'Interests updated successfully.', user: updatedUser });

    } catch (err) {
        console.error("Database error in /interests route:", err.message);
        res.status(500).json({ error: "An internal server error occurred." });
    }
});

// Route to initiate ORCID authentication
router.get('/orcid', (req, res) => {
    const { walletAddress } = req.query;
    if (!walletAddress) {
        return res.status(400).send('Wallet address is required');
    }

    const state = Buffer.from(JSON.stringify({ walletAddress })).toString('base64');

    const authUrl = `https://sandbox.orcid.org/oauth/authorize?client_id=${process.env.ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${process.env.ORCID_REDIRECT_URI}&state=${state}`;
    
    res.redirect(authUrl);
});

// Callback route for ORCID
router.get('/orcid/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!code) {
        return res.status(400).send('Authorization code is missing');
    }

    try {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));
        const { walletAddress } = decodedState;

        const tokenResponse = await axios.post('https://sandbox.orcid.org/oauth/token', null, {
            params: {
                client_id: process.env.ORCID_CLIENT_ID,
                client_secret: process.env.ORCID_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.ORCID_REDIRECT_URI
            },
            headers: { 'Accept': 'application/json' }
        });

        const { orcid } = tokenResponse.data;

        const sql = `UPDATE users SET orcid_id = ?, is_academically_verified = 1 WHERE wallet_address = ?`;
        await db.runAsync(sql, [orcid, walletAddress]);

        // Redirect user back to their profile page after successful verification
        res.redirect(`http://localhost:5173/profile`);

    } catch (error) {
        console.error('ORCID callback error:', error.response ? error.response.data : error.message);
        res.status(500).send('An error occurred during ORCID verification.');
    }
});

module.exports = router; 