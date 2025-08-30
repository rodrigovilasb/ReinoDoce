document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const mainHeader = document.getElementById('main-header');
    const mainContent = document.getElementById('main-content');
    const footer = document.querySelector('.footer');
    
    // Simula um tempo de carregamento de 3 segundos
    setTimeout(() => {
        splashScreen.style.opacity = '0';
        setTimeout(() => {
            splashScreen.style.display = 'none';
            mainHeader.style.display = 'flex';
            mainContent.style.display = 'block';
            footer.style.display = 'block';
        }, 1000); // Tempo para a animação de fade-out
    }, 3000); // 3 segundos antes de começar a transição

    const cartList = document.getElementById('cart-list');
    const cartEmptyMsg = document.getElementById('cart-empty-msg');
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

    // Função para abrir e fechar o menu
    window.toggleMenu = function() {
        const sideMenu = document.getElementById('sideMenu');
        sideMenu.style.width = sideMenu.style.width === '280px' ? '0' : '280px';
    }

    // Funcionalidade do Carrinho
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const productName = button.dataset.product;
            addItemToCart(productName);
        });
    });

    function addItemToCart(productName) {
        if (cartEmptyMsg) {
            cartEmptyMsg.style.display = 'none';
        }

        const li = document.createElement('li');
        li.innerHTML = `
            <span>${productName}</span>
        `;
        cartList.appendChild(li);
        alert(productName + " foi adicionado ao seu carrinho!");
    }
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