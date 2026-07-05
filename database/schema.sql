-- =============================================================================
-- Multi-Role Community & Learning Platform — PostgreSQL Schema
-- Version: 1.0
-- Engine:  PostgreSQL 14+
-- =============================================================================
-- Creation order is carefully chosen to respect FK dependencies:
--   1. Extensions & ENUM types
--   2. Identity & Access (roles → users → profiles/orgs → tokens)
--   3. Social (groups BEFORE posts due to posts.group_id → groups.id)
--   4. Learning & Events
--   5. Engagement
--   6. Governance
--   7. Indexes
-- =============================================================================


-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()


-- =============================================================================
-- 2. ENUM TYPES
-- =============================================================================

-- Identity & Access
CREATE TYPE user_status AS ENUM (
    'pending_verification',
    'active',
    'suspended',
    'banned'
);

CREATE TYPE org_verification_status AS ENUM (
    'pending',
    'verified',
    'rejected',
    'suspended'
);

CREATE TYPE verification_request_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);

CREATE TYPE media_type AS ENUM (
    'image',
    'video',
    'document',
    'other'
);

-- Social
CREATE TYPE content_status AS ENUM (
    'published',
    'removed'
);

CREATE TYPE post_visibility AS ENUM (
    'public',
    'followers',
    'group'
);

CREATE TYPE commentable_type AS ENUM (
    'post',
    'blog_article'
);

CREATE TYPE likeable_type AS ENUM (
    'post',
    'comment',
    'blog_article'
);

CREATE TYPE followable_type AS ENUM (
    'user',
    'group'
);

CREATE TYPE group_visibility AS ENUM (
    'public',
    'private'
);

CREATE TYPE group_status AS ENUM (
    'active',
    'dissolved'
);

CREATE TYPE group_member_role AS ENUM (
    'member',
    'moderator',
    'creator'
);

CREATE TYPE group_member_status AS ENUM (
    'active',
    'pending_request',
    'removed'
);

-- Learning & Events
CREATE TYPE location_type AS ENUM (
    'online',
    'physical'
);

CREATE TYPE activity_status AS ENUM (
    'draft',
    'published',
    'completed',
    'cancelled'
);

CREATE TYPE activity_registration_status AS ENUM (
    'registered',
    'waitlisted',
    'cancelled',
    'attended'
);

CREATE TYPE course_status AS ENUM (
    'draft',
    'published',
    'cancelled',
    'completed'
);

CREATE TYPE course_registration_status AS ENUM (
    'enrolled',
    'completed',
    'cancelled',
    'waitlisted'
);

-- Engagement
CREATE TYPE blog_status AS ENUM (
    'draft',
    'published',
    'unpublished',
    'removed'
);

CREATE TYPE ai_message_role AS ENUM (
    'user',
    'assistant'
);

-- Governance
CREATE TYPE reportable_type AS ENUM (
    'post',
    'comment',
    'blog_article',
    'group',
    'user',
    'organization'
);

CREATE TYPE report_status AS ENUM (
    'pending',
    'under_review',
    'dismissed',
    'action_taken'
);


-- =============================================================================
-- 3. IDENTITY & ACCESS DOMAIN
-- =============================================================================

-- ─── Roles ────────────────────────────────────────────────────────────────────
CREATE TABLE roles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) UNIQUE NOT NULL,   -- 'individual' | 'organization' | 'admin'
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Permissions ──────────────────────────────────────────────────────────────
CREATE TABLE permissions (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(100) UNIQUE NOT NULL,  -- e.g. 'content.moderate', 'org.verify'
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── Role ↔ Permissions (many-to-many) ─────────────────────────────────────--
CREATE TABLE role_permissions (
    role_id       UUID        NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
    permission_id UUID        NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);

-- ─── Users (base identity for ALL roles) ─────────────────────────────────────
CREATE TABLE users (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id           UUID        NOT NULL REFERENCES roles(id),
    email             VARCHAR(255) UNIQUE NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    status            user_status  NOT NULL DEFAULT 'pending_verification',
    email_verified_at TIMESTAMPTZ,
    last_login_at     TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ
);

-- ─── User-level permission overrides ─────────────────────────────────────────
-- Additive grants layered on top of role defaults
-- (e.g. "Moderator" scope for a specific Individual without Admin role)
CREATE TABLE user_permissions (
    user_id       UUID        NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    permission_id UUID        NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by    UUID        NOT NULL REFERENCES users(id),
    granted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, permission_id)
);

