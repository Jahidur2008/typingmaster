# ⌨️ Typing Master

> **A minimal, distraction-free typing tutor & competitive platform built with Next.js 16, Express.js, Socket.IO, and MongoDB.**  
> Inspired by Monkeytype's sleek aesthetic, featuring real-time Bengali & English typing layouts, live multiplayer competitions, dynamic reactive theming, and an all-in-one Superuser Admin Control Center.

---

## 🌟 Key Features

### 🚀 Modern Typing Experience
- **Monkeytype-Inspired Minimal UI**: Smooth caret movement, sub-millisecond keystroke responsiveness, and zero distraction.
- **Multiple Test Modes**:
  - **Time**: 15s, 30s, 60s, 120s test durations.
  - **Words**: 10, 25, 50, 100 word tests.
  - **Quote**: Short, medium, long, or all quotes from literary and pop culture sources.
  - **Custom**: Paste or type custom text passages.
  - **Zen Mode**: Freeform typing without constraints or target text.
- **Bengali & English Typing Support**: Native phonetic Avro and layout switching, Unicode grapheme cluster parsing, and high-frequency Bangla word lists.
- **Dynamic Themed Favicon**: Real-time canvas-generated SVG/PNG favicon that instantly re-paints in your browser tab when you switch presets or pick custom colors.
- **Sound Effects & Keyboard Soundpacks**: Mechanical switches (Cherry MX Blue, Brown, Red, Topre, Bubble, Typewriter) with volume controls.

### 🎮 Gamification & Analytics
- **Experience & Leveling System**: Earn XP per test based on WPM and accuracy, unlock achievements and milestone badges.
- **Streaks & Personal Bests**: Daily streak tracker, high score records per mode and language.
- **Detailed Performance Charts**: WPM per second curves, raw WPM, accuracy, consistency, error breakdown, and character statistics (powered by lazy-loaded Chart.js).
- **Public & Ranked Leaderboards**: Filter by mode, duration, language, and date range.

### ⚔️ Live Multiplayer Competitions
- **Real-Time Rooms**: Create private or public racing lobbies powered by WebSockets / Socket.IO.
- **Live Progress Bars**: Watch competitors' avatars race across the screen keystroke-by-keystroke in real time.
- **Instant Match Results**: Placements, podium celebrations, and final WPM/accuracy breakdowns.

