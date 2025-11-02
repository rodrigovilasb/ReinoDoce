// Ativa o modo estrito para código mais seguro
"use strict";

// --- VARIÁVEIS GLOBAIS DE ESTADO ---
// O carrinho é persistido no LocalStorage para simular a manutenção entre páginas
let carrinho = JSON.parse(localStorage.getItem('carrinhoReinoDoce')) || []; 

// --- FUNÇÕES DE UTILIDADE ---

/** Formata um valor numérico para o padrão monetário brasileiro. */
function formatarMoeda(valor) {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

/** Salva o estado atual do carrinho no LocalStorage e atualiza o contador. */
function salvarCarrinho() {
    localStorage.setItem('carrinhoReinoDoce', JSON.stringify(carrinho));
    atualizarContadorCarrinho();
}

// --- FUNÇÕES DE CARRINHO E CHECKOUT ---

/** Calcula o total de unidades e atualiza o display no header. */
function atualizarContadorCarrinho() {
    const contadorElemento = document.getElementById('contador-carrinho');
    if (!contadorElemento) return;

    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    contadorElemento.textContent = totalItens;
}

/** Adiciona um produto ao carrinho ou aumenta sua quantidade. */
function adicionarAoCarrinho(nome, preco) {
    const precoFloat = parseFloat(preco);
    const itemExistente = carrinho.find(item => item.nome === nome);

    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ nome, preco: precoFloat, quantidade: 1 });
    }

    salvarCarrinho();
    alert(`"${nome}" adicionado ao carrinho!`);
}

/** Remove uma unidade de um item do carrinho, ou o item completamente se for o último. */
function removerItemCarrinho(nome) {
    const itemIndex = carrinho.findIndex(item => item.nome === nome);
    
    if (itemIndex > -1) {
        if (carrinho[itemIndex].quantidade > 1) {
            carrinho[itemIndex].quantidade--;
        } else {
            carrinho.splice(itemIndex, 1);
        }
    }
    
    salvarCarrinho();
    renderizarCarrinho();
}

/** Calcula o valor total dos itens no carrinho. */
function calcularTotalCarrinho() {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

/** Renderiza a lista de itens e os totais no modal do carrinho. */
function renderizarCarrinho() {
    const listaCarrinhoElemento = document.getElementById('itens-carrinho-lista');
    const subtotalElemento = document.getElementById('carrinho-subtotal');
    const totalGeralElemento = document.getElementById('carrinho-total-geral');
    const finalizarCompraBtn = document.getElementById('finalizar-compra-btn');
    const mensagemVazio = document.getElementById('mensagem-vazio');
    const checkoutTotalElement = document.getElementById('checkout-total-exibido');

    if (!listaCarrinhoElemento || !subtotalElemento) return;

    listaCarrinhoElemento.innerHTML = '';
    const total = calcularTotalCarrinho();
    
    subtotalElemento.textContent = formatarMoeda(total);
    totalGeralElemento.textContent = formatarMoeda(total);
    if(checkoutTotalElement) {
        checkoutTotalElement.textContent = formatarMoeda(total);
    }

    if (carrinho.length === 0) {
        if (mensagemVazio) mensagemVazio.style.display = 'block';
        if (finalizarCompraBtn) finalizarCompraBtn.disabled = true;
        return;
    }

    if (mensagemVazio) mensagemVazio.style.display = 'none';
    if (finalizarCompraBtn) finalizarCompraBtn.disabled = false;

    carrinho.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-carrinho';
        
        const valorItem = item.preco * item.quantidade;

        itemDiv.innerHTML = `
            <span>${item.nome} (${item.quantidade}x)</span>
            <span>${formatarMoeda(valorItem)}
                <button class="remover-btn" data-nome="${item.nome}">&times;</button>
            </span>
        `;
        listaCarrinhoElemento.appendChild(itemDiv);
    });

    listaCarrinhoElemento.querySelectorAll('.remover-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            removerItemCarrinho(e.target.dataset.nome);
        });
    });
}

/** Limpa o carrinho de compras. */
function limparCarrinho() {
    if (confirm("Tem certeza que deseja limpar o carrinho?")) {
        carrinho = [];
        salvarCarrinho();
        renderizarCarrinho();
    }
}

