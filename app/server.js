const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Database connection configuration utilizing Environment Variables
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',      // In K8s, this will be the Service name
  database: process.env.DB_NAME || 'ecommerce',
  password: process.env.DB_PASSWORD || 'password',
  port: 5432,
});

// A simple health check route (useful for Kubernetes liveness/readiness probes later)
app.get('/health', (req, res) => {
  res.status(200).send('API is healthy and running!');
});

// A route that interacts with the Stateful Database
app.get('/api/status', async (req, res) => {
  try {
    // A simple query to prove the stateless API can talk to the stateful DB
    const result = await pool.query('SELECT NOW() as current_time'); 
    res.json({ 
        message: 'Successfully connected to the Stateful PostgreSQL Database!', 
        db_time: result.rows[0].current_time 
    });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Failed to connect to the database.', details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Stateless API listening on port ${port}`);
});