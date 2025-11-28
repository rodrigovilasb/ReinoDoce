"use strict";

let carrinho = JSON.parse(localStorage.getItem('carrinhoReinoDoce')) || []; 

function formatarMoeda(valor) {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

function salvarCarrinho() {
    localStorage.setItem('carrinhoReinoDoce', JSON.stringify(carrinho));
    atualizarContadorCarrinho();
}

function atualizarContadorCarrinho() {
    const contadorElemento = document.getElementById('contador-carrinho');
    if (!contadorElemento) return;

    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    contadorElemento.textContent = totalItens;
}

function adicionarAoCarrinho(nome, preco, quantidade) { 
    const precoFloat = parseFloat(preco);
    const quantidadeInt = parseInt(quantidade);

    
    if (quantidadeInt <= 0) {
        alert("A quantidade deve ser de pelo menos 1 item.");
        return; 
    } 

    const itemExistente = carrinho.find(item => item.nome === nome);

    if (itemExistente) {
        itemExistente.quantidade += quantidadeInt;
    } else {
        carrinho.push({ nome, preco: precoFloat, quantidade: quantidadeInt });
    }

    salvarCarrinho();
    alert(`"${nome}" (${quantidadeInt}x) adicionado ao carrinho!`);
}

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

function calcularTotalCarrinho() {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

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
    if(totalGeralElemento) totalGeralElemento.textContent = formatarMoeda(total);
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

function limparCarrinho() {
    if (confirm("Tem certeza que deseja limpar o carrinho?")) {
        carrinho = [];
        salvarCarrinho();
        renderizarCarrinho();
    }
}

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

    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    // Monta payload para enviar ao servidor
    const payload = {
        cliente: {
            nome: nome,
            email: email,
            cep: cep,
            endereco: endereco
        },
        itens: carrinho.map(item => ({
            nome: item.nome,
            quantidade: item.quantidade,
            preco_unit: item.preco
        })),
        total: total
    };

    // Chamada ao endpoint PHP que grava no banco (PHP)
    fetch('php/checkout.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(resp => resp.json())
    .then(data => {
        if (!data || !data.success) {
            const msg = data && data.error ? data.error : 'Erro ao processar pedido.';
            alert(msg);
            return;
        }

        // Monta detalhes para exibir no registro de confirmação
        const detalhesDiv = document.getElementById('confirmacao-detalhes');
        const itensHtml = carrinho.map(it => `<li>${it.nome} (${it.quantidade}x) - ${formatarMoeda(it.preco * it.quantidade)}</li>`).join('');
        if (detalhesDiv) {
            detalhesDiv.innerHTML = `
                <p><strong>Pedido Nº:</strong> <span style="color: #FF69B4;">${data.id_pedv}</span></p>
                <p><strong>Nota Fiscal Nº:</strong> <span style="color: #5A352A;">${data.numero_nf} (Série ${data.serie_nf})</span></p>
                <p><strong>Total Pago:</strong> <span style="font-size: 1.3em; color: #5A352A; font-weight: 700;">${formatarMoeda(data.valor_total)}</span></p>
                <p><strong>Cliente:</strong> ${nome}</p>
                <p><strong>Endereço de Entrega:</strong> ${endereco}, CEP ${cep}</p>
                <br>
                <p><strong>Itens Comprados:</strong></p>
                <ul style="list-style: disc; margin-left: 20px;">${itensHtml}</ul>
                <p style="margin-top: 15px;">Confirmação enviada para ${email}.</p>
            `;
        }

        // Limpa carrinho local e atualiza o design para ficar lindo, perfeito, maravilhoso, do jeitinho que a reinodoce e o ulisses gosta:)
        carrinho = [];
        salvarCarrinho();
        renderizarCarrinho();

        if (formularioCheckout) formularioCheckout.reset();

        fecharModal(modalCheckout);
        abrirModal(modalConfirmacao);
    })
    .catch(err => {
        console.error('Erro fetch checkout:', err);
        alert('Erro de comunicação com o servidor. Tente novamente.');
    });
}

window.processarCheckout = processarCheckout;



function abrirModal(modal) {
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; 
    }
}

function fecharModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function configurarControlesQuantidade() {
  
    document.querySelectorAll('.btn-diminuir').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const nome = e.target.dataset.nome;
            const display = document.querySelector(`.quantidade-display[data-nome="${nome}"]`);
            if (!display) return;
            
            let quantidade = parseInt(display.textContent);
            if (quantidade > 1) {
                quantidade--;
                display.textContent = quantidade;
            }
        });
    });

    document.querySelectorAll('.btn-aumentar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const nome = e.target.dataset.nome;
            const display = document.querySelector(`.quantidade-display[data-nome="${nome}"]`);
            if (!display) return;
            
            let quantidade = parseInt(display.textContent);
            quantidade++;
            display.textContent = quantidade;
        });
    });
}

