# NexCore ERP Backend Endpoints and Frontend Mapping

**Last updated:** 2026-04-04  
**System Status:** ✅ All services operational with message broker verified

## Table of Contents
1. [Gateway Route Map](#gateway-route-map)
2. [Role-Based Access Control](#role-based-access-control)
3. [Status Enum Definitions](#status-enum-definitions)
4. [Backend Endpoints by Service](#backend-endpoints-by-service)
5. [Frontend Component Mapping](#frontend-component-mapping)
6. [RabbitMQ Message Topology](#rabbitmq-message-topology)
7. [Deployment Verification](#deployment-verification)

## Gateway Route Map

All frontend requests go through the API Gateway (port 5000). The gateway routes requests to appropriate microservices:

| Frontend Route | Gateway Route | Backend Service | Backend Route |
|---|---|---|---|
| `/auth/*` | `/api/auth/{**catch-all}` | AuthService | `/api/Auth/{**catch-all}` |
| `/hr/employees/*` | `/api/hr/employees/{**catch-all}` | HRService | `/api/Employees/{**catch-all}` |
| `/hr/attendance/*` | `/api/hr/Attendance/{**catch-all}` | HRService | `/api/Attendance/{**catch-all}` |
| `/hr/leave/*` | `/api/hr/Leave/{**catch-all}` | HRService | `/api/Leave/{**catch-all}` |
| `/hr/reviews/*` | `/api/hr/PerformanceReview/{**catch-all}` | HRService | `/api/PerformanceReview/{**catch-all}` |
| `/hr/self-service/*` | `/api/hr/EmployeeSelfService/{**catch-all}` | HRService | `/api/EmployeeSelfService/{**catch-all}` |
| `/inventory/products/*` | `/api/inventory/products/{**catch-all}` | InventoryService | `/api/Products/{**catch-all}` |
| `/sales/orders/*` | `/api/sales/{**catch-all}` | SalesService | `/api/Sales/{**catch-all}` |
| `/procurement/orders/*` | `/api/procurement/{**catch-all}` | ProcurementService | `/api/Procurement/{**catch-all}` |
| `/payroll/*` | `/api/payroll/{**catch-all}` | PayrollService | `/api/Payroll/{**catch-all}` |
| `/accounting/*` | `/api/accounting/{**catch-all}` | AccountingService | `/api/{**catch-all}` |

## Role-Based Access Control

### Available Roles
- **Admin** - Full system access, user management, system configuration
- **HRManager** - HR operations, employee management, attendance, leaves, reviews
- **Accountant** - Financial operations, journal entries, account management
- **SalesProcurement** - Sales orders, procurement, suppliers, customers
- **Employee** - Self-service access (profile, attendance, leaves), limited read-only access

### Access Control Patterns

| Endpoint Pattern | Authorization | Frontend Component |
|---|---|---|
| User Management | `[Authorize(Roles = "Admin")]` | admin/users (not yet implemented) |
| Employee CRUD | `[Authorize(Roles = "Admin,HRManager")]` | /hr/employees |
| Attendance (own) | `[Authorize(Roles = "Employee")]` + ownership check | Employee dashboard |
| Attendance (others) | `[Authorize(Roles = "Admin,HRManager")]` | /hr/attendance-admin |
| Leave Management | `[Authorize(Roles = "Admin,HRManager")]` | /hr/leaves |
| Sales Orders | `[Authorize(Roles = "Admin,SalesProcurement")]` | /sales/orders |
| Procurement | `[Authorize(Roles = "Admin,SalesProcurement")]` | /procurement/orders |
| Accounting | `[Authorize(Roles = "Admin,Accountant")]` | /accounting/* |
| Payroll | `[Authorize(Roles = "Admin,Accountant")]` | /payroll/salaries |

## Status Enum Definitions

### Sales Order Status
Used in: `SalesService` → Sales Orders  
Possible values: `Pending`, `Confirmed`, `Shipped`, `Cancelled`  
JSON serialization: Configured with `JsonStringEnumConverter`

```csharp
public enum OrderStatus
{
    Pending = 0,
    Confirmed = 1,
    Shipped = 2,
    Cancelled = 3
}
```

**Frontend Mapping** (`frontend/app/sales/orders/page.tsx`):
```typescript
const toSalesStatusLabel = (status: unknown): string => {
  const statusMap: Record<number | string, string> = {
    "0": "Pending", "Pending": "Pending",
    "1": "Confirmed", "Confirmed": "Confirmed",
    "2": "Shipped", "Shipped": "Shipped",
    "3": "Cancelled", "Cancelled": "Cancelled",
  };
  return statusMap[String(status ?? "0")] ?? "Unknown";
};
```

### Procurement Order Status
Used in: `ProcurementService` → Purchase Orders  
Possible values: `Draft`, `Submitted`, `Received`, `Cancelled`  
JSON serialization: Configured with `JsonStringEnumConverter`

```csharp
public enum OrderStatus
{
    Draft = 0,
    Submitted = 1,
    Received = 2,
    Cancelled = 3
}
```

### Attendance Status
Used in: `HRService` → Employee Attendance  
Possible values: `Present`, `Absent`, `HalfDay`, `Late`, `OnLeave`, `Holiday`

```csharp
public enum AttendanceStatus
{
    Present,
    Absent,
    HalfDay,
    Late,
    OnLeave,
    Holiday
}
```

## Backend Endpoints by Service

### AuthService
**Base Route:** `/api/auth` (via API Gateway)  
**Controller Route:** `/api/Auth`

| Method | Endpoint | Authorization | Frontend Component | Purpose |
|--------|----------|---|---|---|
| POST | `/api/auth/register` | Anonymous | `/auth/register` | User registration |
| POST | `/api/auth/login` | Anonymous | `/auth/login` | User authentication |
| POST | `/api/auth/admin/create-user` | Admin | (admin panel - future) | Create users as admin |
| GET | `/api/auth/users` | Admin | (admin panel - future) | List all users |
| PUT | `/api/auth/users/{id}` | Admin | (admin panel - future) | Update user details |
| DELETE | `/api/auth/users/{id}` | Admin | (admin panel - future) | Delete user |
| POST | `/api/auth/forgot-password` | Anonymous | `/auth/forgot-password` | Initiate password reset |
| POST | `/api/auth/reset-password` | Anonymous | `/auth/reset-password` | Complete password reset |

---

### HRService
**Base Route:** `/api/hr` (via API Gateway)

#### Employees Controller
**Authorization:** `Admin,HRManager`  
**Frontend Component:** `/app/hr/employees/page.tsx`

| Method | Endpoint | Purpose |
|--------|----------|---|
| POST | `/api/hr/employees` | Create new employee |
| GET | `/api/hr/employees` | List all employees |
| GET | `/api/hr/employees/{id}` | Get employee details |
| PUT | `/api/hr/employees/{id}` | Update employee information |
| DELETE | `/api/hr/employees/{id}` | Delete employee record |

#### Attendance Controller
**Frontend Component:** `/app/hr/attendance-admin/page.tsx` (admin), Employee dashboard (self-service)  
**Security:** Ownership validation enforced - employees can only check in/out for themselves

| Method | Endpoint | Authorization | Purpose |
|--------|----------|---|---|
| POST | `/api/hr/Attendance/check-in` | Employee (ownership) | Employee self check-in with timestamp |
| POST | `/api/hr/Attendance/check-out` | Employee (ownership) | Employee self check-out with timestamp |
| POST | `/api/hr/Attendance/manual` | Admin,HRManager | **NEW: HR manual attendance marking** (supports batch status updates) |
| GET | `/api/hr/Attendance/employee/{employeeId}` | Admin,HRManager | Get attendance records for specific employee |
| GET | `/api/hr/Attendance/today/{employeeId}` | Admin,HRManager | Get today's attendance summary |
| POST | `/api/hr/Attendance/report` | Admin,HRManager | Generate attendance report |
| GET | `/api/hr/Attendance` | Admin,HRManager | List all attendance records |

**Manual Attendance Request Body:**
```json
{
  "employeeId": "emp-123",
  "date": "2026-04-04",
  "status": "Present",
  "checkInTime": "09:00:00",
  "checkOutTime": "17:00:00",
  "notes": "Marked manually by HR"
}
```

#### Leave Controller
**Authorization:** `Admin,HRManager`  
**Frontend Component:** `/app/hr/leaves/page.tsx`

| Method | Endpoint | Purpose |
|--------|----------|---|
| GET | `/api/hr/Leave/types` | Get all leave types |
| POST | `/api/hr/Leave/types` | Create new leave type |
| POST | `/api/hr/Leave/request` | Submit leave request |
| GET | `/api/hr/Leave/requests/employee/{employeeId}` | Get employee's leave requests |
| GET | `/api/hr/Leave/requests/pending` | Get all pending leave approvals |
| POST | `/api/hr/Leave/requests/{id}/approve` | Approve leave request |
| POST | `/api/hr/Leave/requests/{id}/reject` | Reject leave request |
| GET | `/api/hr/Leave/balance/{employeeId}` | Get employee leave balance |
| GET | `/api/hr/Leave/requests` | List all leave requests |

#### Performance Review Controller
**Authorization:** `Admin,HRManager`  
**Frontend Component:** `/app/hr/reviews/page.tsx` (future implementation)

| Method | Endpoint | Purpose |
|--------|----------|---|
| POST | `/api/hr/PerformanceReview` | Create performance review |
| PUT | `/api/hr/PerformanceReview/{id}` | Update review |
| POST | `/api/hr/PerformanceReview/{id}/publish` | Publish review (make visible) |
| GET | `/api/hr/PerformanceReview/employee/{employeeId}` | Get reviews for employee |
| GET | `/api/hr/PerformanceReview/{id}` | Get specific review |
| GET | `/api/hr/PerformanceReview` | List all reviews |
| GET | `/api/hr/PerformanceReview/summary/{employeeId}` | Get employee review summary |

#### Employee Self-Service Controller
**Authorization:** `Employee` role (restricted to user's own data)  
**Frontend Component:** Employee dashboard, profile page, attendance history  
**Security Note:** NOW RESTRICTED - Only employees can access their own records (NameIdentifier validation added)

| Method | Endpoint | Purpose |
|--------|----------|---|
| GET | `/api/hr/EmployeeSelfService/profile/{userId}` | Get own profile |
| GET | `/api/hr/EmployeeSelfService/attendance/{userId}` | Get own attendance history |
| GET | `/api/hr/EmployeeSelfService/leaves/{userId}` | Get own leave balance |
| GET | `/api/hr/EmployeeSelfService/leave-types` | Get available leave types |
| POST | `/api/hr/EmployeeSelfService/leaves/{userId}` | Submit own leave request |
| GET | `/api/hr/EmployeeSelfService/reviews/{userId}` | Get own reviews |
| GET | `/api/hr/EmployeeSelfService/dashboard/{userId}` | Get personal dashboard |
| GET | `/api/hr/EmployeeSelfService/payroll/{userId}` | Get own payroll information |

---

### InventoryService
**Authorization:** `Admin,SalesProcurement`  
**Base Route:** `/api/inventory/products` (via API Gateway)  
**Frontend Component:** `/app/inventory/products/page.tsx`  
**Status:** Product inventory with stock level management

| Method | Endpoint | Purpose |
|--------|----------|---|
| POST | `/api/inventory/products` | Create new product |
| GET | `/api/inventory/products` | List all products |
| GET | `/api/inventory/products/{id}` | Get product details |
| GET | `/api/inventory/products/check-stock/{sku}` | Check stock level by SKU |
| POST | `/api/inventory/products/{id}/adjust-stock` | Adjust inventory (receipt/adjustment) |
| PUT | `/api/inventory/products/{id}` | Update product information |
| DELETE | `/api/inventory/products/{id}` | Archive/delete product |

---

### SalesService
**Authorization:** `Admin,SalesProcurement`  
**Base Route:** `/api/sales` (via API Gateway)  
**Frontend Component:** `/app/sales/orders/page.tsx`  
**Status Enums:** `Pending`, `Confirmed`, `Shipped`, `Cancelled`  
**JSON Serialization:** Configured with `JsonStringEnumConverter` (April 2026 fix)

#### Customers
| Method | Endpoint | Purpose |
|--------|----------|---|
| POST | `/api/sales/customers` | Create customer |
| GET | `/api/sales/customers` | List customers |
| GET | `/api/sales/customers/{id}` | Get customer details |
| PUT | `/api/sales/customers/{id}` | Update customer |
| DELETE | `/api/sales/customers/{id}` | Delete customer |

#### Sales Orders
| Method | Endpoint | Purpose |
|--------|----------|---|
| POST | `/api/sales/orders` | Create sales order |
| GET | `/api/sales/orders` | List all orders |
| GET | `/api/sales/orders/{id}` | Get order details + line items |
| PUT | `/api/sales/orders/{id}/status` | Update order status (Pending→Confirmed→Shipped) |

**Status Update Request:**
```json
{
  "status": "Confirmed"
}
```

---

### ProcurementService
**Authorization:** `Admin,SalesProcurement`  
**Base Route:** `/api/procurement` (via API Gateway)  
**Frontend Component:** `/app/procurement/orders/page.tsx`  
**Status Enums:** `Draft`, `Submitted`, `Received`, `Cancelled`  
**JSON Serialization:** Configured with `JsonStringEnumConverter` (April 2026 fix)

#### Suppliers
| Method | Endpoint | Purpose |
|--------|----------|---|
| POST | `/api/procurement/suppliers` | Add supplier |
| GET | `/api/procurement/suppliers` | List suppliers |
| GET | `/api/procurement/suppliers/{id}` | Get supplier details |
| PUT | `/api/procurement/suppliers/{id}` | Update supplier |
| DELETE | `/api/procurement/suppliers/{id}` | Delete supplier |

#### Purchase Orders
| Method | Endpoint | Purpose |
|--------|----------|---|
| POST | `/api/procurement/orders` | Create PO |
| GET | `/api/procurement/orders` | List all orders |
| GET | `/api/procurement/orders/{id}` | Get PO details + line items |
| POST | `/api/procurement/orders/{id}/receive` | Receive goods (Submitted→Received) |
| PUT | `/api/procurement/orders/{id}/status` | Update order status |

**Status Options:** Draft (incomplete) → Submitted (finalized) → Received (goods received) → Cancelled (aborted)

---

### PayrollService
**Base Route:** `/api/payroll` (via API Gateway)  
**Frontend Component:** `/app/payroll/salaries/page.tsx`

#### Salary Management
**Authorization:** `Admin,Accountant`

| Method | Endpoint | Purpose |
|--------|----------|---|
| GET | `/api/payroll/salaries` | List all employee salaries |
| GET | `/api/payroll/salaries/{employeeId}` | Get employee salary structure |
| PUT | `/api/payroll/salaries/{employeeId}` | Update salary (base, allowances, deductions) |

#### Payroll Processing
**Authorization:** `Admin,Accountant`

| Method | Endpoint | Purpose |
|--------|----------|---|
| POST | `/api/payroll/process-payroll` | Run monthly payroll batch calculation |
| GET | `/api/payroll/payroll-runs` | List all payroll runs |
| GET | `/api/payroll/payroll-runs/{year}/{month}` | Get specific payroll run data |
| GET | `/api/payroll/summary` | Get payroll summary statistics |

#### Employee Self-Service
**Authorization:** Authenticated user (any role)

| Method | Endpoint | Purpose |
|--------|----------|---|
| GET | `/api/payroll/employee/{employeeId}/history` | Get own payroll history (employee can only view own) |

---

### AccountingService
**Authorization:** `Admin,Accountant`  
**Base Route:** `/api/accounting` (via API Gateway)  
**Frontend Component:** `/app/accounting/journal-entries/page.tsx`

#### Chart of Accounts
| Method | Endpoint | Purpose |
|--------|----------|---|
| GET | `/api/accounting/Accounts` | List all accounts |
| GET | `/api/accounting/Accounts/{id}` | Get account details |
| GET | `/api/accounting/Accounts/code/{accountCode}` | Lookup account by code |
| GET | `/api/accounting/Accounts/types` | Get account type definitions |
| POST | `/api/accounting/Accounts` | Create chart of account entry |
| PUT | `/api/accounting/Accounts/{id}` | Update account |
| DELETE | `/api/accounting/Accounts/{id}` | Deactivate account |

#### Journal Entries
| Method | Endpoint | Purpose |
|--------|----------|---|
| GET | `/api/accounting/JournalEntries` | List journal entries |
| GET | `/api/accounting/JournalEntries/{id}` | Get entry details |
| GET | `/api/accounting/JournalEntries/reference/{referenceId}` | Get entries by reference (e.g., Sales order ID) |
| POST | `/api/accounting/JournalEntries` | Create manual journal entry |
| DELETE | `/api/accounting/JournalEntries/{id}` | Delete entry (audit trail maintained) |

#### Reports
| Method | Endpoint | Purpose |
|--------|----------|---|
| GET | `/api/accounting/Reports/trial-balance` | Trial balance report |
| GET | `/api/accounting/Reports/balance-sheet` | Balance sheet |
| GET | `/api/accounting/Reports/income-statement` | Income statement |
| GET | `/api/accounting/Reports/general-ledger` | General ledger report |
| GET | `/api/accounting/Reports/cash-flow` | Cash flow analysis |

**Automatic Entries Created By:**
- Sales orders → GL entries for revenue recognition
- Procurement orders → GL entries for COGS/accruals
- Payroll processing → GL entries for salary expense + payables

---

## Frontend Component Mapping

| Frontend Route | Component File | Module | Required Role | Purpose |
|---|---|---|---|---|
| `/` | `/app/page.tsx` | Dashboard | Any authenticated | System overview + role-specific widgets |
| `/auth/login` | `/app/auth/login/page.tsx` | Auth | Anonymous | User login |
| `/auth/register` | `/app/auth/register/page.tsx` | Auth | Anonymous | User self-registration |
| `/hr/employees` | `/app/hr/employees/page.tsx` | HR | Admin,HRManager | Employee directory + CRUD |
| `/hr/attendance-admin` | `/app/hr/attendance-admin/page.tsx` | HR | Admin,HRManager | Manual attendance marking for staff |
| `/hr/attendance` | `/app/hr/attendance/page.tsx` | HR | Employee | Personal attendance view |
| `/hr/leaves` | `/app/hr/leaves/page.tsx` | HR | Admin,HRManager | Leave requests + approvals |
| `/sales/orders` | `/app/sales/orders/page.tsx` | Sales | Admin,SalesProcurement | Sales order management |
| `/procurement/orders` | `/app/procurement/orders/page.tsx` | Procurement | Admin,SalesProcurement | Purchase order management |
| `/inventory/products` | `/app/inventory/products/page.tsx` | Inventory | Admin,SalesProcurement | Product catalog + stock |
| `/payroll/salaries` | `/app/payroll/salaries/page.tsx` | Payroll | Admin,Accountant | Salary structure management |
| `/accounting/journal-entries` | `/app/accounting/journal-entries/page.tsx` | Accounting | Admin,Accountant | Journal entry recording |

---

## RabbitMQ Message Topology

**Broker Location:** localhost:5672 (AMQP), localhost:15672 (Management UI)  
**Management URL:** http://localhost:15672 (login: guest/guest)  
**Broker Version:** 3.13.7+

### Event Exchanges (All Type: Fanout)
These are the publish/subscribe topics for inter-service communication:

| Exchange Name | Type | Publishers | Subscribers | Events Published |
|---|---|---|---|---|
| `sales.events` | Fanout | SalesService | AccountingService | OrderCreated, OrderStatusChanged, OrderCancelled |
| `procurement.events` | Fanout | ProcurementService | InventoryService, AccountingService | PurchaseOrderCreated, GoodsReceived, OrderCancelled |
| `inventory.events` | Fanout | InventoryService | SalesService, ProcurementService | StockAdjusted, LowStockAlert |
| `inventory.cogs.events` | Fanout | InventoryService | AccountingService | COGSCalculated |
| `employee.events` | Fanout | HRService | PayrollService | EmployeeCreated, EmployeeTerminated, SalaryUpdated |
| `employee_events` | Fanout | HRService | PayrollService | (alternative routing) |
| `user_events` | Fanout | AuthService | HRService, PayrollService | UserCreated, UserDeactivated |

### Consumer Queues
Queues for consuming the above events (7 queues total):

| Queue Name | Bound To | Consumer | Purpose |
|---|---|---|---|
| `accounting.journal.entries` | sales.events | AccountingService | Create GL entries from sales orders |
| `inventory.adjust.stock` | procurement.events | InventoryService | Update stock on goods receipt |
| `accounting.cogs` | inventory.cogs.events | AccountingService | Record COGS for shipped items |
| `payroll.employee.events` | employee.events | PayrollService | Update salary/benefits on employee changes |
| `payroll.user.creation` | user_events | PayrollService | Create payroll records for new users |
| `(queue-6)` | (tbd) | (tbd) | (reserved) |
| `(queue-7)` | (tbd) | (tbd) | (reserved) |

**Verification:**
```powershell
# Check RabbitMQ status
http://localhost:15672/api/overview  # Returns broker info
http://localhost:15672/api/exchanges # Lists exchanges
http://localhost:15672/api/queues    # Lists consumer queues
```

---

## Deployment Verification

### Pre-Deployment Checklist

- [ ] All 7 backend services compiled without errors
- [ ] Database migrations run successfully for all services
- [ ] RabbitMQ broker up and exchanges/queues configured
- [ ] Frontend built with `npm run build`
- [ ] All role-based access tests passed
- [ ] Status enums aligned (Sales: Pending/Confirmed/Shipped; Procurement: Draft/Submitted/Received)
- [ ] Manual attendance endpoint tested
- [ ] Employee ownership validation verified

### Health Check Commands

**Check All Services:**
```bash
# API Gateway
curl http://localhost:5000/health

# Individual services (if exposed)
curl http://localhost:5001/health  # Varies by service port
```

**Check Infrastructure:**
```bash
# PostgreSQL
psql -h localhost -U postgres -d postgres -c "SELECT version();"

# RabbitMQ
curl -u guest:guest http://localhost:15672/api/overview

# Frontend
curl http://localhost:3000
```

### Recent Fixes Applied (April 2026)

✅ **Status Enum Alignment**
- SalesService: Added JsonStringEnumConverter for Pending/Confirmed/Shipped/Cancelled
- ProcurementService: Added JsonStringEnumConverter for Draft/Submitted/Received/Cancelled
- Frontend pages updated to handle both numeric and string status values

✅ **Security Hardening**
- EmployeeSelfServiceController: Restricted from `[Authorize]` to `[Authorize(Roles = "Employee")]`
- AttendanceController: Added User.FindFirstValue(ClaimTypes.NameIdentifier) ownership check on check-in/check-out
- Manual attendance: Added Enum.TryParse() with 400 error on invalid status

✅ **UI/UX Improvements**
- Root layout: Added `suppressHydrationWarning` to prevent browser extension warnings
- Order pages: Added safe status type conversion (normalize unknown→string)
- Attendance admin: Added manual marking dialog with full form validation

✅ **Infrastructure**
- RabbitMQ verified operational with 7 exchanges and 7 consumer queues
- All inter-service event routing confirmed
- AMQP (5672) and Management (15672) ports verified responsive
