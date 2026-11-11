# Start the Offer Letter frontend

## Critical project structure
This project must contain `index.html` in the **frontend root**, beside `package.json` and `vite.config.js`.
It is included in this corrected ZIP. Without it, Vite can respond with HTTP 404 at `http://localhost:5173/`.

## Run locally (Windows PowerShell)
1. Extract the ZIP.
2. Open a terminal in the extracted `frontend` folder (the folder containing `package.json` and `index.html`).
3. Run:

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

4. Open the exact URL printed by Vite, normally `http://localhost:5173/`.

Do not run `npm run dev` from the parent folder or the backend folder.

## Vercel
In Vercel → Project → Settings → Build and Development Settings:
- Root Directory: `frontend`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

The included `vercel.json` provides SPA fallback routing. Set `VITE_API_BASE` to the deployed backend URL in Vercel Environment Variables, then redeploy.

## API
Set `VITE_API_BASE` in `frontend/.env` for local development. See `.env.example`.
