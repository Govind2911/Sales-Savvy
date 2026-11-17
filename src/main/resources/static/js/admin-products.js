/* Sales Savvy — admin-products.js
   Same API calls and flow as before. Changes are presentation only:
   styled table, escaped output, nicer delete confirmation + row animation. */

const ICON_BOX = '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>';

// Escape text before putting it in innerHTML
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function getToken() {
  return localStorage.getItem("token");
}

function ensureAdminAccess() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "ADMIN") {
    window.location.replace("/admin-login.html");
    return false;
  }

  return true;
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function addProduct(event) {
  event.preventDefault();

  const data = {
    name: document.getElementById("name").value,
    description: document.getElementById("description").value,
    price: document.getElementById("price").value,
    stock: document.getElementById("stock").value,
    category: document.getElementById("category").value,
    imageUrl: document.getElementById("imageUrl").value
  };

  const response = await fetch("/admin/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + getToken()
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    document.getElementById("message").innerText = "Failed to add product";
    return;
  }

  document.getElementById("message").innerText = "Product added successfully";

  setTimeout(() => {
    window.location.href = "/all-products-admin.html";
  }, 1000);
}

async function loadAllProducts() {
  const response = await fetch("/admin/products", {
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  if (response.status === 401 || response.status === 403) {
    window.location.replace("/admin-login.html");
    return;
  }

  const products = await response.json();
  const productList = document.getElementById("productList");

  if (!products.length) {
    productList.innerHTML = `<p class="empty-state">${ICON_BOX}No products found</p>`;
    return;
  }

  let html = `
    <div class="table-wrap">
    <table class="product-table">
      <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Price</th>
        <th>Stock</th>
        <th>Category</th>
        <th>Actions</th>
      </tr>
      </thead>
      <tbody>
  `;

  products.forEach((product, i) => {
    html += `
      <tr style="--i:${i}">
        <td>${esc(product.id)}</td>
        <td>${esc(product.name)}</td>
        <td>₹${esc(product.price)}</td>
        <td>${esc(product.stock)}</td>
        <td>${esc(product.category)}</td>
        <td>
          <div class="row-actions">
            <a class="btn btn-sm btn-ghost" href="/view-product-admin.html?id=${encodeURIComponent(product.id)}">View</a>
            <a class="btn btn-sm btn-ghost" href="/edit-product.html?id=${encodeURIComponent(product.id)}">Edit</a>
            <button class="btn-sm btn-danger" onclick="deleteProduct(${Number(product.id)}, this)">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });

  html += "</tbody></table></div>";
  productList.innerHTML = html;
}

async function loadProductDetails() {
  const id = getProductIdFromUrl();
  if (!id) return;

  const response = await fetch(`/admin/products/${id}`, {
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  if (response.status === 401 || response.status === 403) {
    window.location.replace("/admin-login.html");
    return;
  }

  const product = await response.json();
  const detailsDiv = document.getElementById("productDetails");

  detailsDiv.innerHTML = `
    <p><strong>ID:</strong> ${esc(product.id)}</p>
    <p><strong>Name:</strong> ${esc(product.name)}</p>
    <p><strong>Description:</strong> ${esc(product.description)}</p>
    <p><strong>Price:</strong> ₹${esc(product.price)}</p>
    <p><strong>Stock:</strong> ${esc(product.stock)}</p>
    <p><strong>Category:</strong> ${esc(product.category)}</p>
    <p><strong>Image:</strong></p>
    ${product.imageUrl ? `<img class="product-image-preview" src="${esc(product.imageUrl)}" alt="${esc(product.name)}" />` : "<p>No image</p>"}
  `;
}

async function prefillEditForm() {
  const id = getProductIdFromUrl();
  if (!id) return;

  const response = await fetch(`/admin/products/${id}`, {
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  if (response.status === 401 || response.status === 403) {
    window.location.replace("/admin-login.html");
    return;
  }

  const product = await response.json();

  document.getElementById("name").value = product.name;
  document.getElementById("description").value = product.description;
  document.getElementById("price").value = product.price;
  document.getElementById("stock").value = product.stock;
  document.getElementById("category").value = product.category;
  document.getElementById("imageUrl").value = product.imageUrl || "";
}

async function updateProduct(event) {
  event.preventDefault();

  const id = getProductIdFromUrl();

  const data = {
    name: document.getElementById("name").value,
    description: document.getElementById("description").value,
    price: document.getElementById("price").value,
    stock: document.getElementById("stock").value,
    category: document.getElementById("category").value,
    imageUrl: document.getElementById("imageUrl").value
  };

  const response = await fetch(`/admin/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + getToken()
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    document.getElementById("message").innerText = "Failed to update product";
    return;
  }

  document.getElementById("message").innerText = "Product updated successfully";

  setTimeout(() => {
    window.location.href = "/all-products-admin.html";
  }, 1000);
}

async function deleteProduct(id, btn) {
  const question = "Are you sure you want to delete this product?";
  const confirmed = window.SS
    ? await SS.confirm(question, { title: "Delete product", confirmText: "Delete", danger: true })
    : confirm(question);
  if (!confirmed) return;

  const response = await fetch(`/admin/products/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  if (!response.ok) {
    alert("Failed to delete product");
    return;
  }

  // Slide the row out before refreshing the list
  const row = btn ? btn.closest("tr") : null;
  if (row) {
    row.classList.add("row-out");
    await new Promise((resolve) => setTimeout(resolve, 320));
  }

  alert("Product deleted successfully");
  loadAllProducts();
}

document.addEventListener("DOMContentLoaded", () => {
  if (!ensureAdminAccess()) return;

  const addProductForm = document.getElementById("addProductForm");
  const editProductForm = document.getElementById("editProductForm");
  const productList = document.getElementById("productList");
  const productDetails = document.getElementById("productDetails");

  if (addProductForm) {
    addProductForm.addEventListener("submit", addProduct);
  }

  if (editProductForm) {
    prefillEditForm();
    editProductForm.addEventListener("submit", updateProduct);
  }

  if (productList) {
    loadAllProducts();
  }

  if (productDetails) {
    loadProductDetails();
  }
});