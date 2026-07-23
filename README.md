# 🚀 Startup Outreach Tracker

A modern full-stack web application for managing and tracking startup outreach campaigns.

Built with **React**, **TypeScript**, **Firebase Authentication**, **Express.js**, and **MongoDB Atlas**, the application allows every authenticated Google user to securely manage their own startup database across multiple devices.

---

## ✨ Features

### 🔐 Authentication
- Google Sign-In using Firebase Authentication
- Secure Firebase ID Token verification
- Individual user workspaces
- Protected backend API

### 📊 Company Management
- Add, edit, and delete companies
- Track outreach progress
- Update outreach status
- Assign priorities
- Store notes and contact information

### 🔍 Search & Filtering
- Search companies instantly
- Filter by status
- Filter by priority
- Combined filtering support

### 📈 Dashboard
- Total companies
- Contacted companies
- Pending companies
- Progress statistics
- Summary cards

### ⚡ Productivity
- Bulk mark filtered companies as contacted
- CSV export
- Responsive UI
- Print-friendly pages

### ☁️ Cloud Storage
- MongoDB Atlas database
- Automatic data synchronization
- Cross-device access
- User-specific data isolation

---

# 🏗 Tech Stack

## Frontend

- React 18
- TypeScript
- Vite
- React Router
- React Query
- Tailwind CSS
- shadcn/ui
- Lucide Icons

## Backend

- Node.js
- Express.js
- Firebase Admin SDK
- MongoDB Atlas

## Authentication

- Firebase Authentication
- Google OAuth

## Database

- MongoDB Atlas (M0 Free Tier)

---

# 🔒 Security

This project follows several security best practices.

- Firebase Authentication handles user login.
- Express verifies every Firebase ID Token.
- MongoDB credentials never reach the browser.
- Every database query is automatically scoped to the authenticated user.
- Service Account credentials remain server-side only.

---

# 🗄 Architecture

```text
                 Google Sign-In
                        │
                        ▼
          Firebase Authentication
                        │
                Firebase ID Token
                        │
                        ▼
            Express.js REST API
                        │
      Firebase Admin Token Verification
                        │
                 ownerId filtering
                        │
                        ▼
               MongoDB Atlas Database
```

---

# 🔄 Data Migration

For existing users:

- Local Storage data (`startup-tracker`)
- Imported automatically after first login
- Saved into MongoDB
- Local Storage removed afterward
- Future updates are stored only in MongoDB

---

# 📁 Project Structure

```
Startup-Outreach-Tracker
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── lib/
│   └── main.tsx
│
├── server/
│   ├── index.js
│   └── ...
│
├── public/
│
├── .env.example
├── package.json
└── README.md
```

---

# ⚙️ Installation

## 1. Clone Repository

```bash
git clone <your-repository-url>

cd Startup-Outreach-Tracker
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Copy the example file.

```bash
cp .env.example .env
```

Fill in the required values.

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

> **Important**
>
> Never expose the Firebase Service Account in the frontend.
> Do **not** prefix it with `VITE_`.
> Never commit it to Git.

---

# 🔥 Firebase Setup

1. Create a Firebase Project.
2. Register a Web App.
3. Enable **Google Authentication**.
4. Download the Firebase Service Account JSON.
5. Add your domains to:

```
Authentication
    → Settings
        → Authorized Domains
```

---

# 🍃 MongoDB Atlas Setup

1. Create a free **M0 Cluster**.
2. Create a Database User.
3. Allow your server IP.
4. Copy the MongoDB Node.js connection string.
5. Add it to:

```
MONGODB_URI
```

---

# ▶️ Running the Project

Start both frontend and backend.

```bash
npm run dev
```

Default URLs

Frontend

```
http://localhost:8080
```

Backend

```
http://localhost:3001
```

Vite automatically proxies `/api` requests to the backend.

---

# 📦 Available Scripts

| Command | Description |
|----------|-------------|
| `npm run dev` | Start frontend and backend |
| `npm run dev:client` | Start Vite frontend |
| `npm run dev:server` | Start Express server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest |
| `npm run test:watch` | Watch mode tests |

---

# 🚀 Deployment

The application can be deployed as:

- Single Node application
- Separate frontend and backend services

When deploying separately:

### Frontend

Set

```
VITE_API_URL
```

to your backend URL.

Example

```
https://api.example.com
```

### Backend

Configure

```
CLIENT_ORIGIN
```

Example

```
https://startup-tracker.vercel.app
```

Also:

- Allow backend IP in MongoDB Atlas
- Add frontend domain to Firebase Authorized Domains

---

# 📊 User Workflow

```text
Google Login
      │
      ▼
Verify Firebase Token
      │
      ▼
Load User Companies
      │
      ▼
Manage Outreach
      │
      ▼
Save to MongoDB
```

---

# 🎯 Key Features

✅ Google Authentication

✅ Secure Backend API

✅ MongoDB Cloud Storage

✅ User-specific Database

✅ Startup Management

✅ Status Tracking

✅ Priority Management

✅ Search & Filters

✅ Dashboard Analytics

✅ CSV Export

✅ Responsive Design

✅ Print Support

---

# 🔐 Privacy

Every authenticated user receives an isolated workspace.

Database queries are filtered using the verified Firebase User ID.

Users cannot view or modify another user's companies.

---

# 📌 Future Improvements

- Email reminders
- Team collaboration
- Company tags
- Contact history
- Activity timeline
- Dark mode
- Import from CSV
- Email integration
- Calendar integration
- Analytics charts
- Notifications

---

# 📄 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Author

**Varad Pensalwar**

GitHub: https://github.com/VaradPensalwar

LinkedIn: https://linkedin.com/in/VaradPensalwar

---

## ⭐ Support

If you found this project useful, consider giving it a **Star ⭐** on GitHub.
