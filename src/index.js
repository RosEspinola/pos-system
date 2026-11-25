// index.js
// The main file. Shows the menu and connects everything together.
// Run it with:  npm start

const products = require('./products');
const cart = require('./cart');
const sales = require('./sales');
const { ask, askNumber, closePrompt, money, line, printProducts, printReceipt } = require('./utils');

// ---------- NEW SALE ----------
async function newSale() {
  cart.clear();
  console.log('\n--- NEW SALE ---');

  while (true) {
    printProducts(products.getAll());
    const idText = await ask('Enter product ID (or type "done" to checkout, "cancel" to stop): ');

    if (idText.toLowerCase() === 'cancel') {
      cart.clear();
      console.log('Sale cancelled.');
      return;
    }
    if (idText.toLowerCase() === 'done') break;

    const product = products.findById(Number(idText));
    if (!product) {
      console.log('  Product not found. Try again.');
      continue;
    }

    const qty = await askNumber(`Quantity for ${product.name}: `);
    if (!Number.isInteger(qty) || qty <= 0) {
      console.log('  Quantity must be a whole number greater than 0.');
      continue;
    }

    // Check stock, including what is already in the cart
    const available = product.stock - cart.getQtyInCart(product.id);
    if (qty > available) {
      console.log(`  Not enough stock. Only ${available} left.`);
      continue;
    }

    cart.addItem(product, qty);
    console.log(`  Added ${qty} x ${product.name}. Cart total: ${money(cart.getTotal())}`);
  }

  if (cart.isEmpty()) {
    console.log('Cart is empty. No sale made.');
    return;
  }

  await checkout();
}

// ---------- CHECKOUT ----------
async function checkout() {
  const total = cart.getTotal();
  console.log('\n--- CHECKOUT ---');
  cart.getItems().forEach((item) => {
    console.log(`${item.qty} x ${item.name}  =  ${money(item.price * item.qty)}`);
  });
  console.log('TOTAL: ' + money(total));

  let paid = await askNumber('Customer payment: P');
  while (paid < total) {
    console.log(`  Not enough. The total is ${money(total)}.`);
    paid = await askNumber('Customer payment: P');
  }

  const change = Math.round((paid - total) * 100) / 100;

  // Reduce the stock of every item sold
  cart.getItems().forEach((item) => products.changeStock(item.id, -item.qty));

  const sale = sales.save(cart.getItems(), total, paid, change);
  printReceipt(sale);
  cart.clear();
}

// ---------- PRODUCT MANAGEMENT ----------
async function addProduct() {
  console.log('\n--- ADD PRODUCT ---');
  const name = await ask('Product name: ');
  if (name === '') {
    console.log('Name cannot be empty.');
    return;
  }
  const price = await askNumber('Price: P');
  const stock = await askNumber('Starting stock: ');
  if (price < 0 || stock < 0 || !Number.isInteger(stock)) {
    console.log('Price and stock must not be negative (stock must be a whole number).');
    return;
  }
  const product = products.add(name, price, stock);
  console.log(`Added "${product.name}" with ID ${product.id}.`);
}

async function restockProduct() {
  console.log('\n--- RESTOCK PRODUCT ---');
  printProducts(products.getAll());
  const id = await askNumber('Product ID: ');
  const product = products.findById(id);
  if (!product) {
    console.log('Product not found.');
    return;
  }
  const amount = await askNumber(`How many to add to ${product.name}? `);
  if (!Number.isInteger(amount) || amount <= 0) {
    console.log('Amount must be a whole number greater than 0.');
    return;
  }
  products.changeStock(id, amount);
  console.log(`Done. ${product.name} stock is now ${product.stock + amount}.`);
}

async function removeProduct() {
  console.log('\n--- REMOVE PRODUCT ---');
  printProducts(products.getAll());
  const id = await askNumber('Product ID to remove: ');
  const confirm = await ask('Are you sure? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    return;
  }
  console.log(products.remove(id) ? 'Product removed.' : 'Product not found.');
}

// ---------- SALES REPORT ----------
function showReport() {
  console.log('\n--- SALES REPORT ---');
  const all = sales.getAll();
  const summary = sales.getSummary();
  if (all.length === 0) {
    console.log('No sales yet.');
    return;
  }
  line();
  all.forEach((sale) => {
    console.log(`#${sale.id}`.padEnd(6) + sale.date.padEnd(26) + money(sale.total).padStart(12));
  });
  line();
  console.log('Number of sales : ' + summary.count);
  console.log('Total sales     : ' + money(summary.totalSales));
}

// ---------- MAIN MENU ----------
async function main() {
  console.log('=================================');
  console.log('     SIMPLE POS SYSTEM');
  console.log('=================================');

  let running = true;
  while (running) {
    console.log('\n1. New Sale');
    console.log('2. View Products');
    console.log('3. Add Product');
    console.log('4. Restock Product');
    console.log('5. Remove Product');
    console.log('6. Sales Report');
    console.log('0. Exit');

    const choice = await ask('Choose an option: ');

    switch (choice) {
      case '1': await newSale(); break;
      case '2': printProducts(products.getAll()); break;
      case '3': await addProduct(); break;
      case '4': await restockProduct(); break;
      case '5': await removeProduct(); break;
      case '6': showReport(); break;
      case '0': running = false; break;
      default: console.log('Invalid option. Please choose 0-6.');
    }
  }

  console.log('Goodbye!');
  closePrompt();
}

main();
