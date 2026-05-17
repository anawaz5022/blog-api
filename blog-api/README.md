# Inkline Blog Studio

Full-stack blog app built with Next.js 15 App Router, TypeScript, Prisma, Auth.js, Zod, Upstash rate limiting, Pino, and Vitest.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local environment values from `.env.example`. Use a real PostgreSQL database URL for Prisma migrations and real Upstash credentials for production rate limiting.

3. Generate Prisma Client:

   ```bash
   npx prisma generate
   ```

4. Run migrations once database credentials are configured:

   ```bash
   npx prisma migrate dev --name init
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

## Verification

```bash
npm run lint
npm run typecheck
npx prisma validate
npx prisma generate
npx vitest run
npm run build
```

## Frontend Routes

- `/` public post browser with search, tags, and pagination
- `/posts/:id` post detail with comments
- `/login` and `/register`
- `/dashboard` author/admin post workspace
- `/dashboard/posts/new`
- `/dashboard/posts/:id/edit`
- `/dashboard/tags` admin tag manager
- `/settings` profile and password management

## API Surface

- `POST /api/auth/register`
- `GET|POST /api/auth/[...nextauth]`
- `GET|POST /api/posts`
- `GET|PUT|DELETE /api/posts/:id`
- `GET|POST /api/posts/:id/comments`
- `PUT|DELETE /api/comments/:id`
- `GET /api/users/:id`
- `PUT /api/users/me`
- `PUT /api/users/me/password`
- `GET|POST /api/tags`
- `DELETE /api/tags/:id`
