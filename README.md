## 🌐 Overview

AI Startup Tracker is designed to simplify startup outreach by providing a clean interface to manage company records in one place. Users can mark companies as contacted, update outreach status, assign priorities, search companies, and monitor overall outreach progress.

The application automatically saves all changes in the browser using Local Storage, allowing data to persist across sessions without requiring a backend.

---

<video src="https://github.com/user-attachments/assets/facba3d1-23cb-427a-9b1d-be56d3d0c7d3" autoplay loop muted playsinline width="100%"></video>

---

## ✨ Features

- Track outreach status for AI startups
- Mark companies as contacted
- Update company status
  - Not Contacted
  - Contacted
  - Replied
  - Meeting Scheduled
- Assign High, Medium, or Low priority
- Search companies by name
- Filter companies by status and priority
- Outreach statistics dashboard
- Progress bar showing overall outreach completion
- Export company data as CSV
- Automatically stores data using Local Storage
- Responsive interface for desktop and mobile devices

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| React | User Interface |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| shadcn/ui | UI Components |
| React Router | Routing |
| React Query | Application Setup |
| Local Storage | Data Persistence |

---

## 📂 Project Structure

```
src/
│
├── components/
│   ├── CompanyRow.tsx
│   ├── StatsBar.tsx
│   └── ui/
│
├── data/
│   └── companies.ts
│
├── pages/
│   ├── Index.tsx
│   └── NotFound.tsx
│
├── App.tsx
└── main.tsx
```

---

## 🚀 Getting Started

Clone the repository

```bash
git clone https://github.com/your-username/AI-Startup-Tracker.git
```

Move into the project directory

```bash
cd AI-Startup-Tracker
```

Install dependencies

```bash
npm install
```

Start the development server

```bash
npm run dev
```

Open your browser and visit

```
http://localhost:5173
```

---

## 📊 Application Highlights

- Displays startup outreach statistics
- Calculates outreach progress automatically
- Records the last contact date when a company is updated
- Supports CSV export for offline tracking
- Persists changes even after refreshing the page

---

## 📱 Responsive Design

The application is optimized for:

- 💻 Desktop
- 📱 Mobile
- 📟 Tablet

---

## 👨‍💻 Author

**Varad Pensalwar**

GitHub: https://github.com/varadpensalwar

---

⭐ If you found this project useful, consider giving it a star.
