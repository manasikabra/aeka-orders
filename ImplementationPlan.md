# Deploy AekaOrders to Vercel — Full Guide

## Overview

Your app was built as a Gemini artifact, which provided a free Firebase backend automatically. To deploy it on Vercel, we need to:

1. **Create a free Firebase project** (for saving orders)
2. **Wrap your existing file** in a deployable project (no changes to your code)
3. **Push to GitHub** and **deploy on Vercel**

Your original `aekaorders.jsx` will **NOT** be modified.

---

## Step 1: Create a Firebase Project (in your browser)

I'll open the Firebase Console for you and guide you through it.

### 1a. Create the project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** (or "Add project")
3. Name it something like `aeka-orders`
4. You can disable Google Analytics (not needed) → Click **Continue** → **Create Project**

### 1b. Enable Anonymous Authentication
1. In your new project, go to **Build → Authentication** (left sidebar)
2. Click **Get started**
3. Under "Sign-in method", click **Anonymous**
4. Toggle it **ON** → Click **Save**

### 1c. Create Firestore Database
1. Go to **Build → Firestore Database** (left sidebar)
2. Click **Create database**
3. Choose a location (e.g., `asia-south1` for India)
4. Start in **Test mode** (we'll secure it later) → Click **Create**

### 1d. Get your Firebase Config
1. Go to **Project Settings** (gear icon, top-left)
2. Scroll down to **"Your apps"** section
3. Click the **Web** icon (`</>`) to add a web app
4. Give it a nickname (e.g., `aeka-orders-web`)
5. **Don't** check "Firebase Hosting" → Click **Register app**
6. You'll see a config block like this — **copy the values and paste them to me**:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "aeka-orders.firebaseapp.com",
  projectId: "aeka-orders",
  storageBucket: "aeka-orders.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

> [!IMPORTANT]
> After completing the Firebase setup, **paste the config block here** so I can set up the project.

---

## Step 2: Project Scaffolding (I'll do this)

Once I have your Firebase config, I'll create these files around your existing `aekaorders.jsx`:

| File | Purpose |
|------|---------|
| `package.json` | Project dependencies (React, Firebase, etc.) |
| `vite.config.js` | Build tool configuration |
| `index.html` | HTML entry point with fonts & styling |
| `src/main.jsx` | Bridge that connects Firebase config → your app |
| `src/index.css` | Base styles |
| `.env` | Your Firebase config (kept private) |
| `.env.example` | Template for others |
| `.gitignore` | Keeps secrets & node_modules out of GitHub |
| `vercel.json` | Vercel deployment settings |

---

## Step 3: Local Testing

I'll run the app locally and verify:
- ✅ Customer: browse menu, add to cart, place order
- ✅ Barista: PIN login, view orders, mark delivered
- ✅ Firebase: orders save and load in real-time

---

## Step 4: Deploy to Vercel via GitHub

1. Initialize a Git repo and push to GitHub
2. Connect the repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

---

## Verification Plan

### Local Testing
- `npm run dev` → test all flows in browser

### Production Testing  
- Verify the Vercel URL loads correctly
- Place a test order and confirm it appears in barista view
