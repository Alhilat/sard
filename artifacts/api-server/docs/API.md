# API Reference — Multi-Role Community & Learning Platform

Base URL: `https://<your-domain>/api`  
Swagger UI: `GET /api/docs`

---

## Authentication

All protected routes require:
```
Authorization: Bearer <access_token>
```

---

## Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login, get token pair |
| POST | `/logout` | ✅ | Invalidate session |
| POST | `/refresh` | ❌ | Rotate token pair |
| GET | `/me` | ✅ | Get current user |
| POST | `/forgot-password` | ❌ | Request password reset token |
| POST | `/reset-password` | ❌ | Reset password with token |
| POST | `/verify-email` | ❌ | Verify email with token |

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "Jane Doe",
  "role_name": "individual"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "user": { "id": "...", "email": "...", "roleName": "individual" }
  }
}
```

---

## Users (`/api/users`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/me` | ✅ | Any | Get own profile |
| PUT | `/me` | ✅ | Any | Update profile |
| POST | `/me/change-password` | ✅ | Any | Change password |
| DELETE | `/me` | ✅ | Any | Delete account |
| POST | `/me/avatar` | ✅ | Any | Upload avatar (multipart) |
| GET | `/:id` | ❌ | — | Get public user profile |
| GET | `/:id/posts` | ❌ | — | Get user's posts |
| POST | `/:id/follow` | ✅ | Any | Follow user |
| DELETE | `/:id/follow` | ✅ | Any | Unfollow user |

---

## Organizations (`/api/organizations`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/` | ❌ | — | List organizations |
| GET | `/:id` | ❌ | — | Get organization |
| PUT | `/:id` | ✅ | org | Update org details |
| POST | `/:id/logo` | ✅ | org | Upload logo (multipart) |
| POST | `/:id/cover` | ✅ | org | Upload cover (multipart) |
| POST | `/:id/verify` | ✅ | org | Request verification |
| GET | `/:id/activities` | ❌ | — | List org activities |
| GET | `/:id/courses` | ❌ | — | List org courses |

---

## Posts (`/api/posts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ❌ | Get public feed |
| POST | `/` | ✅ | Create post |
| GET | `/:id` | ❌ | Get post |
| PUT | `/:id` | ✅ | Update post (owner) |
| DELETE | `/:id` | ✅ | Delete post (owner/admin) |
| POST | `/:id/like` | ✅ | Like post |
| DELETE | `/:id/like` | ✅ | Unlike post |
| POST | `/:id/share` | ✅ | Share post |
| DELETE | `/:id/share` | ✅ | Unshare post |
| GET | `/:id/comments` | ❌ | List comments |
| POST | `/:id/comments` | ✅ | Add comment |
| DELETE | `/:id/comments/:commentId` | ✅ | Delete comment (owner/admin) |

### Create Post
```json
{
  "content": "Hello world!",
  "visibility": "public",
  "group_id": null,
  "media_ids": []
}
```

---

## Groups (`/api/groups`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ❌ | List public groups |
| POST | `/` | ✅ | Create group |
| GET | `/:id` | ❌ | Get group |
| PUT | `/:id` | ✅ | Update group (creator/mod) |
| DELETE | `/:id` | ✅ | Dissolve group (creator) |
| GET | `/:id/members` | ❌ | List members |
| POST | `/:id/join` | ✅ | Join group |
| DELETE | `/:id/leave` | ✅ | Leave group |
| PATCH | `/:id/members/:userId` | ✅ | Update member role/status |
| DELETE | `/:id/members/:userId` | ✅ | Remove member |

---

## Activities (`/api/activities`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/` | ❌ | — | List activities |
| POST | `/` | ✅ | org | Create activity |
| GET | `/:id` | ❌ | — | Get activity |
| PUT | `/:id` | ✅ | org | Update activity |
| DELETE | `/:id` | ✅ | org | Cancel activity |
| POST | `/:id/register` | ✅ | Any | Register for activity |
| DELETE | `/:id/register` | ✅ | Any | Cancel registration |
| GET | `/:id/registrations` | ✅ | org | List registrations |

