# Simple POS System (Node.js Website)

A beginner-friendly **Point of Sale (POS)** system that runs as a **website** in your browser.
The backend is built with Node.js using only built-in modules, so there is **nothing to install**.
It works on your computer (JSON files) and on **Vercel** (Upstash Redis database).

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

## Run on Your Computer

```bash
git clone https://github.com/<your-username>/pos-system.git
cd pos-system
npm start
```

Open your browser and go to `http://localhost:3000`.
Press `Ctrl + C` in the terminal to stop the server.

## Deploy to Vercel

Vercel cannot save files, so the online version stores data in a free **Upstash Redis** database.

1. Push this project to GitHub.
2. Go to [vercel.com](https://vercel.com) and log in with GitHub.
3. Click **Add New > Project**, choose the `pos-system` repository, and click **Import**.
4. Set **Framework Preset** to **Other**. Leave the build settings empty. Click **Deploy**.
5. In your Vercel project, open the **Storage** tab, create an **Upstash for Redis** database (free plan), and **connect it to the project**. Vercel adds the variables `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
6. Go to **Deployments**, open the menu (**...**) on the latest deployment, and click **Redeploy**.
7. Open your link, for example `https://pos-system.vercel.app`.

The first time, the database is empty, so the app loads the starting products from `data/products.json`.

If the website shows **"Database is not connected"**, do steps 5 and 6.

## Folder Structure

```
pos-system/
├── api/
│   └── [...path].js      # Vercel runs this file for every /api/... request
├── data/
│   ├── products.json     # starting products (name, price, stock)
│   └── sales.json        # created locally after the first sale
├── public/               # the website (what the browser shows)
│   ├── index.html        # page layout
│   ├── style.css         # design
│   └── app.js            # website logic (cart, buttons, fetch calls)
├── src/                  # the Node.js backend
│   ├── api.js            # all API routes (products, checkout, sales)
│   ├── server.js         # local web server (npm start)
│   ├── products.js       # add, find, restock, remove products
│   ├── sales.js          # save sales and make the report
│   ├── storage.js        # saves data: JSON files locally, Redis on Vercel
│   ├── cart.js           # cart (terminal version only)
│   ├── utils.js          # helpers (terminal version only)
│   └── index.js          # terminal version
├── .gitignore
├── package.json
├── README.md
└── GITHUB_COMMITS.md
```

## How It Works

1. You open the website. The server (or Vercel) sends `index.html`, `style.css`, and `app.js`.
2. `app.js` asks the server for the products using `fetch('/api/products')`.
3. You click products. The cart is kept in the browser.
4. On **Checkout**, the browser sends the cart and payment to `/api/checkout`.
5. `api.js` checks the stock and payment, lowers the stock, saves the sale, and sends back the receipt.
6. `storage.js` saves the data in a JSON file (local) or in Upstash Redis (Vercel).

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
- Use Express and a bigger database (MongoDB or PostgreSQL)

## License

MIT
