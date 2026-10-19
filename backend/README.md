# POS System for Shops — Backend

A REST API backend for a retail Point of Sale (POS) system. Built with **Node.js**, **Express**, **Sequelize ORM**, and **MySQL**. Handles authentication, product/category management, inventory tracking, sales processing, invoice generation, and basic accounting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| ORM | Sequelize |
| Database | MySQL |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Validation | express-validator |

---

## Prerequisites

Before you start, make sure these are installed on your machine:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MySQL](https://dev.mysql.com/downloads/installer/) (v8 or higher)
- [Git](https://git-scm.com/)
- A REST client like [Postman](https://www.postman.com/downloads/) for testing

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/TakrimJengi/POS-System-for-Shops.git
cd "POS-System-for-Shops/backend"
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the MySQL database

Open MySQL Command Line Client (or any MySQL tool) and run:

```sql
CREATE DATABASE pos_system;
```

### 4. Configure environment variables

Create a file named `.env` inside the `backend` folder with the following content:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=pos_system
JWT_SECRET=your_secret_key_here
```

Replace `your_mysql_password` and `your_secret_key_here` with your own values.

> ⚠️ `.env` is git-ignored and should never be committed — it contains secrets.

### 5. Configure Sequelize CLI (config.json)

Create `backend/config/config.json`:

```json
{
  "development": {
    "username": "root",
    "password": "your_mysql_password",
    "database": "pos_system",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "test": {
    "username": "root",
    "password": "your_mysql_password",
    "database": "pos_system",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": "root",
    "password": "your_mysql_password",
    "database": "pos_system",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

> ⚠️ `config.json` is also git-ignored — it contains your DB password.

### 6. Start the server

```bash
node server.js
```

Or, for development with auto-restart on file changes:

```bash
nodemon server.js
```

You should see:

```
Server running on port 5000
MySQL Connected Successfully via Sequelize!
All models synced to database!
```

All tables (Users, Categories, Products, Sales, SaleDetails, Expenses, RefreshTokens) are created automatically on first run via `sequelize.sync()`.

### 7. Verify it's running

Open your browser or Postman:

```
GET http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "POS System is running",
  "timestamp": "..."
}
```

---

## Project Structure

```
backend/
├── config/
│   ├── db.js           # Sequelize connection setup
│   └── config.json     # DB credentials for Sequelize CLI (not committed)
├── controllers/        # Business logic for each module
├── middleware/
│   └── authMiddleware.js   # JWT verification + admin role check
├── models/              # Sequelize models (one per database table)
├── routes/              # Express route definitions per module
├── migrations/          # Sequelize migration files
├── seeders/             # Sequelize seed files
├── .env                 # Environment variables (not committed)
├── server.js            # Application entry point
└── package.json
```

---

## Authentication Flow

This API uses **short-lived access tokens** + **long-lived refresh tokens**:

1. `POST /api/auth/login` → returns a **refresh token** only (7-day expiry, stored in DB)
2. `POST /api/auth/refresh-token` → exchanges a valid refresh token for a new **access token** (15-minute expiry)
3. Protected routes require the access token in the request header:
   ```
   Authorization: Bearer <access_token>
   ```
4. `POST /api/auth/logout` → deletes the refresh token from the database, ending the session

Two roles exist: `admin` and `cashier`. Admin-only routes are protected by an additional `isAdmin` middleware check.

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Create a new user |
| POST | `/login` | Public | Login, returns refresh token |
| POST | `/refresh-token` | Public | Exchange refresh token for access token |
| POST | `/logout` | Public | Invalidate refresh token |

### Categories (`/api/categories`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Logged in | List all categories |
| POST | `/` | Admin | Create category |
| PUT | `/:id` | Admin | Update category |
| DELETE | `/:id` | Admin | Delete category |

### Products (`/api/products`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Logged in | List all products (supports `?search=`) |
| GET | `/:id` | Logged in | Get single product |
| POST | `/` | Admin | Create product |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Delete product |

### Inventory (`/api/inventory`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Logged in | View current stock levels |
| POST | `/stock-in` | Admin | Add stock to a product |

### Sales (`/api/sales`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Logged in | Create a sale (cart of items), auto-generates invoice and reduces stock |
| GET | `/` | Logged in | List all sales (invoice history) |
| GET | `/:id` | Logged in | Get full invoice details with line items |

### Expenses (`/api/expenses`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Admin | List all expenses |
| POST | `/` | Admin | Record a new expense |
| PUT | `/:id` | Admin | Update an expense |
| DELETE | `/:id` | Admin | Delete an expense |

### Accounting (`/api/accounting`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/summary` | Admin | Total income, expenses, and profit (optional `?start_date=&end_date=`) |
| GET | `/category-sales` | Admin | Revenue and quantity sold, grouped by category |
| GET | `/daily-summary` | Admin | Income/expense/profit for a single day (optional `?date=`) |

### Health
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | Server status check |

---

## Testing with Postman

A ready-to-use Postman collection and environment are included in the repository root:

- `POS System API.postman_collection.json`
- `POS Local.postman_environment.json`

**To use them:**
1. Open Postman → **Import** → select both files
2. Select the **POS Local** environment from the top-right dropdown
3. Run **Auth → Login**, then **Auth → Refresh Token** — this automatically saves `refresh_token` and `access_token` as environment variables via post-response scripts
4. All other requests use `{{access_token}}` automatically — no manual copy-pasting needed

---

## Common Issues

| Problem | Cause | Fix |
|---|---|---|
| `running scripts is disabled` (PowerShell) | Windows script execution policy | Run as Admin: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| `Access denied for user 'root'` | Wrong password in `.env` / `config.json` | Double check both files match your actual MySQL password |
| `Invalid or expired token` | Access token expired (15 min) | Call `/api/auth/refresh-token` with your refresh token to get a new one |
| `Too many keys specified; max 64 keys allowed` | Repeated `sync({ alter: true })` runs created duplicate unique indexes | Drop duplicate indexes via SQL; models now use named indexes to prevent recurrence |
| `Cannot find module 'server.js'` | Running command from wrong directory | Make sure you're inside the `backend` folder before running `node server.js` |

---

## Notes for Contributors

- Commits in this repo follow a **surgical commit** convention — one logical change per commit (e.g. "Add product controller", not "update stuff")
- Never commit `.env` or `config/config.json` — both are git-ignored for a reason
- After installing any new package, commit `package.json` and `package-lock.json` together with the feature that needed it
