/* Criação do BD */

CREATE DATABASE IF NOT EXISTS budega_do_atila
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE budega_do_atila;

/* Criação de tabela */

CREATE TABLE IF NOT EXISTS produtos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  descricao VARCHAR(255) NULL,
  quantidade INT UNSIGNED NOT NULL DEFAULT 0,
  preco DECIMAL(10, 2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_produtos_nome UNIQUE (nome),
  CONSTRAINT chk_produtos_preco CHECK (preco >= 0)
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  produto_id INT UNSIGNED NOT NULL,
  tipo ENUM('entrada', 'saida', 'ajuste') NOT NULL,
  quantidade INT UNSIGNED NOT NULL,
  observacao VARCHAR(255) NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_movimentacoes_produto
    FOREIGN KEY (produto_id)
    REFERENCES produtos (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS compras (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  comprador_nome VARCHAR(120) NOT NULL,
  produto_id INT UNSIGNED NOT NULL,
  quantidade INT UNSIGNED NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  valor_total DECIMAL(10, 2) NOT NULL,
  forma_pagamento ENUM('pix', 'dinheiro', 'cartao', 'fiado') NOT NULL DEFAULT 'pix',
  observacao VARCHAR(255) NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_compras_produto
    FOREIGN KEY (produto_id)
    REFERENCES produtos (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_compras_quantidade CHECK (quantidade > 0),
  CONSTRAINT chk_compras_preco_unitario CHECK (preco_unitario >= 0),
  CONSTRAINT chk_compras_valor_total CHECK (valor_total >= 0)
);

/* Criação de índices*/

CREATE INDEX idx_produtos_nome ON produtos (nome);
CREATE INDEX idx_movimentacoes_produto_id ON movimentacoes_estoque (produto_id);
CREATE INDEX idx_movimentacoes_criado_em ON movimentacoes_estoque (criado_em);
CREATE INDEX idx_compras_produto_id ON compras (produto_id);
CREATE INDEX idx_compras_criado_em ON compras (criado_em);

INSERT INTO produtos (nome, descricao, quantidade, preco) VALUES
  ('Refrigerante lata', '350 ml', 0, 5.00),
  ('Agua mineral', '500 ml', 0, 3.00),
  ('Chocolate', 'Unidade', 0, 4.50)
ON DUPLICATE KEY UPDATE
  descricao = VALUES(descricao),
  preco = VALUES(preco);

DROP PROCEDURE IF EXISTS registrar_compra;

DELIMITER //

/* Criaçao do processo de compra no banco */

CREATE PROCEDURE registrar_compra (
  IN p_comprador_nome VARCHAR(120),
  IN p_produto_id INT UNSIGNED,
  IN p_quantidade INT UNSIGNED,
  IN p_forma_pagamento VARCHAR(20),
  IN p_observacao VARCHAR(255)
)
BEGIN
  DECLARE v_preco DECIMAL(10, 2);
  DECLARE v_estoque INT UNSIGNED;
  DECLARE v_produto_encontrado BOOLEAN DEFAULT TRUE;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  DECLARE CONTINUE HANDLER FOR NOT FOUND
    SET v_produto_encontrado = FALSE;

  START TRANSACTION;

  IF p_quantidade IS NULL OR p_quantidade = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Quantidade invalida para a compra.';
  END IF;

  SELECT preco, quantidade
    INTO v_preco, v_estoque
    FROM produtos
    WHERE id = p_produto_id
      AND ativo = TRUE
    FOR UPDATE;

  IF v_produto_encontrado = FALSE THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Produto nao encontrado ou inativo.';
  END IF;

  IF v_estoque < p_quantidade THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Estoque insuficiente para a compra.';
  END IF;

  INSERT INTO compras (
    comprador_nome,
    produto_id,
    quantidade,
    preco_unitario,
    valor_total,
    forma_pagamento,
    observacao
  ) VALUES (
    p_comprador_nome,
    p_produto_id,
    p_quantidade,
    v_preco,
    v_preco * p_quantidade,
    p_forma_pagamento,
    p_observacao
  );

  UPDATE produtos
    SET quantidade = quantidade - p_quantidade
    WHERE id = p_produto_id;

  INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, observacao)
  VALUES (p_produto_id, 'saida', p_quantidade, CONCAT('Compra de ', p_comprador_nome));

  COMMIT;
END //

DELIMITER ;
