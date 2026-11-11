# Previous Offer Letter History

The offer-letter history now follows the appraisal application's search-and-select interaction.

- Type an employee name and press **Search** to show matching saved letters in a dropdown.
- Press **All** to show every saved offer letter, newest first.
- Select a result to load the saved letter back into the form and preview.
- Use the **PDF** link beside a result to open its stored PDF, when one exists.

## Important database note

The backend reads from the existing `offer_sends` table in the configured MySQL database. Keep the same database/schema and data used by the currently deployed offer-letter app. Pointing this version at a new or empty database will show no previous records.

## Frontend configuration

Set `VITE_API_BASE` to the deployed Spring Boot API origin, for example:

`VITE_API_BASE=https://your-backend.onrender.com`

## Backend configuration

Set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `APP_ALLOWED_ORIGINS` in the backend environment. Configure `MAIL_USERNAME` and `MAIL_PASSWORD` to enable email delivery.
