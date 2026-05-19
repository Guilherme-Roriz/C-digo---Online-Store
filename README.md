# 🛒 WebStore - API de Loja Online

API RESTful para gerenciamento de produtos e registro de compras, desenvolvida com Node.js, Express e MySQL. Inclui interface front-end básica para clientes realizarem pedidos.

## 🚀 Tecnologias

- **Node.js** + **Express** – servidor e rotas
- **MySQL** (com `mysql2/promise`) – banco de dados relacional
- **HTML/CSS/JS** – front-end minimalista (para demonstração)

## 📦 Funcionalidades

- Listar todos os produtos ativos (`/api/produtos`)
- Registrar uma nova compra (`/api/compras`)
- Visualizar as últimas 20 compras realizadas (`/api/compras`)
- Página simples para o cliente comprar (`/comprar`)
- Conexão eficiente com banco via **pool de conexões**
- Stored procedure `registrar_compra` no MySQL (consistência de estoque)

## 🗄️ Banco de Dados

O projeto utiliza um banco MySQL com as seguintes tabelas principais:

- `produtos` – cadastro de itens (nome, preço, estoque, ativo)
- `compras` – registros de pedidos feitos pelos clientes
- `movimentacoes_estoque` – log de alterações de quantidade (opcional)
