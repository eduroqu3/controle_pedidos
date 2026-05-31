require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORTA = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

// Serve arquivos estáticos ANTES das rotas da API
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// CONEXÃO COM O MySQL
// -------------------------------------------------------------
const conexao = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

conexao.connect((erro) => {
    if (erro) {
        console.error('Erro ao conectar no MySQL:', erro.message);
        return;
    }
    console.log('Conectado ao banco de dados MySQL!');
});

// -------------------------------------------------------------
// MIDDLEWARE DE AUTENTICAÇÃO
// -------------------------------------------------------------
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(403).json({ erro: 'Token não fornecido' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ erro: 'Falha na autenticação' });
        req.usuarioId = decoded.id;
        next();
    });
};

// -------------------------------------------------------------
// ROTAS DE AUTENTICAÇÃO
// -------------------------------------------------------------
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE username = ? AND password = ?';
    conexao.query(sql, [username, password], (erro, resultados) => {
        if (erro) return res.status(500).json({ erro: erro.message });
        if (resultados.length > 0) {
            const token = jwt.sign({ id: resultados[0].id }, SECRET_KEY, { expiresIn: '24h' });
            res.json({ auth: true, token });
        } else {
            res.status(401).json({ erro: 'Usuário ou senha inválidos' });
        }
    });
});

// -------------------------------------------------------------
// ROTAS DA API (PROTEGIDAS)
// -------------------------------------------------------------

// Clientes
app.post('/api/clientes', verificarToken, (req, res) => {
    const { nome, email, telefone, rua, cidade, estado } = req.body;
    const sqlCliente = 'INSERT INTO clientes (nome, email, telefone) VALUES (?, ?, ?)';
    conexao.query(sqlCliente, [nome, email, telefone], (erro, resultado) => {
        if (erro) return res.status(500).json({ erro: erro.message });
        const clienteId = resultado.insertId;
        const sqlEndereco = 'INSERT INTO enderecos (cliente_id, rua, cidade, estado) VALUES (?, ?, ?, ?)';
        conexao.query(sqlEndereco, [clienteId, rua, cidade, estado], (erro2) => {
            if (erro2) return res.status(500).json({ erro: erro2.message });
            res.status(201).json({ mensagem: 'Cliente cadastrado', id: clienteId });
        });
    });
});

app.get('/api/clientes', verificarToken, (req, res) => {
    const sql = `
        SELECT c.id, c.nome, c.email, c.telefone, e.rua, e.cidade, e.estado
        FROM clientes c
        LEFT JOIN enderecos e ON c.id = e.cliente_id
        ORDER BY c.id DESC
    `;
    conexao.query(sql, (erro, resultados) => {
        if (erro) return res.status(500).json({ erro: erro.message });
        res.json(resultados);
    });
});

app.get('/api/clientes/:id', verificarToken, (req, res) => {
    const sql = `
        SELECT c.id, c.nome, c.email, c.telefone, e.rua, e.cidade, e.estado
        FROM clientes c
        LEFT JOIN enderecos e ON c.id = e.cliente_id
        WHERE c.id = ?
    `;
    conexao.query(sql, [req.params.id], (erro, resultados) => {
        if (erro) return res.status(500).json({ erro: erro.message });
        res.json(resultados[0]);
    });
});

app.put('/api/clientes/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    const { nome, email, telefone, rua, cidade, estado } = req.body;
    const sqlCliente = 'UPDATE clientes SET nome = ?, email = ?, telefone = ? WHERE id = ?';
    conexao.query(sqlCliente, [nome, email, telefone, id], (erro) => {
        if (erro) return res.status(500).json({ erro: erro.message });
        const sqlEndereco = 'UPDATE enderecos SET rua = ?, cidade = ?, estado = ? WHERE cliente_id = ?';
        conexao.query(sqlEndereco, [rua, cidade, estado, id], (erro2) => {
            if (erro2) return res.status(500).json({ erro: erro2.message });
            res.json({ mensagem: 'Cliente atualizado' });
        });
    });
});

app.delete('/api/clientes/:id', verificarToken, (req, res) => {
    conexao.query('DELETE ip FROM itens_pedido ip JOIN pedidos p ON ip.pedido_id = p.id WHERE p.cliente_id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ erro: err.message });

        conexao.query('DELETE FROM pedidos WHERE cliente_id = ?', [req.params.id], (err2) => {
            if (err2) return res.status(500).json({ erro: err2.message });

            conexao.query('DELETE FROM enderecos WHERE cliente_id = ?', [req.params.id], () => {
                conexao.query('DELETE FROM clientes WHERE id = ?', [req.params.id], (erro) => {
                    if (erro) return res.status(500).json({ erro: erro.message });
                    res.json({ mensagem: 'Cliente e todos os seus pedidos foram excluídos' });
                });
            });
        });
    });
});

// Produtos
app.post('/api/produtos', verificarToken, (req, res) => {
    const { nome, preco, estoque } = req.body;
    conexao.query('INSERT INTO produtos (nome, preco, estoque) VALUES (?, ?, ?)', [nome, preco, estoque], (erro) => {
        if (erro) return res.status(500).json({ erro: erro.message });
        res.status(201).json({ mensagem: 'Produto criado' });
    });
});

