const products = [
  {
    name: 'Soda can',
    description: '350 ml',
    quantity: 0,
    price: 5.00
  },
  {
    name: 'Mineral water',
    description: '500 ml',
    quantity: 0,
    price: 3.00
  },
  {
    name: 'Chocolate',
    description: 'Unit',
    quantity: 0,
    price: 4.50
  }
];

/* From here, JavaScript searches for HTML elements by ID (#). */

const form = document.querySelector('#product-form');
const searchField = document.querySelector('#product-search');
const productsTable = document.querySelector('#products-table');
const purchasesTable = document.querySelector('#purchases-table');
const refreshPurchasesButton = document.querySelector('#refresh-purchases');
const totalItems = document.querySelector('#total-items');
const totalUnits = document.querySelector('#total-units');
const inventoryValue = document.querySelector('#inventory-value');

/* Currency formatter. */

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'BRL'
});

/* Standardizes text so searches ignore case and accent differences. */

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/* Checks the inventory quantity and returns the product status. */

function getStatus(quantity) {
  if (quantity === 0) {
    return {
      text: 'Out of stock',
      className: 'status-low'
    };
  }

  if (quantity <= 5) {
    return {
      text: 'Low stock',
      className: 'status-warning'
    };
  }

  return {
    text: 'Available',
    className: 'status-ok'
  };
}

/* Updates the dashboard indicators. */

function updateSummary() {
  const units = products.reduce((total, product) => total + product.quantity, 0);
  const totalValue = products.reduce(
    (total, product) => total + product.quantity * product.price,
    0
  );

  totalItems.textContent = products.length;
  totalUnits.textContent = units;
  inventoryValue.textContent = currency.format(totalValue);
}

/* Creates one product row for the HTML table. */

function createProductRow(product) {
  const status = getStatus(product.quantity);
  const row = document.createElement('tr');

  row.innerHTML = `
    <td>${product.name}</td>
    <td>${product.description || '-'}</td>
    <td>${product.quantity}</td>
    <td>${currency.format(product.price)}</td>
    <td><span class="status ${status.className}">${status.text}</span></td>
  `;

  return row;
}

/* Formats a date with a short date and time. */

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(date));
}

/* Creates one purchase row for the HTML table. */

function createPurchaseRow(purchase) {
  const row = document.createElement('tr');

  row.innerHTML = `
    <td>${purchase.buyer_name}</td>
    <td>${purchase.product_name}</td>
    <td>${purchase.quantity}</td>
    <td>${currency.format(Number(purchase.total_value))}</td>
    <td>${purchase.payment_method}</td>
    <td>${formatDate(purchase.created_at)}</td>
  `;

  return row;
}

/* Filters products using the user's search text. */

function renderProducts() {
  const searchTerm = normalizeText(searchField.value.trim());
  const filteredProducts = products.filter((product) => {
    const name = normalizeText(product.name);
    const description = normalizeText(product.description || '');

    return name.includes(searchTerm) || description.includes(searchTerm);
  });

  productsTable.innerHTML = '';

  if (filteredProducts.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="5" class="empty-results">No items found.</td>';
    productsTable.appendChild(emptyRow);
    return;
  }

  filteredProducts.forEach((product) => {
    productsTable.appendChild(createProductRow(product));
  });
}

/* Reads the form data and adds a new product to the array. */

function registerProduct(event) {
  event.preventDefault();

  const data = new FormData(form);
  const newProduct = {
    name: data.get('name').trim(),
    description: data.get('description').trim(),
    quantity: Number(data.get('quantity')),
    price: Number(data.get('price'))
  };

  if (!newProduct.name || Number.isNaN(newProduct.quantity) || Number.isNaN(newProduct.price)) {
    return;
  }

  products.push(newProduct);
  form.reset();
  form.quantity.value = 0;
  updateScreen();
}

/* Centralizes interface updates. */

function updateScreen() {
  updateSummary();
  renderProducts();
}

/* Loads purchases from the server/API. */

async function loadPurchases() {
  purchasesTable.innerHTML = '<tr><td colspan="6" class="empty-results">Loading latest purchases...</td></tr>';

  try {
    const response = await fetch('/api/purchases');

    if (!response.ok) {
      throw new Error('Failed to load purchases.');
    }

    const purchases = await response.json();
    purchasesTable.innerHTML = '';

    if (purchases.length === 0) {
      purchasesTable.innerHTML = '<tr><td colspan="6" class="empty-results">No purchases registered yet.</td></tr>';
      return;
    }

    purchases.forEach((purchase) => {
      purchasesTable.appendChild(createPurchaseRow(purchase));
    });
  } catch (error) {
    purchasesTable.innerHTML = '<tr><td colspan="6" class="empty-results">Start the server to view updated database purchases.</td></tr>';
  }
}

form.addEventListener('submit', registerProduct);
searchField.addEventListener('input', renderProducts);
refreshPurchasesButton.addEventListener('click', loadPurchases);

updateScreen();
loadPurchases();
