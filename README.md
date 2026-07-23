# 🚀 Startup Outreach Tracker

> A full-stack startup outreach CRM built with **React**, **Firebase Authentication**, **Express.js**, and **MongoDB Atlas**.

Securely manage startup outreach, track application progress, and access your data from any device with Google Sign-In.

---

<p>
  <a href="https://startup-outreach-tracker.vercel.app/"><strong>🔗 Live Link</strong></a>
</p>

---

## 📸 Preview

### Dashboard

![Dashboard](./screenshots/dashboard.png)

### Company Management

![Companies](./screenshots/company-list.png)

---

## ✨ Features

- 🔐 Google Authentication (Firebase)
- ☁️ MongoDB Atlas cloud database
- 👤 Private workspace for every user
- 📊 Dashboard analytics
- 🏢 Company management (CRUD)
- 🎯 Status & priority tracking
- 🔍 Search and filtering
- 📁 CSV export
- 📱 Responsive design
- 🖨️ Print-friendly pages

---

## 🛠 Tech Stack

| Frontend | Backend | Database | Authentication |
|----------|----------|----------|----------------|
| React 18 | Express.js | MongoDB Atlas | Firebase Auth |
| TypeScript | Node.js | Mongoose | Google OAuth |
| Tailwind CSS | REST API | — | Firebase Admin |

---

## 🏗 Architecture

```text
React + Firebase Authentication
            │
      Firebase ID Token
            │
            ▼
      Express.js API
            │
 Firebase Admin Verification
            │
     ownerId Scoped Queries
            │
            ▼
      MongoDB Atlas
```

---

## 🔒 Security

- Firebase Authentication for secure login
- Backend verifies Firebase ID Tokens
- MongoDB credentials never reach the browser
- Every query is scoped to the authenticated user
- Service Account credentials remain server-side

---

## ⚡ Local Data Migration

Existing browser data is automatically migrated after the first Google login.

- Imports Local Storage data once
- Saves it into MongoDB
- Removes old Local Storage
- Future changes sync only with the cloud

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/VaradPensalwar/startup-outreach-tracker.git

cd startup-outreach-tracker
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment Variables

```bash
cp .env.example .env
```

Add your credentials:

```env
# Firebase Web SDK
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Backend
MONGODB_URI=
CLIENT_ORIGIN=

# Server Only
FIREBASE_SERVICE_ACCOUNT_JSON=

# Optional
VITE_API_URL=
```

> **Note:** Never expose your Firebase Service Account in the frontend or commit it to Git.

---

## Firebase Setup

1. Create a Firebase project.
2. Register a Web App.
3. Enable **Google Authentication**.
4. Download the Service Account JSON.
5. Add localhost and deployed domains to **Authorized Domains**.

---

## MongoDB Atlas Setup

1. Create an **M0 Free Cluster**.
2. Create a database user.
3. Allow your server IP.
4. Copy the Node.js connection string.
5. Add it to `MONGODB_URI`.

---

## Run Locally

```bash
npm run dev
```

Frontend:

```text
http://localhost:8080
```

Backend:

```text
http://localhost:3001
```

---

## 📦 Available Scripts

| Command | Description |
|----------|-------------|
| `npm run dev` | Start frontend & backend |
| `npm run dev:client` | Start Vite |
| `npm run dev:server` | Start Express API |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |

---

## 🚀 Deployment

When deploying frontend and backend separately:

### Frontend

- Set `VITE_API_URL`

### Backend

- Set `CLIENT_ORIGIN`
- Allow the backend IP in MongoDB Atlas
- Add the frontend domain to Firebase Authorized Domains

Build the client:

```bash
npm run build
```

Run the API:

```bash
npm start
```

---

## 📂 Project Structure

```text
.
├── public/
├── server/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   └── lib/
├── .env.example
├── package.json
└── README.md
```

---

## 📄 License

Licensed under the **MIT License**.

---

## 👨‍💻 Author

**Varad Pensalwar**

- GitHub: https://github.com/VaradPensalwar
- LinkedIn: https://linkedin.com/in/VaradPensalwar

---

⭐ **If you found this project useful, consider giving it a star!**