app.get('/api/produtos', verificarToken, (req, res) => {
    conexao.query('SELECT * FROM produtos ORDER BY id DESC', (erro, resultados) => {
        if (erro) return res.status(500).json({ erro: erro.message });
        res.json(resultados);
    });
});

app.put('/api/produtos/:id', verificarToken, (req, res) => {
    const { nome, preco, estoque } = req.body;
    conexao.query('UPDATE produtos SET nome = ?, preco = ?, estoque = ? WHERE id = ?', [nome, preco, estoque, req.params.id], (erro) => {
        if (erro) return res.status(500).json({ erro: erro.message });
        res.json({ mensagem: 'Produto atualizado' });
    });
});

app.delete('/api/produtos/:id', verificarToken, (req, res) => {
    const produtoId = req.params.id;

    conexao.query('DELETE FROM itens_pedido WHERE produto_id = ?', [produtoId], (err) => {
        if (err) return res.status(500).json({ erro: err.message });

        conexao.query(`
            SELECT p.id 
            FROM pedidos p
            LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id
            GROUP BY p.id
            HAVING COUNT(ip.id) = 0
        `, (err2, pedidosOrfaos) => {
            if (err2) return res.status(500).json({ erro: err2.message });

            if (pedidosOrfaos.length === 0) {
                conexao.query('DELETE FROM produtos WHERE id = ?', [produtoId], (erro) => {
                    if (erro) return res.status(500).json({ erro: erro.message });
                    return res.json({ mensagem: 'Produto excluído com sucesso' });
                });
            } else {
                const ids = pedidosOrfaos.map(p => p.id);
                conexao.query('DELETE FROM pedidos WHERE id IN (?)', [ids], (err3) => {
                    if (err3) return res.status(500).json({ erro: err3.message });

                    conexao.query('DELETE FROM produtos WHERE id = ?', [produtoId], (erro) => {
                        if (erro) return res.status(500).json({ erro: erro.message });
                        res.json({
                            mensagem: `Produto excluído. ${ids.length} pedido(s) foram removidos porque ficaram sem itens.`
                        });
                    });
                });
            }
        });
    });
});

// Pedidos
app.post('/api/pedidos', verificarToken, (req, res) => {
    const { cliente_id, itens } = req.body;
    conexao.beginTransaction(erro => {
        if (erro) return res.status(500).json({ erro: erro.message });
        conexao.query('INSERT INTO pedidos (cliente_id) VALUES (?)', [cliente_id], (erro, resultado) => {
            if (erro) return conexao.rollback(() => res.status(500).json({ erro: erro.message }));
            const pedidoId = resultado.insertId;
            let count = 0;
            itens.forEach(item => {
                conexao.query('SELECT preco FROM produtos WHERE id = ?', [item.produto_id], (e, r) => {
                    conexao.query('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
                    [pedidoId, item.produto_id, item.quantidade, r[0].preco], (e2) => {
                        count++;
                        if (count === itens.length) {
                            conexao.commit(() => res.status(201).json({ mensagem: 'Pedido criado' }));
                        }
                    });
                });
            });
        });
    });
});

app.get('/api/pedidos', verificarToken, (req, res) => {
    const sql = `SELECT p.id, p.data_pedido, p.status, c.nome AS cliente_nome FROM pedidos p JOIN clientes c ON p.cliente_id = c.id ORDER BY p.id DESC`;
    conexao.query(sql, (erro, resultados) => {
        if (erro) return res.status(500).json({ erro: erro.message });
        res.json(resultados);
    });
});

app.get('/api/pedidos/:id', verificarToken, (req, res) => {
    const sql = `SELECT p.id, p.data_pedido, p.status, c.nome AS cliente_nome, e.rua, e.cidade, e.estado FROM pedidos p JOIN clientes c ON p.cliente_id = c.id LEFT JOIN enderecos e ON c.id = e.cliente_id WHERE p.id = ?`;
    conexao.query(sql, [req.params.id], (erro, resultados) => {
        const pedido = resultados[0];
        conexao.query('SELECT ip.quantidade, ip.preco_unitario, pr.nome AS produto_nome FROM itens_pedido ip JOIN produtos pr ON ip.produto_id = pr.id WHERE ip.pedido_id = ?', [req.params.id], (e, itens) => {
            pedido.itens = itens;
            res.json(pedido);
        });
    });
});

app.patch('/api/pedidos/:id/status', verificarToken, (req, res) => {
    const statusPermitidos = ['Pendente', 'Entregue'];
    if (!statusPermitidos.includes(req.body.status)) {
        return res.status(400).json({ erro: 'Status inválido' });
    }
    conexao.query('UPDATE pedidos SET status = ? WHERE id = ?', [req.body.status, req.params.id], (erro) => {
        if (erro) return res.status(500).json({ erro: erro.message });
        res.json({ mensagem: 'Status atualizado' });
    });
});

app.delete('/api/pedidos/:id', verificarToken, (req, res) => {
    conexao.query('DELETE FROM itens_pedido WHERE pedido_id = ?', [req.params.id], () => {
        conexao.query('DELETE FROM pedidos WHERE id = ?', [req.params.id], (erro) => {
            if (erro) return res.status(500).json({ erro: erro.message });
            res.json({ mensagem: 'Pedido excluído' });
        });
    });
});

// Rota principal para servir o frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback para rotas não encontradas (deve vir por último)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});