# Offer Letter frontend

## Local development
1. Open a terminal in this `frontend` folder (the folder containing `package.json`).
2. Run `npm ci`.
3. Start the Offer Letter Spring Boot backend on port `9091`.
4. Run `npm run dev`.
5. Open the Vite URL, normally http://localhost:5173.

Like the Appraisal frontend, API requests use `/backend`. Vite proxies that prefix to
`http://localhost:9091` locally.

## Vercel (same proxy structure as Appraisal)
- Root Directory: `frontend`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- `vercel.json` rewrites `/backend/:path*` to the Offer Letter Render backend, then applies SPA fallback.
- Replace `YOUR-OFFERLETTER-BACKEND` in `vercel.json` with the actual Offer Letter Render service hostname.
- Leave `VITE_API_BASE_URL` unset to use the `/backend` proxy, exactly like Appraisal.
