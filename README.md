# React Native Expense Tracker

A mobile expense tracking application built with React Native, Node.js, MongoDB, and GraphQL.

## Features

- Track personal expenses with categories
- Date filtering for expenses
- Monthly summary charts
- Offline mode with local storage fallback
- JWT authentication
- GraphQL API for all operations

## Tech Stack

- **Mobile**: React Native (Expo)
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **API**: GraphQL (Apollo Server)
- **Authentication**: JWT

## Project Structure

```
.
├── backend/          # Node.js/Express GraphQL backend
│   ├── server.js
│   ├── models/       # MongoDB models
│   ├── graphql/      # GraphQL schema and resolvers
│   └── middleware/   # Auth middleware
└── mobile/           # React Native mobile app
    ├── App.js
    ├── screens/      # Screen components
    ├── components/   # Reusable components
    ├── services/     # API and storage services
    └── utils/        # Utility functions
```

## Getting Started

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB connection string and JWT secret

5. Start the server:
```bash
npm run dev
```

The GraphQL endpoint will be available at `http://localhost:4000/graphql`

### Mobile App Setup

1. Navigate to mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npm start
```

## Development

This project is being built commit by commit. Each commit adds a specific feature or component.
