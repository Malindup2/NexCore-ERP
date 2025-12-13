# NexCore ERP

<img width="1895" height="825" alt="Screenshot 2025-12-10 154936" src="https://github.com/user-attachments/assets/056d62fd-ae5c-433e-9961-959a2fd610cb" />
<img width="1890" height="835" alt="Screenshot 2025-12-10 154916" src="https://github.com/user-attachments/assets/60dc1e65-0f38-4604-b1ab-98ecef73d92c" />
<img width="1895" height="849" alt="Screenshot 2025-12-10 155207" src="https://github.com/user-attachments/assets/47b5eff9-fa9d-412c-a843-b5b2885964d1" />

A comprehensive Enterprise Resource Planning system built with modern microservices architecture, featuring a Next.js frontend and .NET backend services.

## Overview

NexCore ERP is a full-stack enterprise solution designed to streamline business operations across multiple domains including HR, Inventory, Sales, Procurement, Accounting, and Payroll management. The system leverages microservices architecture for scalability, maintainability, and independent deployment of services.

## Architecture

### Microservices Backend (.NET 8)
- **AuthService**: User authentication, authorization, and identity management
- **HRService**: Employee lifecycle management and organizational structure
- **PayrollService**: Salary processing, deductions, and payroll calculations
- **InventoryService**: Product catalog, stock management, and warehouse operations
- **SalesService**: Customer relationship management and sales order processing
- **ProcurementService**: Supplier management and purchase order workflows
- **AccountingService**: Financial transactions, chart of accounts, and reporting
- **API Gateway**: Centralized routing, authentication, and request aggregation

### Frontend (Next.js 16 + React 19)
- Modern, responsive UI built with TypeScript
- Server-side rendering with App Router
- Real-time updates and interactive dashboards
- Theme support (light/dark mode)
- Professional shadcn/ui component library

### Infrastructure
- **PostgreSQL**: Primary relational database for all services
- **RabbitMQ**: Message broker for asynchronous inter-service communication
- **Redis**: Caching layer for performance optimization
- **Seq**: Centralized logging and monitoring
- **Docker**: Containerized deployment with Docker Compose

## Technology Stack

### Backend
- .NET 8.0
- ASP.NET Core Web API
- Entity Framework Core
- MassTransit (RabbitMQ integration)
- JWT Authentication
- Serilog (Structured logging)

### Frontend
- Next.js 16.0
- React 19
- TypeScript
- Tailwind CSS 4.0
- shadcn/ui Components
- Recharts (Data visualization)
- Geist Font (Typography)

### DevOps & Infrastructure
- Docker & Docker Compose
- PostgreSQL 15
- RabbitMQ 3 (Management)
- Redis 7
- Seq (Logging)

## Project Structure

```
NexCore-ERP/
├── backend/
│   ├── gateway/
│   │   └── ApiGateway/              # API Gateway service
│   ├── services/
│   │   ├── AuthService/             # Authentication & authorization
│   │   ├── HRService/               # Human resources management
│   │   ├── PayrollService/          # Payroll processing
│   │   ├── InventoryService/        # Inventory & stock management
│   │   ├── SalesService/            # Sales & CRM
│   │   ├── ProcurementService/      # Procurement & suppliers
│   │   └── AccountingService/       # Financial accounting
│   └── shared/
│       ├── Shared.Common/           # Common utilities
│       ├── Shared.Events/           # Event definitions
│       ├── Shared.Logging/          # Logging infrastructure
│       └── Shared.Messaging/        # Message bus abstractions
├── frontend/
│   ├── app/
│   │   ├── auth/                    # Authentication pages
│   │   ├── hr/                      # HR module UI
│   │   ├── inventory/               # Inventory module UI
│   │   ├── sales/                   # Sales module UI
│   │   ├── procurement/             # Procurement module UI
│   │   ├── accounting/              # Accounting module UI
│   │   └── page.tsx                 # Dashboard
│   ├── components/                  # Reusable React components
│   └── lib/                         # Utility functions
└── infra/
    └── docker-compose.yml           # Infrastructure services
```

## Features

### Core Modules

#### Authentication & Authorization
- User registration and login
- Role-based access control (RBAC)
- JWT token-based authentication
- Password reset functionality
- Session management

#### Human Resources (HR)
- Employee directory and profiles
- Department and position management
- Employee lifecycle tracking
- Organizational hierarchy
- Leave and attendance management

#### Payroll Management
- Automated salary calculations
- Tax deductions and benefits
- Payslip generation
- Monthly payroll processing
- Payment history tracking

#### Inventory Management
- Product catalog management
- Stock level tracking
- Low stock alerts
- SKU-based inventory system
- Multi-location support

#### Sales Management
- Customer database and CRM
- Sales order processing
- Order status tracking
- Sales analytics and reporting
- Customer interaction history

#### Procurement
- Supplier database management
- Purchase order creation and approval
- Order tracking and receiving
- Supplier performance metrics
- Procurement analytics

#### Accounting & Finance
- Chart of accounts
- General ledger management
- Transaction recording
- Balance sheet and income statements
- Financial reporting

