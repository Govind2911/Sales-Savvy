# Sales Savvy

**Smart Deals. Smarter Shopping.**

Sales Savvy is a full-stack e-commerce application built with Spring Boot. It brings together user authentication, product management, shopping cart functionality, payment integration, and email-based OTP verification in one application.

## Features

- User registration and login with JWT authentication
- Email OTP verification
- Forgot-password and password-reset functionality
- Product listing and management
- Shopping cart functionality
- Online payments using Razorpay
- Admin functionality for managing products
- Responsive frontend served through the Spring Boot application

## Tech Stack

- **Backend:** Java, Spring Boot, Spring Security
- **Database:** MySQL, Spring Data JPA, Hibernate
- **Authentication:** JWT
- **Payment Gateway:** Razorpay
- **Email Service:** Gmail SMTP
- **Frontend:** HTML, CSS, JavaScript
- **Build Tool:** Maven

## Getting Started

### Prerequisites

- Java and Maven (or use the included Maven Wrapper)
- MySQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Sales-Savvy.git
cd Sales-Savvy
```

### 2. Create the database

Create a MySQL database:

```sql
CREATE DATABASE sales_savvy;
```

### 3. Configure environment variables

Refer to `.env.example` for the required environment variables.

Configure the following values in your environment:

| Variable | Description |
|---|---|
| `DB_URL` | MySQL JDBC connection URL |
| `DB_USERNAME` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `JWT_SECRET` | Secret used for JWT signing |
| `JWT_EXPIRATION_MS` | JWT expiration time in milliseconds |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret |
| `OTP_EXPIRATION_MINUTES` | OTP validity duration |
| `OTP_MAIL_ENABLED` | Enable or disable OTP email delivery |
| `MAIL_USERNAME` | Gmail address used for SMTP |
| `MAIL_PASSWORD` | Gmail app password |

**Note:** Spring Boot does not automatically load a plain `.env` file. Configure these variables in your IDE's run configuration or your system environment. Never commit your actual credentials.

### 4. Run the application

On Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Open the application:

```text
http://localhost:8081
```

## Password Reset

Customers can use the **Forgot Password** option on the login page.

The application accepts a username or email address to identify the account and sends an OTP to the registered email address when email delivery is enabled.

## Payment Integration

Razorpay is used to process online payments. Configure your Razorpay API credentials through environment variables before using the payment functionality.

## Security

- Sensitive configuration values are supplied through environment variables.
- Do not commit `.env` or other files containing credentials.
- Use your own secure credentials when configuring the application.

## Author

**Govind Patidar**

GitHub: [Govind2911](https://github.com/Govind2911)