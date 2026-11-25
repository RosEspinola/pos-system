// utils.js
// Small helper functions: asking questions, money format, printing tables.

const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');

const rl = readline.createInterface({ input, output });

async function ask(question) {
  const answer = await rl.question(question);
  return answer.trim();
}

// Keeps asking until the user types a valid number
async function askNumber(question) {
  while (true) {
    const answer = await ask(question);
    const number = Number(answer);
    if (answer !== '' && !isNaN(number)) return number;
    console.log('  Please enter a valid number.');
  }
}

function closePrompt() {
  rl.close();
}

function money(amount) {
  return 'P' + amount.toFixed(2);
}

function line(char = '-', length = 44) {
  console.log(char.repeat(length));
}

function printProducts(products) {
  line();
  console.log('ID'.padEnd(5) + 'NAME'.padEnd(22) + 'PRICE'.padEnd(10) + 'STOCK');
  line();
  if (products.length === 0) {
    console.log('No products yet.');
  }
  products.forEach((p) => {
    console.log(
      String(p.id).padEnd(5) + p.name.padEnd(22) + money(p.price).padEnd(10) + p.stock
    );
  });
  line();
}

function printReceipt(sale) {
  console.log('');
  line('=');
  console.log('              MY STORE - RECEIPT');
  line('=');
  console.log('Receipt #: ' + sale.id);
  console.log('Date     : ' + sale.date);
  line();
  sale.items.forEach((item) => {
    const left = `${item.qty} x ${item.name}`;
    console.log(left.padEnd(30) + money(item.price * item.qty).padStart(14));
  });
  line();
  console.log('TOTAL'.padEnd(30) + money(sale.total).padStart(14));
  console.log('PAID'.padEnd(30) + money(sale.paid).padStart(14));
  console.log('CHANGE'.padEnd(30) + money(sale.change).padStart(14));
  line('=');
  console.log('        Thank you! Please come again.');
  line('=');
}

module.exports = { ask, askNumber, closePrompt, money, line, printProducts, printReceipt };