### 🛡️ Superuser Admin Control Center (`/admin`)
- **System Dashboard**: Total users, tests taken, average WPM, today's tests, active competitions, unread messages, and 7-day volume chart.
- **User Management**: View all users, search, filter by role (user/admin), toggle admin privileges, ban/unban, and remove accounts.
- **Test Results Log**: Audit all user & guest test records across the platform.
- **Words & Quotes Database**: Add, edit, or delete practice quotes, custom passages, and word pools.
- **Curriculum & Lesson Manager**: Create and organize touch-typing lessons and drill exercises.
- **Languages & Layouts**: Manage typing layouts (English, Bengali, Bijoy, etc.).
- **Challenges Manager**: Configure Daily, Weekly, Speed, and Accuracy challenges.
- **Contact Messages Inbox**: View, filter (unread/read/replied), search, and inspect inquiries sent from the `/contact` page.
- **Platform Settings & Maintenance Mode**:
  - Emergency **Maintenance Mode Toggle**: Instantly blocks public visitors with an elegant maintenance screen while allowing administrators full bypass access.
  - Toggle guest test submissions, customize default test duration, set max custom text length.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide Icons](https://lucide.dev/), [Chart.js](https://www.chartjs.org/) |
| **State & Store** | [Zustand](https://github.com/pmndrs/zustand) (with `localStorage` persistence) |
| **Backend** | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [Socket.IO](https://socket.io/) (Live multiplayer & rooms) |
| **Database** | [MongoDB](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/) |
| **Authentication** | JWT (JSON Web Tokens) + Secure Admin Session Tokens |

---

## 📁 Project Structure

```text
Typing Master/
├── typing_master/                # Next.js 16 Frontend
│   ├── app/                      # Next.js App Router
│   │   ├── about/                # About page
│   │   ├── admin/                # Superuser Admin Control Center
│   │   ├── challenge/            # Daily & Weekly challenges
│   │   ├── competition/          # Multiplayer lobby & racing
│   │   ├── contact/              # Interactive contact form
│   │   ├── dashboard/            # User profile & stats
│   │   ├── history/              # Test logs & performance graphs
│   │   ├── leaderboard/          # Global leaderboards
│   │   ├── learn/                # Touch-typing curriculum
│   │   ├── practice/             # Targeted typing drills
│   │   ├── settings/             # Theme & appearance controls
│   │   ├── error.tsx             # Global runtime error boundary
│   │   ├── loading.tsx           # Test skeleton loader
│   │   ├── not-found.tsx         # 404 Page Not Found
│   │   ├── robots.ts             # SEO robots.txt generator
│   │   ├── sitemap.ts            # SEO sitemap.xml generator
│   │   ├── layout.tsx            # Root layout & dynamic metadata
│   │   └── page.tsx              # Main typing test view
│   ├── components/               # Reusable UI & typing components
│   │   ├── dynamic-favicon.tsx   # Instant theme-synced favicon generator
│   │   ├── maintenance-gate.tsx  # Maintenance mode interceptor
│   │   ├── navbar.tsx            # Top navigation bar
│   │   ├── footer.tsx            # Footer
│   │   ├── typing-area.tsx       # Core typing engine & caret renderer
│   │   └── wpm-chart.tsx         # Performance chart
│   └── lib/                      # Stores, utilities, and typing engine
│
├── typing_master/server/         # Express.js & Socket.IO Backend
│   ├── models/                   # Mongoose schemas
│   │   ├── challenge.js          # Challenges schema
│   │   ├── contact-message.js    # Contact submissions schema
│   │   ├── course.js             # Curriculum lessons schema
│   │   ├── quote.js              # Words & quotes schema
│   │   ├── result.js             # Typing test results schema
│   │   ├── settings.js           # Platform global settings schema
│   │   └── user.js               # Users & auth schema
│   ├── routes/                   # REST API route handlers
│   │   ├── admin.js              # Admin control center endpoints
│   │   ├── auth.js               # User registration & login
│   │   ├── contact.js            # Contact form submission & inbox
│   │   ├── results.js            # Test logging & personal stats
│   │   ├── settings.js           # Maintenance mode & platform config
│   │   └── ...                   # Challenges, leaderboards, words
│   ├── sockets/                  # Real-time Socket.IO multiplayer rooms
│   ├── .env                      # Backend environment variables
│   └── server.js                 # HTTP + WebSocket server entry point
│
└── admin.env                     # Superuser Admin credentials reference
```

---

## ⚙️ Environment Variables

### 1. Frontend (`typing_master/.env.local`)
Create a file at `typing_master/.env.local`:

```env
# URL where your Express backend server is running
NEXT_PUBLIC_API_URL=http://localhost:4000

# Canonical site URL (for SEO, sitemaps, OpenGraph)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Backend (`typing_master/server/.env`)
Create a file at `typing_master/server/.env`:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/typing_master
JWT_SECRET=typing_master_super_secure_jwt_secret_key_2026
CLIENT_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### 3. Admin Credentials (`admin.env`)
The Superuser Admin portal (`/admin`) is pre-configured with the following credentials:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

*(You can sign in directly at `http://localhost:3000/admin` using these credentials to manage the platform.)*

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Installed locally (running on `mongodb://localhost:27017`) or a free [MongoDB Atlas](#-migrating-to-mongodb-atlas) cloud cluster.

### 2. Start the Backend API & WebSocket Server
In a terminal window:

```bash
cd typing_master/server
npm install
npm run dev
# or
node server.js
```
The server will start on `http://localhost:4000` and automatically:
- Connect to MongoDB.
- Initialize database indexes.
- Seed default practice lessons, words, quotes, and sample challenges.

### 3. Start the Next.js Frontend
In a separate terminal window:

```bash
cd typing_master
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Migrating to MongoDB Atlas (Production Cloud Database)

Switching from your local MongoDB instance to **MongoDB Atlas** requires **ONLY changing 1 line (`MONGODB_URI`)** in `server/.env`. No code changes are required!

### Step-by-Step Instructions:

1. **Create an Atlas Account**:
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and register or sign in.
   - Create a free **M0 Shared Cluster** (choose the AWS / Google Cloud region closest to your users).

2. **Create a Database User**:
   - In the Atlas sidebar, navigate to **Security** → **Database Access**.
   - Click **Add New Database User**.
   - Select **Password Authentication**.
   - Choose a username (e.g. `typing_admin`) and a strong password (e.g. `StrongPass2026!`).
   - Grant the user **Read and write to any database** role.
   - Click **Add User**.

3. **Configure IP Whitelist / Network Access**:
   - In the Atlas sidebar, go to **Security** → **Network Access**.
   - Click **Add IP Address**.
   - To allow access from any server (recommended for development & Vercel/Render deployments), select **Allow Access From Anywhere** (`0.0.0.0/0`).
   - Click **Confirm**.

4. **Copy the Connection String**:
   - In the sidebar, click **Deployment** → **Database**.
   - Next to your cluster, click **Connect**.
   - Select **Drivers** (Node.js).
   - Copy the connection string format:
     ```text
     mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/typing_master?retryWrites=true&w=majority&appName=Cluster0
     ```

5. **Update `server/.env`**:
   - Open `typing_master/server/.env`.
   - Replace the `MONGODB_URI` line with your Atlas connection string, making sure to replace `<username>` and `<password>` with your real credentials:
     ```env
     MONGODB_URI=mongodb+srv://typing_admin:StrongPass2026!@cluster0.abcde.mongodb.net/typing_master?retryWrites=true&w=majority&appName=Cluster0
     ```

6. **Restart Backend Server**:
   ```bash
   cd typing_master/server
   node server.js
   ```
   > ✅ **Done!** The backend will connect to MongoDB Atlas, automatically create all required schemas (`users`, `results`, `challenges`, `quotes`, `courses`, `contactmessages`, `settings`), and populate initial seed data.

---

## 🛠️ Verification & Building for Production

To build the Next.js frontend for production:

```bash
cd typing_master
npm run build
npm start
```

To run TypeScript verification:

```bash
cd typing_master
npx tsc --noEmit
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE). Built for typists, by typists.
#   t y p i n g m a s t e r  
 