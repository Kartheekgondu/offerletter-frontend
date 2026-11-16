# Offer Letter frontend

## Local
`npm ci` -> start backend on 9091 -> `npm run dev` (Vite proxies /backend to localhost:9091).

## Vercel
- Root Directory: the folder containing package.json; Framework Vite; build `npm run build`; output `dist`
- Option A: put your Render URL in vercel.json (replace YOUR-RENDER-SERVICE) and leave VITE_API_BASE_URL unset.
- Option B (best for PDF uploads): set VITE_API_BASE_URL=https://offerletter-backend-yh42.onrender.com in Vercel and redeploy.
- Render env APP_ALLOWED_ORIGINS must equal your Vercel URL exactly.
