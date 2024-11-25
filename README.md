# Banking System

This is a basic banking system with core functionalities such as account management, transactions, deposit handling, locker assignments, and OTP-based authentication. The system caters to three main user roles: Admin, Branch Manager, and Customer, each with distinct capabilities and access restrictions.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)

---

## Features

- **Admin Features**:
  - Manages Branch Manager
  - Manages Branch
  - Manages Policies
  - System wide settings
- **Branch Manager Features**:
  - Manages Customers
  - Manages customer accounts
  - Manages locker and assign it to customer based on availability
- **Customer Features**:
  - Register themselves
  - Request for account creation
  - Request for locker
  - Perform transactions
  - Create FD and RD account

---

## Technologies Used

- **Node.js**: Backend development
- **Express**: Web application framework
- **PostgreSQL**: Database
- **Sequelize**: ORM for PostgreSQL
- **Redis**: In memory database
- **AWS**: s3 client

---

## Installation

Follow these steps to set up and run the project locally for development:

### Prerequisites

Ensure the following are installed on your system:

- **Node.js**: v20.18.0
- **npm**: Comes with Node.js
- **PostgreSQL**: Installed and running
- **redis**: Installed and running

### Steps

1. Clone the repository:
   ```bash
   git clone git@github.com:lakshyagkmit/banking-system.git
   cd banking-system
   ```
2. Install dependencies

```bash
npm install
```

3. Setup environment variables as given in [env.sample](https://github.com/lakshyagkmit/banking-system/blob/staging/.env.sample)
4. Start server

```bash
npm start
```
