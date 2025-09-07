# Shanakht Dashboard V1

A comprehensive production management system built with modern web technologies, packaged as a desktop application using Electron. This system is designed for manufacturing businesses to manage clients, orders, production lots, workers, inventory, and financial tracking.

## 🚀 Features

### Core Modules

#### 1. **Client Management**
- Complete client database with contact information
- Business name and shop address tracking
- Email and phone number management
- Client creation and editing capabilities

#### 2. **Order Management**
- Client order creation and tracking
- Design description and specifications
- Unit quantity and deadline management
- Color and material type specifications
- Design image upload and storage
- Order status tracking (Pending, In Progress, Completed, Cancelled)
- Cost estimation and tracking

#### 3. **Production Lot Management**
- Production batch creation linked to orders
- Lot status tracking (Pending, In Progress, Completed, On Hold)
- Start and end date management
- Progress percentage tracking
- Current production stage monitoring
- Cost calculation and notes

#### 4. **Worker Management**
- Worker database with skill types
- Hourly rate management
- Worker assignment to production lots
- Productivity tracking (units produced, hours worked)
- Performance analytics

#### 5. **Inventory Management**
- Material usage tracking per lot
- Quantity and unit cost management
- Supplier information
- Date-based usage tracking
- Cost calculation per lot

#### 6. **Financial Management**
- **Lot Expenses**: Track all expenses per production lot
- **Client Ledger**: Payment tracking and balance management
- **Day Book**: Complete financial transaction log
- Invoice number generation
- Payment method tracking
- Balance calculations

### Advanced Features

#### 📊 **Analytics Dashboard**
- Real-time statistics and KPIs
- Revenue vs Expenses charts
- Lot status distribution
- Worker productivity analytics
- Inventory usage trends
- Financial summary with profit/loss calculations
- Recent activities feed
- Top performing workers

#### 🔍 **Data Management**
- **Import/Export**: CSV import and export for all modules
- **Search & Filter**: Advanced search capabilities across all data
- **Data Validation**: Comprehensive input validation
- **Image Upload**: Design image storage and management

#### 🎨 **User Interface**
- Modern, responsive design with dark theme
- Intuitive sidebar navigation
- Data tables with sorting and filtering
- Form validation with real-time feedback
- Toast notifications for user actions
- Keyboard shortcuts (Ctrl+B for sidebar toggle)

#### 🖥️ **Desktop Application**
- Cross-platform desktop app using Electron
- Standalone executable generation
- Local database storage
- Offline functionality
- Auto-updater ready

## 🏗️ Architecture

### Technology Stack

#### Backend (Flask API)
- **Framework**: Flask 2.3.3
- **Database**: SQLite with SQLAlchemy ORM
- **CORS**: Flask-CORS for cross-origin requests
- **PDF Generation**: fpdf2 for report generation
- **File Handling**: Pillow for image processing

#### Frontend (React + TypeScript)
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 6.3.5
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS 4.1.12
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form for form management
- **Icons**: Lucide React

#### Desktop Application
- **Framework**: Electron 37.4.0
- **Builder**: Electron Builder for packaging
- **Platform**: Windows (primary), macOS/Linux compatible

### Project Structure

```
Shanakht Dashboard V1/
├── Backend/                    # Flask API Server
│   ├── models/                # Database models
│   │   ├── client.py          # Client model
│   │   ├── client_orders.py   # Order model
│   │   ├── lot.py            # Production lot model
│   │   ├── worker.py         # Worker model
│   │   ├── inventory.py      # Inventory model
│   │   ├── lot_expenses.py   # Expense model
│   │   ├── client_ledger.py  # Payment model
│   │   └── day_book.py       # Transaction model
│   ├── routes/               # API endpoints
│   │   ├── client.py         # Client routes
│   │   ├── client_orders.py  # Order routes
│   │   ├── lot.py           # Lot routes
│   │   ├── worker.py        # Worker routes
│   │   ├── inventory.py     # Inventory routes
│   │   ├── lot_expenses.py  # Expense routes
│   │   ├── client_ledger.py # Payment routes
│   │   ├── day_book.py      # Transaction routes
│   │   ├── dashboard.py     # Analytics routes
│   │   └── import_export.py # Data import/export
│   ├── utils/               # Utility functions
│   │   ├── validation.py    # Input validation
│   │   ├── helpers.py       # Helper functions
│   │   └── serialization.py # Data serialization
│   └── app.py              # Flask application
├── Frontend/                # React Application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Dashboard.tsx # Main dashboard
│   │   │   ├── EnhancedDataTable.tsx # Data table
│   │   │   └── ui/         # UI components
│   │   ├── config/         # Configuration files
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── build/              # Production build
├── Electron/               # Desktop Application
│   ├── main.js            # Electron main process
│   └── dist/              # Built application
└── requirements.txt       # Python dependencies
```

## 🛠️ Installation

### Prerequisites

