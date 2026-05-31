-- Criação e utilização do Banco de Dados
CREATE DATABASE IF NOT EXISTS pedidos_db;
USE pedidos_db;

-- Tabela de Usuários (para autenticação simples)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Tabela de Clientes (Relacionamento 1:1 com Endereços)
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefone VARCHAR(20)
);

-- Tabela de Endereços (Relacionamento 1:1 com Clientes)
CREATE TABLE IF NOT EXISTS enderecos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT UNIQUE,
    rua VARCHAR(255),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    preco DECIMAL(10, 2) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    estoque INT DEFAULT 0
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pendente', 'Concluído') DEFAULT 'Pendente',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Tabela de Itens do Pedido (N:M entre Pedidos e Produtos)
CREATE TABLE IF NOT EXISTS itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT,
    produto_id INT,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- Usuário padrão (Senha: admin123)
INSERT IGNORE INTO usuarios (username, password) VALUES ('admin', 'admin123');