### Technical Features

#### Backend
- RESTful API design
- Microservices communication via message bus
- Database-per-service pattern
- Event-driven architecture
- Centralized error handling
- Request/response logging
- Health check endpoints
- API versioning

#### Frontend
- Responsive design (mobile, tablet, desktop)
- Server-side rendering (SSR)
- Client-side routing
- Real-time data updates
- Interactive charts and visualizations
- Form validation with Zod
- Optimistic UI updates
- Dark mode support

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- .NET 8.0 SDK
- Docker and Docker Compose
- PostgreSQL 15 (via Docker)
- Git

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Malindup2/NexCore-ERP.git
cd NexCore-ERP
```

#### 2. Start Infrastructure Services
```bash
cd infra
docker-compose up -d
```

This will start:
- PostgreSQL (port 5432)
- RabbitMQ (ports 5672, 15672)
- Redis (port 6379)
- Seq (port 5341, 8081)

#### 3. Backend Setup

Navigate to each service and run migrations:

```bash
cd backend/services/AuthService
dotnet restore
dotnet ef database update
dotnet run
```

Repeat for other services:
- HRService
- PayrollService
- InventoryService
- SalesService
- ProcurementService
- AccountingService

#### 4. Start API Gateway
```bash
cd backend/gateway/ApiGateway
dotnet restore
dotnet run
```

#### 5. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:5000
- RabbitMQ Management: http://localhost:15672 (guest/guest)
- Seq Logging: http://localhost:8081

### Environment Configuration

#### Backend Services
Each service requires an `appsettings.json` or `appsettings.Development.json` with:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=ServiceName;Username=postgres;Password=12345"
  },
  "RabbitMQ": {
    "Host": "localhost",
    "Username": "guest",
    "Password": "guest"
  },
  "JwtSettings": {
    "SecretKey": "your-secret-key",
    "Issuer": "NexCore-ERP",
    "Audience": "NexCore-Client"
  }
}
```

#### Frontend
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Development

### Running in Development Mode

#### Backend
Each service can be run independently:
```bash
cd backend/services/[ServiceName]
dotnet watch run
```

#### Frontend
```bash
cd frontend
npm run dev
```

### Building for Production

#### Backend
```bash
cd backend/services/[ServiceName]
dotnet publish -c Release -o ./publish
```

#### Frontend
```bash
cd frontend
npm run build
npm start
```

## API Documentation

API Gateway provides centralized access to all microservices:

### Base URL
```
http://localhost:5000/api
```

### Service Endpoints
- `/auth/*` - Authentication & Authorization
- `/hr/*` - Human Resources
- `/payroll/*` - Payroll Management
- `/inventory/*` - Inventory Operations
- `/sales/*` - Sales & CRM
- `/procurement/*` - Procurement
- `/accounting/*` - Accounting & Finance

### Authentication
All protected endpoints require a JWT token:
```
Authorization: Bearer <token>
```

## Testing

### Backend
```bash
cd backend/services/[ServiceName]
dotnet test
```

### Frontend
```bash
cd frontend
npm run test
```

## Monitoring & Logging

### RabbitMQ Management
Access the RabbitMQ management console at http://localhost:15672
- Username: guest
- Password: guest

### Seq Logging Dashboard
View centralized logs at http://localhost:8081

### Health Checks
Each service exposes health check endpoints:
```
http://localhost:[port]/health
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow C# coding conventions for backend
- Use ESLint and Prettier for frontend
- Write unit tests for new features
- Update documentation as needed

## Security Considerations

- JWT tokens with configurable expiration
- Password hashing with bcrypt/PBKDF2
- Role-based access control (RBAC)
- SQL injection prevention via EF Core
- CORS configuration for API Gateway
- Environment-based configuration
- Secrets management (do not commit sensitive data)

## Performance Optimization

- Database indexing on frequently queried fields
- Redis caching for read-heavy operations
- Connection pooling for database connections
- Message queue for async operations
- Frontend code splitting and lazy loading
- Image optimization in Next.js
- Server-side rendering for initial page loads

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/Malindup2/NexCore-ERP/issues

## Acknowledgments

- Built with .NET 8 and Next.js 16
- UI components from shadcn/ui
- Charts powered by Recharts
- Inspired by modern ERP solutions

---
<img width="1895" height="849" alt="Screenshot 2025-12-10 155207" src="https://github.com/user-attachments/assets/d6819cba-69f7-4f5e-ba07-9a188ee3fcc2" />
<img width="1895" height="825" alt="Screenshot 2025-12-10 154936" src="https://github.com/user-attachments/assets/76eac340-d9eb-4e30-986f-70b71ae14d7d" />
<img width="1890" height="835" alt="Screenshot 2025-12-10 154916" src="https://github.com/user-attachments/assets/264a30c3-1ea5-439d-a426-9bb2c4b57132" />
<img width="1904" height="831" alt="Screenshot 2025-12-10 154906" src="https://github.com/user-attachments/assets/d9b5debf-7860-45ef-96aa-fbda5d917ef8" />

**NexCore ERP** - Enterprise Resource Planning for Modern Businesses
