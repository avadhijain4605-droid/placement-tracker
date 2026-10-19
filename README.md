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
│   │   ├── config/      # db connection
│   │   ├── models/      # Student, Company, PlacementExperience
│   │   ├── routes/      # health, companies, experiences, students
│   │   ├── app.js
│   │   ├── server.js
│   │   └── seed.js       # sample data seeder
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

### 3a. Set up MongoDB Atlas (free tier)

1. Create a free account at https://www.mongodb.com/atlas and build a **free M0** cluster.
2. Under **Database Access**, create a database user (username + password) — save these.
3. Under **Network Access**, click **Add IP Address** → **Allow from anywhere** (`0.0.0.0/0`) for development, or add your current IP.
4. Under **Database → Connect → Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/placement_tracker?retryWrites=true&w=majority
   ```
5. Paste it as `MONGODB_URI` in `server/.env` (replace `<username>`, `<password>`, and the cluster host).

> You can also use a local MongoDB (`mongodb://127.0.0.1:27017/placement_tracker`) if you prefer.

### 3b. Seed sample data

After your `MONGODB_URI` is set, populate five fictional companies and four placement experiences:

```bash
cd server
npm run seed
```

The seed script is **idempotent** — running it twice updates existing records instead of creating duplicates. It matches companies by `name` and experiences by `company + studentName`.

### 3c. Start the backend

```bash
cd server
npm run dev
```

The API runs on http://localhost:5000 by default.
Verify it with: http://localhost:5000/api/health — you should see:
```json
{"status":"ok","service":"placement-tracker-api","database":"connected",...}
```
`"database":"connected"` confirms MongoDB Atlas is reachable. If it shows `"disconnected"`, check `MONGODB_URI`, your Atlas user/password, and the IP allowlist.

### 4. Start the frontend

```bash
cd client
npm run dev
```

The app runs on http://localhost:5173.

---

## What's done so far

- Separate `client/` and `server/` folders
- React + Vite + Tailwind frontend
- Express + Mongoose backend connected to MongoDB Atlas via `MONGODB_URI`
- Health-check endpoint: `GET /api/health` (reports DB connection status)
- Mongoose models: **Student**, **Company**, **PlacementExperience** (with references)
- `passwordHash` is never returned in any API response (schema `select: false` + `.toJSON()` override + route projections)
- Safe seed script: `npm run seed` (idempotent — no duplicate records)
- Read-only API routes: `GET /api/companies`, `GET /api/companies/:id`, `GET /api/experiences`, `GET /api/students`
- If the database is down, the server still starts and DB routes return a safe `503` instead of crashing
- Responsive placement dashboard with placeholder pages
- `.env.example` and `.gitignore`; no keys or credentials in source code

Future steps will add authentication, AI preparation plans, and analytics.

---

## Notes

- **Never commit `.env` files** — they are gitignored. Use the `.env.example` files as templates.
- The frontend only ever talks to your own Express backend; the Gemini API key lives only on the server.
- MongoDB connection is lazy and will retry automatically if the database is briefly unavailable.

## Verifying the sample records exist in MongoDB

After running `npm run seed`, confirm the data three ways:

1. **Via the API** (fastest):
   ```bash
   curl http://localhost:5000/api/companies
   curl http://localhost:5000/api/experiences
   curl http://localhost:5000/api/health   # database should say "connected"
   ```
   `/api/companies` should return `count: 5` and `/api/experiences` should return `count: 4`.

2. **Via MongoDB Atlas UI**: open your cluster → **Browse Collections** → the `placement_tracker` database will have `companies` and `placementexperiences` collections with the seeded documents.

3. **Via the Mongo shell** (Atlas Connect → MongoDB Shell):
   ```js
   use placement_tracker
   db.companies.countDocuments()        // -> 5
   db.companies.find().pretty()
   db.placementexperiences.countDocuments()  // -> 4
   db.placementexperiences.find().pretty()
   ```

The Student collection is intentionally empty after seeding (students are created during signup in a later step).
