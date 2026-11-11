# Offer Letter frontend

## Local development
1. Open a terminal in this `frontend` folder (the folder containing `package.json`).
2. Run `npm ci`.
3. Run `npm run dev`.
4. Start the Spring Boot backend locally on port 9091.
5. Open the Vite URL, normally http://localhost:5173.

Vite proxies `/backend/*` to `http://localhost:9091/*`.
The app API client always uses `/backend`, so the same frontend code works locally and on Vercel.

## Vercel
- Root Directory: `frontend`
- Framework: Vite
- Build: `npm run build`
- Output: `dist`
- The `vercel.json` rewrite sends `/backend/*` to the Render backend.
- Replace `YOUR-RENDER-SERVICE` in `vercel.json` with your real Render service hostname before deployment.
- Do not configure `VITE_API_BASE` or `VITE_API_BASE_URL`; the app uses the same-origin `/backend` proxy.