---

## Courses (`/api/courses`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/` | ❌ | — | List courses |
| POST | `/` | ✅ | org | Create course |
| GET | `/:id` | ❌ | — | Get course with materials |
| PUT | `/:id` | ✅ | org | Update course |
| POST | `/:id/enroll` | ✅ | Any | Enroll in course |
| DELETE | `/:id/enroll` | ✅ | Any | Cancel enrollment |
| GET | `/:id/enrollments` | ✅ | org | List enrollments |
| POST | `/:id/materials` | ✅ | org | Add material |
| DELETE | `/:id/materials/:materialId` | ✅ | org | Remove material |

---

## Blog (`/api/blog`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/articles` | ❌ | — | List published articles |
| POST | `/articles` | ✅ | org | Create article (draft) |
| GET | `/articles/:slug` | ❌ | — | Get article by slug |
| PUT | `/articles/:id` | ✅ | Any | Update article (owner/admin) |
| POST | `/articles/:id/publish` | ✅ | Any | Publish article |
| DELETE | `/articles/:id` | ✅ | Any | Remove article |
| POST | `/articles/:id/like` | ✅ | Any | Like article |
| DELETE | `/articles/:id/like` | ✅ | Any | Unlike article |
| GET | `/articles/:id/comments` | ❌ | — | List comments |
| POST | `/articles/:id/comments` | ✅ | Any | Add comment |
| GET | `/categories` | ❌ | — | List categories |
| POST | `/categories` | ✅ | admin | Create category |

---

## Notifications (`/api/notifications`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✅ | List notifications (`?unread=true`) |
| PATCH | `/:id/read` | ✅ | Mark single as read |
| POST | `/read-all` | ✅ | Mark all as read |
| GET | `/preferences` | ✅ | Get notification preferences |
| PUT | `/preferences` | ✅ | Update preferences |

---

## Messages (`/api/messages`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/conversations` | ✅ | List conversations |
| POST | `/conversations` | ✅ | Create conversation |
| GET | `/conversations/:id` | ✅ | Get messages in conversation |
| POST | `/conversations/:id/messages` | ✅ | Send message |

---

## AI Chat (`/api/ai-chat`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✅ | List AI conversations |
| POST | `/` | ✅ | Create new conversation |
| GET | `/:id` | ✅ | Get conversation + messages |
| POST | `/:id/messages` | ✅ | Send message, get AI reply |
| DELETE | `/:id` | ✅ | Delete conversation |

> **Note:** The AI reply is currently a stub echo. Replace `ai-chat.service.ts → sendMessage` with a real LLM call (OpenAI, Anthropic, etc.).

---

## Reports (`/api/reports`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/` | ✅ | Any | Submit report |
| GET | `/` | ✅ | admin | List reports |
| POST | `/:id/resolve` | ✅ | admin | Resolve report |
| POST | `/:id/dismiss` | ✅ | admin | Dismiss report |

---

## Admin (`/api/admin`)

All endpoints require `admin` role.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List users (`?role=&status=&q=`) |
| GET | `/users/:id` | Get user |
| PATCH | `/users/:id/status` | Update user status |
| DELETE | `/users/:id` | Ban/delete user |
| PATCH | `/users/:id/role` | Assign role |
| GET | `/organizations` | List organizations |
| PATCH | `/organizations/:id/status` | Update org status |
| GET | `/posts` | List all posts |
| DELETE | `/posts/:id` | Remove post |
| GET | `/roles` | List roles |

---

## Dashboard (`/api/dashboard`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/admin` | ✅ | admin | Admin overview stats |
| GET | `/org` | ✅ | org | Org dashboard (activities, registrations) |
| GET | `/individual` | ✅ | individual | Individual dashboard (posts, follows, etc.) |

---

## Common Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Missing or invalid token |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
