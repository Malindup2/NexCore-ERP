# NexCore ERP Users, Roles, Endpoint Access, and Frontend Access


## Actual users in system

There are no hardcoded seeded user accounts in code.

- Users are created through:
  - `POST /api/auth/register` (self-registration, default role is `Employee`)
  - `POST /api/auth/admin/create-user` (Admin creates users with selected role)

So the platform has role-based user types, not fixed predefined usernames in source code.

## Role list

- Anonymous (not logged in)
- Admin
- HRManager
- Accountant
- SalesProcurement
- Employee

## Backend endpoint capabilities by role

## Anonymous

Allowed:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Blocked:
- All other authenticated endpoints

## Admin

Allowed endpoint groups:
- Auth management
  - `POST /api/auth/admin/create-user`
  - `GET /api/auth/users`
  - `PUT /api/auth/users/{id}`
  - `DELETE /api/auth/users/{id}`
- HR admin
  - `GET|POST|PUT|DELETE /api/hr/employees/*`
  - `GET|POST /api/hr/Attendance*` (including admin report/manual routes)
  - `GET|POST /api/hr/Leave*` (types, requests, approvals)
  - `GET|POST|PUT /api/hr/PerformanceReview*`
- Employee self-service API surface (authenticated)
  - `/api/hr/EmployeeSelfService/*`
- Inventory
  - `/api/inventory/products*`
- Sales
  - `/api/sales/*`
- Procurement
  - `/api/procurement/*`
- Payroll
  - `/api/payroll/salaries*`
  - `/api/payroll/process-payroll`
  - `/api/payroll/payroll-runs*`
  - `/api/payroll/summary`
  - `/api/payroll/employee/{employeeId}/history` (authenticated endpoint)
- Accounting
  - `/api/accounting/Accounts*`
  - `/api/accounting/JournalEntries*`
  - `/api/accounting/Reports*`

## HRManager

Allowed endpoint groups:
- HR admin
  - `/api/hr/employees*`
  - `/api/hr/Attendance` (admin routes)
  - `/api/hr/Leave*`
  - `/api/hr/PerformanceReview*`
- Self-service (authenticated)
  - `/api/hr/EmployeeSelfService/*`

Not allowed by backend role constraints:
- Auth admin user management endpoints
- Inventory/Sales/Procurement endpoints
- Accounting endpoints
- Payroll admin endpoints (`/api/payroll/salaries*`, process-payroll, runs, summary)

## Accountant

Allowed endpoint groups:
- Payroll admin
  - `/api/payroll/salaries*`
  - `/api/payroll/process-payroll`
  - `/api/payroll/payroll-runs*`
  - `/api/payroll/summary`
  - `/api/payroll/employee/{employeeId}/history` (authenticated endpoint)
- Accounting
  - `/api/accounting/Accounts*`
  - `/api/accounting/JournalEntries*`
  - `/api/accounting/Reports*`

Not allowed by backend role constraints:
- HR admin endpoints
- Inventory/Sales/Procurement endpoints
- Auth admin user management endpoints

## SalesProcurement

Allowed endpoint groups:
- Inventory
  - `/api/inventory/products*`
- Sales
  - `/api/sales/*`
- Procurement
  - `/api/procurement/*`

Not allowed by backend role constraints:
- HR admin endpoints
- Payroll admin endpoints
- Accounting endpoints
- Auth admin user management endpoints

## Employee

Allowed endpoint groups:
- Self-service (authenticated)
  - `/api/hr/EmployeeSelfService/profile/{userId}`
  - `/api/hr/EmployeeSelfService/attendance/{userId}`
  - `/api/hr/EmployeeSelfService/leaves/{userId}`
  - `/api/hr/EmployeeSelfService/leave-types`
  - `POST /api/hr/EmployeeSelfService/leaves/{userId}`
  - `/api/hr/EmployeeSelfService/reviews/{userId}`
  - `/api/hr/EmployeeSelfService/dashboard/{userId}`
  - `/api/hr/EmployeeSelfService/payroll/{userId}`
- Attendance actions (authenticated)
  - `POST /api/hr/Attendance/check-in`
  - `POST /api/hr/Attendance/check-out`
- Payroll history endpoint (authenticated)
  - `GET /api/payroll/employee/{employeeId}/history`

Not allowed by backend role constraints:
- Admin management APIs across Auth/HR/Payroll/Accounting/Sales/Procurement/Inventory

## Frontend capabilities by role

## Anonymous

Accessible pages:
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/auth/reset-password`

## Admin

Primary pages:
- `/`
- `/admin`
- `/admin/users`
- `/hr/employees`
- `/hr/attendance-admin`
- `/hr/leave-approvals`
- `/hr/reviews-admin`
- `/inventory/products`
- `/sales/customers`
- `/sales/orders`
- `/procurement/suppliers`
- `/procurement/orders`
- `/accounting`
- `/payroll/salary-records`
- `/payroll/runs`
- `/payroll/reports`

## HRManager

Primary pages:
- `/`
- `/hr/employees`
- `/hr/attendance-admin`
- `/hr/leave-approvals`
- `/hr/reviews-admin`

## Accountant

Primary pages:
- `/`
- `/accounting`
- `/payroll/salary-records`
- `/payroll/runs`
- `/payroll/reports`

## SalesProcurement

Primary pages:
- `/`
- `/inventory/products`
- `/sales/customers`
- `/sales/orders`
- `/procurement/suppliers`
- `/procurement/orders`

## Employee

Primary pages:
- `/`
- `/hr/attendance`
- `/hr/leave`
- `/hr/reviews`
- `/hr/payroll`

## Important note

This matrix reflects code-level authorization and frontend guards. Runtime success still depends on service health, valid JWT tokens, and data state in database.
