# CounselConnect — Zoom-Powered Counseling Scheduler

A full-stack scheduling platform that lets students propose meeting times and counselors confirm them, automatically creating a Zoom meeting with direct-join links for both parties.

---

## 📁 Project Structure

```
Zoom Testing/
├── backend/
│   ├── server.js          ← Express API + Zoom integration
│   ├── package.json
│   ├── .env               ← Your real credentials (create from .env.example)
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── StudentPage.jsx    ← Student dashboard
    │   │   └── CounselorPage.jsx  ← Counselor dashboard
    │   ├── App.jsx                ← Routes + layout
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🔑 Step 1 — Set Up Zoom API Credentials

You need a **Server-to-Server OAuth App** in Zoom Marketplace:

1. Go to [https://marketplace.zoom.us/develop/create](https://marketplace.zoom.us/develop/create)
2. Choose **Server-to-Server OAuth**
3. Name your app (e.g. `CounselConnect`)
4. Under **Scopes**, add:
   - `meeting:write:admin`
   - `meeting:write`
5. Copy your **Account ID**, **Client ID**, **Client Secret**

---

## ⚙️ Step 2 — Configure the Backend `.env`

Navigate to the `backend/` folder and create a `.env` file:

```bash
# Windows PowerShell:
Copy-Item .env.example .env
```

Then open `backend/.env` and fill in your credentials:

```env
ZOOM_ACCOUNT_ID=your_actual_account_id
ZOOM_CLIENT_ID=your_actual_client_id
ZOOM_CLIENT_SECRET=your_actual_client_secret
PORT=5000
```

---

## 🚀 Step 3 — Start the Backend

Open a terminal window and run:

```powershell
cd "Zoom Testing\backend"
npm run dev
```

You should see:
```
✅  Backend running on http://localhost:5000
```

> **Note:** Uses `nodemon` so it auto-restarts on file changes. For production use `npm start`.

---

## 🌐 Step 4 — Start the Frontend

Open a **second terminal window** and run:

```powershell
cd "Zoom Testing\frontend"
npm run dev
```

You should see:
```
  VITE  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

---

## 🖥️ Step 5 — Use the Application

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Student Flow (`/student`)
1. Enter your name
2. Select **3–4 date/time slots** when you're available
3. Click **Submit Availability**
4. The page auto-refreshes every 5 seconds
5. Once the counselor accepts, **"Join Meeting"** button appears (enabled 5 min before session)

### Counselor Flow (`/counselor`)
1. See all pending student requests
2. Click **Accept** next to the time you want to confirm
3. Zoom meeting is auto-created via API
4. **"Start Meeting (Host)"** button appears — this opens Zoom as the host

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |
| `GET` | `/slots` | Get all submitted slots |
| `GET` | `/slots/:id` | Get a single slot by ID |
| `POST` | `/slots` | Submit student availability |
| `POST` | `/accept` | Accept a slot + create Zoom meeting |
| `DELETE` | `/slots/:id` | Remove a slot |

### POST `/slots` body:
```json
{
  "studentName": "Alex Johnson",
  "times": ["2025-05-15T10:00:00Z", "2025-05-15T14:00:00Z", "2025-05-16T09:00:00Z"]
}
```

### POST `/accept` body:
```json
{
  "slotId": "uuid-here",
  "selectedTime": "2025-05-15T10:00:00Z"
}
```

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Backend | Node.js + Express |
| Zoom API | Server-to-Server OAuth |
| Storage | In-memory (no database) |

---

## 🐛 Troubleshooting

**`Failed to create Zoom meeting`**
- Double-check your `.env` credentials
- Make sure your Zoom app has the correct scopes (`meeting:write`)
- Verify Account ID matches your Zoom account

**`Could not reach the backend`**
- Ensure the backend is running on port 5000
- Check there's no firewall blocking localhost:5000

**Frontend shows blank page**
- Make sure you ran `npm install` in the `frontend/` folder
- Check for errors in the browser console (F12)

---

## ✨ Features

- 🎓 **Student Dashboard** — submit 3–4 time slots with datetime pickers
- 🧑‍💼 **Counselor Dashboard** — review all requests, one-click accept
- 🎥 **Auto Zoom Creation** — meeting generated via Zoom API on acceptance
- 🔗 **Split Links** — student gets `join_url`, counselor gets `start_url` (host)
- ⏳ **Join Button Gating** — Join button enables 5 minutes before session time
- 🔄 **Auto-polling** — student page refreshes every 5s, counselor every 8s
- 🚫 **No Waiting Room** — `join_before_host: true`, direct join
- 📋 **Copy Host Link** — counselor can copy start URL to clipboard
- 🔔 **Toast Notifications** — success/error feedback after accepting