/** Simula o processo de checkout e exibe o modal de confirmação. */
function processarCheckout(event) {
    event.preventDefault();

    const modalCheckout = document.getElementById('modal-checkout');
    const modalConfirmacao = document.getElementById('modal-confirmacao');
    const formularioCheckout = document.getElementById('formulario-checkout');

    const nome = document.getElementById('checkout-nome').value;
    const email = document.getElementById('checkout-email').value;
    const cep = document.getElementById('checkout-cep').value;
    const endereco = document.getElementById('checkout-endereco').value;
    const total = calcularTotalCarrinho();
    const numeroPedido = Math.floor(Math.random() * 900000) + 100000;
    
    const detalhesDiv = document.getElementById('confirmacao-detalhes');
    
    let listaItensHtml = carrinho.map(item => 
        `<li>${item.nome} (${item.quantidade}x) - ${formatarMoeda(item.preco * item.quantidade)}</li>`
    ).join('');
    
    detalhesDiv.innerHTML = `
        <p><strong>Pedido Nº:</strong> <span style="color: #FF69B4;">${numeroPedido}</span></p>
        <p><strong>Total Pago:</strong> <span style="font-size: 1.3em; color: #5A352A; font-weight: 700;">${formatarMoeda(total)}</span></p>
        <p><strong>Cliente:</strong> ${nome}</p>
        <p><strong>Endereço de Entrega:</strong> ${endereco}, CEP ${cep}</p>
        <br>
        <p><strong>Itens Comprados:</strong></p>
        <ul style="list-style: disc; margin-left: 20px;">${listaItensHtml}</ul>
        <p style="margin-top: 15px;">A confirmação detalhada foi enviada para ${email}.</p>
    `;
    
    // Limpa o carrinho
    carrinho = [];
    salvarCarrinho();
    
    // Fecha o checkout e abre a confirmação
    fecharModal(modalCheckout);
    abrirModal(modalConfirmacao);
    
    if (formularioCheckout) formularioCheckout.reset(); 
}

// Expõe a função para ser usada no atributo onsubmit do HTML
window.processarCheckout = processarCheckout;


// --- FUNÇÕES DE MODAL ---

function abrirModal(modal) {
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Evita rolagem da página principal
    }
}

function fecharModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}


// --- LÓGICA DA SEÇÃO INTERNACIONAL (Logística Global - index.html) ---

/** Lógica de Acordeão para Países do Mercosul. */
function configurarAcordeaoMercosul() {
    const listaMercosul = document.getElementById('mercosul-lista');
    if (!listaMercosul) return;

    listaMercosul.addEventListener('click', (event) => {
        const button = event.target.closest('.pais-btn');
        if (!button) return;

        const item = button.closest('.mercosul-item');
        const formContainer = item.querySelector('.mercosul-form-container');
        const isCurrentlyOpen = formContainer.style.display === 'block';

        // Fecha todos os outros forms abertos
        document.querySelectorAll('.mercosul-form-container').forEach(container => {
            container.style.display = 'none';
            container.closest('.mercosul-item').classList.remove('aberto');
        });

        // Abre ou fecha o form clicado
        if (!isCurrentlyOpen) {
            formContainer.style.display = 'block';
            item.classList.add('aberto');
        } else {
            formContainer.style.display = 'none';
            item.classList.remove('aberto');
        }
    });
}

/** Simula o envio de cotação para o Mercosul. */
function enviarCotacaoMercosul(event, pais) {
    event.preventDefault();
    
    const form = event.target;
    
    if (!form.checkValidity()) {
        alert('Por favor, preencha todos os campos obrigatórios corretamente.');
        return;
    }

    const email = form.querySelector('input[type="email"]').value;
    const produto = form.querySelector('[name="produto-interesse"]').value;
    const quantidade = form.querySelector('input[type="number"]').value;
    const pagamentoInput = form.querySelector('input[type="radio"]:checked');
    const pagamento = pagamentoInput ? pagamentoInput.value : 'Não Selecionado';

    
    const msgSucessoCotacao = form.querySelector('.msg-sucesso-cotacao');
    if(msgSucessoCotacao) msgSucessoCotacao.style.display = 'block';
    
    const submitBtn = form.querySelector('.btn-destaque');
    if (submitBtn) submitBtn.disabled = true;

    setTimeout(() => {
        form.reset();
        if(msgSucessoCotacao) msgSucessoCotacao.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
        
        // Fecha o acordeão após a simulação
        const item = form.closest('.mercosul-item');
        if (item) {
            const formContainer = item.querySelector('.mercosul-form-container');
            if (formContainer) {
                formContainer.style.display = 'none';
                item.classList.remove('aberto');
            }
        }
        
        alert(`Sua cotação de exportação para ${pais} foi registrada! Entraremos em contato via ${email}.`);
    }, 2000);
}

// Expõe a função para ser usada no atributo onsubmit do HTML
window.enviarCotacaoMercosul = enviarCotacaoMercosul;

