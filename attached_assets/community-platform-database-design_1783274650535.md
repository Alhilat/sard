# PostgreSQL Database Design
## Multi-Role Community & Learning Platform

**Document Version:** 1.0
**Database Engine:** PostgreSQL 14+
**Classification:** Internal / Engineering — Data Architecture

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [ER Diagram Description](#2-er-diagram-description)
3. [SQL Schema — Extensions & Types](#3-sql-schema--extensions--types)
4. [SQL CREATE TABLE Statements (by Domain)](#4-sql-create-table-statements-by-domain)
5. [Table-by-Table Explanation](#5-table-by-table-explanation)
6. [Relationship Explanation](#6-relationship-explanation)
7. [Indexing Strategy](#7-indexing-strategy)
8. [Normalization Notes & Deliberate Trade-offs](#8-normalization-notes--deliberate-trade-offs)
9. [Appendix — Full Table Inventory](#9-appendix--full-table-inventory)

---

## 1. Design Principles

- **3NF baseline.** Every table is normalized to Third Normal Form unless explicitly noted in Section 8 (polymorphic association tables trade strict referential integrity for schema flexibility — a deliberate, documented exception, not an oversight).
- **UUID primary keys** (`gen_random_uuid()`, via `pgcrypto`) are used platform-wide instead of auto-increment integers, since this avoids ID enumeration/guessing across a public-facing multi-tenant-like system and simplifies future horizontal sharding.
- **Soft deletes** (`deleted_at TIMESTAMPTZ`) are used on user-generated content tables (`posts`, `comments`) so moderation/audit history survives deletion; hard deletes are reserved for GDPR-style erasure requests, handled at the application layer.
- **`created_at` / `updated_at`** timestamp pairs are standard on every mutable table for auditability and cache invalidation.
- **Native PostgreSQL `ENUM` types** are used for small, stable, closed value sets (status fields, roles) rather than free-text or lookup tables, since these values do not need runtime extensibility and native enums give you index-friendly, self-documenting constraints.
- **Polymorphic association pattern** (`{x}able_type` + `{x}able_id`) is used only where a genuine cross-cutting capability applies to multiple unrelated entities — Likes, Comments, Reports, and Follows. This is called out explicitly in Section 8 along with the mitigation (application-level guards + optional trigger-based validation) since native foreign keys cannot target multiple tables.
- **Every organization is also a user.** `organizations` is a 1:1 extension table of `users` (much like `individual_profiles`), not a parallel identity system — this keeps Authentication and RBAC completely uniform across all three roles.

---

## 2. ER Diagram Description

Below is a textual ER description grouped by domain, since a rendered diagram isn't practical in Markdown. Arrows read "one → many" unless marked `(1:1)`.

### 2.1 Identity & Access
```
roles ─────────────┬──< role_permissions >───────── permissions
   │                                                       │
   │ (1:many)                                    (1:many) │
   ▼                                                       ▼
users ──< user_permissions >── permissions        (override grants)
  │ (1:1)
  ├──> individual_profiles
  │ (1:1)
  ├──> organizations ──< organization_verification_requests
  │
  ├──< refresh_tokens
  ├──< password_reset_tokens
  ├──< email_verification_tokens
  └──< media_files (uploader)
```

### 2.2 Social Domain
```
users ──< posts ──< post_media >── media_files
  │          │
  │          ├──< comments (polymorphic: post | blog_article) ──< comments (self-ref: parent_comment_id)
  │          ├──< likes (polymorphic: post | comment | blog_article)
  │          └──< shares >── posts (original_post reference)
  │
  ├──< follows (polymorphic: user | group)
  │
  └──< groups (creator) ──< group_members >── users
```

### 2.3 Learning & Events Domain
```
organizations ──< activities ──< activity_registrations >── users
organizations ──< courses ──< course_materials >── media_files
                       │
                       └──< course_registrations >── users
```

### 2.4 Engagement Domain
```
users (org/admin) ──< blog_articles >──< blog_article_categories >──< blog_categories
                              │
                              ├──< comments (polymorphic target)
                              └──< likes (polymorphic target)

users ──< notifications
users ──(1:1)── notification_preferences

users ──< message_conversation_participants >── message_conversations ──< messages >── users (sender)

users ──< ai_chat_conversations ──< ai_chat_messages
```

### 2.5 Governance Domain
```
users (reporter) ──< reports >── (polymorphic target: post | comment | blog_article | group | user | organization)
                          │
                          └── reviewed_by ──> users (admin)

users (admin) ──< admin_logs

settings (standalone key/value, updated_by ──> users)
```

---

## 3. SQL Schema — Extensions & Types

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ============ ENUM TYPES ============

CREATE TYPE user_status AS ENUM ('pending_verification', 'active', 'suspended', 'banned');
CREATE TYPE org_verification_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');
CREATE TYPE verification_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE content_status AS ENUM ('published', 'removed');
CREATE TYPE post_visibility AS ENUM ('public', 'followers', 'group');
CREATE TYPE commentable_type AS ENUM ('post', 'blog_article');
CREATE TYPE likeable_type AS ENUM ('post', 'comment', 'blog_article');
CREATE TYPE followable_type AS ENUM ('user', 'group');
CREATE TYPE reportable_type AS ENUM ('post', 'comment', 'blog_article', 'group', 'user', 'organization');
CREATE TYPE report_status AS ENUM ('pending', 'under_review', 'dismissed', 'action_taken');
CREATE TYPE group_visibility AS ENUM ('public', 'private');
CREATE TYPE group_status AS ENUM ('active', 'dissolved');
CREATE TYPE group_member_role AS ENUM ('member', 'moderator', 'creator');
CREATE TYPE group_member_status AS ENUM ('active', 'pending_request', 'removed');
CREATE TYPE location_type AS ENUM ('online', 'physical');
CREATE TYPE activity_status AS ENUM ('draft', 'published', 'completed', 'cancelled');
CREATE TYPE activity_registration_status AS ENUM ('registered', 'waitlisted', 'cancelled', 'attended');
CREATE TYPE course_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE course_registration_status AS ENUM ('enrolled', 'completed', 'cancelled', 'waitlisted');
CREATE TYPE blog_status AS ENUM ('draft', 'published', 'unpublished', 'removed');
CREATE TYPE ai_message_role AS ENUM ('user', 'assistant');
CREATE TYPE media_type AS ENUM ('image', 'video', 'document', 'other');
```

---

## 4. SQL CREATE TABLE Statements (by Domain)

### 4.1 Identity & Access Domain

```sql
-- ROLES
CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) UNIQUE NOT NULL,      -- 'individual' | 'organization' | 'admin'
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PERMISSIONS
CREATE TABLE permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(100) UNIQUE NOT NULL,     -- e.g. 'content.moderate', 'org.verify'
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ROLE <-> PERMISSIONS (many-to-many)
CREATE TABLE role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);

-- USERS (base identity table for all three roles)
CREATE TABLE users (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id            UUID NOT NULL REFERENCES roles(id),
    email              VARCHAR(255) UNIQUE NOT NULL,
    password_hash      VARCHAR(255) NOT NULL,
    status             user_status NOT NULL DEFAULT 'pending_verification',
    email_verified_at  TIMESTAMPTZ,
    last_login_at      TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at         TIMESTAMPTZ
);

-- USER-LEVEL PERMISSION OVERRIDES (e.g. "Moderator" scope without full Admin role)
CREATE TABLE user_permissions (
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by    UUID NOT NULL REFERENCES users(id),
    granted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, permission_id)
);

-- MEDIA FILES (generic file storage referenced by many domains)
CREATE TABLE media_files (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id UUID NOT NULL REFERENCES users(id),
    file_url    VARCHAR(500) NOT NULL,
    file_type   media_type NOT NULL,
    mime_type   VARCHAR(100),
    size_bytes  BIGINT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDIVIDUAL PROFILES (1:1 extension of users where role = individual)
CREATE TABLE individual_profiles (
    user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name         VARCHAR(150) NOT NULL,
    bio               TEXT,
    avatar_media_id   UUID REFERENCES media_files(id),
    country           VARCHAR(100),
    interests         JSONB DEFAULT '[]'::jsonb,
    privacy_settings  JSONB DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ORGANIZATIONS (1:1 extension of users where role = organization)
CREATE TABLE organizations (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    legal_name            VARCHAR(200) NOT NULL,
    display_name          VARCHAR(150) NOT NULL,
    description           TEXT,
    website               VARCHAR(255),
    logo_media_id         UUID REFERENCES media_files(id),
    cover_media_id        UUID REFERENCES media_files(id),
    verification_status   org_verification_status NOT NULL DEFAULT 'pending',
    verified_at           TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ORGANIZATION VERIFICATION REQUESTS (history of submissions/decisions)
CREATE TABLE organization_verification_requests (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_media_id  UUID NOT NULL REFERENCES media_files(id),
    status             verification_request_status NOT NULL DEFAULT 'pending',
    reviewed_by        UUID REFERENCES users(id),
    review_reason      TEXT,
    submitted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at        TIMESTAMPTZ
);

-- REFRESH TOKENS (long-lived auth sessions)
CREATE TABLE refresh_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   VARCHAR(255) NOT NULL,
    device_info  VARCHAR(255),
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PASSWORD RESET TOKENS
CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EMAIL VERIFICATION TOKENS
CREATE TABLE email_verification_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4.2 Social Domain

```sql
-- POSTS
CREATE TABLE posts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id   UUID NOT NULL REFERENCES users(id),
    content     TEXT NOT NULL,
    visibility  post_visibility NOT NULL DEFAULT 'public',
    group_id    UUID REFERENCES groups(id),         -- nullable; set if posted inside a group
    status      content_status NOT NULL DEFAULT 'published',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

-- POST <-> MEDIA (many-to-many; a post can carry multiple images/videos)
CREATE TABLE post_media (
    post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_id  UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    position  SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (post_id, media_id)
);

-- COMMENTS (polymorphic target: post | blog_article; supports nested replies)
CREATE TABLE comments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id          UUID NOT NULL REFERENCES users(id),
    commentable_type   commentable_type NOT NULL,
    commentable_id     UUID NOT NULL,
    parent_comment_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
    content            TEXT NOT NULL,
    status             content_status NOT NULL DEFAULT 'published',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at         TIMESTAMPTZ
);

-- LIKES (polymorphic target: post | comment | blog_article)
CREATE TABLE likes (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    likeable_type  likeable_type NOT NULL,
    likeable_id    UUID NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, likeable_type, likeable_id)
);

-- SHARES (always re-broadcasts a Post)
CREATE TABLE shares (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    commentary  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, post_id)
);

-- FOLLOWS (polymorphic target: user | group)
CREATE TABLE follows (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followable_type followable_type NOT NULL,
    followable_id   UUID NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (follower_id, followable_type, followable_id)
);

-- GROUPS
CREATE TABLE groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    creator_id      UUID NOT NULL REFERENCES users(id),
    visibility      group_visibility NOT NULL DEFAULT 'public',
    cover_media_id  UUID REFERENCES media_files(id),
    status          group_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GROUP MEMBERS
CREATE TABLE group_members (
    group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       group_member_role NOT NULL DEFAULT 'member',
    status     group_member_status NOT NULL DEFAULT 'active',
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);
```

> **Note:** `posts.group_id` references `groups(id)`, and `groups.creator_id` references `users(id)` — this creates a forward reference in a single migration file. In practice, split into two migrations (create `groups` before `posts`) or add the `group_id` column via `ALTER TABLE` after both tables exist. The dependency is called out here so it isn't missed during migration-file ordering.

### 4.3 Learning & Events Domain

```sql
-- ACTIVITIES (organization-hosted events)
CREATE TABLE activities (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    location_type    location_type NOT NULL,
    location_value   VARCHAR(500),          -- physical address OR online meeting link
    start_at         TIMESTAMPTZ NOT NULL,
    end_at           TIMESTAMPTZ NOT NULL,
    capacity         INTEGER NOT NULL CHECK (capacity > 0),
    status           activity_status NOT NULL DEFAULT 'draft',
    cover_media_id   UUID REFERENCES media_files(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ACTIVITY REGISTRATIONS
CREATE TABLE activity_registrations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id   UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status        activity_registration_status NOT NULL DEFAULT 'registered',
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cancelled_at  TIMESTAMPTZ,
    UNIQUE (activity_id, user_id)
);

-- COURSES (organization-hosted structured learning)
CREATE TABLE courses (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    syllabus         TEXT,
    schedule         JSONB,                  -- flexible session/date structure
    capacity         INTEGER CHECK (capacity > 0),
    prerequisites    TEXT,
    status           course_status NOT NULL DEFAULT 'draft',
    cover_media_id   UUID REFERENCES media_files(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COURSE MATERIALS (many files per course)
CREATE TABLE course_materials (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    media_id   UUID NOT NULL REFERENCES media_files(id),
    title      VARCHAR(200),
    position   SMALLINT NOT NULL DEFAULT 0
);

-- COURSE REGISTRATIONS (enrollments)
CREATE TABLE course_registrations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status            course_registration_status NOT NULL DEFAULT 'enrolled',
    progress_percent  SMALLINT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    enrolled_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at      TIMESTAMPTZ,
    UNIQUE (course_id, user_id)
);
```

### 4.4 Engagement Domain

```sql
-- BLOG CATEGORIES
CREATE TABLE blog_categories (
    id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name  VARCHAR(100) UNIQUE NOT NULL,
    slug  VARCHAR(120) UNIQUE NOT NULL
);

-- BLOG ARTICLES (authored by an Organization's or Admin's user account)
CREATE TABLE blog_articles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID NOT NULL REFERENCES users(id),
    title           VARCHAR(250) NOT NULL,
    slug            VARCHAR(280) UNIQUE NOT NULL,
    content         TEXT NOT NULL,
    cover_media_id  UUID REFERENCES media_files(id),
    status          blog_status NOT NULL DEFAULT 'draft',
    featured        BOOLEAN NOT NULL DEFAULT false,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BLOG ARTICLE <-> CATEGORY (many-to-many)
CREATE TABLE blog_article_categories (
    article_id   UUID NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,
    category_id  UUID NOT NULL REFERENCES blog_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, category_id)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          VARCHAR(60) NOT NULL,        -- e.g. 'new_follower', 'comment', 'org_verified'
    payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_read       BOOLEAN NOT NULL DEFAULT false,
    read_at       TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NOTIFICATION PREFERENCES (1:1 with users)
CREATE TABLE notification_preferences (
    user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    in_app_enabled   BOOLEAN NOT NULL DEFAULT true,
    email_enabled    BOOLEAN NOT NULL DEFAULT true,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MESSAGE CONVERSATIONS (container for a DM thread)
CREATE TABLE message_conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CONVERSATION PARTICIPANTS (many-to-many; supports 1:1 and group DMs)
CREATE TABLE message_conversation_participants (
    conversation_id  UUID NOT NULL REFERENCES message_conversations(id) ON DELETE CASCADE,
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);

-- MESSAGES
CREATE TABLE messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID NOT NULL REFERENCES message_conversations(id) ON DELETE CASCADE,
    sender_id        UUID NOT NULL REFERENCES users(id),
    content          TEXT,
    media_id         UUID REFERENCES media_files(id),
    sent_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at          TIMESTAMPTZ
);

-- AI CHAT CONVERSATIONS
CREATE TABLE ai_chat_conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200),
    started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at    TIMESTAMPTZ
);

-- AI CHAT MESSAGES
CREATE TABLE ai_chat_messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID NOT NULL REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
    role             ai_message_role NOT NULL,
    content          TEXT NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4.5 Governance Domain

```sql
-- REPORTS (polymorphic target: post | comment | blog_article | group | user | organization)
CREATE TABLE reports (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id      UUID NOT NULL REFERENCES users(id),
    reportable_type  reportable_type NOT NULL,
    reportable_id    UUID NOT NULL,
    reason           VARCHAR(100) NOT NULL,
    details          TEXT,
    status           report_status NOT NULL DEFAULT 'pending',
    reviewed_by      UUID REFERENCES users(id),
    reviewed_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ADMIN LOGS (immutable audit trail)
CREATE TABLE admin_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id     UUID NOT NULL REFERENCES users(id),
    action       VARCHAR(100) NOT NULL,     -- e.g. 'organization.verify', 'user.suspend'
    target_type  VARCHAR(50) NOT NULL,
    target_id    UUID NOT NULL,
    reason       TEXT,
    metadata     JSONB DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SETTINGS (system-wide config / feature flags)
CREATE TABLE settings (
    key          VARCHAR(100) PRIMARY KEY,
    value        JSONB NOT NULL,
    description  TEXT,
    updated_by   UUID REFERENCES users(id),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 5. Table-by-Table Explanation

| Table | Purpose |
|---|---|
| `roles` | The three closed top-level roles (`individual`, `organization`, `admin`). Small, rarely-changed lookup table. |
| `permissions` | Fine-grained capability codes (e.g. `content.moderate`) usable both at the role level and the individual-user override level. |
| `role_permissions` | Default permission set granted to every user of a given role. |
| `users` | The single identity table for **all** roles — authentication, status, and role assignment live here regardless of whether the account is an Individual, Organization, or Admin. |
| `user_permissions` | Per-user permission grants that sit on top of the role defaults (e.g. a "Moderator" scope for a specific Individual, per FR-RBAC-3), with an audit trail of who granted it. |
| `media_files` | Central file registry (images, videos, documents) referenced by avatars, posts, courses, activities, blog covers, and messages — a single storage abstraction instead of duplicating file metadata per feature. |
| `individual_profiles` | 1:1 extension of `users` holding Individual-specific public profile data (bio, interests, avatar). |
| `organizations` | 1:1 extension of `users` holding Organization-specific data and the `verification_status` state machine. |
| `organization_verification_requests` | Full history of verification submissions/decisions — supports the `pending → rejected → resubmit → pending` cycle from the SRS. |
| `refresh_tokens` | Long-lived session tokens supporting multi-device login and "logout everywhere" (FR-AUTH-6). |
| `password_reset_tokens` | Single-use, expiring tokens for the password-reset flow. |
| `email_verification_tokens` | Single-use, expiring tokens for the email-verification flow (FR-AUTH-5). |
| `posts` | Core social-feed content unit; can optionally belong to a `group`. |
| `post_media` | Junction table allowing a post to carry multiple attached media files in order. |
| `comments` | Threaded comments; polymorphic so the same table serves both Post comments and Blog comments, with `parent_comment_id` enabling one level (or more) of nested replies. |
| `likes` | Generic reaction table, polymorphic across Posts, Comments, and Blog Articles, with a uniqueness constraint preventing duplicate likes. |
| `shares` | Records a re-broadcast of a Post to the sharer's own feed, with optional commentary. |
| `follows` | The follow graph; polymorphic so a user can follow either another User (including Organization accounts, since Organizations are Users) or a Group. |
| `groups` | Community sub-spaces with public/private visibility and their own moderation. |
| `group_members` | Membership + role (`member`/`moderator`/`creator`) + status (handles private-group join requests). |
| `activities` | Organization-hosted events (in-person or online) with scheduling and capacity. |
| `activity_registrations` | Enrollment lifecycle for Activities, including waitlisting and attendance tracking. |
| `courses` | Organization-hosted structured learning content with syllabus, schedule, and capacity. |
| `course_materials` | Ordered set of files attached to a course (readings, slides, recordings). |
| `course_registrations` | Enrollment lifecycle for Courses, including progress tracking and completion state. |
| `blog_categories` | Taxonomy for discoverability of blog content. |
| `blog_articles` | Long-form publishing content, authored by an Organization's or Admin's user account. |
| `blog_article_categories` | Many-to-many tagging of articles to categories. |
| `notifications` | Per-user notification feed, generated by domain events across the whole platform. |
| `notification_preferences` | Per-user opt-in/out of in-app vs. email notification channels. |
| `message_conversations` | Container for a direct-message thread (supports 1:1 or group DMs). |
| `message_conversation_participants` | Many-to-many membership of a conversation. |
| `messages` | Individual DM messages, optionally carrying a media attachment. |
| `ai_chat_conversations` | Groups a user's AI Assistant chat turns into a session/thread. |
| `ai_chat_messages` | Individual turns (user prompt / assistant reply) within an AI conversation, kept for the FR-AI-4 logging/disclosure requirement. |
| `reports` | User-submitted content/account reports, polymorphic across the reportable entity types, feeding the Admin moderation queue. |
| `admin_logs` | Immutable audit trail of every privileged Admin action, satisfying FR-ADMIN-6. |
| `settings` | Platform-wide key/value configuration and feature flags. |

---

## 6. Relationship Explanation

- **`roles` → `users` (1:many).** Every user has exactly one role at any time; role escalation (Individual → Organization) is an application-level workflow that updates this FK under Admin approval, never a client-writable field (FR-RBAC-2).
- **`roles`/`permissions` ↔ `role_permissions` (many:many).** Decouples "what a role can do" from the role definition itself, so permissions can be re-composed without schema changes.
- **`users` ↔ `permissions` via `user_permissions` (many:many).** Additive, per-user overrides layered on top of role defaults — this is how a Moderator scope is granted to a specific Individual without promoting them to Admin.
- **`users` → `individual_profiles` (1:1).** Split out so the core auth table (`users`) stays lean and identical in shape across all three roles, while role-specific attributes live in their own extension table.
- **`users` → `organizations` (1:1).** Same rationale as above; an Organization *is* a user account with an extension row. This is why `follows.followable_type = 'user'` is sufficient to let Individuals follow Organizations — no separate follow mechanism is needed.
- **`organizations` → `organization_verification_requests` (1:many).** One organization can have multiple verification attempts over time (rejected → resubmitted), each independently auditable.
- **`users` → `refresh_tokens` / `password_reset_tokens` / `email_verification_tokens` (1:many).** Standard multi-device / multi-attempt auth token patterns; each row is independently revocable/expirable.
- **`media_files` → many domains (1:many, referenced from many tables).** A single upload can be reused as an avatar, a post attachment, a course material, etc.; centralizing storage metadata avoids duplicating `file_url`/`mime_type` logic everywhere.
- **`users` → `posts` (1:many)**, **`posts` ↔ `media_files` via `post_media` (many:many)**, **`groups` → `posts` (1:many, nullable)** — a post is always authored by a user, optionally scoped to a group, and can carry zero or more media attachments.
- **`comments` (polymorphic) → `posts`/`blog_articles`.** Rather than two near-identical `post_comments` and `blog_comments` tables, one `comments` table serves both, keyed by `(commentable_type, commentable_id)`. `parent_comment_id` self-references `comments.id` for nested replies.
- **`likes` (polymorphic) → `posts`/`comments`/`blog_articles`.** Same rationale as comments; the `UNIQUE(user_id, likeable_type, likeable_id)` constraint is what actually enforces "one like per user per item," which is the important business rule here.
- **`shares` → `users` + `posts` (many:1 each).** A share always points back to an original Post; the `UNIQUE(user_id, post_id)` prevents a user from sharing the same post twice (an app-level "unshare" simply deletes the row).
- **`follows` (polymorphic) → `users`/`groups`.** One follow-graph table for both "follow a person/org" and "follow a group," which is what powers Feed composition (SRS FR-FEED-1).
- **`groups` → `group_members` (1:many) → `users` (many:1).** Standard membership junction, carrying both a `role` (creator/moderator/member) and a `status` (to represent pending join requests on private groups per FR-GROUP-2).
- **`organizations` → `activities` / `courses` (1:many).** Only Organizations own Activities and Courses, matching FR-ACT-1 / FR-COURSE-1 (enforced at the FK level structurally, and additionally at the RBAC layer for verified-only creation).
- **`activities`/`courses` → their `*_registrations` tables (1:many) → `users` (many:1).** These are two independent tables rather than a single shared table so each can carry domain-specific fields (`progress_percent` for courses, nothing analogous for activities) — while the *business logic* for capacity/waitlisting is still shared at the application layer (the "Enrollment abstraction" from the SRS), it doesn't need to be a shared *table* since the two domains have diverging attributes.
- **`courses` → `course_materials` (1:many) → `media_files` (many:1).** Ordered material list per course.
- **`blog_articles` ↔ `blog_categories` via `blog_article_categories` (many:many).** Standard tagging junction.
- **`users` → `notifications` (1:many).** Every domain event that should surface to a user lands here as a row; `payload` (JSONB) carries event-specific data without needing a notification-type-specific column set.
- **`users` → `notification_preferences` (1:1).** One settings row per user.
- **`message_conversations` ↔ `users` via `message_conversation_participants` (many:many); `message_conversations` → `messages` (1:many).** Splitting participants from messages lets a conversation support 2+ participants without schema change, and lets you add/remove participants over time (group DMs) if needed later.
- **`users` → `ai_chat_conversations` (1:many) → `ai_chat_messages` (1:many).** Each user's assistant history is threaded into conversations, each holding an ordered list of user/assistant turns.
- **`users` (reporter) → `reports` (1:many); `reports.reviewed_by` → `users` (admin, nullable).** Reports are polymorphic across six target types and always trace back to both who filed and who (if anyone) reviewed them.
- **`users` (admin) → `admin_logs` (1:many).** Every privileged action an Admin takes is written here, never updated or deleted (immutability enforced at the application/DB-permission layer, e.g. `REVOKE UPDATE, DELETE` for the app role on this table).
- **`settings.updated_by` → `users` (many:1, nullable).** Tracks which admin last changed a given config key.

---

## 7. Indexing Strategy

Primary keys are automatically indexed by PostgreSQL (B-tree on UUID). The additional indexes below target the platform's actual read patterns: feed composition, dashboard queries, auth lookups, and moderation queues.

```sql
-- Authentication / lookups
CREATE UNIQUE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role_id ON users (role_id);
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);

-- Organizations & verification
CREATE INDEX idx_organizations_verification_status ON organizations (verification_status);
CREATE INDEX idx_org_verification_requests_org_id ON organization_verification_requests (organization_id);
CREATE INDEX idx_org_verification_requests_status ON organization_verification_requests (status);

-- Posts / Feed composition (the hottest read path in the system)
CREATE INDEX idx_posts_author_id ON posts (author_id);
CREATE INDEX idx_posts_group_id ON posts (group_id) WHERE group_id IS NOT NULL;
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX idx_posts_status_created_at ON posts (status, created_at DESC);

-- Comments (polymorphic lookups)
CREATE INDEX idx_comments_commentable ON comments (commentable_type, commentable_id);
CREATE INDEX idx_comments_parent_comment_id ON comments (parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_comments_author_id ON comments (author_id);

-- Likes (polymorphic lookups; UNIQUE constraint already creates a supporting index)
CREATE INDEX idx_likes_likeable ON likes (likeable_type, likeable_id);

-- Shares
CREATE INDEX idx_shares_post_id ON shares (post_id);

-- Follows (both directions matter: "who does X follow" and "who follows X")
CREATE INDEX idx_follows_follower_id ON follows (follower_id);
CREATE INDEX idx_follows_followable ON follows (followable_type, followable_id);

-- Groups
CREATE INDEX idx_group_members_user_id ON group_members (user_id);
CREATE INDEX idx_groups_visibility_status ON groups (visibility, status);

-- Activities & registrations
CREATE INDEX idx_activities_organization_id ON activities (organization_id);
CREATE INDEX idx_activities_status_start_at ON activities (status, start_at);
CREATE INDEX idx_activity_registrations_activity_id ON activity_registrations (activity_id);
CREATE INDEX idx_activity_registrations_user_id ON activity_registrations (user_id);

-- Courses & registrations
CREATE INDEX idx_courses_organization_id ON courses (organization_id);
CREATE INDEX idx_courses_status ON courses (status);
CREATE INDEX idx_course_registrations_course_id ON course_registrations (course_id);
CREATE INDEX idx_course_registrations_user_id ON course_registrations (user_id);

-- Blog
CREATE UNIQUE INDEX idx_blog_articles_slug ON blog_articles (slug);
CREATE INDEX idx_blog_articles_status_published_at ON blog_articles (status, published_at DESC);
CREATE INDEX idx_blog_articles_author_id ON blog_articles (author_id);

-- Notifications (dashboard badge + list queries)
CREATE INDEX idx_notifications_recipient_unread ON notifications (recipient_id, is_read, created_at DESC);

-- Messaging
CREATE INDEX idx_messages_conversation_id_sent_at ON messages (conversation_id, sent_at);
CREATE INDEX idx_conversation_participants_user_id ON message_conversation_participants (user_id);

-- AI Assistant
CREATE INDEX idx_ai_chat_messages_conversation_id ON ai_chat_messages (conversation_id, created_at);
CREATE INDEX idx_ai_chat_conversations_user_id ON ai_chat_conversations (user_id);

-- Governance / Moderation queue
CREATE INDEX idx_reports_status_created_at ON reports (status, created_at);
CREATE INDEX idx_reports_reportable ON reports (reportable_type, reportable_id);
CREATE INDEX idx_admin_logs_admin_id ON admin_logs (admin_id);
CREATE INDEX idx_admin_logs_target ON admin_logs (target_type, target_id);
```

**Rationale highlights:**
- Composite `(status, created_at DESC)` indexes on `posts` and `blog_articles` directly support the most common query shape: "published items, newest first."
- Partial indexes (`WHERE group_id IS NOT NULL`, `WHERE parent_comment_id IS NOT NULL`) avoid indexing the majority-NULL rows, keeping these indexes small and fast.
- The `(recipient_id, is_read, created_at DESC)` composite on `notifications` matches the dashboard's exact query: unread notifications for me, newest first.
- Polymorphic tables (`comments`, `likes`, `follows`, `reports`) always get a composite index on `(x_type, x_id)` since every query against them filters by both.

---

## 8. Normalization Notes & Deliberate Trade-offs

1. **Polymorphic associations (`comments`, `likes`, `follows`, `reports`) are a deliberate denormalization.** A fully normalized alternative would require separate tables (`post_comments`, `blog_comments`, `post_likes`, `comment_likes`, `blog_likes`, etc.), which avoids the need for application-level integrity checks but multiplies table count and duplicates near-identical logic across the codebase. This design accepts that trade-off: referential integrity for the polymorphic `_id` column **cannot** be enforced by a native FK (since it may point to one of several tables), so it must be enforced at the application layer and/or via a `CHECK`-constrained enum plus an optional `BEFORE INSERT/UPDATE` trigger that validates the target row actually exists in the corresponding table.
2. **`activity_registrations` and `course_registrations` are separate tables, not a single polymorphic "enrollments" table.** Unlike the cases above, these two have diverging attributes (`progress_percent` exists only for courses) and are queried independently from two very different UI surfaces (Activity detail vs. Course detail), so separate tables with shared *application-layer* logic (per the SRS's "Enrollment abstraction") is cleaner than forcing them into one schema with a pile of nullable columns.
3. **`schedule` on `courses` and `payload` on `notifications`/`metadata` on `admin_logs` use `JSONB`** rather than fully normalized child tables, because their internal shape is either genuinely variable (notification payloads differ per `type`) or not queried relationally in the current scope (a course's session schedule is read as a whole, not filtered by individual session). If session-level querying becomes a requirement later (e.g., "show me all courses with a session on Tuesday evenings"), a `course_sessions` child table should be introduced at that point — this is flagged here so it isn't forgotten.
4. **No table stores denormalized counters** (e.g., `posts.like_count`). For MVP, counts are computed with `COUNT(*)` against `likes`/`comments`/`shares` filtered by the polymorphic key, which is correct-by-construction and index-supported. If profiling later shows this is too slow at scale, introduce denormalized counter columns updated via triggers or the async event bus described in the System Architecture document — not before, to avoid premature complexity.
5. **Soft delete vs. hard delete.** `deleted_at` on `posts` and `comments` preserves moderation history (an Admin needs to see what was removed and why); everything else either has no user-facing "delete" (e.g., `admin_logs`, which is append-only) or is safe to hard-delete (e.g., `refresh_tokens`, `notifications`).

---

## 9. Appendix — Full Table Inventory

| # | Table | Domain |
|---|---|---|
| 1 | `roles` | Identity & Access |
| 2 | `permissions` | Identity & Access |
| 3 | `role_permissions` | Identity & Access |
| 4 | `users` | Identity & Access |
| 5 | `user_permissions` | Identity & Access |
| 6 | `media_files` | Identity & Access (shared) |
| 7 | `individual_profiles` | Identity & Access |
| 8 | `organizations` | Identity & Access |
| 9 | `organization_verification_requests` | Identity & Access |
| 10 | `refresh_tokens` | Identity & Access |
| 11 | `password_reset_tokens` | Identity & Access |
| 12 | `email_verification_tokens` | Identity & Access |
| 13 | `posts` | Social |
| 14 | `post_media` | Social |
| 15 | `comments` | Social |
| 16 | `likes` | Social |
| 17 | `shares` | Social |
| 18 | `follows` | Social |
| 19 | `groups` | Social |
| 20 | `group_members` | Social |
| 21 | `activities` | Learning & Events |
| 22 | `activity_registrations` | Learning & Events |
| 23 | `courses` | Learning & Events |
| 24 | `course_materials` | Learning & Events |
| 25 | `course_registrations` | Learning & Events |
| 26 | `blog_categories` | Engagement |
| 27 | `blog_articles` | Engagement |
| 28 | `blog_article_categories` | Engagement |
| 29 | `notifications` | Engagement |
| 30 | `notification_preferences` | Engagement |
| 31 | `message_conversations` | Engagement |
| 32 | `message_conversation_participants` | Engagement |
| 33 | `messages` | Engagement |
| 34 | `ai_chat_conversations` | Engagement |
| 35 | `ai_chat_messages` | Engagement |
| 36 | `reports` | Governance |
| 37 | `admin_logs` | Governance |
| 38 | `settings` | Governance |

**Total: 38 tables** across 4 domains, directly mirroring the module breakdown in the platform's System Architecture document (Identity & Access, Social, Learning & Events, Engagement domains, plus a Governance layer for Admin/Reports/Audit).

---

*End of Document.*
