# Vercel frontend deployment

1. Import the frontend folder (the folder containing `package.json`) into Vercel.
2. Set the Vercel **Root Directory** to the frontend project folder.
3. In Vercel → Project → Settings → Environment Variables, add:
   - `VITE_API_BASE` = `https://YOUR-RENDER-SERVICE.onrender.com` (no `/api` suffix)
   - `VITE_API_KEY` = leave empty unless `APP_API_KEY` is intentionally enabled on Render.
4. Apply the variable to Production (and Preview if needed), save, then redeploy. Vite variables are baked in at build time.
5. Test `https://YOUR-RENDER-SERVICE.onrender.com/api/health` and then test Generate, Save, Search, and Email from the Vercel site.

Do not set `VITE_API_BASE` to localhost in Vercel. A browser's localhost is the visitor's own computer.
