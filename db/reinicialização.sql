USE pedidos_db;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE itens_pedido;
TRUNCATE TABLE pedidos;
TRUNCATE TABLE enderecos;
TRUNCATE TABLE clientes;
TRUNCATE TABLE produtos;
TRUNCATE TABLE usuarios;
SET FOREIGN_KEY_CHECKS = 1;

INSERT IGNORE INTO usuarios (username, password) VALUES ('admin', 'admin123');
