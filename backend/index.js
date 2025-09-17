const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir)); // Serve uploaded files statically

// Route imports
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const kanbanRoutes = require('./routes/kanban');
const userRoutes = require('./routes/users');
const datasetRoutes = require('./routes/datasets');
// We will move repository logic into projects.js, so this is no longer needed.

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/kanban', kanbanRoutes);
app.use('/api/users', userRoutes);
app.use('/api/datasets', datasetRoutes);


app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
}); 

app.get('/api/download/:filename', (req, res) => {
  const fileName = req.params.filename
  const filePath = path.resolve('uploads', fileName)

  if (!filePath.startsWith(path.resolve('uploads'))) {
    return res.status(400).end()
  }

  if (!fs.existsSync(filePath)) 
    return res.status(404).json({ msg: 'File not found' })

  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

  const stream = fs.createReadStream(filePath)
  stream.pipe(res)
})

app.listen(3000, () => console.log('Download server ready on :3000'))