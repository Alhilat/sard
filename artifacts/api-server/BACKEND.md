# Backend Documentation — Multi-Role Community & Learning Platform

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (ESM via esbuild) |
| Framework | Express.js |
| ORM | Prisma 7 (`provider = "prisma-client"`) |
| Database | PostgreSQL |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod |
| File Uploads | Multer (local disk → `uploads/`) |
| Rate Limiting | express-rate-limit |
| Docs | Swagger UI (`/api/docs`) |
| Logging | Pino |

---

## Project Structure

```
artifacts/api-server/
├── prisma/
│   └── schema.prisma          # Introspected from DB (38 models, 23 enums)
├── src/
│   ├── config/
│   │   ├── env.ts             # Zod env validation
│   │   └── swagger.ts         # swagger-jsdoc config
│   ├── generated/prisma/      # Prisma client (auto-generated)
│   ├── lib/
│   │   ├── prisma.ts          # Prisma singleton
│   │   └── logger.ts          # Pino logger
│   ├── middleware/
│   │   ├── auth.ts            # JWT authenticate / optionalAuthenticate
│   │   ├── errorHandler.ts    # AppError classes + global handler
│   │   ├── rateLimiter.ts     # general / auth / upload limiters
│   │   ├── rbac.ts            # requireAuth / requireRole / requireAdmin …
│   │   ├── upload.ts          # Multer config
│   │   └── validate.ts        # Zod middleware factory
│   ├── modules/
│   │   ├── auth/              # register, login, logout, refresh, forgot/reset password, verify email
│   │   ├── users/             # profile, avatar, follow/unfollow
│   │   ├── organizations/     # org CRUD, logo/cover, verification
│   │   ├── posts/             # feed, CRUD, likes, shares, comments
│   │   ├── groups/            # CRUD, member management
│   │   ├── activities/        # events, registration
│   │   ├── courses/           # courses, enrollment, materials
│   │   ├── blog/              # articles, categories, likes, comments
│   │   ├── notifications/     # list, mark read, preferences
│   │   ├── messages/          # conversations, direct messages
│   │   ├── ai-chat/           # AI chat conversations & messages
│   │   ├── reports/           # content moderation reports
│   │   ├── admin/             # admin user/org/post management
│   │   └── dashboard/         # role-specific dashboards
│   ├── routes/
│   │   ├── index.ts           # mounts all module routers
│   │   └── health.ts          # GET /api/health
│   ├── types/
│   │   └── express.d.ts       # req.user augmentation
│   ├── utils/
│   │   ├── apiResponse.ts     # sendSuccess / sendCreated / sendPaginated …
│   │   ├── asyncHandler.ts    # wraps async handlers
│   │   ├── hash.ts            # bcrypt + SHA-256
│   │   ├── jwt.ts             # sign / verify access + refresh tokens
│   │   └── paginate.ts        # parsePagination / buildPagination
│   └── app.ts                 # Express app factory
└── src/server.ts              # HTTP server entry point
```

---

## Authentication Flow

### Register
`POST /api/auth/register`
Body: `{ email, password, name, role_name: "individual"|"organization" }`

1. Validates email uniqueness.
2. Hashes password with bcrypt (salt 12).
3. Looks up `roles` table by `role_name`.
4. Creates user record.
5. Returns `{ access_token, refresh_token, user }`.

### Login
`POST /api/auth/login`

1. Looks up user by email.
2. Compares password with bcrypt.
3. Issues access token (15 min) + refresh token (7 days).
4. Stores SHA-256 hash of refresh token in `user_sessions`.

### Refresh
`POST /api/auth/refresh`
Body: `{ refresh_token }`

1. Verifies JWT signature.
2. Compares SHA-256 hash against `user_sessions`.
3. Issues **new** token pair (rotation) — old session deleted.

### Password Reset (dev mode)
`POST /api/auth/forgot-password` → returns token in response (replace with email in prod).
`POST /api/auth/reset-password` → verifies SHA-256 hashed token, updates password.

---

## RBAC Roles

| Role | Access |
|------|--------|
| `individual` | Social features (posts, groups, messages, ai-chat, courses/activities enrollment) |
| `organization` | Org management, activities, courses, blog articles |
| `admin` | Full access — user/org/post management, reports, admin dashboard |

Middleware: `requireRole('admin')`, `requireAdmin`, `requireOrg`, `requireIndividual`

---

## Pagination

All list endpoints support:
- `?page=1&limit=20`

Response shape:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## File Uploads

`POST /api/users/me/avatar` — single image  
`POST /api/organizations/:id/logo` — single image  
`POST /api/organizations/:id/cover` — single image  

Files are saved to `uploads/<fieldname>-<timestamp>-<random>.<ext>`.  
The URL (`/uploads/filename`) is stored in the `media_files` table.

Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `video/mp4`, `application/pdf`  
Max file size: **10 MB**

---

## API Docs

Swagger UI available at: `GET /api/docs`  
Raw OpenAPI JSON: `GET /api/docs.json`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (managed by Replit) |
| `PORT` | ✅ | Server port (managed by Replit) |
| `JWT_ACCESS_SECRET` | ✅ | Min 32 chars — sign access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Min 32 chars — sign refresh tokens |
| `NODE_ENV` | — | `development` or `production` |

---

## Rate Limits

| Limiter | Window | Max Requests |
|---------|--------|-------------|
| `generalLimiter` | 15 min | 200 |
| `authLimiter` | 15 min | 20 |
| `uploadLimiter` | 1 hour | 50 |

---

## Database Seed (Required Before First Use)

The `roles` table must be seeded before auth works:

```sql
INSERT INTO roles (id, name, description, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'individual',    'Individual user',    NOW(), NOW()),
  (gen_random_uuid(), 'organization',  'Organization user',  NOW(), NOW()),
  (gen_random_uuid(), 'admin',         'Platform admin',     NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
```

---

## Error Response Shape

```json
{
  "success": false,
  "message": "Human-readable error",
  "errors": [{ "field": "email", "message": "Required" }]
}
```

HTTP status codes:  
`400` Bad Request / Validation  
`401` Unauthenticated  
`403` Forbidden  
`404` Not Found  
`409` Conflict  
`429` Rate Limited  
`500` Internal Server Error  
