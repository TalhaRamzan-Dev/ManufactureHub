# Shanakht Dashboard

A modern web-based production management system for manufacturing businesses. Built with Flask and React, it streamlines client, order, production, worker, inventory, and financial management in one platform.

## Features

- **Client Management**: Track client details, contacts, and business information.
- **Order Management**: Create and monitor orders with design specs, quantities, deadlines, and status (Pending, In Progress, Completed, Cancelled).
- **Production Lots**: Manage production batches, track progress, costs, and timelines.
- **Worker Management**: Assign workers to lots, track skills, hourly rates, and productivity.
- **Inventory Management**: Monitor material usage, costs, and suppliers per lot.
- **Financials**: Log expenses, client payments, and balances with a daily transaction log.
- **Analytics Dashboard**: Visualize revenue, expenses, worker productivity, and lot progress.
- **Data Tools**: Import/export CSV, search, filter, and validate data.
- **UI**: Responsive design with dark theme, data tables, forms, and notifications.

## Installation

### Prerequisites
- Python 3.8+ (3.11+ recommended)
- Node.js 16.0+ (18.0+ recommended)
- npm 9.0+
- Git

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/TalhaRamzan-Dev/Shanakht-Dashboard.git
   cd Shanakht-Dashboard
   ```
2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Install frontend dependencies:
   ```bash
   cd Frontend
   npm install
   ```

## Usage

### Development Mode
1. Start the backend:
   ```bash
   cd Backend
   python app.py
   ```
   Runs on `http://localhost:5000`
2. Start the frontend:
   ```bash
   cd Frontend
   npm run dev
   ```
   Runs on `http://localhost:3000`

### Production Mode
1. Build the frontend:
   ```bash
   cd Frontend
   npm run build
   ```
2. Deploy `Frontend/build/` to a static host (e.g., Netlify, Vercel).
3. Deploy the Flask backend to a Python server (e.g., Gunicorn, Heroku).

## Technical Details

- **Backend**: Flask 2.3.3, SQLite (SQLAlchemy), Flask-CORS, fpdf2 (PDFs), Pillow (images).
- **Frontend**: React 18.3.1, TypeScript, Vite 6.3.5, Tailwind CSS, Recharts, React Hook Form.
- **Database**: Tables for clients, orders, lots, workers, inventory, expenses, and financials.
- **Security**: Input validation, SQL injection protection, secure file uploads, CORS.

## Testing

- Backend: `pytest Backend/tests/`
- Frontend: `cd Frontend && npm test`

## Configuration

- Backend: Edit database/file paths in `Backend/config.py`.
- Frontend: Update API endpoints in `Frontend/src/services/api.ts`.

## Deployment

- **Frontend**: Host `Frontend/build/` on Netlify, Vercel, or Nginx.
- **Backend**: Deploy Flask API with Gunicorn + Nginx or a cloud platform (e.g., Heroku).

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature-name`).
3. Add changes and tests.
4. Submit a pull request with a clear description.

## Support

For issues, submit a bug report or feature request on the [GitHub repository](https://github.com/TalhaRamzan-Dev/Shanakht-Dashboard).