- **Python 3.8+** (Python 3.11+ recommended)
- **Node.js 16.0+** (Node.js 18.0+ recommended)
- **npm 9.0+**
- **Git** (for cloning the repository)

### System Requirements

- **Operating System**: Windows 10/11 (primary), macOS 10.15+, Linux Ubuntu 18.04+
- **Memory**: 4GB RAM minimum, 8GB+ recommended
- **Storage**: 2GB free space minimum, 5GB+ recommended

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd "Shanakht Dashboard V1"
   ```

2. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Node.js Dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd Frontend
   npm install
   
   # Install electron dependencies
   cd ../Electron
   npm install
   cd ..
   ```

4. **Build the Application**
   ```bash
   # Build frontend
   npm run build:frontend
   
   # Build desktop application
   npm run build:electron
   ```

## 🚀 Usage

### Development Mode

1. **Start the Development Server**
   ```bash
   npm start
   ```
   This will start:
   - Flask backend on `http://localhost:5000`
   - React frontend on `http://localhost:3000`
   - Electron desktop app

2. **Individual Component Development**
   ```bash
   # Backend only
   npm run start:backend
   
   # Frontend only
   npm run start:frontend
   
   # Electron only
   npm run start:electron
   ```

### Production Mode

1. **Build Executable**
   ```bash
   npm run build:exe
   ```

2. **Run the Desktop Application**
   - Navigate to `Electron/dist/win-unpacked/`
   - Run `Shankh Dashboard.exe`

### Using the Application

#### Navigation
- Use the sidebar to navigate between different modules
- Press `Ctrl+B` to toggle sidebar visibility
- Each module has its own data table with full CRUD operations

#### Data Management
- **Add Records**: Click the "Add" button in any module
- **Edit Records**: Click the edit icon in the data table
- **Delete Records**: Click the delete icon (with confirmation)
- **Import Data**: Use the import button to upload CSV files
- **Export Data**: Use the export button to download CSV files

#### Dashboard Analytics
- View real-time statistics and charts
- Monitor production progress
- Track financial performance
- Analyze worker productivity

## 📊 Database Schema

### Core Tables

1. **client**: Client information and contact details
2. **client_orders**: Orders placed by clients
3. **lot**: Production batches linked to orders
4. **worker**: Worker information and rates
5. **lot_worker**: Worker assignments to lots
6. **inventory**: Material usage per lot
7. **lot_expenses**: Expenses per production lot
8. **client_ledger**: Payment tracking and balances
9. **day_book**: Complete financial transaction log

### Relationships
- Clients → Orders (One-to-Many)
- Orders → Lots (One-to-Many)
- Lots → Workers (Many-to-Many via lot_worker)
- Lots → Inventory (One-to-Many)
- Lots → Expenses (One-to-Many)
- Lots → Payments (One-to-Many)

## 🔧 Configuration

### Backend Configuration
- Database: SQLite (configurable in `Backend/config.py`)
- File uploads: Stored in `Backend/instance/uploads/`
- Logging: Configured in `Backend/app.py`

### Frontend Configuration
- API endpoints: Configured in `Frontend/src/services/api.ts`
- Table configurations: `Frontend/src/config/tableConfigs.ts`
- Sidebar items: `Frontend/src/config/sidebarItems.ts`

### Electron Configuration
- Build configuration: `Electron/package.json`
- Main process: `Electron/main.js`

## 🧪 Testing

The application includes comprehensive testing capabilities:

### Backend Testing
```bash
# Run Python tests
pytest Backend/tests/
```

### Frontend Testing
```bash
# Run React tests
cd Frontend
npm test
```

## 📦 Deployment

### Desktop Application
1. Build the executable using `npm run build:exe`
2. Distribute the `Electron/dist/` folder
3. Users can run `Shankh Dashboard.exe` directly

### Web Application
1. Build the frontend: `npm run build:frontend`
2. Deploy the `Frontend/build/` folder to a web server
3. Deploy the Flask backend to a Python hosting service

## 🔒 Security Features

- Input validation on all forms
- SQL injection protection via SQLAlchemy ORM
- File upload validation
- CORS configuration for API security
- Local database storage (no external dependencies)

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change ports in `Backend/app.py` and `Frontend/vite.config.ts`

2. **Database Issues**
   - Delete `Backend/instance/production.db` to reset database
   - Restart the application to recreate tables

3. **Build Failures**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Clear Python cache: `find . -type d -name "__pycache__" -delete`

4. **Electron Build Issues**
   - Ensure all dependencies are installed
   - Check Electron builder configuration

### Logs
- Backend logs: `Backend/app.log`
- Application logs: `app.log` (root directory)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the logs for error details

## 🔄 Version History

### Version 1.0.0
- Initial release
- Complete production management system
- Desktop application with Electron
- All core modules implemented
- Analytics dashboard
- Import/export functionality

---

**Shanakht Dashboard V1** - Streamlining production management for modern manufacturing businesses.