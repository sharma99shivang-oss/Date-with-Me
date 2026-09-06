# Date With Me, Princess

A production-oriented MERN invitation experience: a playful, cinematic, multi-step date invitation with a protected response dashboard.

## Stack

- **Frontend:** React 19, Vite, Framer Motion, Axios, responsive CSS
- **Backend:** Express, Mongoose, JWT admin auth, Helmet, CORS
- **Persistence:** MongoDB (local or Atlas)

## Run locally

```bash
npm install
copy backend\.env.example backend\.env
npm run dev
```

The invitation runs at `http://localhost:5173`. The API defaults to `http://localhost:5000`.

Set `VITE_API_URL` in `frontend/.env` when the API is deployed separately. To create the first admin account:

```bash
npm run seed
```

The seed command uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend/.env`.

## API

- `GET /api/health` — liveness and database status
- `POST /api/responses` — public invitation response
- `POST /api/admin/login` — JWT login
- `GET /api/admin/analytics` — protected summary cards
- `GET /api/admin/responses` — protected, searchable response list
- `GET /api/admin/responses/:id` — protected response detail
- `DELETE /api/admin/responses/:id` — protected delete
- `GET /api/admin/export?format=csv|json` — protected export-friendly data

## Deployment notes

### Vercel

Set the frontend root directory to `frontend`, build command to `npm run build`, and output directory to `dist`. Add `VITE_API_URL` pointing at the Render API.

### Render

Create a Web Service from this repository with root directory `backend`, build command `npm install`, and start command `npm start`. Add `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.

MongoDB is required for saving invitation responses and admin analytics. The app still exposes a useful health response while Mongo is disconnected so deployment diagnostics are readable. Optional imagery is represented by tasteful CSS gradients and emoji, so no image hosting is required.
