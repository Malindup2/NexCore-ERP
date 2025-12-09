# NexCore ERP - Frontend

A modern, professional ERP system frontend built with Next.js 16, React 19, TypeScript, and shadcn/ui components.

##  Features

- **Modern UI/UX**: Clean, professional design with shadcn/ui components
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Ready**: Full dark mode support
- **Type-Safe**: Built with TypeScript for better developer experience
- **Performance**: Optimized with Next.js App Router

##  Project Structure

```
frontend/
├── app/
│   ├── auth/                    # Authentication pages
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration page
│   │   └── forgot-password/    # Password reset page
│   ├── hr/                     # HR Module
│   │   ├── employees/          # Employee management
│   │   └── payroll/            # Payroll management
│   ├── inventory/              # Inventory Module
│   │   └── products/           # Product management
│   ├── sales/                  # Sales Module
│   │   ├── customers/          # Customer management
│   │   └── orders/             # Sales orders
│   ├── procurement/            # Procurement Module
│   │   ├── suppliers/          # Supplier management
│   │   └── orders/             # Purchase orders
│   ├── accounting/             # Accounting Module
│   ├── page.tsx               # Dashboard home
│   └── layout.tsx             # Root layout with sidebar
├── components/
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   └── app-sidebar.tsx        # Main navigation sidebar
└── lib/
    └── utils.ts               # Utility functions
```

##  Getting Started

### Prerequisites

- Node.js 20+ and npm
- Backend services running (optional for development)

### Installation

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

##  Modules Overview
###  Authentication
- **Login**: Secure user authentication
- **Register**: New user registration
- **Forgot Password**: Password recovery

###  Dashboard
- Real-time business metrics
- Revenue charts (Area charts)
- Weekly sales analytics (Bar charts)
- Recent orders/activities
- Key performance indicators (KPIs)

###  HR Module
- **Employees**: Complete employee directory with search and filters
- **Payroll**: Salary management, payment processing, and payslips

###  Inventory Module
- **Products**: Product catalog with SKU, pricing, and stock levels
- Low stock alerts
- Inventory valuation

###  Sales Module
- **Customers**: Customer relationship management
- **Sales Orders**: Order processing and tracking
- Order status management (Pending, Confirmed, Shipped, Cancelled)

### 🛒 Procurement Module
- **Suppliers**: Supplier database
- **Purchase Orders**: Procurement workflow
- Order approval system

###  Accounting Module
- **Chart of Accounts**: Account management
- **Transactions**: Journal entries
- **Reports**: Balance sheet, Income statement
- Financial summaries

##  UI Components

All UI components are built with shadcn/ui:

- **Table**: Data tables with sorting and filtering
- **Dialog/Modal**: Form dialogs and confirmations
- **Card**: Content containers
- **Badge**: Status indicators
- **Select**: Dropdown selections
- **Tabs**: Tabbed interfaces
- **Charts**: Data visualizations (recharts)

##  Development

### Adding New Pages
1. Create folder in `app/` directory
2. Add `page.tsx` for the route
3. Update sidebar navigation in `components/app-sidebar.tsx`

### Styling
- Uses Tailwind CSS v4
- Custom design tokens in `globals.css`
- Dark mode via `dark:` prefix

## Charts & Data Visualization

Uses **recharts** for data visualization:
- Area charts for revenue trends
- Bar charts for sales analytics
- Responsive and interactive

##  Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts

## Backend Integration

To connect with backend services, update the mock data in each page with actual API calls to your .NET backend services.

