# Git City 🌆

A 3D visualization platform that transforms GitHub repositories and activity into an interactive city experience. Built with Next.js, React Three Fiber, and Supabase.

## Features

- **3D City Visualization** - View GitHub activity as a virtual city with towers representing repositories
- **Real-time Updates** - Live GitHub data visualization
- **User Authentication** - Secure login via Supabase Auth (NextAuth.js)
- **Interactive 3D Experience** - Explore your GitHub footprint in an immersive 3D environment
- **Chat System** - Built-in community chat functionality

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **3D Rendering:** React Three Fiber, Three.js, @react-three/drei, @react-three/postprocessing
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Styling:** Tailwind CSS 4
- **State Management:** TanStack React Query

## Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm/bun
- Supabase account (for backend services)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/git-city.git
cd git-city

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Environment Setup

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Configure the following variables in `.env`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Database Setup

Run the Supabase schema files in your Supabase dashboard:

1. `supabase-schema.sql` - Main database schema
2. `supabase-user-roles.sql` - User roles
3. `supabase-chat-schema.sql` - Chat system schema

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/            # Next.js App Router pages
├── components/
│   ├── auth/      # Authentication components
│   ├── chat/      # Chat system
│   ├── city/      # 3D city visualization
│   ├── layout/    # Layout components
│   ├── profile/   # User profile components
│   ├── tower/     # 3D tower components
│   └── ui/        # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utility libraries
├── types/         # TypeScript type definitions
└── utils/         # Helper functions
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT License - see LICENSE file for details.
