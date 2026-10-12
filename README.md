# ProofOfWork — Practical Skill Verification Platform

Role-based platform where **students** complete practical challenges, **evaluators** grade them with rubrics, and **admins** manage users, challenges and assignments. Approved results build a student portfolio and leaderboard.

**Stack:** React 19 + Vite + Tailwind (frontend) · Express + JWT cookies + bcrypt (backend) · MongoDB via Mongoose, or a built-in JSON file store when no `MONGODB_URI` is set.

## Run locally

```bash
npm install
cp .env.example .env      # edit JWT_SECRET etc.
npm run dev               # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Other scripts: `npm test` (end-to-end API tests), `npm run seed`, `npm run lint`.

## Demo accounts (created on first start)

| Role      | Email                      | Password            |
|-----------|----------------------------|---------------------|
| Admin     | admin@proofofwork.edu      | AdminPassword123!   |
| Evaluator | evaluator@proofofwork.edu  | EvalPassword123!    |
| Student   | student@proofofwork.edu    | StudentPassword123!|

Change all of these and `JWT_SECRET` before deploying.

## Structure

- `server.ts` – Express entry (API + Vite dev middleware / static prod)
- `server/routes/` – `auth`, `admin`, `evaluator`, `student`
- `server/models/`, `server/db.ts` – data layer (Mongo or file store)
- `src/pages/{admin,evaluator,student}` – role dashboards
