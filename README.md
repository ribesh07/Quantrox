# Quantrox - Modern Gaming Top-up & Exchange Platform

Quantrox is a high-performance, production-ready fintech application built with the latest web technologies. It provides a seamless experience for users to exchange digital assets and purchase gaming credits for popular platforms.

## 🚀 Features

### User Features
- **Modern Dashboard**: A clean, dark-themed interface inspired by professional trading platforms.
- **Gaming Store**: Stake-style unique poster cards for trending games (Juwa, Firekirin, etc.).
- **Instant Exchange**: Convert Cash App USD to USDT with real-time rate calculation.
- **Secure Payments**: Integrated screenshot proof submission for manual admin verification.
- **Order Tracking**: Comprehensive history of all gaming and exchange transactions.
- **Mobile Responsive**: Fully optimized for a premium experience on any device.

### Admin Features
- **Management Dashboard**: Overview of all platform activities and orders.
- **Game Management**: Create, update, and manage games, including poster URLs and exchange rates.
- **Order Review**: Approve or reject user transactions with custom notes.
- **QR Code Management**: Manage payment QR codes dynamically.
- **User Control**: Role-based access control (User, Staff Admin, Super Admin).

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI / Radix UI
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: TanStack Query (React Query)
- **Icons**: Lucide React

## 📦 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sauravjha491/Quantrox.git
   cd Quantrox
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/quantrox"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Initialize the database:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

## 🔐 Security
- Bcrypt encryption for user passwords.
- Middleware protection for admin and dashboard routes.
- Manual verification flow for high-security transactions.

## 📄 License
This project is proprietary. All rights reserved.
