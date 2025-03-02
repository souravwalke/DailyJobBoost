# DailyJobBoost

DailyJobBoost is a motivational email service that sends daily inspirational quotes to job seekers, helping them stay motivated during their job search journey. It features smart quote rotation, timezone-based delivery, and a secure admin interface for content management.

## Features

### Email System

- 📧 Daily motivational quotes via email
- ⏰ Intelligent timezone-based delivery at 9 AM local time
- 🔄 Smart quote rotation to prevent repetition
- 📊 Email delivery tracking and logging
- 🎨 Beautiful, responsive email templates
- ✉️ Welcome emails for new subscribers

### User Management

- 👤 Easy subscription with email and timezone
- 🔒 Secure unsubscribe functionality
- 📝 User preference management
- 📈 Activity tracking

### Quote Management

- 📚 Admin dashboard for quote management
- ✨ CRUD operations for quotes
- 🔄 Smart quote rotation system
- 🏷️ Quote categorization
- 📊 Quote usage tracking

### Security

- 🔐 JWT-based admin authentication
- 🛡️ Protected admin routes
- 🔒 Secure email tokens
- 🌐 CORS protection
- 🔑 Environment variable configuration

## Tech Stack

### Frontend

- Next.js 13+
- TypeScript
- Tailwind CSS
- Shadcn UI
- React Hook Form
- Zod Validation

### Backend

- Node.js
- Express
- TypeScript
- TypeORM
- PostgreSQL
- Nodemailer
- JWT Authentication
- node-cron

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- SMTP server access (e.g., Gmail)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/dailyjobboost.git
cd dailyjobboost
```

2. Install dependencies:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:

```bash
# Backend (.env)
cp backend/.env.example backend/.env
# Update the .env file with your database and SMTP credentials

# Frontend (.env)
cp frontend/.env.example frontend/.env
```

4. Set up the database:

```bash
cd backend
npm run typeorm migration:run
```

5. Start the development servers:

```bash
# Start backend (in backend directory)
npm run dev

# Start frontend (in frontend directory)
npm run dev
```

6. Visit `http://localhost:3000` to see the application

## Environment Variables

### Backend

- `PORT`: Server port (default: 3001)
- `FRONTEND_URL`: Frontend URL for CORS
- `NODE_ENV`: Environment (development/production)

#### Database Configuration

- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name

#### Email Configuration

- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port
- `SMTP_SECURE`: Use SSL/TLS (true/false)
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `EMAIL_FROM`: Sender email address

#### Security

- `JWT_SECRET`: Secret for JWT tokens
- `UNSUBSCRIBE_SECRET`: Secret for generating unsubscribe tokens
- `ADMIN_PASSWORD`: Initial admin password

### Frontend

- `NEXT_PUBLIC_API_URL`: Backend API URL

## API Endpoints

### User Management

```http
POST /api/users/subscribe
Content-Type: application/json

{
  "email": "user@example.com",
  "timezone": "America/New_York"
}
```

```http
GET /api/users/unsubscribe/:token
POST /api/users/unsubscribe
```

### Quote Management (Protected)

```http
GET    /api/quotes       # Get all quotes
POST   /api/quotes       # Create new quote
GET    /api/quotes/:id   # Get single quote
PUT    /api/quotes/:id   # Update quote
DELETE /api/quotes/:id   # Delete quote
GET    /api/quotes/random # Get random quote
```

### Authentication

```http
POST /api/auth/login    # Admin login
POST /api/auth/register # Admin registration (protected)
```

## Database Schema

### Users

- `id`: Primary key
- `email`: Unique email address
- `timezone`: User's timezone
- `isActive`: Subscription status
- `createdAt`: Timestamp

### Quotes

- `id`: Primary key
- `content`: Quote text
- `author`: Quote author (optional)
- `category`: Quote category (optional)
- `createdAt`: Timestamp

### EmailLogs

- `id`: Primary key
- `userId`: Foreign key to Users
- `quoteId`: Foreign key to Quotes
- `sentAt`: Timestamp
- `status`: Delivery status

### Admins

- `id`: Primary key
- `username`: Unique username
- `password`: Hashed password
- `createdAt`: Timestamp

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
