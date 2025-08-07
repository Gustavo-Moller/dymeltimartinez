// === Integração com API Externa para carregar produtos ===
// Em vez do array estático, inicializamos como vazio e buscamos da API
let products = [];

// Função que carrega produtos de uma API externa
// Altere a URL para o endpoint real da sua API
async function loadProducts() {
  try {
    const res = await fetch("http://localhost:3001/produtos");
    if (!res.ok) throw new Error(`Erro ao carregar produtos: ${res.status}`);
    products = await res.json(); // popula o array com os dados da API
    renderProducts(); // renderiza os produtos depois de carregar
  } catch (err) {
    console.error(err);
    // Exibir mensagem de erro na UI, se desejar
    document.getElementById("productsGrid").innerHTML =
      '<p class="error">Não foi possível carregar os produtos.</p>';
  }
}

// Estado do carrinho de compras
let cart = [];

// === Renderização dos produtos ===
function renderProducts() {
  const grid = document.getElementById("productsGrid");
  grid.innerHTML = products
    .map(
      (product) => `
        <div class="product-card" onclick="openProductModal(${product.id})">
            <div class="product-image">
                <!-- Imagem principal; oculta se não carregar -->
                <img src="${product.images[0]}" alt="${
        product.name
      }" onerror="this.style.display='none'">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <!-- Preço formatado em Real -->
                <div class="product-price">R$ ${product.price
                  .toFixed(2)
                  .replace(".", ",")}</div>
                <div class="product-actions">
                    ${
                      product.available
                        ? `<button class="btn btn-primary" onclick="event.stopPropagation(); quickAddToCart(${product.id})">Adicionar</button>`
                        : `<button class="btn" disabled>Indisponível</button>`
                    }
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); openProductModal(${
                      product.id
                    })">Ver Detalhes</button>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// === Adição rápida ao carrinho ===
function quickAddToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product || !product.available) return;

  const cartItem = {
    id: Date.now(),
    productId: product.id,
    name: product.name,
    price: product.price,
    image: product.images[0],
    size: product.sizes[0],
    color: product.colors[0],
    quantity: 1,
  };

  cart.push(cartItem);
  updateCartUI();
  showNotification("Produto adicionado ao carrinho!");
}

// === Modal de detalhes do produto ===
function openProductModal(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const modal = document.getElementById("productModal");
  const modalBody = document.getElementById("modalBody");

  modalBody.innerHTML = `
    <div class="modal-product-images">
      <div class="modal-main-image">
        <img src="${product.images[0]}" alt="${product.name}" id="mainImage">
      </div>
      <div class="modal-image-thumbnails">
        ${product.images
          .map(
            (img, idx) => `
          <div class="modal-thumbnail ${
            idx === 0 ? "active" : ""
          }" onclick="changeMainImage('${img}', this)">
            <img src="${img}" alt="Imagem ${idx + 1}">
          </div>
        `
          )
          .join("")}
      </div>
    </div>
    <div class="modal-product-info">
      <h3>${product.name}</h3>
      <div class="modal-product-price">R$ ${product.price
        .toFixed(2)
        .replace(".", ",")}</div>
      ${
        product.available
          ? `
        <div class="product-options">
          <div class="option-group">
            <label>Tamanho:</label>
            <div class="option-buttons">
              ${product.sizes
                .map(
                  (s) =>
                    `<button class="option-btn" onclick="selectOption(this,'size')" data-value="${s}">${s}</button>`
                )
                .join("")}
            </div>
          </div>
          <div class="option-group">
            <label>Cor:</label>
            <div class="option-buttons">
              ${product.colors
                .map(
                  (c) =>
                    `<button class="option-btn" onclick="selectOption(this,'color')" data-value="${c}">${c}</button>`
                )
                .join("")}
            </div>
          </div>
        </div>
        <button class="btn btn-primary" style="width:100%;" onclick="addToCartFromModal(${
          product.id
        })">Adicionar ao Carrinho</button>
      `
          : `
        <button class="btn" disabled style="width:100%;">Produto Indisponível</button>
      `
      }
    </div>
  `;

  // Seleciona as primeiras opções
  setTimeout(() => {
    modalBody.querySelectorAll(".option-btn")[0]?.click();
    modalBody.querySelectorAll(".option-btn")[product.sizes.length]?.click();
  }, 100);

  modal.classList.add("open");
}

function closeProductModal() {
  document.getElementById("productModal").classList.remove("open");
}
function changeMainImage(src, thumb) {
  document.getElementById("mainImage").src = src;
  document
    .querySelectorAll(".modal-thumbnail")
    .forEach((t) => t.classList.remove("active"));
  thumb.classList.add("active");
}
function selectOption(btn) {
  btn.parentElement
    .querySelectorAll(".option-btn")
    .forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
}
function addToCartFromModal(id) {
  const p = products.find((x) => x.id === id);
  if (!p || !p.available) return;
  const size =
    document.querySelector(".option-btn.selected[data-value]")?.dataset.value ||
    p.sizes[0];
  const color =
    document.querySelector(
      `.option-btn.selected[data-value]:not([data-value="${size}"])`
    )?.dataset.value || p.colors[0];
  cart.push({
    id: Date.now(),
    productId: id,
    name: p.name,
    price: p.price,
    image: p.images[0],
    size,
    color,
    quantity: 1,
  });
  updateCartUI();
  closeProductModal();
  showNotification("Produto adicionado ao carrinho!");
}

// === Carrinho e checkout via WhatsApp ===
function toggleCart() {
  document.getElementById("cartSidebar").classList.toggle("open");
  document.getElementById("cartOverlay").classList.toggle("open");
}
function updateCartUI() {
  const countEl = document.getElementById("cartCount");
  const listEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const btn = document.getElementById("checkoutBtn");
  countEl.textContent = cart.length;
  if (!cart.length) {
    listEl.innerHTML = '<p class="empty-cart">Carrinho vazio</p>';
    totalEl.textContent = "0,00";
    btn.disabled = true;
    return;
  }
  listEl.innerHTML = cart
    .map(
      (item) =>
        `<div class="cart-item"><img src="${item.image}" alt=""><div><strong>${
          item.name
        }</strong><p>${item.size} | ${item.color}</p><p>R$ ${item.price
          .toFixed(2)
          .replace(".", ",")}</p><div><button onclick="updateQuantity(${
          item.id
        },-1)">-</button><span>${
          item.quantity
        }</span><button onclick="updateQuantity(${
          item.id
        },1)">+</button><button onclick="removeFromCart(${
          item.id
        })">Remover</button></div></div></div>`
    )
    .join("");
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  totalEl.textContent = total.toFixed(2).replace(".", ",");
  btn.disabled = false;
}
function updateQuantity(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity < 1) removeFromCart(id);
  else updateCartUI();
}
function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  updateCartUI();
  showNotification("Produto removido do carrinho!");
}
function checkout() {
  if (!cart.length) return;
  let msg = "*PEDIDO DYMELTI MARTINEZ*\n\n*Produtos:*\n";
  cart.forEach((i) => {
    msg += `• ${i.name}\n  ${i.size} | ${i.color}\n  ${i.quantity}x R$ ${(
      i.price * i.quantity
    )
      .toFixed(2)
      .replace(".", ",")}\n`;
  });
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  msg += `\n*Total:* R$ ${total
    .toFixed(2)
    .replace(".", ",")}\n\n*Via WhatsApp*`;
  window.open(
    `https://wa.me/5562998806950?text=${encodeURIComponent(msg)}`,
    "_blank"
  );
}
function showNotification(text) {
  const n = document.createElement("div");
  n.className = "notification";
  n.textContent = text;
  document.body.appendChild(n);
  setTimeout(() => n.classList.add("show"), 50);
  setTimeout(() => {
    n.classList.remove("show");
    setTimeout(() => n.remove(), 300);
  }, 3000);
}

// === Event listeners ===
document.getElementById("productModal").addEventListener("click", (e) => {
  if (e.target.id === "productModal") closeProductModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("cartSidebar").classList.remove("open");
    closeProductModal();
  }
});
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartUI();
});
