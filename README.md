# Flowly React + Express + Supabase

Flowly đã được chuyển từ Express + EJS sang React/Vite cho frontend và Express cho API backend.

## Cấu trúc chính

```txt
flowly/
├─ client/
│  ├─ index.html
│  ├─ public/assets/images/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ layouts/
│  │  ├─ pages/
│  │  ├─ styles/
│  │  └─ utils/
│  └─ vite.config.js
├─ server/
│  ├─ controllers/
│  ├─ middleware/
│  ├─ routes/
│  ├─ services/
│  ├─ utils/
│  └─ index.js
├─ package.json
└─ .env.example
```

## Chạy project

```bash
npm install
cp .env.example .env
npm run dev
```

- React dev server: `http://localhost:5173`
- Express API server: `http://localhost:3000`

Vite tự proxy các request `/api/*` sang Express.

## Build và chạy production

```bash
npm run build
npm start
```

Sau khi build, Express phục vụ React app từ `client/dist` tại `http://localhost:3000`.

## Biến môi trường

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-or-publishable-key
```

## API

- `GET /api/config`
- `GET /api/holidays/:year`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `GET /api/schedules`
- `POST /api/schedules`
- `PUT /api/schedules/:id`
- `DELETE /api/schedules/:id`

## Supabase tables

```sql
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  task_type text not null check (task_type in ('today', 'future')),
  task_date date,
  status text default 'pending',
  priority text default 'normal',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  schedule_date date not null,
  start_time time not null,
  end_time time not null,
  color text default 'blue',
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```
