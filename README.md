# DailyJobBoost

DailyJobBoost is a motivational email service that sends daily inspirational quotes to job seekers, helping them stay motivated during their job search journey.

## Features

- 📧 Daily motivational quotes via email
- ⏰ Timezone-based delivery
- 🎨 Beautiful, responsive email templates
- 🔒 Easy subscription/unsubscription
- ✨ Modern, user-friendly interface

## Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Shadcn UI

### Backend

- Node.js
- Express
- TypeScript
- TypeORM
- PostgreSQL
- Nodemailer

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
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `EMAIL_FROM`: Sender email address
- `UNSUBSCRIBE_SECRET`: Secret for generating unsubscribe tokens

### Frontend

- `NEXT_PUBLIC_API_URL`: Backend API URL

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
