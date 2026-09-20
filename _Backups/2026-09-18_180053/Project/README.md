# PhonePOS

## Mobile Phone Shop Point of Sale and Management System

PhonePOS is a web-based Point of Sale (POS) and Management System developed for mobile phone shops.

The system is designed to help shop owners and employees manage daily business operations such as product management, sales, customers, suppliers, installment payments, mobile phone repairs, employees, and business reports.

PhonePOS provides different user roles with specific permissions to ensure that each employee can access only the functions required for their responsibilities.

---

## Project Overview

Managing a mobile phone shop using manual records or separate applications can be difficult. Shop owners need to manage products, stock, sales, customers, repairs, installment payments, suppliers, and employees.

PhonePOS brings these activities into one centralized web application.

The system allows authorized users to:

- Manage mobile phones and accessories
- Record customer sales
- Manage customer information
- Manage suppliers
- Manage installment payments
- Manage mobile phone repairs
- Manage employees
- Monitor business activities
- Generate business reports
- Export reports to PDF and Excel

---

## Main Features

### 1. Dashboard

The dashboard provides an overview of the shop's current activities.

It can display:

- Total sales
- Total revenue
- Total products
- Low-stock products
- Customer information
- Recent sales
- Repair information
- Business statistics

---

### 2. Product Management

The Product Management module allows authorized employees to manage mobile phones and accessories.

Functions include:

- Add products
- Edit products
- Delete products
- Search products
- Manage product categories
- Manage brands
- Manage selling prices
- Manage stock quantities
- Manage product information

Products can include:

- Mobile Phones
- Phone Accessories
- Chargers
- Cables
- Earphones
- Cases
- Screen Protectors
- Other phone-related products

---

### 3. Sales Management

The Sales module is used to process customer purchases.

Functions include:

- Search products
- Add products to cart
- Select customers
- Calculate subtotal
- Apply discounts
- Calculate total amount
- Select payment method
- Complete sales
- Generate receipts
- View previous sales

Supported payment methods can include:

- Cash
- Card

---

### 4. Customer Management

The Customer Management module allows the shop to maintain customer information.

Functions include:

- Add customers
- Edit customer details
- Delete customers
- Search customers
- View customer information
- View customer purchase history
- Manage customer contact details

Customer information may include:

- Customer name
- Phone number
- Address
- Email
- Purchase history

---

### 5. Supplier Management

The Supplier Management module is used to maintain supplier information.

Functions include:

- Add suppliers
- Edit suppliers
- Delete suppliers
- Search suppliers
- View supplier information

Supplier information may include:

- Supplier name
- Company name
- Phone number
- Email
- Address

---

### 6. Installment Management

PhonePOS supports installment-based sales.

The installment module allows authorized users to:

- Create installment sales
- Record customer installment information
- Track installment payments
- View pending payments
- View completed installments
- Identify overdue payments
- View installment history

This helps the shop monitor customers who purchase products using installment payment plans.

---

### 7. Repair Management

The Repair Management module is designed for mobile phone repair services.

Employees can create repair records containing:

- Customer name
- Customer phone number
- Customer address
- Device
- Device condition
- Problem description
- Advance payment
- Expected completion date
- Technician
- Repair status

Repair statuses can include:

- Pending
- In Progress
- Completed
- Cancelled

This allows the shop to track a customer's device from receiving the repair request until completion.

---

### 8. Employee Management

Employee Management is restricted to **Admin users**.

The Admin can:

- Add employees
- Edit employee details
- Delete employees
- Activate employees
- Deactivate employees
- Change employee passwords
- Assign employee roles

The system currently supports:

- Admin
- Manager
- Cashier
- Technician

Only Admin and Cashier accounts are managed through the employee management section.

---

### 9. Reports

PhonePOS provides reports to help management understand business activities.

Available reports include:

- Sales Report
- Customer Report
- Installment Report
- Repair Report
- Supplier Report

Reports can be filtered and analyzed using relevant information such as:

- Date range
- Customer
- Product
- Supplier
- Repair information
- Payment information

Reports can also be exported as:

- PDF
- Excel

---

## User Roles and Permissions

Different users have different responsibilities in the system.

| Feature | Admin | Manager | Cashier | Technician |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Products | ✓ | ✓ | ✓ | - |
| Sales | ✓ | ✓ | ✓ | - |
| Customers | ✓ | ✓ | ✓ | - |
| Suppliers | ✓ | ✓ | - | - |
| Installments | ✓ | ✓ | ✓ | - |
| Repairs | ✓ | ✓ | ✓ | ✓ |
| Reports | ✓ | ✓ | - | - |
| Employees | ✓ | - | - | - |

### Admin

The Admin has the highest level of access.

Admin can:

- Manage products
- Manage sales
- Manage customers
- Manage suppliers
- Manage installments
- Manage repairs
- View reports
- Manage employees
- Manage user accounts

### Manager

The Manager can manage most business operations but does not have access to employee management.

### Cashier

The Cashier mainly handles:

- Sales
- Customers
- Products
- Installments
- Dashboard

### Technician

The Technician mainly handles:

- Repair records
- Customer device repairs
- Repair status updates

---

## Technologies Used

### Frontend

- **Next.js** – React framework for building the web application
- **React** – User interface development
- **TypeScript** – Type-safe JavaScript development
- **Tailwind CSS** – User interface styling
- **Lucide React** – Icons
- **Chart.js** – Charts and data visualization

### Backend

- **Next.js API Routes** – Backend API development
- **Node.js** – JavaScript runtime
- **Prisma ORM** – Database access and management

### Database

- **MySQL** – Relational database management system

### Authentication and Security

- **JWT** – User authentication
- **bcryptjs** – Password hashing
- **HTTP Cookies** – Authentication token storage
- **Role-Based Access Control** – Permission management

### Reporting and Export

- **jsPDF** – PDF generation
- **jspdf-autotable** – PDF table generation
- **XLSX** – Excel file generation

---

# System Architecture

PhonePOS follows a modern web application architecture.
## License

This project is licensed under the MIT License and developed by Madhushi Illesinghe for educational and software engineering purposes.
```text
                    PhonePOS
                       |
        +--------------+--------------+
        |                             |
   Presentation Layer             API Layer
        |                             |
   Next.js / React              Next.js API
        |                             |
        +--------------+--------------+
                       |
                  Prisma ORM
                       |
                    MySQL
                    Database

