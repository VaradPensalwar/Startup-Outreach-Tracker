# Startup Outreach Tracker

A React dashboard for tracking startup outreach. Each Google user gets an isolated company list stored in MongoDB, so their work follows them across browsers and devices.

## What changed

- **Google sign-in:** Firebase Authentication (Spark) is used for Google OAuth.
- **Remote storage:** A Node/Express API verifies Firebase ID tokens and persists data to MongoDB.
- **Per-user privacy:** Every database query is scoped to the verified Firebase user ID; the browser never receives MongoDB credentials.
- **Safe migration:** Existing `startup-tracker` Local Storage data is imported once after the user’s first sign-in, then removed. New changes are saved remotely only.

Firebase’s Spark plan includes social sign-in at no cost, and MongoDB Atlas offers a free M0 cluster suitable for a small development or proof-of-concept deployment. Review each provider’s current quotas before using this in a high-traffic production application.

## Architecture

```text
React + Firebase Google sign-in
          | Firebase ID token
          v
Express API + Firebase Admin verification
          | ownerId scoped queries
          v
MongoDB Atlas (companies collection)
```

## Setup

### 1. Create Firebase authentication

1. Create a Firebase project and register a **Web app**.
2. In **Authentication → Sign-in method**, enable **Google**.
3. In **Project settings → Service accounts**, generate a new private key for the server.
4. Add your local and deployed domains in Firebase Authentication’s **Authorized domains** list.

### 2. Create MongoDB Atlas storage

1. Create an Atlas **M0 Free** cluster.
2. Create a database user and permit the IP address/network where the API will run.
3. Copy the Node.js connection string from **Connect → Drivers**.

### 3. Configure the project

```bash
npm install
cp .env.example .env
```

Fill all Firebase web values, `MONGODB_URI`, and `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env`. The service-account JSON is server-only: do not prefix it with `VITE_`, add it to a repository, or use it in the browser.

### 4. Run locally

```bash
npm run dev
```

This starts the Vite client at `http://localhost:8080` and the API at `http://localhost:3001`. Vite proxies `/api` calls to the API automatically.

## Deployment

Deploy the Vite client and the `server/index.js` API as a single Node-capable service or as two services. When they are separate:

- Set `VITE_API_URL` to the API’s public origin when building the client.
- Set `CLIENT_ORIGIN` to the client’s deployed origin (comma-separate multiple allowed origins).
- Allow the API host’s network/IP in MongoDB Atlas.
- Add the client domain to Firebase Authentication’s authorized domains.

Build the client with `npm run build`; run the API with `npm start`.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the client and API together |
| `npm run dev:client` | Start Vite only |
| `npm run dev:server` | Start the Express API only |
| `npm run build` | Create a production client build |
| `npm run lint` | Lint the project |
| `npm test` | Run tests |

## Existing features

- Outreach status and priority controls
- Search and filters
- Progress and summary statistics
- Mark filtered companies as contacted
- CSV export
- Responsive and printable pages
