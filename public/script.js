const API_URL = '/api';

// --- Autenticação ---
let token = localStorage.getItem('token');

async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    
    if (response.status === 401 || response.status === 403) {
        logout();
        return null;
    }
    return response.json();
}

// Avisos Flutuantes (Toast)
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

const loginForm = document.getElementById('form-login');
loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.auth) {
            token = data.token;
            localStorage.setItem('token', token);
            showApp();
            showToast('Login realizado com sucesso!');
        } else {
            errorDiv.innerText = 'Usuário ou senha incorretos';
        }
    } catch (err) {
        errorDiv.innerText = 'Erro ao conectar ao servidor';
    }
};

function logout() {
    token = null;
    localStorage.removeItem('token');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
}

document.getElementById('btn-logout').onclick = logout;

function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    updateUI();
}

// --- Modo Escuro ---
const themeBtn = document.getElementById('btn-theme-toggle');
themeBtn.onclick = () => {
    const body = document.body;
    if (body.classList.contains('light-mode')) {
        body.classList.replace('light-mode', 'dark-mode');
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.replace('dark-mode', 'light-mode');
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    }
};

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.replace('light-mode', 'dark-mode');
    themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
}

// --- Lógica da Aplicação ---
let currentSection = 'clientes-section';

document.querySelectorAll('.nav-links li').forEach(link => {
    link.addEventListener('click', () => {
        const target = link.getAttribute('data-target');
        document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.querySelectorAll('.data-section').forEach(s => s.classList.remove('active'));
        document.getElementById(target).classList.add('active');
        currentSection = target;
        updateUI();
    });
});

function updateUI() {
    const title = document.getElementById('section-title');
    if (currentSection === 'clientes-section') { title.innerText = 'Clientes'; loadClientes(); }
    else if (currentSection === 'produtos-section') { title.innerText = 'Produtos'; loadProdutos(); }
    else if (currentSection === 'pedidos-section') { title.innerText = 'Pedidos'; loadPedidos(); }
}

// --- Clientes ---
async function loadClientes() {
    const data = await apiFetch('/clientes');
    if (!data) return;
    const tbody = document.querySelector('#table-clientes tbody');
    tbody.innerHTML = data.map(c => `
        <tr>
            <td>${c.id}</td>
            <td><strong>${c.nome}</strong></td>
            <td>${c.email}</td>
            <td>${c.telefone}</td>
            <td>${c.cidade}</td>
            <td>
                <button class="btn-icon" onclick="editCliente(${c.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-icon danger" onclick="deleteCliente(${c.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

document.getElementById('form-cliente').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('cliente-id').value;
    const data = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        rua: document.getElementById('rua').value,
        cidade: document.getElementById('cidade').value,
        estado: document.getElementById('estado').value
    };
    await apiFetch(id ? `/clientes/${id}` : '/clientes', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(data)
    });
    document.getElementById('modal-cliente').style.display = 'none';
    showToast(id ? 'Cliente atualizado!' : 'Cliente cadastrado!');
    loadClientes();
};

window.editCliente = async (id) => {
    const c = await apiFetch(`/clientes/${id}`);
    document.getElementById('cliente-id').value = c.id;
    document.getElementById('nome').value = c.nome;
    document.getElementById('email').value = c.email;
    document.getElementById('telefone').value = c.telefone;
    document.getElementById('rua').value = c.rua;
    document.getElementById('cidade').value = c.cidade;
    document.getElementById('estado').value = c.estado;
    document.getElementById('modal-cliente').style.display = 'block';
};

window.deleteCliente = async (id) => {
    if (confirm('Excluir cliente?')) {
        await apiFetch(`/clientes/${id}`, { method: 'DELETE' });
        showToast('Cliente excluído!');
        loadClientes();
    }
};

// --- Produtos ---
async function loadProdutos() {
    const data = await apiFetch('/produtos');
    if (!data) return;
    const tbody = document.querySelector('#table-produtos tbody');
    tbody.innerHTML = data.map(p => `
        <tr>
            <td>${p.id}</td>
            <td><strong>${p.nome}</strong></td>
            <td>R$ ${parseFloat(p.preco).toFixed(2)}</td>
            <td>${p.estoque}</td>
            <td>
                <button class="btn-icon" onclick="editProduto(${p.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-icon danger" onclick="deleteProduto(${p.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

document.getElementById('form-produto').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('produto-id').value;
    const data = {
        nome: document.getElementById('prod-nome').value,
        preco: document.getElementById('prod-preco').value,
        estoque: document.getElementById('prod-estoque').value
    };
    await apiFetch(id ? `/produtos/${id}` : '/produtos', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(data)
    });
    document.getElementById('modal-produto').style.display = 'none';
    showToast(id ? 'Produto atualizado!' : 'Produto criado!');
    loadProdutos();
};

window.editProduto = async (id) => {
    const data = await apiFetch('/produtos');
    const p = data.find(x => x.id === id);
    document.getElementById('produto-id').value = p.id;
    document.getElementById('prod-nome').value = p.nome;
    document.getElementById('prod-preco').value = p.preco;
    document.getElementById('prod-estoque').value = p.estoque;
    document.getElementById('modal-produto').style.display = 'block';
};

window.deleteProduto = async (id) => {
    if (confirm('Excluir produto?')) {
        await apiFetch(`/produtos/${id}`, { method: 'DELETE' });
        showToast('Produto excluído!');
        loadProdutos();
    }
};

