# E-Commerce Application

A full-stack e-commerce application built with React.js frontend and Node.js backend.

## Features

- User authentication and authorization
- Admin panel for managing products and orders
- Shopping cart functionality
- Payment processing with Stripe
- Product reviews and ratings
- Responsive design

## Tech Stack

**Frontend:**
- React.js
- React Router
- Axios
- Stripe.js

**Backend:**
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Stripe Payment Processing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Stripe account

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd ecomm
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
- Copy `.env.example` to `.env` in the root directory
- Copy `server/.env.example` to `server/.env`
- Fill in your actual values

4. Start the development servers

Frontend:
```bash
npm start
```

Backend:
```bash
npm run server
```

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Railway/Render)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy the server folder

## Environment Variables

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### Backend (server/.env)
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `EMAIL_USER` - Email for notifications
- `EMAIL_PASS` - Email password

## License

This project is licensed under the MIT License.