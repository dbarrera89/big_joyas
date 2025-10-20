class ShoppingCart {
    constructor() {
      // Usar almacenamiento en memoria en lugar de localStorage
      this.items = [];
      this.bindEvents();
      this.updateCartDisplay();
      this.initializeModal();
    }
  
    // Inicializar el modal si no existe
    initializeModal() {
      if (!document.getElementById('cartModal')) {
        this.createCartModal();
      }
    }
  
    // Crear el modal del carrito dinámicamente
    createCartModal() {
      const modal = document.createElement('div');
      modal.id = 'cartModal';
      modal.innerHTML = `
        <div class="cart-content">
          <div class="cart-header">
            <h2>🛒 Carrito de Compras</h2>
            <button id="closeCart" class="close-btn">&times;</button>
          </div>
          <div id="cartItems" class="cart-items"></div>
          <div class="cart-footer">
            <div id="cartTotal" class="cart-total">Total: $0 COP</div>
            <button class="checkout-btn">Proceder al Pago</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
  
    bindEvents() {
      // Buscar botones de productos de forma más flexible
      this.bindProductButtons();
      
      // Eventos del carrito
      document.addEventListener('click', (e) => {
        if (e.target.id === 'cartIcon' || e.target.closest('#cartIcon')) {
          this.openCart();
        }
        if (e.target.id === 'closeCart') {
          this.closeCart();
        }
        if (e.target.id === 'cartModal') {
          this.closeCart();
        }
      });
    }
  
    bindProductButtons() {
      // Buscar botones con diferentes selectores posibles
      const selectors = [
        '.producto button',
        '.product button',
        '.card button',
        '.item button',
        '[data-product] button',
        '.add-to-cart'
      ];
  
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(button => {
          // Evitar múltiples event listeners
          if (!button.dataset.cartBound) {
            button.addEventListener('click', (e) => {
              e.preventDefault();
              this.handleAddToCart(e);
            });
            button.dataset.cartBound = 'true';
          }
        });
      });
    }
  
    handleAddToCart(e) {
      const button = e.target;
      const productContainer = this.findProductContainer(button);
      
      if (!productContainer) {
        console.warn('No se pudo encontrar el contenedor del producto');
        return;
      }
  
      const productData = this.extractProductData(productContainer);
      
      if (productData.name && productData.price) {
        this.addItem(productData.name, productData.price, productData.image);
        this.showAddedToCartFeedback(button);
      } else {
        console.warn('No se pudieron extraer los datos del producto');
      }
    }
  
    findProductContainer(button) {
      const possibleContainers = [
        '.producto',
        '.product',
        '.card',
        '.item',
        '[data-product]'
      ];
  
      for (const selector of possibleContainers) {
        const container = button.closest(selector);
        if (container) return container;
      }
      
      return null;
    }
  
    extractProductData(container) {
      const data = { name: null, price: null, image: null };
      
      // Extraer nombre - múltiples selectores posibles
      const nameSelectors = ['h2', 'h3', '.name', '.title', '.product-name'];
      for (const selector of nameSelectors) {
        const element = container.querySelector(selector);
        if (element) {
          data.name = element.textContent.trim();
          break;
        }
      }
  
      // Extraer precio - múltiples selectores posibles
      const priceSelectors = ['.precio', '.price', '.cost', '.amount'];
      for (const selector of priceSelectors) {
        const element = container.querySelector(selector);
        if (element) {
          const priceText = element.textContent.replace(/[^\d]/g, '');
          data.price = parseInt(priceText) || 0;
          break;
        }
      }
  
      // Extraer imagen si existe
      const img = container.querySelector('img');
      if (img) {
        data.image = img.src;
      }
  
      return data;
    }
  
    addItem(name, price, image = null) {
      const existing = this.items.find(item => item.name === name);
      if (existing) {
        existing.quantity += 1;
      } else {
        this.items.push({ 
          name, 
          price, 
          quantity: 1,
          image,
          id: Date.now() // ID único para cada producto
        });
      }
      this.updateCartDisplay();
    }
  
    removeItem(name) {
      this.items = this.items.filter(item => item.name !== name);
      this.updateCartDisplay();
    }
  
    changeQuantity(name, amount) {
      const item = this.items.find(i => i.name === name);
      if (item) {
        item.quantity += amount;
        if (item.quantity <= 0) {
          this.removeItem(name);
        }
      }
      this.updateCartDisplay();
    }
  
    getTotal() {
      return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    }
  
    getItemCount() {
      return this.items.reduce((sum, i) => sum + i.quantity, 0);
    }
  
    updateCartDisplay() {
      this.updateCartBadge();
      this.updateCartItems();
      this.updateCartTotal();
    }
  
    updateCartBadge() {
      const badge = document.getElementById('cartBadge');
      if (badge) {
        const count = this.getItemCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      }
    }
  
    updateCartItems() {
      const container = document.getElementById('cartItems');
      if (!container) return;
  
      if (!this.items.length) {
        container.innerHTML = `
          <div class="empty-cart">
            <div class="empty-icon">🛒</div>
            <p>Tu carrito está vacío</p>
            <small>Agrega productos para comenzar</small>
          </div>
        `;
      } else {
        container.innerHTML = '';
        this.items.forEach(item => {
          const div = document.createElement('div');
          div.className = 'cart-item';
          div.innerHTML = `
            <div class="cart-item-info">
              ${item.image ? `<img src="${item.image}" alt="${item.name}" class="cart-item-image">` : ''}
              <div class="cart-item-details">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">$${item.price.toLocaleString()} COP</span>
              </div>
            </div>
            <div class="cart-item-controls">
              <button class="quantity-btn minus" data-action="decrease" data-name="${item.name}">-</button>
              <span class="quantity">${item.quantity}</span>
              <button class="quantity-btn plus" data-action="increase" data-name="${item.name}">+</button>
            </div>
            <div class="cart-item-total">
              $${(item.price * item.quantity).toLocaleString()} COP
            </div>
            <button class="remove-item" data-name="${item.name}">🗑️</button>
          `;
          
          // Agregar event listeners a los botones
          const minusBtn = div.querySelector('.minus');
          const plusBtn = div.querySelector('.plus');
          const removeBtn = div.querySelector('.remove-item');
          
          minusBtn.addEventListener('click', () => this.changeQuantity(item.name, -1));
          plusBtn.addEventListener('click', () => this.changeQuantity(item.name, 1));
          removeBtn.addEventListener('click', () => this.removeItem(item.name));
          
          container.appendChild(div);
        });
      }
    }
  
    updateCartTotal() {
      const totalElement = document.getElementById('cartTotal');
      if (totalElement) {
        totalElement.textContent = `Total: $${this.getTotal().toLocaleString()} COP`;
      }
    }
  
    openCart() {
      const modal = document.getElementById('cartModal');
      if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    }
  
    closeCart() {
      const modal = document.getElementById('cartModal');
      if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    }
  
    showAddedToCartFeedback(button) {
      const originalText = button.textContent;
      button.textContent = '✓ Agregado';
      button.style.backgroundColor = '#4CAF50';
      button.disabled = true;
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
        button.disabled = false;
      }, 1500);
    }
  
    // Método para limpiar todo el carrito
    clearCart() {
      this.items = [];
      this.updateCartDisplay();
    }
  
    // Método para obtener los datos del carrito (útil para checkout)
    getCartData() {
      return {
        items: this.items,
        total: this.getTotal(),
        itemCount: this.getItemCount()
      };
    }
  
    // Método para inicializar después de que el DOM esté listo
    init() {
      this.bindProductButtons();
      this.updateCartDisplay();
    }
  }
  
  // Inicialización mejorada
  document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia global del carrito
    window.shoppingCart = new ShoppingCart();
    
    // Reinicializar cuando se agreguen nuevos productos dinámicamente
    const observer = new MutationObserver(() => {
      window.shoppingCart.bindProductButtons();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
  
  // Exportar la clase para uso en otros módulos si es necesario
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShoppingCart;
  }
  
  // Lógica para mostrar/ocultar el menú canvas
  document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const overlayMenu = document.getElementById('overlay-menu');
    const closeMenu = document.getElementById('close-menu');
  
    if (hamburger && overlayMenu && closeMenu) {
      hamburger.addEventListener('click', () => {
        overlayMenu.classList.add('open');
      });
  
      closeMenu.addEventListener('click', () => {
        overlayMenu.classList.remove('open');
      });
  
      // También cerrar si se da click fuera del menú (opcional)
      overlayMenu.addEventListener('click', (e) => {
        if (e.target === overlayMenu) {
          overlayMenu.classList.remove('open');
        }
      });
    }
  });
  
  
  
  
  //Section carrusel 2 //
  let nextBtn = document.querySelector('.next')
  let prevBtn = document.querySelector('.prev')
  
  let slider = document.querySelector('.slider')
  let sliderList = slider.querySelector('.slider .list')
  let thumbnail = document.querySelector('.slider .thumbnail')
  let thumbnailItems = thumbnail.querySelectorAll('.item')
  
  thumbnail.appendChild(thumbnailItems[0])
  
  // Function for next button 
  nextBtn.onclick = function() {
      moveSlider('next')
  }
  
  
  // Function for prev button 
  prevBtn.onclick = function() {
      moveSlider('prev')
  }
  
  
  function moveSlider(direction) {
      let sliderItems = sliderList.querySelectorAll('.item')
      let thumbnailItems = document.querySelectorAll('.thumbnail .item')
      
      if(direction === 'next'){
          sliderList.appendChild(sliderItems[0])
          thumbnail.appendChild(thumbnailItems[0])
          slider.classList.add('next')
      } else {
          sliderList.prepend(sliderItems[sliderItems.length - 1])
          thumbnail.prepend(thumbnailItems[thumbnailItems.length - 1])
          slider.classList.add('prev')
      }
  
  
      slider.addEventListener('animationend', function() {
          if(direction === 'next'){
              slider.classList.remove('next')
          } else {
              slider.classList.remove('prev')
          }
      }, {once: true}) // Remove the event listener after it's triggered once
  }
  
  
  
  
  