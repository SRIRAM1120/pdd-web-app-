# BiasSense AI

A responsive liquid-glass productivity PWA with complete Firebase email/password and Google authentication.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the Firebase web-app values.
3. In Firebase Console, enable **Email/Password** and **Google** under Authentication → Sign-in method.
4. Add `localhost` and the production hostname under Authentication → Settings → Authorized domains.
5. Create a Cloud Firestore database and deploy `firestore.rules` with the Firebase CLI or paste the rules into the Firestore Rules editor.
6. Under Authentication → Templates, customize the verification and password-reset emails. Set the action URL/authorized continue URL to the deployed BiasSense AI origin.
7. Run `npm run dev`.

The Firebase web configuration is safe to expose to the browser; access control is enforced by Firebase Authentication and the included Firestore rules. Do not commit `.env.local`.

## Commands

- `npm run dev` — local development
- `npm run test` — unit tests
- `npm run lint` — static analysis
- `npm run build` — type-check and create the production PWA
- `npm run preview` — preview the production output

## Authentication behavior

- Email/password registration writes only non-sensitive profile information to `users/{uid}` and sends a verification email.
- Password users remain on the verification screen until Firebase confirms their email.
- Google users are treated as verified and receive a profile document on first sign-in.
- Password-reset submission always shows the same success response to avoid revealing registered email addresses.
- Protected routes restore the Firebase session on page reload and redirect signed-out visitors to sign in.

## PWA and deployment

The production build generates a service worker and manifest. PWA installation requires HTTPS in production (localhost is allowed during development). Deploy the contents of `dist/` to any SPA-compatible static host and configure unknown routes to serve `index.html`. The `/install` page provides Chrome desktop and Android instructions.

Before production launch, replace the starter Privacy Policy and Terms of Service with counsel-approved text, configure a dedicated support contact, and use full PNG app-icon sets if required by your target app stores.