-- ─── Media Files (central file registry) ─────────────────────────────────────
-- Referenced by avatars, posts, courses, activities, blog covers, messages, etc.
CREATE TABLE media_files (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id UUID         NOT NULL REFERENCES users(id),
    file_url    VARCHAR(500) NOT NULL,
    file_type   media_type   NOT NULL,
    mime_type   VARCHAR(100),
    size_bytes  BIGINT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── Individual Profiles (1:1 extension of users, role = individual) ──────────
CREATE TABLE individual_profiles (
    user_id          UUID         PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name        VARCHAR(150) NOT NULL,
    bio              TEXT,
    avatar_media_id  UUID         REFERENCES media_files(id),
    country          VARCHAR(100),
    interests        JSONB        NOT NULL DEFAULT '[]'::jsonb,
    privacy_settings JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── Organizations (1:1 extension of users, role = organization) ─────────────
CREATE TABLE organizations (
    id                  UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID                    NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    legal_name          VARCHAR(200)            NOT NULL,
    display_name        VARCHAR(150)            NOT NULL,
    description         TEXT,
    website             VARCHAR(255),
    logo_media_id       UUID                    REFERENCES media_files(id),
    cover_media_id      UUID                    REFERENCES media_files(id),
    verification_status org_verification_status NOT NULL DEFAULT 'pending',
    verified_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT now()
);

-- ─── Organization Verification Requests ──────────────────────────────────────
-- Full history of submissions/decisions (supports pending → rejected → resubmit cycle)
CREATE TABLE organization_verification_requests (
    id                UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID                        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_media_id UUID                        NOT NULL REFERENCES media_files(id),
    status            verification_request_status NOT NULL DEFAULT 'pending',
    reviewed_by       UUID                        REFERENCES users(id),
    review_reason     TEXT,
    submitted_at      TIMESTAMPTZ                 NOT NULL DEFAULT now(),
    reviewed_at       TIMESTAMPTZ
);

-- ─── Refresh Tokens ───────────────────────────────────────────────────────────
-- Long-lived session tokens; supports multi-device login and "logout everywhere"
CREATE TABLE refresh_tokens (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    device_info VARCHAR(255),
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── Password Reset Tokens ────────────────────────────────────────────────────
CREATE TABLE password_reset_tokens (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── Email Verification Tokens ────────────────────────────────────────────────
CREATE TABLE email_verification_tokens (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);


-- =============================================================================
-- 4. SOCIAL DOMAIN
-- NOTE: groups is created BEFORE posts because posts.group_id → groups.id
-- =============================================================================

-- ─── Groups ───────────────────────────────────────────────────────────────────
CREATE TABLE groups (
    id             UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(150)     NOT NULL,
    description    TEXT,
    creator_id     UUID             NOT NULL REFERENCES users(id),
    visibility     group_visibility NOT NULL DEFAULT 'public',
    cover_media_id UUID             REFERENCES media_files(id),
    status         group_status     NOT NULL DEFAULT 'active',
    created_at     TIMESTAMPTZ      NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ      NOT NULL DEFAULT now()
);

-- ─── Group Members ────────────────────────────────────────────────────────────
-- Carries role (creator/moderator/member) and status (handles private-group join requests)
CREATE TABLE group_members (
    group_id  UUID                NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id   UUID                NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    role      group_member_role   NOT NULL DEFAULT 'member',
    status    group_member_status NOT NULL DEFAULT 'active',
    joined_at TIMESTAMPTZ         NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

-- ─── Posts ────────────────────────────────────────────────────────────────────
CREATE TABLE posts (
    id         UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id  UUID            NOT NULL REFERENCES users(id),
    content    TEXT            NOT NULL,
    visibility post_visibility NOT NULL DEFAULT 'public',
    group_id   UUID            REFERENCES groups(id),    -- nullable; set if posted inside a group
    status     content_status  NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ     NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- ─── Post ↔ Media (many-to-many; ordered attachments) ────────────────────────
CREATE TABLE post_media (
    post_id  UUID     NOT NULL REFERENCES posts(id)       ON DELETE CASCADE,
    media_id UUID     NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    position SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (post_id, media_id)
);

-- ─── Comments (polymorphic: post | blog_article; supports nested replies) ─────
CREATE TABLE comments (
    id                UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id         UUID             NOT NULL REFERENCES users(id),
    commentable_type  commentable_type NOT NULL,
    commentable_id    UUID             NOT NULL,
    parent_comment_id UUID             REFERENCES comments(id) ON DELETE CASCADE,
    content           TEXT             NOT NULL,
    status            content_status   NOT NULL DEFAULT 'published',
    created_at        TIMESTAMPTZ      NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ      NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ
);

-- ─── Likes (polymorphic: post | comment | blog_article) ──────────────────────
-- UNIQUE constraint enforces one-like-per-user-per-item
CREATE TABLE likes (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    likeable_type likeable_type NOT NULL,
    likeable_id   UUID          NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    UNIQUE (user_id, likeable_type, likeable_id)
);

-- ─── Shares ───────────────────────────────────────────────────────────────────
-- Re-broadcasts a Post to the sharer's feed; "unshare" = DELETE the row
CREATE TABLE shares (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    post_id    UUID        NOT NULL REFERENCES posts(id)  ON DELETE CASCADE,
    commentary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, post_id)
);

-- ─── Follows (polymorphic: user | group) ─────────────────────────────────────
-- Powers feed composition; following an org account uses followable_type = 'user'
CREATE TABLE follows (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followable_type followable_type NOT NULL,
    followable_id   UUID            NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    UNIQUE (follower_id, followable_type, followable_id)
);


-- =============================================================================
-- 5. LEARNING & EVENTS DOMAIN
-- =============================================================================

-- ─── Activities (organization-hosted events) ─────────────────────────────────
CREATE TABLE activities (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID            NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title           VARCHAR(200)    NOT NULL,
    description     TEXT,
    location_type   location_type   NOT NULL,
    location_value  VARCHAR(500),   -- physical address OR online meeting link
    start_at        TIMESTAMPTZ     NOT NULL,
    end_at          TIMESTAMPTZ     NOT NULL,
    capacity        INTEGER         NOT NULL CHECK (capacity > 0),
    status          activity_status NOT NULL DEFAULT 'draft',
    cover_media_id  UUID            REFERENCES media_files(id),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- ─── Activity Registrations ───────────────────────────────────────────────────
CREATE TABLE activity_registrations (
    id            UUID                         PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id   UUID                         NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id       UUID                         NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    status        activity_registration_status NOT NULL DEFAULT 'registered',
    registered_at TIMESTAMPTZ                  NOT NULL DEFAULT now(),
    cancelled_at  TIMESTAMPTZ,
    UNIQUE (activity_id, user_id)
);

-- ─── Courses (organization-hosted structured learning) ───────────────────────
CREATE TABLE courses (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title           VARCHAR(200)  NOT NULL,
    description     TEXT,
    syllabus        TEXT,
    schedule        JSONB,        -- flexible session/date structure (see normalization note §8.3)
    capacity        INTEGER       CHECK (capacity > 0),
    prerequisites   TEXT,
    status          course_status NOT NULL DEFAULT 'draft',
    cover_media_id  UUID          REFERENCES media_files(id),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ─── Course Materials (ordered file list per course) ─────────────────────────
CREATE TABLE course_materials (
    id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID         NOT NULL REFERENCES courses(id)      ON DELETE CASCADE,
    media_id  UUID         NOT NULL REFERENCES media_files(id),
    title     VARCHAR(200),
    position  SMALLINT     NOT NULL DEFAULT 0
);

-- ─── Course Registrations (enrollments) ──────────────────────────────────────
CREATE TABLE course_registrations (
    id               UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id        UUID                      NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id          UUID                      NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    status           course_registration_status NOT NULL DEFAULT 'enrolled',
    progress_percent SMALLINT                  NOT NULL DEFAULT 0
                                               CHECK (progress_percent BETWEEN 0 AND 100),
    enrolled_at      TIMESTAMPTZ               NOT NULL DEFAULT now(),
    completed_at     TIMESTAMPTZ,
    UNIQUE (course_id, user_id)
);


-- =============================================================================
-- 6. ENGAGEMENT DOMAIN
-- =============================================================================

-- ─── Blog Categories ─────────────────────────────────────────────────────────
CREATE TABLE blog_categories (
    id   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL
);

-- ─── Blog Articles (authored by an Organization or Admin user account) ────────
CREATE TABLE blog_articles (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id      UUID         NOT NULL REFERENCES users(id),
    title          VARCHAR(250) NOT NULL,
    slug           VARCHAR(280) UNIQUE NOT NULL,
    content        TEXT         NOT NULL,
    cover_media_id UUID         REFERENCES media_files(id),
    status         blog_status  NOT NULL DEFAULT 'draft',
    featured       BOOLEAN      NOT NULL DEFAULT false,
    published_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── Blog Article ↔ Category (many-to-many) ──────────────────────────────────
CREATE TABLE blog_article_categories (
    article_id  UUID NOT NULL REFERENCES blog_articles(id)    ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES blog_categories(id)  ON DELETE CASCADE,
    PRIMARY KEY (article_id, category_id)
);

-- ─── Notifications ────────────────────────────────────────────────────────────
-- payload (JSONB) carries event-specific data without per-type column explosion
CREATE TABLE notifications (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         VARCHAR(60) NOT NULL,  -- e.g. 'new_follower', 'comment', 'org_verified'
    payload      JSONB       NOT NULL DEFAULT '{}'::jsonb,
    is_read      BOOLEAN     NOT NULL DEFAULT false,
    read_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Notification Preferences (1:1 with users) ───────────────────────────────
CREATE TABLE notification_preferences (
    user_id        UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    in_app_enabled BOOLEAN     NOT NULL DEFAULT true,
    email_enabled  BOOLEAN     NOT NULL DEFAULT true,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Message Conversations (container for DM threads) ────────────────────────
CREATE TABLE message_conversations (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Conversation Participants (many-to-many; supports 1:1 and group DMs) ────
CREATE TABLE message_conversation_participants (
    conversation_id UUID        NOT NULL REFERENCES message_conversations(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES users(id)                 ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);

-- ─── Messages ─────────────────────────────────────────────────────────────────
CREATE TABLE messages (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID        NOT NULL REFERENCES message_conversations(id) ON DELETE CASCADE,
    sender_id       UUID        NOT NULL REFERENCES users(id),
    content         TEXT,
    media_id        UUID        REFERENCES media_files(id),
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at         TIMESTAMPTZ
);

-- ─── AI Chat Conversations ────────────────────────────────────────────────────
CREATE TABLE ai_chat_conversations (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(200),
    started_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    ended_at   TIMESTAMPTZ
);

-- ─── AI Chat Messages ─────────────────────────────────────────────────────────
-- Keeps full user/assistant turn history (required for AI disclosure per FR-AI-4)
CREATE TABLE ai_chat_messages (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID            NOT NULL REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
    role            ai_message_role NOT NULL,
    content         TEXT            NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);


-- =============================================================================
-- 7. GOVERNANCE DOMAIN
-- =============================================================================

-- ─── Reports (polymorphic: post | comment | blog_article | group | user | org) ─
-- Application layer must validate reportable_id against the correct table
CREATE TABLE reports (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID            NOT NULL REFERENCES users(id),
    reportable_type reportable_type NOT NULL,
    reportable_id   UUID            NOT NULL,
    reason          VARCHAR(100)    NOT NULL,
    details         TEXT,
    status          report_status   NOT NULL DEFAULT 'pending',
    reviewed_by     UUID            REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- ─── Admin Logs (immutable audit trail) ──────────────────────────────────────
-- Append-only; revoke UPDATE/DELETE on this table for the app DB role
CREATE TABLE admin_logs (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id    UUID         NOT NULL REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,   -- e.g. 'organization.verify', 'user.suspend'
    target_type VARCHAR(50)  NOT NULL,
    target_id   UUID         NOT NULL,
    reason      TEXT,
    metadata    JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── Settings (platform-wide key/value config & feature flags) ───────────────
CREATE TABLE settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       JSONB        NOT NULL,
    description TEXT,
    updated_by  UUID         REFERENCES users(id),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);


-- =============================================================================
-- 8. INDEXES
-- =============================================================================
-- Primary keys are auto-indexed (B-tree on UUID).
-- Additional indexes target the platform's actual read patterns:
-- feed composition, dashboard queries, auth lookups, and moderation queues.
-- =============================================================================

-- ─── Authentication / lookups ─────────────────────────────────────────────────
CREATE UNIQUE INDEX idx_users_email
    ON users (email);

CREATE INDEX idx_users_role_id
    ON users (role_id);

CREATE INDEX idx_users_status
    ON users (status);

CREATE INDEX idx_refresh_tokens_user_id
    ON refresh_tokens (user_id);

CREATE INDEX idx_refresh_tokens_token_hash
    ON refresh_tokens (token_hash);

-- ─── Organizations & verification ────────────────────────────────────────────
CREATE INDEX idx_organizations_verification_status
    ON organizations (verification_status);

CREATE INDEX idx_org_verification_requests_org_id
    ON organization_verification_requests (organization_id);

CREATE INDEX idx_org_verification_requests_status
    ON organization_verification_requests (status);

-- ─── Posts / Feed composition (hottest read path) ────────────────────────────
CREATE INDEX idx_posts_author_id
    ON posts (author_id);

-- Partial index: skips the majority-NULL rows
CREATE INDEX idx_posts_group_id
    ON posts (group_id)
    WHERE group_id IS NOT NULL;

CREATE INDEX idx_posts_created_at
    ON posts (created_at DESC);

-- Composite: "published items, newest first"
CREATE INDEX idx_posts_status_created_at
    ON posts (status, created_at DESC);

-- ─── Comments (polymorphic lookups) ──────────────────────────────────────────
CREATE INDEX idx_comments_commentable
    ON comments (commentable_type, commentable_id);

-- Partial index: skips top-level comments
CREATE INDEX idx_comments_parent_comment_id
    ON comments (parent_comment_id)
    WHERE parent_comment_id IS NOT NULL;

CREATE INDEX idx_comments_author_id
    ON comments (author_id);

-- ─── Likes (polymorphic lookups) ─────────────────────────────────────────────
-- UNIQUE constraint on (user_id, likeable_type, likeable_id) already creates a
-- supporting index; this additional composite covers "count likes on item" queries
CREATE INDEX idx_likes_likeable
    ON likes (likeable_type, likeable_id);

-- ─── Shares ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_shares_post_id
    ON shares (post_id);

-- ─── Follows (both directions matter) ────────────────────────────────────────
CREATE INDEX idx_follows_follower_id
    ON follows (follower_id);

CREATE INDEX idx_follows_followable
    ON follows (followable_type, followable_id);

-- ─── Groups ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_group_members_user_id
    ON group_members (user_id);

CREATE INDEX idx_groups_visibility_status
    ON groups (visibility, status);

-- ─── Activities & registrations ───────────────────────────────────────────────
CREATE INDEX idx_activities_organization_id
    ON activities (organization_id);

CREATE INDEX idx_activities_status_start_at
    ON activities (status, start_at);

CREATE INDEX idx_activity_registrations_activity_id
    ON activity_registrations (activity_id);

CREATE INDEX idx_activity_registrations_user_id
    ON activity_registrations (user_id);

-- ─── Courses & registrations ──────────────────────────────────────────────────
CREATE INDEX idx_courses_organization_id
    ON courses (organization_id);

CREATE INDEX idx_courses_status
    ON courses (status);

CREATE INDEX idx_course_registrations_course_id
    ON course_registrations (course_id);

CREATE INDEX idx_course_registrations_user_id
    ON course_registrations (user_id);

-- ─── Blog ─────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX idx_blog_articles_slug
    ON blog_articles (slug);

CREATE INDEX idx_blog_articles_status_published_at
    ON blog_articles (status, published_at DESC);

CREATE INDEX idx_blog_articles_author_id
    ON blog_articles (author_id);

-- ─── Notifications (dashboard badge + list queries) ───────────────────────────
-- Composite matches exact query: "unread notifications for me, newest first"
CREATE INDEX idx_notifications_recipient_unread
    ON notifications (recipient_id, is_read, created_at DESC);

-- ─── Messaging ────────────────────────────────────────────────────────────────
CREATE INDEX idx_messages_conversation_id_sent_at
    ON messages (conversation_id, sent_at);

CREATE INDEX idx_conversation_participants_user_id
    ON message_conversation_participants (user_id);

-- ─── AI Assistant ─────────────────────────────────────────────────────────────
CREATE INDEX idx_ai_chat_conversations_user_id
    ON ai_chat_conversations (user_id);

CREATE INDEX idx_ai_chat_messages_conversation_id
    ON ai_chat_messages (conversation_id, created_at);

-- ─── Governance / Moderation queue ────────────────────────────────────────────
CREATE INDEX idx_reports_status_created_at
    ON reports (status, created_at);

CREATE INDEX idx_reports_reportable
    ON reports (reportable_type, reportable_id);

CREATE INDEX idx_admin_logs_admin_id
    ON admin_logs (admin_id);

CREATE INDEX idx_admin_logs_target
    ON admin_logs (target_type, target_id);


-- =============================================================================
-- END OF SCHEMA
-- 38 tables | 4 domains | PostgreSQL 14+
-- =============================================================================
