const path = require('path');
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 3000;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'atilas_store',
  waitForConnections: true,
  connectionLimit: 10
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'Front-End')));

app.get('/api/products', async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT id, name, description, quantity, price
         FROM products
        WHERE active = TRUE
        ORDER BY name`
    );

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load products.' });
  }
});

app.get('/api/purchases', async (req, res) => {
  try {
    const [purchases] = await pool.query(
      `SELECT
          p.id,
          p.buyer_name,
          pr.name AS product_name,
          p.quantity,
          p.total_value,
          p.payment_method,
          p.created_at
         FROM purchases p
         INNER JOIN products pr ON pr.id = p.product_id
         ORDER BY p.created_at DESC, p.id DESC
         LIMIT 20`
    );

    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load purchases.' });
  }
});

app.post('/api/purchases', async (req, res) => {
  const {
    buyer_name: buyerName,
    product_id: productId,
    quantity,
    payment_method: paymentMethod,
    note
  } = req.body;

  if (!buyerName || !productId || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'Invalid purchase data.' });
  }

  try {
    await pool.query('CALL register_purchase(?, ?, ?, ?, ?)', [
      buyerName,
      productId,
      quantity,
      paymentMethod || 'pix',
      note || null
    ]);

    res.status(201).json({ message: 'Purchase registered successfully.' });
  } catch (error) {
    res.status(400).json({
      error: error.sqlMessage || 'Unable to register the purchase.'
    });
  }
});

app.get('/purchase', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Front-End', 'purchase.html'));
});

app.listen(port, () => {
  console.log(`Atila's Store running at http://localhost:${port}`);
});
