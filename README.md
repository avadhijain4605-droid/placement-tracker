# AI-Powered Placement Tracker & Career Intelligence Platform

A MERN-stack platform for placement preparation, company insights, and AI-powered career guidance.
Built with **React + Vite + Tailwind CSS** (frontend) and **Node.js + Express + MongoDB + Mongoose** (backend), with **Google Gemini** powering the AI features (called only from the backend so keys never reach the browser).

---

## Tech Stack (as required)

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| Frontend | React + Vite + JavaScript + Tailwind CSS    |
| Backend  | Node.js + Express + JavaScript              |
| Database | MongoDB + Mongoose                          |
| AI       | Google Gemini API (backend-only calls)      |

No Firebase, Supabase, PostgreSQL, or other backend/database is used.

---

## Project Structure

```
.
├── client/          # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
├── server/          # Express + Mongoose backend
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## Prerequisites

- Node.js v18 or newer
- A MongoDB instance (local `mongodb://127.0.0.1:27017` or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)
- A Google Gemini API key (get one free at https://aistudio.google.com/app/apikey) — only needed for the AI features in later steps.

---

## Setup & Run (local development)

### 1. Clone and install dependencies

From the project root, install both the client and server packages:

```bash
# Backend
cd server
npm install

# Frontend (open a second terminal)
cd client
npm install
```

### 2. Configure environment variables

Copy the example files and fill in your values:

```bash
# Server
cp server/.env.example server/.env
# then edit server/.env and set MONGODB_URI and GEMINI_API_KEY

# Client
cp client/.env.example client/.env
# then edit client/.env and set VITE_API_URL
```

### 3. Start the backend

```bash
cd server
npm run dev
```

The API runs on http://localhost:5000 by default.
Verify it with: http://localhost:5000/api/health — you should see `{ "status": "ok", ... }`.

### 4. Start the frontend

```bash
cd client
npm run dev
```

The app runs on http://localhost:5173.

---

## Current Step (Step 1)

This first step sets up the foundation:

- Separate `client/` and `server/` folders
- React + Vite + Tailwind frontend up and running
- Express + Mongoose backend with MongoDB connection
- Health-check endpoint: `GET /api/health`
- Responsive placement dashboard layout
- Placeholder pages: Login, Signup, Student Profile, Companies, Company Details, AI Preparation Plan
- `.env.example` and `.gitignore` included
- No API keys or database credentials in source code

Future steps will add authentication, the companies database, AI preparation plans, and analytics.

---

## Notes

- **Never commit `.env` files** — they are gitignored. Use the `.env.example` files as templates.
- The frontend only ever talks to your own Express backend; the Gemini API key lives only on the server.
- MongoDB connection is lazy and will retry automatically if the database is briefly unavailable.
