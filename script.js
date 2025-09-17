document.addEventListener('DOMContentLoaded', () => {
    const telaCarregamento = document.getElementById('tela-carregamento');
    const cabecalhoPrincipal = document.getElementById('cabecalho-principal');
    const conteudoPrincipal = document.getElementById('conteudo-principal');
    const rodape = document.querySelector('.rodape');
    const listaCarrinho = document.getElementById('lista-carrinho');
    const msgCarrinhoVazio = document.getElementById('msg-carrinho-vazio');
    const botoesAdicionarCarrinho = document.querySelectorAll('.adicionar-carrinho');
    const contadorCarrinho = document.getElementById('contador-carrinho');
    const carrinhoDropdown = document.getElementById('carrinho-dropdown');

    // Array para armazenar os itens do carrinho
    let itensCarrinho = [];

    // Simula um tempo de carregamento de 3 segundos
    setTimeout(() => {
        telaCarregamento.style.opacity = '0';
        setTimeout(() => {
            telaCarregamento.style.display = 'none';
            cabecalhoPrincipal.style.display = 'flex';
            conteudoPrincipal.style.display = 'block';
            rodape.style.display = 'block';
        }, 1000); // Tempo para a animação de fade-out
    }, 3000); // 3 segundos antes de começar a transição

    // Função para abrir e fechar o menu
    window.alternarMenu = function() {
        const menuLateral = document.getElementById('menuLateral');
        menuLateral.style.width = menuLateral.style.width === '280px' ? '0' : '280px';
    }

    // Função para abrir/fechar o dropdown do carrinho
    window.alternarDropdownCarrinho = function() {
        if (carrinhoDropdown.style.display === 'block') {
            carrinhoDropdown.style.display = 'none';
        } else {
            carrinhoDropdown.style.display = 'block';
        }
    }

    // Atualiza o contador e a lista do carrinho
    function atualizarCarrinho() {
        contadorCarrinho.textContent = itensCarrinho.length;
        listaCarrinho.innerHTML = '';
        if (itensCarrinho.length === 0) {
            msgCarrinhoVazio.style.display = 'block';
        } else {
            msgCarrinhoVazio.style.display = 'none';
            itensCarrinho.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${item}</span>`;
                listaCarrinho.appendChild(li);
            });
        }
    }

    // Funcionalidade do Carrinho
    botoesAdicionarCarrinho.forEach(botao => {
        botao.addEventListener('click', () => {
            const nomeProduto = botao.dataset.produto;
            itensCarrinho.push(nomeProduto);
            atualizarCarrinho();
            alert(nomeProduto + " foi adicionado ao seu carrinho!");
        });
    });

    // Inicializa o carrinho vazio
    atualizarCarrinho();
});

// Inicialização do Google Maps
function initMap() {
    var diadema = {lat: -23.700752, lng: -46.615246};
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: diadema
    });
    var marker = new google.maps.Marker({
        position: diadema,
        map: map,
        title: 'Fábrica ReinoDoce em Diadema'
    });
}