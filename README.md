# GhostAI - Collaborative Software Architecture Canvas

GhostAI is a state-of-the-art, production-ready collaborative platform for software architects and developers. It combines a real-time collaborative canvas with AI-powered system design generation and automated technical specification compiling.

**Live Deployment:** [trian-senior-ai-git-development-rusdanlamsa-9430s-projects.vercel.app](https://trian-senior-ai-git-development-rusdanlamsa-9430s-projects.vercel.app)

---

## 🚀 Key Features

### 1. Collaborative Canvas Workspace
*   **Real-time Multiplayer Editing:** Synchronized using **Liveblocks**, supporting concurrent participants with live cursors, pointer tracking, and color name badges.
*   **Custom Shapes & Layouts:** Supports standard nodes (rectangles, circles, pills) and SVG scale-invariant nodes (diamonds, hexagons, cylinders) with custom resize handles and inline double-click editing.
*   **Edge Connections:** Orthogonal smooth-step right-angle routing, arrowheads, double-clickable inline label overlays, and optimized click/hover triggers.
*   **Ergonomics:** Complete viewport zoom controls, undo/redo state history, and global keyboard shortcuts (de-activated when typing in input forms).
*   **Templates Library:** One-click imports for starter templates (e.g., Microservices architecture, CI/CD pipelines, Event-driven systems) with automatic diagram centering.

### 2. Clerk Authentication & Access Control
*   **Auth Gates:** Responsive, styled sign-in/up dashboards secured by Clerk, customized to match the system's dark theme.
*   **Share System:** Invite collaborators via email with Clerk avatar/display name enrichment, manage read/write permissions, and share clipboard workspace links.

### 3. AI Architect & Spec Generator (Ghost AI)
*   **Asynchronous AI Partner:** Runs background tasks orchestrated by **Trigger.dev v3** to prevent browser timeouts.
*   **AI Canvas Painter:** Analyzes prompt requirements and dynamically updates/creates coordinates, nodes, and labeled connector lines using Gemini AI.
*   **Technical Spec Compiler:** Writes a thorough technical specification based on your canvas architecture and chat history. Stores the markdown file in Vercel Blob, saves metadata in PostgreSQL via Prisma, and enables in-app markdown previews and browser downloads.
*   **Robust Fallbacks:** Integrates local blueprint spec and layout fallbacks to ensure the application remains fully functional even during Gemini rate limit / quota exhaustion events.

---

## 🛠️ Technology Stack

*   **Framework:** Next.js (App Router, Turbopack, Tailwind CSS v4, shadcn/ui)
*   **Real-Time Collaboration:** Liveblocks WebSockets, Presence, and Storage
*   **Background Jobs:** Trigger.dev SDK v3
*   **AI Engine:** Vercel AI SDK with Google Gemini API (`gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`)
*   **ORM & Database:** Prisma ORM with PostgreSQL (hosted)
*   **File Storage:** Vercel Blob (Private Storage)
*   **Authentication:** Clerk Authentication SDK

---

## 📦 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd my-app
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the root directory:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database Connectivity (Prisma)
DATABASE_URL=postgresql://your_db_connection_url
DIRECT_DATABASE_URL=postgresql://your_direct_db_connection_url

# Liveblocks Collaboration
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key

# Trigger.dev Orchestration
TRIGGER_SECRET_KEY=your_trigger_secret_key

# Gemini LLM Integration
GEMINI_API_KEY=your_gemini_api_key

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### 3. Run Database Migrations
Generate Prisma Client types and sync your schema:
```bash
npx prisma db push
npx prisma generate
```

### 4. Start Development Servers
Run the Next.js local server:
```bash
npm run dev
```

In a separate terminal, launch the Trigger.dev development worker:
```bash
npx trigger.dev@latest dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to explore the collaborative AI workspace.

---

## 📂 Project Architecture

```
├── app/
│   ├── api/                  # Backend REST API routes
│   │   ├── ai/               # AI architect and spec triggering endpoints
│   │   ├── liveblocks-auth/  # Token auth for multiplayer rooms
│   │   └── projects/         # Project metadata and spec CRUD routes
│   ├── editor/               # /editor main panel and roomId workspaces
│   ├── sign-in/              # Auth dashboards
│   └── layout.tsx            # Global layout configuration
├── components/
│   ├── editor/               # Workspace chrome, AI sidebars, and dialogue modals
│   │   └── canvas/           # Custom React Flow nodes, edges, and room wrappers
│   └── ui/                   # Modular shadcn buttons, dialogs, and tabs
├── hooks/                    # Keyboard shortcuts and autosave React hooks
├── lib/                      # Cached singleton clients (Prisma, Liveblocks)
├── prisma/
│   ├── models/               # Modular database schemas (Project, Spec, TaskRun)
│   └── schema.prisma         # Merged schema declaration
├── trigger/                  # Background worker tasks (Design Agent, Spec Generator)
└── types/                    # Core typescript canvas and message interfaces
```

---

