# Offer Letter Frontend – PDF Upload and History Fix

## What changed
- Reduced browser PDF rendering from 3x / JPEG 0.95 to 1.65x / JPEG 0.78 to substantially reduce PDF upload size while retaining readable text.
- Releases each rendered page canvas after adding it to the PDF to reduce browser memory pressure.
- Shows a specific HTTP 413 explanation instead of an unhelpful generic save failure.
- Keeps the previous-offer search workflow: search by candidate name, recipient email, job title, department, work location, or saved record ID; open a result to restore its saved form details; use its PDF link to open the saved file.

## Environment
Set `VITE_API_BASE` to the deployed Spring Boot API base URL. If the API uses an API key, set `VITE_API_KEY` to the matching key at build time.

## Build
```bash
npm ci
npm run build
```

## Important
A successful PDF generation in the browser is not the same as a successful server save. The UI reports saved only after the backend confirms the database record and PDF path.
