# POS System for Shops

A web-based Point of Sale (POS) application designed to help a small retail shop manage its day-to-day sales and operations in one place. The system provides a React-based interface connected to a Node.js/Express REST API and a MySQL database.

## Project Overview

A traditional shop may manage products, sales, stock, expenses, and profit records manually or across separate tools. This can lead to calculation mistakes, duplicated records, difficulty tracking inventory, and slow report preparation.

The **POS System for Shops** brings these activities into one application. Staff can use the sales screen to record customer purchases, while the administrator can manage shop data and review inventory and financial summaries.

### Main goals

- Make recording sales and preparing invoices easier.
- Keep product and category information organized.
- Track available stock and update inventory when sales are made.
- Manage users with separate administrator and cashier responsibilities.
- Record expenses and review income, expenses, and profit summaries.
- Provide sales and category-based reports.
- Explore product-purchasing patterns through a market basket analysis module.

## Features

- **Authentication and role-based access:** login, registration endpoints, access tokens, refresh tokens, and protected API routes.
- **Dashboard:** a central place to view shop information.
- **Product management:** create, view, update, search, and delete products.
- **Category management:** organize products into categories.
- **Sales and invoices:** record sales, view sales history, and retrieve invoice details. A sale updates product stock.
- **Inventory management:** view stock levels and add stock.
- **Accounting reports:** view income, expenses, profit, and sales grouped by category or date.
- **Expense management:** record, edit, list, and delete shop expenses.
- **User management:** administer application users and distinguish administrator and cashier access.
- **Market basket analysis:** a separate API module for examining product-purchase associations.
- **Members:** member records can be associated with sales.
- **API testing:** a Postman collection and local environment are included.

> **Roles:** The Administrator represents the shop owner and manages administrative functions. The Cashier mainly handles sales/POS operations. Actual access is enforced by the backend routes and middleware.

## Technology Stack

| Part | Technology |
|---|---|
| Frontend | React, React DOM, React Router, Axios |
| Frontend development/build tool | Vite |
| Backend runtime | Node.js |
| Backend framework | Express.js |
| Database | MySQL |
| Database ORM | Sequelize |
| Authentication | JSON Web Token (JWT), bcryptjs |
| Request validation | express-validator |
| Other backend packages | CORS, dotenv, cookie-parser, Multer |
| API testing | Postman |

## Requirements

Install the following before running the project:

1. **Node.js and npm** — use a current LTS version compatible with the installed Vite version.
2. **MySQL Server** — MySQL 8 is recommended.
3. **A MySQL client** — for example, MySQL Workbench, phpMyAdmin through XAMPP, or the MySQL command line.
4. **Git** — needed if you clone the repository.
5. **Postman** (optional) — useful for testing the backend APIs.

Check that Node.js and npm are installed:

```bash
node -v
npm -v
```

Check Git:

```bash
git --version
```

## Project Structure

```text
POS-System-for-Shops/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/       # API business logic
│   ├── middleware/       # Authentication/authorization middleware
│   ├── models/           # Sequelize database models
│   ├── routes/           # API route definitions
│   ├── uploads/          # Uploaded files directory
│   ├── server.js         # Express entry point
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/        # React screens
│   │   ├── services/     # API and authentication helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── POS System API.postman_collection.json
├── POS Local.postman_environment.json
└── README.md
```


## Demo Login Credentials

**Important:** The repository does not include pre-created login accounts or a database seed script. These are example credentials for you to create locally; they will not work until you register the accounts in your own `pos_system` database.

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@pos.local` | `Admin@123` |
| Cashier | `cashier@pos.local` | `Cashier@123` |

### Create the local demo accounts

1. Start MySQL and the backend as described in the setup steps.
2. Open Postman and send a `POST` request to `http://localhost:5000/api/auth/register`.
3. Choose **Body → raw → JSON** and send the following administrator account details:

```json
{
  "username": "admin_demo",
  "email": "admin@pos.local",
  "password": "Admin@123",
  "role": "admin"
}
```

4. Send another `POST` request to the same endpoint to create the cashier account:

```json
{
  "username": "cashier_demo",
  "email": "cashier@pos.local",
  "password": "Cashier@123",
  "role": "cashier"
}
```

5. Start the frontend and log in using the email and password from the table above.

If registration returns **Email already registered** or a duplicate username error, that account already exists in your database; use the password you originally registered with, or reset the account password through a controlled local development process.

**Security warning:** These are public demo credentials intended only for a local development database. Do not use them in a live shop or production deployment. In the current code, `/api/auth/register` accepts a `role` value and is not protected by authentication, so anyone who can reach that endpoint may be able to register an administrator. Before deployment, restrict admin account creation and disable public administrator registration.

## Installation and Setup

### 1. Download or clone the project

To clone from GitHub:

```bash
git clone https://github.com/Rubayeat13JOY/POS-System-for-Shops.git
cd POS-System-for-Shops
```

If you downloaded a ZIP file, extract it and open the extracted `POS-System-for-Shops` project folder in VS Code.

### 2. Create the MySQL database

Start MySQL from your local MySQL installation. If using XAMPP, start **MySQL** from the XAMPP Control Panel.

Open phpMyAdmin at `http://localhost/phpmyadmin` or use a MySQL client. Run:

```sql
CREATE DATABASE pos_system;
```

If the database already exists, do not create it again.

### 3. Configure the backend database connection

The current backend database connection code reads its settings from `backend/config/config.json`. This file may not be included in the repository, so create it inside the `backend/config/` folder.

Create `backend/config/config.json` with the following structure:

