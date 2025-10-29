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

- **Mobile**: React Native (Expo) with TypeScript
- **Backend**: Node.js with Express and TypeScript
- **Database**: MongoDB with Mongoose
- **API**: GraphQL (Apollo Server)
- **Authentication**: JWT
- **Monorepo**: npm workspaces

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

This is a monorepo managed with npm workspaces. You can install all dependencies and run commands from the root.

### Install Dependencies

From the root directory, install all workspace dependencies:
```bash
npm install
```

### Backend Setup

1. Create `.env` file in the `backend` directory from `.env.example`:
```bash
cp backend/.env.example backend/.env
```

2. Update `backend/.env` with your MongoDB connection string and JWT secret

3. Start the backend server:
```bash
npm run backend:dev
```

Or from the backend directory:
```bash
cd backend
npm run dev
```

The GraphQL endpoint will be available at `http://localhost:4000/graphql`

### Mobile App Setup

1. Start the Expo development server:
```bash
npm run mobile:start
```

Or from the mobile directory:
```bash
cd mobile
npm start
```

### Available Scripts

From the root directory:
- `npm run backend:dev` - Start backend in development mode
- `npm run backend:build` - Build backend TypeScript
- `npm run backend:start` - Start backend in production mode
- `npm run mobile:start` - Start mobile app
- `npm run mobile:android` - Start mobile app on Android
- `npm run mobile:ios` - Start mobile app on iOS
- `npm install:all` - Install dependencies for all workspaces

## Development

This project is being built commit by commit. Each commit adds a specific feature or component.
