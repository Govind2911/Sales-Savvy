/* Sales Savvy — customer.js
   Same API calls and flow as before. Changes are presentation only:
   product cards, escaped output, "Added" button state, animated cart total. */

const ICON_BAG = '<svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
const ICON_CART = '<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
const ICON_PLUS = '<svg class="ico" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
const ICON_CHECK = '<svg class="ico" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';

// Escape text before putting it in innerHTML (product data is user-entered by admins)
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function ensureCustomer() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  if (!token || role !== "USER") {
    window.location.replace("/login.html");
    return false;
  }

  const welcome = document.getElementById("welcomeText");
  if (welcome) {
    welcome.innerText = `Welcome, ${username}`;
  }

  return true;
}

function getToken() {
  return localStorage.getItem("token");
}

function startShopping() {
  loadProducts();
}

function goToCart() {
  window.location.href = "/view-cart.html";
}

function goBackToShopping() {
  window.location.href = "/customer-home.html";
}

async function loadProducts() {
  const response = await fetch("/products", {
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  if (response.status === 401) {
    logout();
    return;
  }

  if (response.status === 403) {
    alert("Access denied to products");
    return;
  }

  const products = await response.json();
  const shoppingSection = document.getElementById("shoppingSection");
  const productList = document.getElementById("productList");

  shoppingSection.style.display = "block";
  shoppingSection.classList.remove("shown");
  void shoppingSection.offsetWidth;
  shoppingSection.classList.add("shown");

  if (!products.length) {
    productList.innerHTML = `<p class="empty-state">${ICON_BAG}No products found</p>`;
    return;
  }

  let html = '<div class="product-grid">';

  products.forEach((product, i) => {
    const stock = Number(product.stock);
    let stockPill = "";
    if (stock <= 0) stockPill = '<span class="pill pill-stock out">Out of stock</span>';
    else if (stock <= 5) stockPill = `<span class="pill pill-stock">Only ${stock} left</span>`;

    html += `
      <article class="product-card" style="--i:${i}">
        <div class="product-media">
          <span class="product-ph">${ICON_BAG}</span>
          ${product.imageUrl ? `<img src="${esc(product.imageUrl)}" alt="${esc(product.name)}" loading="lazy" onerror="this.style.display='none'" />` : ""}
          <span class="pill pill-cat">${esc(product.category)}</span>
          ${stockPill}
        </div>
        <div class="product-body">
          <h3 class="product-name">${esc(product.name)}</h3>
          ${product.description ? `<p class="product-desc">${esc(product.description)}</p>` : ""}
          <div class="product-price">₹${esc(product.price)}</div>
          <button class="add-btn" data-burst onclick="addToCart(${Number(product.id)}, this)">${ICON_PLUS}Add to Cart</button>
        </div>
      </article>
    `;
  });

  html += "</div>";
  productList.innerHTML = html;

  shoppingSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function addToCart(productId, btn) {
  const response = await fetch("/customer/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + getToken()
    },
    body: JSON.stringify({
      productId: productId,
      quantity: 1
    })
  });

  const result = await response.json().catch(() => ({}));

  if (response.status === 401) {
    logout();
    return;
  }

  if (!response.ok) {
    alert(result.message || "Failed to add product to cart");
    return;
  }

  // Button turns green with a tick for a moment
  if (btn && !btn.classList.contains("is-done")) {
    const original = btn.innerHTML;
    btn.classList.add("is-done");
    btn.innerHTML = `${ICON_CHECK}Added`;
    setTimeout(() => {
      btn.classList.remove("is-done");
      btn.innerHTML = original;
    }, 1400);
  }

  alert(result.message || "Product added to cart");
}

async function loadCart() {
  const response = await fetch("/customer/cart", {
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  if (response.status === 401) {
    logout();
    return;
  }

  if (response.status === 403) {
    alert("Access denied to cart");
    return;
  }

  const cart = await response.json();
  const cartList = document.getElementById("cartList");
  const cartTotal = document.getElementById("cartTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");

  if (!cartList) return;

  if (!cart.items.length) {
    cartList.innerHTML = `<p class='empty-state'>${ICON_CART}Your cart is empty</p>`;
    cartTotal.innerText = "";
    if (checkoutBtn) checkoutBtn.style.display = "none";
    return;
  }

  let html = `
    <div class="table-wrap">
    <table class="product-table">
      <thead>
      <tr>
        <th>Image</th>
        <th>Name</th>
        <th>Price</th>
        <th>Quantity</th>
        <th>Subtotal</th>
        <th>Actions</th>
      </tr>
      </thead>
      <tbody>
  `;

  cart.items.forEach((item, i) => {
    html += `
      <tr style="--i:${i}">
        <td>
          <img src="${esc(item.imageUrl || "")}" alt="${esc(item.productName)}" class="product-thumb" onerror="this.style.visibility='hidden'" />
        </td>
        <td>${esc(item.productName)}</td>
        <td>₹${esc(item.price)}</td>
        <td>
          <input type="number" min="1" value="${esc(item.quantity)}" id="qty-${Number(item.cartItemId)}" class="qty-input" />
        </td>
        <td>₹${esc(item.subtotal)}</td>
        <td>
          <div class="row-actions">
            <button class="btn-sm btn-ghost" onclick="updateCartItem(${Number(item.cartItemId)})">Update</button>
            <button class="btn-sm btn-danger" onclick="removeCartItem(${Number(item.cartItemId)})">Remove</button>
          </div>
        </td>
      </tr>
    `;
  });

  html += "</tbody></table></div>";

  cartList.innerHTML = html;

  const totalText = `Total: ₹${cart.totalAmount}`;
  cartTotal.innerText = totalText;
  if (checkoutBtn) checkoutBtn.style.display = "";
  if (window.SS) {
    SS.countUp(cartTotal, cart.totalAmount, { prefix: "Total: ₹", final: totalText });
  }
}

async function updateCartItem(cartItemId) {
  const quantity = document.getElementById(`qty-${cartItemId}`).value;

  const response = await fetch(`/customer/cart/${cartItemId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + getToken()
    },
    body: JSON.stringify({
      quantity: Number(quantity)
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    alert(result.message || "Failed to update cart item");
    return;
  }

  alert(result.message || "Cart updated");
  loadCart();
}

async function removeCartItem(cartItemId) {
  const response = await fetch(`/customer/cart/${cartItemId}`, {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    alert(result.message || "Failed to remove cart item");
    return;
  }

  // Slide the row out before refreshing the list
  const input = document.getElementById(`qty-${cartItemId}`);
  const row = input ? input.closest("tr") : null;
  if (row) {
    row.classList.add("row-out");
    await new Promise((resolve) => setTimeout(resolve, 320));
  }

  alert(result.message || "Item removed from cart");
  loadCart();
}

async function checkout() {
  if (typeof Razorpay === "undefined") {
    alert("Razorpay SDK not loaded");
    return;
  }

  const createOrderResponse = await fetch("/customer/payment/create-order", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  if (createOrderResponse.status === 401) {
    logout();
    return;
  }

  const orderData = await createOrderResponse.json().catch(() => ({}));

  if (!createOrderResponse.ok) {
    alert(orderData.message || "Failed to create payment order");
    return;
  }

  const username = localStorage.getItem("username") || "Customer";

  const options = {
    key: orderData.keyId,
    amount: orderData.amount,
    currency: orderData.currency,
    name: "Sales Savvy",
    description: "Cart Payment",
    order_id: orderData.razorpayOrderId,
    handler: async function (response) {
      const verifyResponse = await fetch("/customer/payment/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getToken()
        },
        body: JSON.stringify({
          localOrderId: orderData.localOrderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature
        })
      });

      const verifyResult = await verifyResponse.json().catch(() => ({}));

      if (!verifyResponse.ok) {
        alert(verifyResult.message || "Payment verification failed");
        return;
      }

      alert(verifyResult.message || "Payment successful");
      window.location.href = "/customer-home.html";
    },
    prefill: {
      name: username
    },
    theme: {
      color: "#0F52BA"   // sapphire
    }
  };

  console.log("Razorpay Options:", options);

  const rzp = new Razorpay(options);

  rzp.on("payment.failed", function (response) {

      console.log("Payment Failed Response:", response);

      alert(
          response.error.description ||
          response.error.reason ||
          "Payment failed"
      );
  });

  rzp.open();
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  window.location.replace("/index.html");
}

document.addEventListener("DOMContentLoaded", () => {
  if (!ensureCustomer()) return;

  if (document.getElementById("cartList")) {
    loadCart();
  }
});