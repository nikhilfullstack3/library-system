# Demo Deployment

This repo is ready for a simple demo deployment with:

- backend on Render
- web frontend on Vercel

## 1. Deploy backend on Render

Use the root [render.yaml](/Users/nikse/Desktop/library-system/render.yaml) blueprint or create the service manually.

Service settings:

- root directory: `server`
- build command: `npm install`
- start command: `npm start`

Required environment variables:

- `MONGODB_URI`
- `SESSION_SECRET`
- `QR_SECRET`

Optional:

- `RATE_LIMIT_PER_MINUTE`

After deploy, verify:

- `https://your-backend-domain.onrender.com/health`

## 2. Deploy frontend on Vercel

Import the `client` directory as the Vercel project root.

Build settings:

- framework preset: `Vite`
- build command: `npm run build`
- output directory: `dist`

Required environment variable:

- `VITE_API_URL=https://your-backend-domain.onrender.com/api`

The [client/vercel.json](/Users/nikse/Desktop/library-system/client/vercel.json) file handles SPA routing so nested URLs like `/librarian/registration` still work after refresh.

## 3. Important demo limitation

Uploaded files are stored on the backend filesystem right now. On Render, those uploads are not durable across redeploys or instance replacement.

For a demo, this is acceptable.
For a more stable deployment later, move uploads to S3 or another object store.
