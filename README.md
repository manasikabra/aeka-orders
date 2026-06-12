# ☕ Aeka Orders — Cafe Event Ordering System

A real-time ordering system built for **AI Study Group** events at **Aeka's Coffee**. Customers scan a QR code, browse the menu, pay via UPI, and place their order — baristas see it instantly on their dashboard.

## ✨ Features

- **Customer View** — Browse drinks & food, add to cart, pay via UPI QR, place order
- **Barista Dashboard** — PIN-protected admin panel with real-time order management
- **Live Sync** — Orders appear instantly across all devices using Firebase Firestore
- **Item-level Tracking** — Mark individual items as delivered
- **Payment Verification** — Barista can verify UPI payments
- **Custom QR Code** — Upload your own payment QR from the admin settings
- **Mobile-First Design** — Responsive layout with bottom navigation on mobile

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite 6 | Build tool & dev server |
| Tailwind CSS 3 | Utility-first styling |
| Firebase Auth | Anonymous authentication |
| Cloud Firestore | Real-time database |
| Lucide React | Icons |

---

## 🔥 Firebase Project Setup (Step-by-Step)

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** (or "Add project")
3. Name it something like `aeka-orders`
4. You can disable Google Analytics (not needed) → Click **Continue** → **Create Project**

### 2. Enable Anonymous Authentication

1. In your new project, go to **Build → Authentication** (left sidebar)
2. Click **Get started**
3. Under "Sign-in method", click **Anonymous**
4. Toggle it **ON** → Click **Save**

> Anonymous auth allows customers to place orders without creating an account. Each browser session gets a unique user ID, which is used to show "My Orders" on the customer status tab.

### 3. Create Firestore Database

1. Go to **Build → Firestore Database** (left sidebar)
2. Click **Create database**
3. Choose a location close to your users (e.g., `asia-south1` for India)
4. Start in **Test mode** (allows all reads/writes — secure it later for production)
5. Click **Create**

> Firestore stores all orders in real-time. When a customer places an order, it instantly appears on the barista dashboard — no refresh needed.

### 4. Register a Web App & Get Config

1. Go to **Project Settings** (gear icon, top-left)
2. Scroll down to **"Your apps"** section
3. Click the **Web** icon (`</>`) to add a web app
4. Give it a nickname (e.g., `aeka-orders-web`)
5. **Don't** check "Firebase Hosting" → Click **Register app**
6. You'll see a config object like this:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "aeka-orders.firebaseapp.com",
  projectId: "aeka-orders",
  storageBucket: "aeka-orders.firebasestorage.app",
  messagingSenderId: "957228...",
  appId: "1:957228...:web:1e54e6...",
  measurementId: "G-72Z..."
};
```

7. Copy these values into your `.env` file (see Environment Variables below)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A Firebase project (see setup above)

### Installation

```bash
git clone https://github.com/manasikabra/aeka-orders.git
cd aeka-orders
npm install
```

### Environment Variables

Create a `.env` file in the project root (use `.env.example` as a template):

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_APP_ID=cafe-event-orders
```

### Run Locally

```bash
npm run dev
```

The app will start at `http://localhost:5173/`

---

## 📱 Testing on Multiple Devices (Same WiFi)

To test real-time sync between a customer and barista on different devices:

1. Start the dev server with network access:

```bash
npx vite --host --port 3000
```

2. The terminal will show a **Network URL** like:

```
➜  Local:   http://localhost:3000/
➜  Network: http://192.168.1.102:3000/
```

3. Open the **Network URL** on your phone or another device connected to the same WiFi
4. On **Device 1** (e.g., laptop): Switch to **Barista** view → Enter PIN `1234`
5. On **Device 2** (e.g., phone): Browse the menu → Add items → Place an order
6. The order appears **instantly** on the barista dashboard — real-time Firebase sync in action! 🎉

> We tested this successfully during development with a MacBook and iPhone on the same WiFi network.

---

## 🔐 Barista Access

- Tap the **chef hat** icon in the header (or the **Barista** tab on mobile)
- Enter PIN: `1234` (configurable in `src/App.jsx` → `BARISTA_PIN`)
- From the dashboard you can:
  - View all orders with real-time updates
  - Tap individual items to mark them as delivered
  - Verify payments with the checkbox
  - Filter orders by date
  - Delete orders
  - Upload a custom QR code in Settings

---

## 🌐 Deployment (Vercel)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import the GitHub repo
3. Add environment variables in Vercel dashboard (same as your `.env` file)
4. Deploy!

The `vercel.json` file handles SPA routing automatically.

---

## 📁 Project Structure

```
AekaOrders/
├── index.html           # HTML entry point with Inter font
├── package.json         # Dependencies & scripts
├── vite.config.js       # Vite build configuration
├── tailwind.config.js   # Tailwind CSS config
├── postcss.config.js    # PostCSS pipeline
├── vercel.json          # Vercel SPA routing
├── .env                 # Firebase config (not in git)
├── .env.example         # Template for env vars
└── src/
    ├── main.jsx         # React entry point
    ├── App.jsx          # Main application component
    ├── firebase.js      # Firebase initialization
    └── index.css        # Global styles + Tailwind
```

---

## 📝 License

MIT
