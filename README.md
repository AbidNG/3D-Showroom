# 3D Showroom

An interactive Three.js showroom with a server-backed dealership dashboard.

## Requirements

- Node.js 22.13 or newer (the API uses Node's built-in SQLite module)
- npm

## Run locally

Set an admin password before starting the app. Use a unique password of at least 14 characters; the repository does not contain a default credential.
Generate a private TOTP secret, add it to an authenticator app, and save it as `ADMIN_TOTP_SECRET` in your local environment. The generator prints both the secret and an `otpauth://` URI; keep both private.

```sh
npm install
node scripts/generate-totp-secret.mjs
ADMIN_PASSWORD='use-a-long-unique-local-password' ADMIN_TOTP_SECRET='paste-your-private-Base32-secret' npm run dev
```

The public showroom and admin dashboard run on separate local origins:

- Public showroom: `http://localhost:5173`
- Admin dashboard: `http://127.0.0.1:5174/admin.html`
- Private API: `http://127.0.0.1:4175` (access it through either app's `/api` proxy)

The public dev server does not serve the admin page, and the admin dev server redirects its root to the dashboard. The two browser origins keep their session cookies separate while sharing vehicle and inquiry data through the API. Fleet and inquiry records are stored in `data/showroom.sqlite`.

## Production deployment

Build the frontend, then run the API and static file server behind an HTTPS reverse proxy:

```sh
npm install
npm run build
NODE_ENV=production ADMIN_PASSWORD='use-a-long-unique-production-password' ADMIN_TOTP_SECRET='paste-your-private-Base32-secret' DATA_ENCRYPTION_KEY='paste-the-stable-64-character-key-from-your-secret-manager' PUBLIC_ORIGIN='https://showroom.example.com' npm start
```

Production also requires a stable, private `DATA_ENCRYPTION_KEY` containing 32 random bytes encoded as 64 hexadecimal characters. Generate it once with `openssl rand -hex 32`, store it in the deployment secret manager, and keep it with the database backup process. Losing this key makes inquiry contact details unreadable. Do not use the example value above. The production server listens on port `4175` by default; point the HTTPS reverse proxy to that port.

The reverse proxy must forward requests to the Node process and terminate HTTPS. The application refuses production startup without an exact HTTPS `PUBLIC_ORIGIN`. Keep `data/` on a persistent private volume and back it up. Configure host-level firewalling, monitoring, backups, and a trusted TLS proxy before exposing the service to the internet. This baseline uses one Node process with local SQLite and in-memory sessions, so run one app instance unless you replace those components with shared services.

## Security and data behavior

- Admin APIs require a server-side session, same-origin checks, and a per-session CSRF token. The session cookie is HTTP-only, same-site, and secure in production.
- Sign-in requires a password checked with Node's scrypt password derivation and a time-based one-time code. The app uses one shared admin identity; per-user accounts and role-based access are not included.
- Authenticator codes are accepted once, with the last accepted time step stored in SQLite. Login and inquiry submission are rate limited per client address; behind a proxy, set `TRUSTED_PROXY_ADDRESS` only when that proxy overwrites `X-Real-IP`.
- Public booking requests are validated on the server and saved as **new inquiries**. The app does not accept or process deposits or payments.
- Admin data is stored in SQLite, not browser storage. Inquiry contact fields are encrypted at rest with AES-256-GCM. The server validates vehicle fields and prevents assigning two cars to one bay.
- Uploaded images in the media preview remain in the current browser tab. No image is uploaded, and no photogrammetry is performed.

This is a secure single-admin baseline, not a substitute for a deployment security review. For multiple staff accounts, use an identity provider with MFA and role management. Payment collection requires a payment provider and its own server-side verification flow.
