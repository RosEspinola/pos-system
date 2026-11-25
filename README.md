# Simple POS System (Node.js Website)

A beginner-friendly **Point of Sale (POS)** system that runs as a **website** in your browser.
The backend is built with Node.js using only built-in modules, so there is **nothing to install**.
Data is saved in simple JSON files.

> A terminal version is also included (`npm run cli`).

## Features

- Click products to add them to the cart
- Change quantity, remove items, and search products
- Checkout with payment and automatic change
- Printable receipt
- Stock goes down automatically after each sale
- Add, restock, and delete products
- Sales report (number of sales, total money, history)
- Input checks (not enough stock, not enough payment, empty fields)

## Requirements

- [Node.js](https://nodejs.org) version 18 or newer (check with `node -v`)

## How to Run

```bash
git clone https://github.com/<your-username>/pos-system.git
cd pos-system
npm start
```

Then open your browser and go to:

```
http://localhost:3000
```

Press `Ctrl + C` in the terminal to stop the server.

To use a different port:

```bash
# Mac / Linux
PORT=4000 npm start

# Windows (Command Prompt)
set PORT=4000 && npm start
```

## Folder Structure

```
pos-system/
├── data/
│   ├── products.json     # list of products (name, price, stock)
│   └── sales.json        # created automatically after the first sale
├── public/               # the website (what the browser shows)
│   ├── index.html        # page layout
│   ├── style.css         # design
│   └── app.js            # website logic (cart, buttons, fetch calls)
├── src/                  # the Node.js backend
│   ├── server.js         # web server + API routes
│   ├── products.js       # add, find, restock, remove products
│   ├── sales.js          # save sales and make the report
│   ├── storage.js        # read/write JSON files
│   ├── cart.js           # cart (terminal version only)
│   ├── utils.js          # helpers (terminal version only)
│   └── index.js          # terminal version
├── .gitignore
├── package.json
├── README.md
└── GITHUB_COMMITS.md
```

## How It Works

1. You open `http://localhost:3000`. `server.js` sends `index.html`, `style.css`, and `app.js`.
2. `app.js` asks the server for the products using `fetch('/api/products')`.
3. You click products. The cart is kept in the browser.
4. On **Checkout**, the browser sends the cart and payment to `/api/checkout`.
5. The server checks the stock and payment, lowers the stock, saves the sale, and sends back the receipt.

## API Routes

| Method | Route | What it does |
|--------|-------|--------------|
| GET | `/api/products` | Get all products |
| POST | `/api/products` | Add a product |
| POST | `/api/products/:id/restock` | Add stock to a product |
| DELETE | `/api/products/:id` | Delete a product |
| POST | `/api/checkout` | Finish a sale |
| GET | `/api/sales` | Get sales report |

## Ideas to Improve (Next Steps)

- Add a cashier login
- Add discounts (for example, 10% off)
- Export the sales report to CSV
- Use Express and a real database (SQLite or MongoDB)

## License

MIT
