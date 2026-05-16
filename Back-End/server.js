const path = require('path');
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const porta = process.env.PORT || 3000;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'budega_do_atila',
  waitForConnections: true,
  connectionLimit: 10
});

app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/produtos', async (req, res) => {
  try {
    const [produtos] = await pool.query(
      `SELECT id, nome, descricao, quantidade, preco
         FROM produtos
        WHERE ativo = TRUE
        ORDER BY nome`
    );

    res.json(produtos);
  } catch (erro) {
    res.status(500).json({ erro: 'Nao foi possivel carregar os produtos.' });
  }
});

app.get('/api/compras', async (req, res) => {
  try {
    const [compras] = await pool.query(
      `SELECT
          c.id,
          c.comprador_nome,
          p.nome AS produto_nome,
          c.quantidade,
          c.valor_total,
          c.forma_pagamento,
          c.criado_em
         FROM compras c
         INNER JOIN produtos p ON p.id = c.produto_id
         ORDER BY c.criado_em DESC, c.id DESC
         LIMIT 20`
    );

    res.json(compras);
  } catch (erro) {
    res.status(500).json({ erro: 'Nao foi possivel carregar as compras.' });
  }
});

app.post('/api/compras', async (req, res) => {
  const {
    comprador_nome: compradorNome,
    produto_id: produtoId,
    quantidade,
    forma_pagamento: formaPagamento,
    observacao
  } = req.body;

  if (!compradorNome || !produtoId || !quantidade || quantidade < 1) {
    return res.status(400).json({ erro: 'Dados da compra invalidos.' });
  }

  try {
    await pool.query('CALL registrar_compra(?, ?, ?, ?, ?)', [
      compradorNome,
      produtoId,
      quantidade,
      formaPagamento || 'pix',
      observacao || null
    ]);

    res.status(201).json({ mensagem: 'Compra registrada com sucesso.' });
  } catch (erro) {
    res.status(400).json({
      erro: erro.sqlMessage || 'Nao foi possivel registrar a compra.'
    });
  }
});

app.get('/comprar', (req, res) => {
  res.sendFile(path.join(__dirname, 'clientes.html'));
});

app.listen(porta, () => {
  console.log(`Budega do Atila rodando em http://localhost:${porta}`);
});
