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
│   │   ├── context/      # AuthContext (JWT session)
│   │   ├── pages/
│   │   ├── api.js        # fetch wrapper for the Express API
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
│   │   ├── routes/      # health, auth, companies, experiences, students, ai
│   │   ├── middleware/  # JWT auth guard
│   │   ├── services/    # gemini (Google Gen AI SDK wrapper + validation)
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
- Responsive placement dashboard
- `.env.example` and `.gitignore`; no keys or credentials in source code
- **Authentication**: email/password signup & login (`POST /api/auth/signup`, `POST /api/auth/login`) with JWT session tokens
- **AI Preparation Plan**: `POST /api/ai/preparation-plan` — generates a personalized, structured prep plan using Google Gemini (backend-only; the API key never reaches the browser)

---

## AI Preparation Plan feature

### How it works

1. A signed-in student selects a target company and enters how many days they have to prepare.
2. The frontend sends `POST /api/ai/preparation-plan` with the company ID and available days (the auth token is sent automatically).
3. The backend fetches the **student's real profile** (skills, CGPA, projects, certifications, coding profiles) and the **company's real requirements** (roles, eligibility, hiring process) from MongoDB.
4. The backend builds a prompt from that real data and calls **Google Gemini** (`gemini-1.5-flash`) with a fixed server-side system instruction and a JSON response schema. The student cannot choose or override the system instruction.
5. The AI's JSON response is **validated** against a strict schema (summary, durationDays, priorityTopics with reasons, dailyTasks with topics/practice, resources with reasons). If it fails validation, a `502` is returned — no partial or fake plan is sent to the frontend.
6. The validated plan is returned to the frontend and rendered with daily tasks, priority topics, and resources.

### Endpoint reference

```
POST /api/ai/preparation-plan
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "companyId": "<mongodb ObjectId string>",
  "availableDays": 7        // integer 1–60
}
```

**Responses**

| Status | Meaning |
| ------ | ------- |
| 200 | Plan generated and validated successfully. Body: `{ plan: { summary, durationDays, priorityTopics[], dailyTasks[], resources[] } }` |
| 400 | Missing/invalid `companyId` or `availableDays`, or the student's profile is incomplete (missing skills or graduation year). |
| 401 | No auth token or the token is invalid/expired. |
| 404 | The student or company was not found in the database. |
| 429 | Gemini rate limit reached — retry shortly. |
| 502 | Gemini returned invalid/unparseable output. |
| 503 | `GEMINI_API_KEY` is not configured on the server. |

### Security notes

- The `GEMINI_API_KEY` is read from server-side environment variables only — it is never exposed to the browser or sent in any API response.
- The system instruction is hardcoded on the server; the client cannot supply or alter it.
- The prompt is built entirely from database records (the student's real profile + the selected company's real data). No client-supplied free-text prompt is passed to Gemini.
- The AI response is validated before it reaches the frontend; if validation fails the user sees an error, never a fabricated plan.

### Setup for the AI feature

1. Get a free Gemini API key at https://aistudio.google.com/app/apikey.
2. Add it to `server/.env` (or the project-root `.env`):
   ```
   GEMINI_API_KEY=your_real_key_here
   ```
3. Set `JWT_SECRET` to a long random string in the same `.env` file:
   ```
   JWT_SECRET=replace-with-a-long-random-string
   ```
4. Restart the backend. The health check at `GET /api/health` will still report `ok` regardless of whether the Gemini key is set.
5. Sign up at `/signup`, complete your profile (add at least your skills and graduation year), then visit **AI Prep Plan** to generate a plan.

### Testing the endpoint

With the backend running and a valid JWT token:

```bash
# Sign up and grab the token from the response
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

# (Add skills + graduationYear to the student record via your DB or a profile edit.)

# Generate a plan
curl -s -X POST http://localhost:5000/api/ai/preparation-plan \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"companyId":"<companyObjectId>","availableDays":7}'
```

Without a `GEMINI_API_KEY`, the same call returns `503` with `{"error":"Gemini API key is not configured on the server."}` — confirming the error path works without a real key.

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
