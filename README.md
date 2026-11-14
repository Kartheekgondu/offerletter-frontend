# Offer Letter Frontend

React + Vite frontend for the Offer Letter Generator.

## CORS / Failed to fetch fix

The frontend now sends API requests to the same-origin path `/backend` instead of calling the Render domain directly from the browser.

- Production: `vercel.json` rewrites `/backend/*` to `https://offerletter-backend-ihy7.onrender.com/*`.
- Local development: `vite.config.js` proxies `/backend/*` to `http://localhost:9091/*`.

This removes direct cross-origin browser requests and avoids CORS preflight issues for this frontend. The backend must still be online and reachable by Vercel's rewrite. A frontend proxy cannot fix a Render backend that fails during startup or cannot connect to MySQL.

## Deploy on Vercel

1. Extract this project.
2. Push the frontend project to its GitHub repository.
3. In Vercel, set the project Root Directory to the folder containing `package.json`.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Redeploy after the new `vercel.json` and `src/lib/api.js` are committed.

Do not set `VITE_API_BASE_URL` to the Render URL. The frontend intentionally uses `/backend`.

## Run locally on Windows

```cmd
npm install
npm run dev
```

Vite runs the frontend and proxies `/backend` requests to `http://localhost:9091`. Start the Spring Boot backend on port 9091 first.

## Optional API key

If the backend requires an API key, set `VITE_API_KEY` in Vercel and the matching `APP_API_KEY` on Render. Leave both unset if API-key protection is disabled.

## Notes

- If the frontend still shows a failed request after deploying, open `https://offerletter-backend-ihy7.onrender.com/api/health` directly. If that endpoint fails, fix the Render backend/database first.
- This ZIP excludes `node_modules`, `.git`, and build output. Run `npm install` after extracting.
