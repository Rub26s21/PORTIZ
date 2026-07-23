# Electronic Club ⚡ Quiz Portal

> The Ultimate Electronics Competition Platform for Future Engineers 🚀

A complete, production-ready web application that serves as both a stunning marketing website AND a secure multi-round online quiz competition portal for a college electronics club.

## ✨ Features

### Marketing Website
- 🎨 Jaw-dropping homepage with 3D particle effects (Three.js)
- 🌊 Glassmorphism UI with neon glow effects
- 🖱️ Custom animated cursor with trailing effect
- 🫧 Floating bubble particle background
- 🔌 Circuit board SVG background pattern
- 📱 Fully responsive design
- 🎭 Scroll-triggered Framer Motion animations

### Quiz Competition
- 🏆 Multi-round competition system (Spark → Circuit → Nexus)
- 🔒 Comprehensive anti-cheat system (fullscreen lock, tab detection, copy block)
- ⏱️ Server-side timer validation
- 🎲 Question and option randomization per participant
- 📊 Real-time live monitoring for admins
- 🎯 Promotion system between rounds
- 📜 PDF certificate generation

### Security
- 🔐 Correct answers NEVER sent to browser
- 👁️ Zero-tolerance anti-cheat policy
- 🔑 Role-based access control (Admin / Participant)
- 🛡️ Row Level Security (RLS) on all Supabase tables
- ⚡ Server-side scoring engine

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Custom CSS |
| 3D Graphics | Three.js + React Three Fiber + Drei |
| Animations | Framer Motion |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Forms | React Hook Form + Zod |
| CSV Import | PapaParse |
| Icons | Lucide React |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))

### 1. Clone & Install

```bash
cd electronic-club-quiz
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run:
   - `supabase/schema.sql` (creates all tables and triggers)
   - `supabase/policies.sql` (sets up Row Level Security)
3. Copy your project credentials

### 3. Configure Environment

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_NAME=Electronic Club Quiz Portal
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Create Admin User

1. Register a user through the app's `/register` page
2. In Supabase, go to Table Editor → `profiles`
3. Find your user and change `role` from `participant` to `admin`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Marketing homepage
│   ├── about/             # About page
│   ├── rules/             # Rules page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── admin/             # Admin portal (9 pages)
│   ├── participant/       # Participant portal (9 pages)
│   └── api/               # API routes (21 endpoints)
├── components/
│   ├── cursor/            # Custom animated cursor
│   ├── effects/           # Visual effects (bubbles, circuit, neon)
│   ├── three/             # Three.js 3D components
│   ├── marketing/         # Homepage marketing sections
│   └── shared/            # Reusable UI components
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── anti-cheat.ts      # Anti-cheat system
│   ├── scoring.ts         # Server-side scoring engine
│   ├── auth-helpers.ts    # API auth helpers
│   ├── validators.ts      # Zod schemas
│   └── utils.ts           # Utility functions
├── types/                 # TypeScript type definitions
└── supabase/              # SQL schema and policies
```

## 🔒 Anti-Cheat Measures

1. **Fullscreen Lock** — Test must run in fullscreen
2. **Tab Switch Detection** — `visibilitychange` + `blur` events
3. **Keyboard Blocking** — Ctrl+C, Ctrl+V, F12, Ctrl+Shift+I blocked
4. **Copy/Paste Disabled** — All clipboard events prevented
5. **DevTools Detection** — Window size monitoring
6. **Question Randomization** — Unique order per participant
7. **Server-Side Timer** — Cannot manipulate from client
8. **Zero Tolerance** — Any violation = immediate disqualification

## 📡 API Routes

### Authentication
- `POST /api/auth/register` — Register new participant
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user

### Admin (requires admin role)
- `GET/POST /api/admin/rounds` — Manage rounds
- `GET/PUT/DELETE /api/admin/rounds/[id]` — Single round CRUD
- `GET/POST /api/admin/rounds/[id]/questions` — Manage questions
- `POST /api/admin/rounds/[id]/upload-questions` — Bulk CSV import
- `GET /api/admin/rounds/[id]/results` — View results
- `POST /api/admin/rounds/[id]/promote` — Promote participants
- `GET /api/admin/participants` — List participants
- `GET /api/admin/monitoring` — Live monitoring

### Participant (requires participant role)
- `GET /api/participant/rounds` — List eligible rounds
- `POST /api/participant/rounds/[id]/start` — Start test
- `GET /api/participant/rounds/[id]/questions` — Get questions (no answers!)
- `POST /api/participant/rounds/[id]/save-answer` — Save answer
- `POST /api/participant/rounds/[id]/submit` — Submit test
- `POST /api/participant/rounds/[id]/proctor-event` — Log violation

## 🎨 Color Theme

```css
--bg: #03040f         /* Deep dark background */
--primary: #00cfff    /* Electric blue */
--secondary: #12ff80  /* Neon green */
--accent: #f5c518     /* Gold */
--danger: #ff3b5c     /* Red */
--purple: #7c3aed     /* Purple */
```

## 📝 License

Built with ❤️ by Electronic Club ⚡