function configurarAcordeaoMercosul() {
    const listaMercosul = document.getElementById('mercosul-lista');
    if (!listaMercosul) return;

    listaMercosul.addEventListener('click', (event) => {
        const button = event.target.closest('.pais-btn');
        if (!button) return;

        const item = button.closest('.mercosul-item');
        const formContainer = item.querySelector('.mercosul-form-container');
        const isCurrentlyOpen = formContainer.style.display === 'block';

        document.querySelectorAll('.mercosul-form-container').forEach(container => {
            container.style.display = 'none';
            container.closest('.mercosul-item').classList.remove('aberto');
        });

        if (!isCurrentlyOpen) {
            formContainer.style.display = 'block';
            item.classList.add('aberto');
        } else {
            formContainer.style.display = 'none';
            item.classList.remove('aberto');
        }
    });
}
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

window.enviarCotacaoMercosul = enviarCotacaoMercosul;

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



function enviarContato(event) {
    event.preventDefault(); 
    
    const nome = document.getElementById('nome').value;
    const msgSucesso = document.getElementById('msg-sucesso');
    const corAcentoRosa = '#FF69B4'; 

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

window.enviarContato = enviarContato;



function aplicarMascaraCPF(input) {
    if (!input) return;
    let v = input.value.replace(/\D/g, '').slice(0,11);
    v = v.replace(/^(\d{3})(\d)/, '$1.$2');
    v = v.replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2');
    v = v.replace(/^(\d{3}\.\d{3}\.\d{3})(\d{1,2})/, '$1-$2');
    input.value = v;
}

function aplicarMascaraTelefone(input) {
    if (!input) return;
    let v = input.value.replace(/\D/g, '').slice(0,11);
    if (v.length > 10) {
        v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (v.length > 6) {
        v = v.replace(/^(\d{2})(\d{4,5})(\d{0,4})$/, '($1) $2-$3');
    } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d+)/, '($1) $2');
    }
    input.value = v;
}

function configurarFormularioTrabalhe() {
    const cpf = document.getElementById('cpf');
    const telefone = document.getElementById('telefone');
    const formacaoRadios = document.querySelectorAll('input[name="formacao"]');
    const experienciaRadios = document.querySelectorAll('input[name="experiencia"]');
    const form = document.getElementById('form-trabalhe');

    if (cpf) {
        cpf.addEventListener('input', (e) => aplicarMascaraCPF(e.target));
        cpf.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
            e.target.value = paste;
            aplicarMascaraCPF(e.target);
        });
    }

    if (telefone) {
        telefone.addEventListener('input', (e) => aplicarMascaraTelefone(e.target));
        telefone.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
            e.target.value = paste;
            aplicarMascaraTelefone(e.target);
        });
    }

    if (formacaoRadios) {
        formacaoRadios.forEach(r => r.addEventListener('change', () => {
            const superiorChecked = document.getElementById('formacao-superior') && document.getElementById('formacao-superior').checked;
            const areaContainer = document.getElementById('formacao-area-container');
            if (areaContainer) areaContainer.style.display = superiorChecked ? 'block' : 'none';
        }));
    }

    if (experienciaRadios) {
        experienciaRadios.forEach(r => r.addEventListener('change', () => {
            const sim = document.getElementById('exp-sim') && document.getElementById('exp-sim').checked;
            const qualContainer = document.getElementById('exp-qual-container');
            if (qualContainer) qualContainer.style.display = sim ? 'block' : 'none';
        }));
    }

    window.enviarFormularioTrabalhe = function(event) {
        event.preventDefault();
        const form = document.getElementById('form-trabalhe');
        if (!form) return;
        
        const nome = form.querySelector('#nome-completo').value || '';
        const msg = document.getElementById('trabalhe-msg');
        
        if (msg) {
            msg.style.display = 'block';
            msg.style.color = '#2e7d32';
            msg.textContent = `Obrigado, ${nome || 'candidato'}. Sua candidatura foi enviada com sucesso!`;
        }
        
        setTimeout(() => {
            form.reset();
            const areaContainer = document.getElementById('formacao-area-container');
            const qualContainer = document.getElementById('exp-qual-container');
            if (areaContainer) areaContainer.style.display = 'none';
            if (qualContainer) qualContainer.style.display = 'none';
        }, 1000);
    };
}

