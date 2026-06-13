# 🧠 Gyaan Chakra – Backend API Server

Gyaan Chakra is a high-performance, secure, and production-ready backend API built with **Node.js**, **Express**, **TypeScript**, and **MongoDB**. It powers the Gyaan Chakra mobile app, delivering real-time quizzes, wallet transactions, referral programs, and leaderboards.

---

## 🚀 Key Features

* 🔐 **Robust Authentication**: JWT authorization, refresh token rotation, and OTP verification flow.
* 🏆 **Quiz Engines**: Engines for Daily Quizzes and Mega Challenges with real-time score calculation and prize shortlisting.
* 💳 **Wallet & Transaction System**: Safe ledger for earnings, deposits, withdrawals, and referrals.
* 📈 **Leaderboards & History**: Track daily and mega contest winners and active participation logs.
* 🔔 **Multi-Channel Notifications**: Real-time notifications and system audits.
* 📖 **OpenAPI Documentation**: Interactive Swagger API exploration out-of-the-box.
* ⚙️ **Cron-Scheduled Tasks**: Automatic contest settlement, user state synchronization, and database maintenance.

---

## 🛠️ Prerequisites

Make sure you have the following installed on your machine:
* **Node.js** (v18.0.0 or higher recommended)
* **MongoDB** (Local instance running on `27017` or a remote MongoDB Atlas connection URI)
* **npm** or **yarn**
* *(Optional)* **Redis** (The server runs perfectly with memory fallback if Redis is disabled or unavailable)

---

## 📦 Getting Started

### 1. Install Dependencies
Navigate to the `backend` folder and install all NPM packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create a file named `.env.development` (for development) or `.env.production` (for production) in the root of the `backend` folder.

Copy and modify the template below:

```ini
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/gyaanchakra_dev

# JWT Configuration
JWT_SECRET=gyaanchakra_jwt_secret_dev_change_in_prod
JWT_REFRESH_SECRET=gyaanchakra_refresh_secret_dev_change_in_prod
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Redis Configuration (Optional - will automatically fallback to in-memory if disabled)
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=false

# Cloudinary Storage Configuration (Optional - for profile and media uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration (Nodemailer - for OTP / notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Gyaan Chakra <noreply@gyaanchakra.com>

# Firebase Configuration (Optional - for FCM Push Notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Rate Limiting & Safety
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# App Settings
OTP_EXPIRY_MINUTES=10
REFERRAL_REWARD_AMOUNT=50

# CORS Allowed Origins (comma separated list)
ALLOWED_ORIGINS=http://localhost:3000,http://10.0.2.2:5000
```

---

## 🎮 Running the Server

### Development Mode (with hot-reloading)
Runs the TypeScript server using `ts-node-dev` which watches for file changes:
```bash
npm run dev
```

### Production Build & Launch
Compile the TypeScript code to native optimized ES6 JavaScript and start the server:
```bash
# Compile TypeScript to dist/
npm run build

# Start production server
npm start
```

Once running successfully, you'll see this banner:
```text
╔══════════════════════════════════════════╗
║     🧠 Gyaan Chakra API Server           ║
║     Port: 5000                           ║
║     Env:  development                    ║
║     Docs: http://localhost:5000/api-docs ║
╚══════════════════════════════════════════╝
```

---

## 📖 API Documentation (Swagger Docs)

With the server running locally, you can view the complete interactive API specifications and test endpoints directly via your web browser:

🌐 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

---

## 📂 Project Architecture

The backend follows an **Enterprise Clean Architecture** (Controller-Service-Repository pattern) to keep codebase decoupled and fully testable:

```text
backend/
├── dist/                  # Compiled JavaScript output (production)
├── src/
│   ├── config/            # Server, Database, Swagger, & environment configs
│   ├── controllers/       # HTTP Request handlers & Zod body validators
│   ├── cron/              # Node-Cron jobs for background automation
│   ├── middlewares/       # Auth, Rate limiting, Upload, & Error middlewares
│   ├── models/            # Mongoose schemas & TypeScript type interfaces
│   ├── repositories/      # Database abstraction layer (queries/mutations)
│   ├── routes/            # Express Router endpoints (versioned under /api/v1)
│   ├── services/          # Core business logic handlers
│   ├── utils/             # Winston Logger, ApiError wrapper, & helpers
│   ├── app.ts             # App middleware configuration & routes mounting
│   └── server.ts          # Server entry point & DB connection bootstrap
├── package.json
└── tsconfig.json
```

---

## 🔍 Troubleshooting & FAQs

### 1. `Cannot find module 'helmet' ... ts(2307)` (VS Code Red Underlines)
If VS Code shows red squiggly lines under imports like `helmet` or `cors` inside `app.ts` even though `npm install` succeeded:
* Open the command palette (**`Ctrl + Shift + P`** or **`Cmd + Shift + P`** on Mac).
* Select **`TypeScript: Restart TS Server`**.
* *Alternative:* Open the `backend` folder directly as your workspace root in VS Code instead of the parent root directory.

### 2. Database Connection Issues
If the console prints `Mongoose connection error`:
* Check if your local MongoDB service is running (on Windows, run `services.msc` and verify "MongoDB Server" status is Running).
* Verify that your `MONGO_URI` in `.env.development` is correct and matches your local port or MongoDB Atlas cluster.