```json
{
  "development": {
    "username": "root",
    "password": "",
    "database": "pos_system",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "test": {
    "username": "root",
    "password": "",
    "database": "pos_system",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": "root",
    "password": "",
    "database": "pos_system",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

Update `username` and `password` to match your local MySQL credentials. For a typical local XAMPP installation, the MySQL user is often `root` with an empty password, but use the credentials configured on your own computer.

**Important:** Do not commit this file if it contains database credentials. Keep it private and add it to `.gitignore` if it is not already ignored.

The current `backend/config/db.js` imports `config.json` directly. Therefore, creating only a `.env` file is not enough to configure the database connection in the current version of the code.

### 4. Install backend dependencies

Open a terminal in VS Code and run:

```bash
cd backend
npm install
```

### 5. Start the backend API

From the `backend` directory, run:

```bash
node server.js
```

The API uses port **5000** by default. If the server starts correctly, the terminal should show a message similar to:

```text
Server running on port 5000
MySQL Connected Successfully via Sequelize!
Database connection established!
```

The exact order or wording may vary. If the database connection fails, check that MySQL is running, the database exists, and `backend/config/config.json` has the correct credentials.

### 6. Check the backend

With the backend running, open:

- Health check: `http://localhost:5000/health`
- Root endpoint: `http://localhost:5000/`

The health endpoint should return a JSON response indicating that the POS system is running.

### 7. Install frontend dependencies

Open a **second terminal** in VS Code. From the project root, run:

```bash
cd frontend
npm install
```

### 8. Start the frontend

From the `frontend` directory, run:

```bash
npm run dev
```

Vite will print a local URL, usually:

```text
http://localhost:5173
```

Open the URL printed in the terminal in your browser. Keep both the backend and frontend terminals running while using the application.

The frontend API helper currently points to `http://localhost:5000/api`, so the backend should be running on port 5000 unless you also update the frontend API configuration.

## Running the Project Later

Whenever you want to open the project again:

1. Start MySQL in XAMPP or your MySQL service.
2. Open the project folder in VS Code.
3. Open a terminal and run `cd backend`, then `node server.js`.
4. Open a second terminal and run `cd frontend`, then `npm run dev`.
5. Open the local frontend URL shown by Vite.

You do not need to run `npm install` every time. Run it again only if dependencies change, or if you have freshly downloaded the project and its `node_modules` directories are absent.

## API Overview

The backend exposes REST API endpoints under `http://localhost:5000`.

| Module | Base path | Purpose |
|---|---|---|
| Authentication | `/api/auth` | Register, log in, refresh tokens, log out |
| Categories | `/api/categories` | Manage product categories |
| Products | `/api/products` | Manage products and search product records |
| Inventory | `/api/inventory` | View stock and add stock |
| Sales | `/api/sales` | Record sales and retrieve sales/invoice details |
| Expenses | `/api/expenses` | Manage shop expenses |
| Accounting | `/api/accounting` | View financial summaries and category sales |
| Market basket | `/api/market-basket` | Market basket analysis endpoints |
| Members | `/api/members` | Manage member records |
| Health check | `/health` | Check server status |

Most application endpoints require authentication. Administrator-only actions are restricted by the backend's authorization logic. Refer to the route files in `backend/routes/` for the exact methods and permissions.

## Testing APIs with Postman

The repository includes these files in the project root:

- `POS System API.postman_collection.json`
- `POS Local.postman_environment.json`

To import them:

1. Open Postman.
2. Select **Import**.
3. Import both JSON files.
4. Select the imported **POS Local** environment.
5. Check the environment's base URL and ensure the backend is running.
6. Start with the authentication requests and then test the other API modules.

Follow the request order and any scripts included in the Postman collection. If a request fails, check its HTTP status and response body, your database connection, and whether the required access token is present.

## Troubleshooting

| Problem | What to check |
|---|---|
| `Cannot find module ...` | Run `npm install` in the relevant `backend` or `frontend` directory. |
| Database connection failed | Confirm MySQL is running, `pos_system` exists, and the credentials in `backend/config/config.json` are correct. |
| `Cannot find ... config.json` | Create `backend/config/config.json` as described above. |
| Port 5000 is already in use | Stop the other process using the port or configure a different backend port and update the frontend API URL accordingly. |
| Frontend cannot reach the API | Confirm the backend is running and that `frontend/src/services/api.js` points to the correct API URL. |
| Login or protected API requests fail | Check the user credentials, token, role permissions, and the API response in the browser or Postman. |
| `npm` is not recognized | Install Node.js, then close and reopen the terminal. |
| PowerShell blocks an npm script | Try using the VS Code Command Prompt terminal, or address the PowerShell execution policy for your own user account according to your organization's rules. |

## Security Notes

- Do not commit database passwords, JWT secrets, access tokens, refresh tokens, or other credentials.
- Use a strong, private password and secret for any non-local deployment.
- Do not expose a development database directly to the public internet.
- Configure production CORS, HTTPS, and environment-specific credentials before deploying.
- This README describes local development setup; it is not a production deployment guide.

## Current Implementation Notes

- The backend database connection is configured through `backend/config/config.json` in the current code.
- The frontend API base URL is currently set to `http://localhost:5000/api` in `frontend/src/services/api.js`.
- Start the backend and frontend in separate terminals.
- Review the existing Sequelize models and database schema before making manual table changes or running schema-altering SQL commands.

## Author / Repository

Repository: [Rubayeat13JOY/POS-System-for-Shops](https://github.com/Rubayeat13JOY/POS-System-for-Shops)

---

If you are setting up the project on a new computer, follow the setup steps in order: install the requirements, create the database, configure `backend/config/config.json`, install and start the backend, and then install and start the frontend.