function inicializarEventos() {
    const modalCarrinho = document.getElementById('modal-carrinho');
    const abrirCarrinhoBtn = document.getElementById('abrir-carrinho');
    const fecharCarrinhoBtn = document.getElementById('fechar-carrinho');
    const limparCarrinhoBtn = document.getElementById('limpar-carrinho');
    const finalizarCompraBtn = document.getElementById('finalizar-compra-btn');
    
    const modalCheckout = document.getElementById('modal-checkout');
    const fecharCheckoutBtn = document.getElementById('fechar-checkout');
    
    const modalConfirmacao = document.getElementById('modal-confirmacao');
    const fecharConfirmacaoBtn = document.getElementById('fechar-confirmacao');
    
    const botoesAdicionar = document.querySelectorAll('.btn-adicionar');

    if (abrirCarrinhoBtn && modalCarrinho) {
        abrirCarrinhoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            renderizarCarrinho();
            abrirModal(modalCarrinho);
        });
    }
    
    if (fecharCarrinhoBtn && modalCarrinho) {
        fecharCarrinhoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fecharModal(modalCarrinho);
        });
    }
    
    if (limparCarrinhoBtn) {
        limparCarrinhoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            limparCarrinho();
        });
    }
    
    if (finalizarCompraBtn && modalCheckout) {
        finalizarCompraBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (carrinho.length > 0) {
                fecharModal(modalCarrinho);
                renderizarCarrinho();
                abrirModal(modalCheckout);
            } else {
                alert("Seu carrinho está vazio!");
            }
        });
    }
    
    if (fecharCheckoutBtn && modalCheckout) {
        fecharCheckoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fecharModal(modalCheckout);
        });
    }
    
    if (fecharConfirmacaoBtn && modalConfirmacao) {
        fecharConfirmacaoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fecharModal(modalConfirmacao);
        });
    }

    botoesAdicionar.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const nome = e.target.dataset.nome;
            const itemElement = e.target.closest('.produto-item-novo');
            const preco = itemElement ? itemElement.dataset.preco : null;
            const quantidadeDisplay = document.querySelector(`.quantidade-display[data-nome="${nome}"]`);
            const quantidade = quantidadeDisplay ? parseInt(quantidadeDisplay.textContent) : 1;
            
            if (preco) {
                adicionarAoCarrinho(nome, preco, quantidade);
                if (quantidadeDisplay) quantidadeDisplay.textContent = '1';
            } else {
                alert("Erro: Preço do produto não encontrado.");
            }
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === modalCarrinho) fecharModal(modalCarrinho);
        if (event.target === modalCheckout) fecharModal(modalCheckout);
        if (event.target === modalConfirmacao) fecharModal(modalConfirmacao);
    });
    
    configurarAcordeaoMercosul();
    configurarModalOutrosPaises();
    configurarControlesQuantidade(); 

    configurarFormularioTrabalhe(); // <-- adicionada

    atualizarContadorCarrinho();
}

document.addEventListener('DOMContentLoaded', inicializarEventos);