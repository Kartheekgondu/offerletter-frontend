# Offer Letter email delivery

The frontend `Send Mail` button now:
1. Validates the recipient email address.
2. Generates the current offer-letter PDF in memory.
3. Sends the PDF and offer details to the backend `POST /api/send-offer` endpoint.
4. Shows success only when the backend reports successful SMTP delivery, or displays the backend error.

The backend uses Spring Boot `JavaMailSender` and attaches the PDF directly. It does not open `mailto:` and does not require the recipient to manually attach the file.

Configure Gmail SMTP credentials on the backend host only. See the backend project's `EMAIL-SETUP.md`. Render Free blocks outbound SMTP, so this implementation requires a host/plan that permits SMTP or a future HTTPS email-provider integration.
