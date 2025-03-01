# DailyJobBoost Backend

A Node.js backend service that sends daily motivational quotes to subscribers via email. Built with Express, TypeScript, PostgreSQL, and TypeORM.

## Features

- 📧 Daily email delivery at 9 AM in subscriber's timezone
- 🌐 Multi-timezone support
- 📝 Customizable motivational quotes
- 📊 Email delivery tracking
- ✨ Beautiful email templates
- 🔒 Secure subscription management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Email**: Nodemailer
- **Scheduling**: node-cron
- **Validation**: Zod

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository and navigate to backend:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   # Server
   PORT=3001
   NODE_ENV=development

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_NAME=dailyjobboost

   # Email
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-specific-password
   EMAIL_FROM=DailyJobBoost <noreply@dailyjobboost.com>
   ```

4. Create database:
   ```bash
   createdb dailyjobboost
   ```

## Development

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start production server:

```bash
npm start
```

## API Endpoints

### User Management

#### Subscribe to Daily Quotes

```http
POST /api/users/subscribe
Content-Type: application/json

{
  "email": "user@example.com",
  "timezone": "est"
}
```

#### Unsubscribe from Daily Quotes

```http
POST /api/users/unsubscribe
Content-Type: application/json

{
  "email": "user@example.com"
}
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

## Project Structure

```
src/
├── config/         # Configuration files
├── models/         # Database entities
├── routes/         # API routes
├── services/       # Business logic
└── index.ts        # Application entry point
```

## Email Scheduling

The application sends emails at 9 AM in each subscriber's local timezone. Supported timezones:

- Pacific Time (PST/PDT)
- Mountain Time (MST/MDT)
- Central Time (CST/CDT)
- Eastern Time (EST/EDT)
- Greenwich Mean Time (GMT)
- Central European Time (CET)
- India Standard Time (IST)
- Japan Standard Time (JST)
- Australian Eastern Time (AEST)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