/** Lógica para o Modal 'Outros Países'. */
function configurarModalOutrosPaises() {
    const abrirOutrosPaisesBtn = document.getElementById('abrir-outros-paises');
    const modalOutrosPaises = document.getElementById('modal-outros-paises');
    const fecharOutrosPaisesBtn = document.getElementById('fechar-outros-paises');
    const listaPaisesSelecao = document.getElementById('lista-paises-selecao');
    const confirmarPaisBtn = document.getElementById('confirmar-pais-selecionado');
    const outroPaisInput = document.getElementById('outro-pais-input');

    if (abrirOutrosPaisesBtn) {
        abrirOutrosPaisesBtn.addEventListener('click', () => abrirModal(modalOutrosPaises));
    }
    
    if (fecharOutrosPaisesBtn) {
        fecharOutrosPaisesBtn.addEventListener('click', () => fecharModal(modalOutrosPaises));
    }
    
    if (listaPaisesSelecao) {
        listaPaisesSelecao.addEventListener('click', (event) => {
            const item = event.target.closest('li');
            if (!item || item.classList.contains('outro-input-container')) return;

            const paisSelecionado = item.textContent.trim();
            confirmarPais(paisSelecionado);
        });
    }

    if (confirmarPaisBtn) {
        confirmarPaisBtn.addEventListener('click', () => {
            const outroPais = outroPaisInput.value.trim();
            if (outroPais) {
                confirmarPais(outroPais);
            } else {
                alert('Por favor, selecione um país ou preencha o campo "Outro".');
            }
        });
    }
    
    if (modalOutrosPaises) {
        window.addEventListener('click', (event) => {
            if (event.target === modalOutrosPaises) fecharModal(modalOutrosPaises);
        });
    }

    function confirmarPais(pais) {
        fecharModal(modalOutrosPaises);
        alert(`Obrigado por indicar ${pais}! Nossa equipe entrará em contato para iniciar a cotação de logística global para este destino.`);
        if (outroPaisInput) outroPaisInput.value = '';
    }
}


// --- LÓGICA DO FORMULÁRIO DE CONTATO (index.html) ---

function enviarContato(event) {
    event.preventDefault(); 
    
    const nome = document.getElementById('nome').value;
    const msgSucesso = document.getElementById('msg-sucesso');
    const corAcentoRosa = '#FF69B4'; // Do estilos.css

    if(msgSucesso) {
        msgSucesso.style.display = 'block';
        msgSucesso.style.color = corAcentoRosa; 
    }

    setTimeout(() => {
        const form = document.querySelector('.formulario-contato');
        if (form) form.reset();
        if (msgSucesso) msgSucesso.style.display = 'none';
        alert(`Obrigado, ${nome}. Sua solicitação foi registrada.`);
    }, 1500);
}

// Expõe a função para ser usada no atributo onsubmit do HTML
window.enviarContato = enviarContato;


// --- INICIALIZAÇÃO E OUVINTES GERAIS ---

function inicializarEventos() {
    // Referências aos modais e botões principais
    const modalCarrinho = document.getElementById('modal-carrinho');
    const abrirCarrinhoBtn = document.getElementById('abrir-carrinho');
    const fecharCarrinhoBtn = document.getElementById('fechar-carrinho');
    const limparCarrinhoBtn = document.getElementById('limpar-carrinho');
    const finalizarCompraBtn = document.getElementById('finalizar-compra-btn');
    
    const modalCheckout = document.getElementById('modal-checkout');
    const fecharCheckoutBtn = document.getElementById('fechar-checkout');
    
    const modalConfirmacao = document.getElementById('modal-confirmacao');
    const fecharConfirmacaoBtn = document.getElementById('fechar-confirmacao');
    
    const botoesComprar = document.querySelectorAll('.btn-comprar');

    // 1. Ouvintes do Carrinho
    if (abrirCarrinhoBtn) {
        abrirCarrinhoBtn.addEventListener('click', () => {
            renderizarCarrinho();
            abrirModal(modalCarrinho);
        });
    }
    
    if (fecharCarrinhoBtn) fecharCarrinhoBtn.addEventListener('click', () => fecharModal(modalCarrinho));
    if (limparCarrinhoBtn) limparCarrinhoBtn.addEventListener('click', limparCarrinho);
    
    // 2. Ouvintes do Checkout
    if (finalizarCompraBtn) {
        finalizarCompraBtn.addEventListener('click', () => {
            if (carrinho.length > 0) {
                fecharModal(modalCarrinho);
                abrirModal(modalCheckout);
            } else {
                alert("Seu carrinho está vazio!");
            }
        });
    }
    
    if (fecharCheckoutBtn) fecharCheckoutBtn.addEventListener('click', () => fecharModal(modalCheckout));
    
    // 3. Ouvintes da Confirmação
    if (fecharConfirmacaoBtn) fecharConfirmacaoBtn.addEventListener('click', () => fecharModal(modalConfirmacao));

    // 4. Ouvintes dos Botões de Compra (produtos.html)
    botoesComprar.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const nome = e.target.dataset.nome;
            const preco = e.target.dataset.preco;
            adicionarAoCarrinho(nome, preco);
        });
    });
    
    // 5. Fechamento de modais clicando fora
    window.addEventListener('click', (event) => {
        if (event.target === modalCarrinho) fecharModal(modalCarrinho);
        if (event.target === modalCheckout) fecharModal(modalCheckout);
        if (event.target === modalConfirmacao) fecharModal(modalConfirmacao);
    });
    
    // 6. Configurações de Páginas Específicas
    configurarAcordeaoMercosul();
    configurarModalOutrosPaises();
    
    // Inicializa o contador ao carregar
    atualizarContadorCarrinho();
}

// Inicia todo o script após o DOM carregar
document.addEventListener('DOMContentLoaded', inicializarEventos);