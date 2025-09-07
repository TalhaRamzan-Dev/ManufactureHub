# Shanakht Dashboard

A comprehensive **production management system** built with modern web technologies.
It is designed for manufacturing businesses to streamline the management of clients, orders, production lots, workers, inventory, and financial records in a single unified platform.

---

## 🚀 Features

### Core Modules

#### 1. **Client Management**

* Maintain a complete client database with contact information
* Track business names and shop addresses
* Manage emails and phone numbers
* Add, edit, and update clients

#### 2. **Order Management**

* Create and track client orders
* Add design specifications, materials, and colors
* Manage unit quantities and deadlines
* Upload and store design images
* Track order status (Pending, In Progress, Completed, Cancelled)
* Estimate and track costs

#### 3. **Production Lot Management**

* Create production batches linked to orders
* Track lot status (Pending, In Progress, Completed, On Hold)
* Manage start and end dates
* Monitor progress and production stages
* Calculate costs and add notes

#### 4. **Worker Management**

* Maintain a worker database with skill sets
* Manage hourly rates
* Assign workers to production lots
* Track productivity (units produced, hours worked)
* Analyze worker performance

#### 5. **Inventory Management**

* Track material usage per lot
* Manage quantities, unit costs, and suppliers
* Monitor date-based usage
* Calculate lot-wise costs

#### 6. **Financial Management**

* Track all expenses per lot
* Manage client payments and balances (ledger)
* Maintain a daily financial transaction log (Day Book)
* Generate invoice numbers
* Track payment methods and balances

---

### Advanced Features

* 📊 **Analytics Dashboard** with revenue vs expenses, worker productivity, and lot progress
* 🔍 **Data Management** with import/export (CSV), search & filter, and validation
* 🎨 **User Interface** with a modern responsive design, dark theme, data tables, form validation, and notifications

---

## 🏗️ Architecture

### Technology Stack

#### Backend (Flask API)

* **Framework**: Flask 2.3.3
* **Database**: SQLite with SQLAlchemy ORM
* **CORS**: Flask-CORS for cross-origin requests
* **PDF Generation**: fpdf2 for reports
* **File Handling**: Pillow for images

#### Frontend (React + TypeScript)

* **Framework**: React 18.3.1 with TypeScript
* **Build Tool**: Vite 6.3.5
* **UI Components**: Radix UI primitives
* **Styling**: Tailwind CSS 4.1.12
* **Charts**: Recharts for analytics
* **Forms**: React Hook Form
* **Icons**: Lucide React

---

## 🛠️ Installation

### Prerequisites

Make sure the following are installed:

* **Python 3.8+** (Python 3.11+ recommended)
* **Node.js 16.0+** (Node.js 18.0+ recommended)
* **npm 9.0+**
* **Git**

---

### Clone the Repository

#### 🔹 Public Repository (HTTPS)

```bash
git clone https://github.com/<your-username>/shanakht-dashboard-v1.git
cd shanakht-dashboard-v1
```

#### 🔹 Private Repository (HTTPS with credentials)

```bash
git clone https://<your-username>@github.com/<your-username>/shanakht-dashboard-v1.git
cd shanakht-dashboard-v1
```

#### 🔹 SSH (recommended for developers)

```bash
git clone git@github.com:<your-username>/shanakht-dashboard-v1.git
cd shanakht-dashboard-v1
```

---

### Install Dependencies

#### 1. Backend (Flask API)

```bash
pip install -r requirements.txt
```

#### 2. Frontend (React + TypeScript)

```bash
cd Frontend
npm install
```

---

### Build the Frontend

```bash
npm run build
```

---

## 🚀 Usage

### Development Mode

#### 1. Start the Backend (Flask API)

```bash
cd Backend
python app.py
```

Runs on `http://localhost:5000`

#### 2. Start the Frontend (React App)

```bash
cd Frontend
npm run dev
```

Runs on `http://localhost:3000`

---

### Production Mode

1. Build the frontend:

   ```bash
   cd Frontend
   npm run build
   ```
2. Deploy the `Frontend/build/` folder to a web server
3. Deploy the Flask backend to your Python hosting environment

---

## 📊 Database Schema

* **client** → Client details
* **client\_orders** → Orders placed by clients
* **lot** → Production batches linked to orders
* **worker** → Worker details and rates
* **lot\_worker** → Worker assignments
* **inventory** → Material usage per lot
* **lot\_expenses** → Lot-wise expenses
* **client\_ledger** → Client payments & balances
* **day\_book** → Complete financial transaction log

---

## 🔧 Configuration

* **Backend**: Configure database and file paths in `Backend/config.py`
* **Frontend**: API endpoints in `Frontend/src/services/api.ts`

---

## 🧪 Testing

#### Backend Tests

```bash
pytest Backend/tests/
```

#### Frontend Tests

```bash
cd Frontend
npm test
```

---

## 📦 Deployment

* **Frontend** → Deploy `Frontend/build/` to any static hosting service (Netlify, Vercel, Nginx, Apache)
* **Backend** → Deploy Flask API to a Python server (Gunicorn + Nginx, Heroku, or any cloud hosting)

---

## 🔒 Security Features

* Input validation across all forms
* SQL injection protection via SQLAlchemy
* Secure file uploads
* CORS configuration for API security

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Submit a pull request

---

## 📄 License

This project is licensed under the **ISC License** – see the LICENSE file for details.

---

**Shanakht Dashboard** – Streamlining production management for modern manufacturing businesses.

