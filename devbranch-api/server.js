require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { connectToDatabase } = require('./config/db');
const authRoutes = require('./routes/auth.routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', authRoutes);

async function startServer() {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`API server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

startServer();