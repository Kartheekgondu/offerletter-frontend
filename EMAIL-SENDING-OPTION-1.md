# Email Offer Letter — Option 1 (No email API / SMTP credentials)

The Email Offer Letter button now:
1. Validates the recipient address.
2. Generates and downloads the current offer-letter PDF.
3. Opens the user's configured email application using a `mailto:` link.
4. Prefills the recipient, subject, and message.
5. Asks the user to attach the downloaded PDF and press Send.

No `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, SMTP username, or SMTP password is needed for this frontend flow.

Important browser limitation: web pages cannot silently attach a locally generated PDF to a `mailto:` draft. The user must attach the downloaded PDF manually. The email is not sent automatically until the user presses Send in their email application.

The backend remains in use for saving offer-letter records and history. The frontend no longer calls `/api/send-offer` for email sending.
