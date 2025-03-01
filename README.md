# DailyJobBoost

A full-stack application that sends daily motivational quotes to job seekers, delivering inspiration right to their inbox at the start of their day.

## Project Structure

```
├── frontend/          # Next.js frontend application
└── backend/          # Node.js backend service
```

## Quick Start

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

For detailed setup instructions and documentation:

- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)

## Features

- 📧 Daily motivational quotes via email
- 🌐 Multi-timezone support
- 💫 Modern, responsive UI
- 🔒 Secure user management
- 📊 Email delivery tracking

## Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Radix UI

### Backend

- Node.js/Express
- TypeScript
- PostgreSQL
- TypeORM
- Nodemailer

## License

MIT License
