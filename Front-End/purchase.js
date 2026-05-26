/* The JavaScript captures the HTML elements here. */

const purchaseForm = document.querySelector('#purchase-form');
const purchaseProduct = document.querySelector('#purchase-product');
const purchaseQuantity = document.querySelector('#purchase-quantity');
const summaryItem = document.querySelector('#summary-item');
const summaryQuantity = document.querySelector('#summary-quantity');
const summaryTotal = document.querySelector('#summary-total');
const purchaseMessage = document.querySelector('#purchase-message');

/* This array stores the products returned by the back end. */

let availableProducts = [];

/* Currency formatter. */

const purchaseCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'BRL'
});

/* Gets the product selected in the <select>. */

function getSelectedProduct() {
  const option = purchaseProduct.selectedOptions[0];

  if (!option || !option.value) {
    return null;
  }

  return {
    id: Number(option.value),
    name: option.textContent.split(' - ')[0],
    price: Number(option.dataset.price)
  };
}

/* Calculates the purchase total from the selected product and quantity. */

function calculateTotal() {
  const product = getSelectedProduct();
  const quantity = Number(purchaseQuantity.value) || 0;

  if (!product) {
    return 0;
  }

  return product.price * quantity;
}

/* Updates only the visual purchase summary. */

function updatePurchaseSummary() {
  const product = getSelectedProduct();
  const quantity = Number(purchaseQuantity.value) || 0;

  summaryItem.textContent = product ? product.name : '-';
  summaryQuantity.textContent = quantity;
  summaryTotal.textContent = purchaseCurrency.format(calculateTotal());
}

/* Sends the purchase DTO to the server. */

async function sendPurchase(event) {
  event.preventDefault();

  const product = getSelectedProduct();
  const data = new FormData(purchaseForm);
  const purchase = {
    buyer_name: data.get('buyer_name').trim(),
    product_id: product ? product.id : null,
    quantity: Number(data.get('quantity')),
    payment_method: data.get('payment_method'),
    note: data.get('note').trim()
  };

  if (!purchase.buyer_name || !purchase.product_id || purchase.quantity < 1) {
    purchaseMessage.textContent = 'Check the purchase details before confirming.';
    return;
  }

  try {
    const response = await fetch('/api/purchases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(purchase)
    });

    if (!response.ok) {
      throw new Error('No response from the server');
    }

    purchaseMessage.textContent = 'Purchase registered successfully.';
    await loadProducts();
  } catch (error) {
    purchaseMessage.textContent = 'Failed to communicate with the server.';
  }

  purchaseForm.reset();
  purchaseQuantity.value = 1;
  updatePurchaseSummary();
}

/* Builds the <select> dynamically. */

function fillProducts(products) {
  purchaseProduct.innerHTML = '<option value="">Select</option>';

  products.forEach((product) => {
    const option = document.createElement('option');
    option.value = product.id;
    option.dataset.price = product.price;
    option.textContent = `${product.name} - ${purchaseCurrency.format(Number(product.price))}`;
    option.disabled = product.quantity < 1;
    purchaseProduct.appendChild(option);
  });
}

/* Loads products from the API. */

async function loadProducts() {
  try {
    const response = await fetch('/api/products');

    if (!response.ok) {
      throw new Error('Failed to load products.');
    }

    availableProducts = await response.json();
  } catch (error) {
    availableProducts = [
      { id: 1, name: 'Soda can', price: 5.00, quantity: 0 },
      { id: 2, name: 'Mineral water', price: 3.00, quantity: 0 },
      { id: 3, name: 'Chocolate', price: 4.50, quantity: 0 }
    ];
    purchaseMessage.textContent = 'Server unavailable. Products loaded for preview only.';
  }

  fillProducts(availableProducts);
  updatePurchaseSummary();
}

purchaseProduct.addEventListener('change', updatePurchaseSummary);
purchaseQuantity.addEventListener('input', updatePurchaseSummary);
purchaseForm.addEventListener('submit', sendPurchase);

loadProducts();