// --- Pedidos ---
async function loadPedidos() {
    const data = await apiFetch('/pedidos');
    if (!data) return;
    data.sort((a, b) => {
        const ordem = { 'Pendente': 0, 'Concluído': 1 };
        return ordem[a.status] - ordem[b.status];
    });
    const tbody = document.querySelector('#table-pedidos tbody');
    tbody.innerHTML = data.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${new Date(p.data_pedido).toLocaleDateString()}</td>
            <td><strong>${p.cliente_nome}</strong></td>
            <td><span class="status-badge status-${p.status}" onclick="toggleStatus(${p.id}, '${p.status}')"><i class="fas ${p.status === 'Pendente' ? 'fa-clock' : 'fa-check-circle'}"></i> ${p.status}</span></td>
            <td>
                <button class="btn-icon" onclick="viewPedido(${p.id})"><i class="fas fa-eye"></i></button>
                <button class="btn-icon danger" onclick="deletePedido(${p.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

window.toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pendente' ? 'Concluído' : 'Pendente';
    await apiFetch(`/pedidos/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
    });
    showToast(`Pedido marcado como ${newStatus}!`);
    loadPedidos();
};

window.viewPedido = async (id) => {
    const p = await apiFetch(`/pedidos/${id}`);
    const content = document.getElementById('detalhes-pedido-content');
    let total = 0;
    const itensHtml = p.itens.map(item => {
        const sub = item.quantidade * item.preco_unitario;
        total += sub;
        return `<tr><td>${item.produto_nome}</td><td>${item.quantidade}</td><td>R$ ${sub.toFixed(2)}</td></tr>`;
    }).join('');

    content.innerHTML = `
        <div class="detalhes-grid">
            <div class="detalhes-field">
                <div class="field-label">Cliente</div>
                <div class="field-value">${p.cliente_nome}</div>
            </div>
            <div class="detalhes-field">
                <div class="field-label">Status</div>
                <div class="field-value"><span class="status-badge status-${p.status}"><i class="fas ${p.status === 'Pendente' ? 'fa-clock' : 'fa-check-circle'}"></i> ${p.status}</span></div>
            </div>
            <div class="detalhes-field full-width">
                <div class="field-label">Endereço de entrega</div>
                <div class="field-value">${p.rua}, ${p.cidade} — ${p.estado}</div>
            </div>
        </div>
        <div class="detalhes-table-wrap">
            <table>
                <thead><tr><th>Produto</th><th>Qtd</th><th style="text-align:right">Subtotal</th></tr></thead>
                <tbody>${itensHtml.replace(/<td>R\$/g, '<td style="text-align:right">R$')}</tbody>
            </table>
        </div>
        <div class="detalhes-total">
            <span>Total do pedido</span>
            <span>R$ ${total.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('modal-pedido-detalhes').style.display = 'block';
};

window.deletePedido = async (id) => {
    if (confirm('Excluir pedido?')) {
        await apiFetch(`/pedidos/${id}`, { method: 'DELETE' });
        showToast('Pedido excluído!');
        loadPedidos();
    }
};

async function setupPedidoForm() {
    const clientes = await apiFetch('/clientes');
    const produtos = await apiFetch('/produtos');
    const selectCliente = document.getElementById('pedido-cliente');
    selectCliente.innerHTML = '<option value="">Selecione um cliente</option>' + 
        clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    
    window.listaProdutos = produtos;
    const container = document.getElementById('itens-container');
    container.innerHTML = '<label>Itens</label>';
    addItemRow();
}

function addItemRow() {
    const container = document.getElementById('itens-container');
    const div = document.createElement('div');
    div.className = 'item-row';
    div.innerHTML = `
        <select class="item-produto" required>
            <option value="">Produto</option>
            ${window.listaProdutos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('')}
        </select>
        <input type="number" class="item-quantidade" min="1" value="1" required>
        <button type="button" onclick="this.parentElement.remove()" style="border:none; background:none; color:red; cursor:pointer;"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(div);
}

document.getElementById('btn-add-item').onclick = addItemRow;

document.getElementById('form-pedido').onsubmit = async (e) => {
    e.preventDefault();
    const itens = Array.from(document.querySelectorAll('.item-row')).map(row => ({
        produto_id: row.querySelector('.item-produto').value,
        quantidade: row.querySelector('.item-quantidade').value
    }));
    const res = await fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            cliente_id: document.getElementById('pedido-cliente').value,
            itens
        })
    });
    const result = await res.json();
    if (!res.ok) {
        showToast('Erro: ' + result.erro);
        return;
    }
    document.getElementById('modal-pedido').style.display = 'none';
    showToast('Pedido realizado!');
    loadPedidos();
};

// --- Modais ---
document.querySelectorAll('.close').forEach(c => c.onclick = () => {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
});

document.getElementById('btn-add').onclick = () => {
    if (currentSection === 'clientes-section') {
        document.getElementById('form-cliente').reset();
        document.getElementById('cliente-id').value = '';
        document.getElementById('modal-cliente').style.display = 'block';
    } else if (currentSection === 'produtos-section') {
        document.getElementById('form-produto').reset();
        document.getElementById('produto-id').value = '';
        document.getElementById('modal-produto').style.display = 'block';
    } else if (currentSection === 'pedidos-section') {
        setupPedidoForm();
        document.getElementById('modal-pedido').style.display = 'block';
    }
};

// Inicialização — valida o token no servidor antes de exibir o app
(async () => {
    if (!token) { logout(); return; }
    try {
        const res = await fetch(`${API_URL}/clientes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
            logout();
        } else {
            showApp();
        }
    } catch {
        logout();
    }
})();