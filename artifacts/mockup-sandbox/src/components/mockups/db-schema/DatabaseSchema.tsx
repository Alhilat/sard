import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Column {
  name: string;
  type: string;
  constraints?: string;
}

interface Table {
  name: string;
  columns: Column[];
}

interface Domain {
  id: string;
  label: string;
  color: string;         // Tailwind bg class for header
  border: string;       // Tailwind border class
  headerText: string;   // Tailwind text class
  tables: Table[];
}

// ─── Schema Data ──────────────────────────────────────────────────────────────
const domains: Domain[] = [
  {
    id: "identity",
    label: "Identity & Access",
    color: "bg-blue-700",
    border: "border-blue-400",
    headerText: "text-blue-100",
    tables: [
      {
        name: "roles",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "name", type: "VARCHAR(50)", constraints: "UNIQUE NOT NULL" },
          { name: "description", type: "TEXT" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "permissions",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "code", type: "VARCHAR(100)", constraints: "UNIQUE NOT NULL" },
          { name: "description", type: "TEXT" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "role_permissions",
        columns: [
          { name: "role_id", type: "UUID", constraints: "PK, FK → roles" },
          { name: "permission_id", type: "UUID", constraints: "PK, FK → permissions" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "users",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "role_id", type: "UUID", constraints: "NOT NULL FK → roles" },
          { name: "email", type: "VARCHAR(255)", constraints: "UNIQUE NOT NULL" },
          { name: "password_hash", type: "VARCHAR(255)", constraints: "NOT NULL" },
          { name: "status", type: "user_status", constraints: "NOT NULL" },
          { name: "email_verified_at", type: "TIMESTAMPTZ" },
          { name: "last_login_at", type: "TIMESTAMPTZ" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "updated_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "deleted_at", type: "TIMESTAMPTZ" },
        ],
      },
      {
        name: "user_permissions",
        columns: [
          { name: "user_id", type: "UUID", constraints: "PK, FK → users" },
          { name: "permission_id", type: "UUID", constraints: "PK, FK → permissions" },
          { name: "granted_by", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "granted_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "media_files",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "uploader_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "file_url", type: "VARCHAR(500)", constraints: "NOT NULL" },
          { name: "file_type", type: "media_type", constraints: "NOT NULL" },
          { name: "mime_type", type: "VARCHAR(100)" },
          { name: "size_bytes", type: "BIGINT" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "individual_profiles",
        columns: [
          { name: "user_id", type: "UUID", constraints: "PK, FK → users" },
          { name: "full_name", type: "VARCHAR(150)", constraints: "NOT NULL" },
          { name: "bio", type: "TEXT" },
          { name: "avatar_media_id", type: "UUID", constraints: "FK → media_files" },
          { name: "country", type: "VARCHAR(100)" },
          { name: "interests", type: "JSONB", constraints: "DEFAULT '[]'" },
          { name: "privacy_settings", type: "JSONB", constraints: "DEFAULT '{}'" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "updated_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "organizations",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "user_id", type: "UUID", constraints: "UNIQUE FK → users" },
          { name: "legal_name", type: "VARCHAR(200)", constraints: "NOT NULL" },
          { name: "display_name", type: "VARCHAR(150)", constraints: "NOT NULL" },
          { name: "description", type: "TEXT" },
          { name: "website", type: "VARCHAR(255)" },
          { name: "logo_media_id", type: "UUID", constraints: "FK → media_files" },
          { name: "cover_media_id", type: "UUID", constraints: "FK → media_files" },
          { name: "verification_status", type: "org_verification_status", constraints: "NOT NULL" },
          { name: "verified_at", type: "TIMESTAMPTZ" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "updated_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "organization_verification_requests",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "organization_id", type: "UUID", constraints: "NOT NULL FK → organizations" },
          { name: "document_media_id", type: "UUID", constraints: "NOT NULL FK → media_files" },
          { name: "status", type: "verification_request_status", constraints: "NOT NULL" },
          { name: "reviewed_by", type: "UUID", constraints: "FK → users" },
          { name: "review_reason", type: "TEXT" },
          { name: "submitted_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "reviewed_at", type: "TIMESTAMPTZ" },
        ],
      },
      {
        name: "refresh_tokens",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "user_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "token_hash", type: "VARCHAR(255)", constraints: "NOT NULL" },
          { name: "device_info", type: "VARCHAR(255)" },
          { name: "expires_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "revoked_at", type: "TIMESTAMPTZ" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "password_reset_tokens",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "user_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "token_hash", type: "VARCHAR(255)", constraints: "NOT NULL" },
          { name: "expires_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "used_at", type: "TIMESTAMPTZ" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "email_verification_tokens",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "user_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "token_hash", type: "VARCHAR(255)", constraints: "NOT NULL" },
          { name: "expires_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "used_at", type: "TIMESTAMPTZ" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
    ],
  },
  {
    id: "social",
    label: "Social",
    color: "bg-emerald-700",
    border: "border-emerald-400",
    headerText: "text-emerald-100",
    tables: [
      {
        name: "groups",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "name", type: "VARCHAR(150)", constraints: "NOT NULL" },
          { name: "description", type: "TEXT" },
          { name: "creator_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "visibility", type: "group_visibility", constraints: "NOT NULL" },
          { name: "cover_media_id", type: "UUID", constraints: "FK → media_files" },
          { name: "status", type: "group_status", constraints: "NOT NULL" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "updated_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "group_members",
        columns: [
          { name: "group_id", type: "UUID", constraints: "PK, FK → groups" },
          { name: "user_id", type: "UUID", constraints: "PK, FK → users" },
          { name: "role", type: "group_member_role", constraints: "NOT NULL" },
          { name: "status", type: "group_member_status", constraints: "NOT NULL" },
          { name: "joined_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "posts",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "author_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "content", type: "TEXT", constraints: "NOT NULL" },
          { name: "visibility", type: "post_visibility", constraints: "NOT NULL" },
          { name: "group_id", type: "UUID", constraints: "FK → groups" },
          { name: "status", type: "content_status", constraints: "NOT NULL" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "updated_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "deleted_at", type: "TIMESTAMPTZ" },
        ],
      },
      {
        name: "post_media",
        columns: [
          { name: "post_id", type: "UUID", constraints: "PK, FK → posts" },
          { name: "media_id", type: "UUID", constraints: "PK, FK → media_files" },
          { name: "position", type: "SMALLINT", constraints: "NOT NULL DEFAULT 0" },
        ],
      },
      {
        name: "comments",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "author_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "commentable_type", type: "commentable_type", constraints: "NOT NULL" },
          { name: "commentable_id", type: "UUID", constraints: "NOT NULL (polymorphic)" },
          { name: "parent_comment_id", type: "UUID", constraints: "FK → comments (self)" },
          { name: "content", type: "TEXT", constraints: "NOT NULL" },
          { name: "status", type: "content_status", constraints: "NOT NULL" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "updated_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "deleted_at", type: "TIMESTAMPTZ" },
        ],
      },
      {
        name: "likes",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "user_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "likeable_type", type: "likeable_type", constraints: "NOT NULL" },
          { name: "likeable_id", type: "UUID", constraints: "NOT NULL (polymorphic)" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "shares",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "user_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "post_id", type: "UUID", constraints: "NOT NULL FK → posts" },
          { name: "commentary", type: "TEXT" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "follows",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "follower_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "followable_type", type: "followable_type", constraints: "NOT NULL" },
          { name: "followable_id", type: "UUID", constraints: "NOT NULL (polymorphic)" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
    ],
  },
  {
    id: "learning",
    label: "Learning & Events",
    color: "bg-violet-700",
    border: "border-violet-400",
    headerText: "text-violet-100",
    tables: [
      {
        name: "activities",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "organization_id", type: "UUID", constraints: "NOT NULL FK → organizations" },
          { name: "title", type: "VARCHAR(200)", constraints: "NOT NULL" },
          { name: "description", type: "TEXT" },
          { name: "location_type", type: "location_type", constraints: "NOT NULL" },
          { name: "location_value", type: "VARCHAR(500)" },
          { name: "start_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "end_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "capacity", type: "INTEGER", constraints: "NOT NULL CHECK > 0" },
          { name: "status", type: "activity_status", constraints: "NOT NULL" },
          { name: "cover_media_id", type: "UUID", constraints: "FK → media_files" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "updated_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "activity_registrations",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "activity_id", type: "UUID", constraints: "NOT NULL FK → activities" },
          { name: "user_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "status", type: "activity_registration_status", constraints: "NOT NULL" },
          { name: "registered_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "cancelled_at", type: "TIMESTAMPTZ" },
        ],
      },
      {
        name: "courses",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "organization_id", type: "UUID", constraints: "NOT NULL FK → organizations" },
          { name: "title", type: "VARCHAR(200)", constraints: "NOT NULL" },
          { name: "description", type: "TEXT" },
          { name: "syllabus", type: "TEXT" },
          { name: "schedule", type: "JSONB" },
          { name: "capacity", type: "INTEGER", constraints: "CHECK > 0" },
          { name: "prerequisites", type: "TEXT" },
          { name: "status", type: "course_status", constraints: "NOT NULL" },
          { name: "cover_media_id", type: "UUID", constraints: "FK → media_files" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "updated_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "course_materials",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "course_id", type: "UUID", constraints: "NOT NULL FK → courses" },
          { name: "media_id", type: "UUID", constraints: "NOT NULL FK → media_files" },
          { name: "title", type: "VARCHAR(200)" },
          { name: "position", type: "SMALLINT", constraints: "NOT NULL DEFAULT 0" },
        ],
      },
      {
        name: "course_registrations",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "course_id", type: "UUID", constraints: "NOT NULL FK → courses" },
          { name: "user_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "status", type: "course_registration_status", constraints: "NOT NULL" },
          { name: "progress_percent", type: "SMALLINT", constraints: "CHECK 0–100" },
          { name: "enrolled_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "completed_at", type: "TIMESTAMPTZ" },
        ],
      },
    ],
  },
  {
    id: "engagement",
    label: "Engagement",
    color: "bg-amber-700",
    border: "border-amber-400",
    headerText: "text-amber-100",
    tables: [
      {
        name: "blog_categories",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "name", type: "VARCHAR(100)", constraints: "UNIQUE NOT NULL" },
          { name: "slug", type: "VARCHAR(120)", constraints: "UNIQUE NOT NULL" },
        ],
      },
      {
        name: "blog_articles",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "author_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "title", type: "VARCHAR(250)", constraints: "NOT NULL" },
          { name: "slug", type: "VARCHAR(280)", constraints: "UNIQUE NOT NULL" },
          { name: "content", type: "TEXT", constraints: "NOT NULL" },
          { name: "cover_media_id", type: "UUID", constraints: "FK → media_files" },
          { name: "status", type: "blog_status", constraints: "NOT NULL" },
          { name: "featured", type: "BOOLEAN", constraints: "NOT NULL DEFAULT false" },
          { name: "published_at", type: "TIMESTAMPTZ" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "updated_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "blog_article_categories",
        columns: [
          { name: "article_id", type: "UUID", constraints: "PK, FK → blog_articles" },
          { name: "category_id", type: "UUID", constraints: "PK, FK → blog_categories" },
        ],
      },
      {
        name: "notifications",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "recipient_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "type", type: "VARCHAR(60)", constraints: "NOT NULL" },
          { name: "payload", type: "JSONB", constraints: "NOT NULL DEFAULT '{}'" },
          { name: "is_read", type: "BOOLEAN", constraints: "NOT NULL DEFAULT false" },
          { name: "read_at", type: "TIMESTAMPTZ" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "notification_preferences",
        columns: [
          { name: "user_id", type: "UUID", constraints: "PK, FK → users" },
          { name: "in_app_enabled", type: "BOOLEAN", constraints: "NOT NULL DEFAULT true" },
          { name: "email_enabled", type: "BOOLEAN", constraints: "NOT NULL DEFAULT true" },
          { name: "updated_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "message_conversations",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "message_conversation_participants",
        columns: [
          { name: "conversation_id", type: "UUID", constraints: "PK, FK → message_conversations" },
          { name: "user_id", type: "UUID", constraints: "PK, FK → users" },
          { name: "joined_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "messages",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "conversation_id", type: "UUID", constraints: "NOT NULL FK → message_conversations" },
          { name: "sender_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "content", type: "TEXT" },
          { name: "media_id", type: "UUID", constraints: "FK → media_files" },
          { name: "sent_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "read_at", type: "TIMESTAMPTZ" },
        ],
      },
      {
        name: "ai_chat_conversations",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "user_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "title", type: "VARCHAR(200)" },
          { name: "started_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
          { name: "ended_at", type: "TIMESTAMPTZ" },
        ],
      },
      {
        name: "ai_chat_messages",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "conversation_id", type: "UUID", constraints: "NOT NULL FK → ai_chat_conversations" },
          { name: "role", type: "ai_message_role", constraints: "NOT NULL" },
          { name: "content", type: "TEXT", constraints: "NOT NULL" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    color: "bg-rose-700",
    border: "border-rose-400",
    headerText: "text-rose-100",
    tables: [
      {
        name: "reports",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "reporter_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "reportable_type", type: "reportable_type", constraints: "NOT NULL" },
          { name: "reportable_id", type: "UUID", constraints: "NOT NULL (polymorphic)" },
          { name: "reason", type: "VARCHAR(100)", constraints: "NOT NULL" },
          { name: "details", type: "TEXT" },
          { name: "status", type: "report_status", constraints: "NOT NULL" },
          { name: "reviewed_by", type: "UUID", constraints: "FK → users" },
          { name: "reviewed_at", type: "TIMESTAMPTZ" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "admin_logs",
        columns: [
          { name: "id", type: "UUID", constraints: "PK" },
          { name: "admin_id", type: "UUID", constraints: "NOT NULL FK → users" },
          { name: "action", type: "VARCHAR(100)", constraints: "NOT NULL" },
          { name: "target_type", type: "VARCHAR(50)", constraints: "NOT NULL" },
          { name: "target_id", type: "UUID", constraints: "NOT NULL" },
          { name: "reason", type: "TEXT" },
          { name: "metadata", type: "JSONB", constraints: "NOT NULL DEFAULT '{}'" },
          { name: "created_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
      {
        name: "settings",
        columns: [
          { name: "key", type: "VARCHAR(100)", constraints: "PK" },
          { name: "value", type: "JSONB", constraints: "NOT NULL" },
          { name: "description", type: "TEXT" },
          { name: "updated_by", type: "UUID", constraints: "FK → users" },
          { name: "updated_at", type: "TIMESTAMPTZ", constraints: "NOT NULL" },
        ],
      },
    ],
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────
function ConstraintBadge({ text }: { text: string }) {
  const isPK = text.includes("PK");
  const isFK = text.includes("FK");
  const isUnique = text.includes("UNIQUE");
  const isNotNull = text.includes("NOT NULL") && !isFK && !isPK && !isUnique;
  const isPolymorphic = text.includes("polymorphic");
  const isDefault = text.includes("DEFAULT");

  if (isPK)
    return (
      <span className="inline-block px-1 py-0.5 rounded text-[9px] font-bold bg-yellow-400 text-yellow-900 mr-1">
        PK
      </span>
    );
  if (isPolymorphic)
    return (
      <span className="inline-block px-1 py-0.5 rounded text-[9px] font-bold bg-purple-500 text-white mr-1">
        POLY
      </span>
    );
  if (isFK)
    return (
      <span className="inline-block px-1 py-0.5 rounded text-[9px] font-bold bg-sky-500 text-white mr-1">
        FK
      </span>
    );
  if (isUnique)
    return (
      <span className="inline-block px-1 py-0.5 rounded text-[9px] font-bold bg-green-500 text-white mr-1">
        UQ
      </span>
    );
  if (isNotNull)
    return (
      <span className="inline-block px-1 py-0.5 rounded text-[9px] font-semibold bg-slate-600 text-slate-200 mr-1">
        NN
      </span>
    );
  if (isDefault)
    return (
      <span className="inline-block px-1 py-0.5 rounded text-[9px] font-semibold bg-slate-700 text-slate-300 mr-1">
        DEF
      </span>
    );
  return null;
}

function TableCard({
  table,
  borderClass,
}: {
  table: Table;
  borderClass: string;
}) {
  return (
    <div
      className={`rounded-lg border ${borderClass} bg-slate-800 overflow-hidden flex-shrink-0`}
      style={{ minWidth: 240, width: 260 }}
    >
      {/* Table name */}
      <div className="px-3 py-2 bg-slate-700 border-b border-slate-600">
        <span className="font-mono text-xs font-bold text-slate-100 tracking-wide">
          {table.name}
        </span>
      </div>
      {/* Columns */}
      <div className="divide-y divide-slate-700/60">
        {table.columns.map((col) => (
          <div
            key={col.name}
            className="flex items-start gap-2 px-3 py-[5px] hover:bg-slate-700/40 transition-colors"
          >
            {/* Constraint badges */}
            <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
              {col.constraints ? (
                <ConstraintBadge text={col.constraints} />
              ) : (
                <span className="inline-block w-[18px]" />
              )}
            </div>
            {/* Column name */}
            <span className="font-mono text-[11px] text-slate-200 flex-1 leading-tight">
              {col.name}
            </span>
            {/* Data type */}
            <span className="font-mono text-[10px] text-slate-400 text-right leading-tight flex-shrink-0">
              {col.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DomainSection({ domain }: { domain: Domain }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="mb-8">
      {/* Domain header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-lg mb-4 ${domain.color} hover:opacity-90 transition-opacity`}
      >
        <span
          className={`text-sm font-bold uppercase tracking-widest ${domain.headerText}`}
        >
          {domain.label}
        </span>
        <span className={`text-xs ${domain.headerText} opacity-70 ml-1`}>
          {domain.tables.length} tables
        </span>
        <span className={`ml-auto text-lg ${domain.headerText} opacity-70`}>
          {expanded ? "−" : "+"}
        </span>
      </button>

      {expanded && (
        <div className="flex flex-wrap gap-4">
          {domain.tables.map((table) => (
            <TableCard
              key={table.name}
              table={table}
              borderClass={domain.border}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  const items = [
    { label: "PK", color: "bg-yellow-400 text-yellow-900", desc: "Primary Key" },
    { label: "FK", color: "bg-sky-500 text-white", desc: "Foreign Key" },
    { label: "UQ", color: "bg-green-500 text-white", desc: "Unique" },
    { label: "NN", color: "bg-slate-600 text-slate-200", desc: "Not Null" },
    { label: "POLY", color: "bg-purple-500 text-white", desc: "Polymorphic" },
    { label: "DEF", color: "bg-slate-700 text-slate-300", desc: "Has Default" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-3 bg-slate-800 border border-slate-700 rounded-lg mb-6">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
        Legend
      </span>
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-1.5">
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${i.color}`}
          >
            {i.label}
          </span>
          <span className="text-[11px] text-slate-400">{i.desc}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function DatabaseSchema() {
  const totalTables = domains.reduce((acc, d) => acc + d.tables.length, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-end gap-4 mb-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Database Schema
          </h1>
          <span className="text-sm text-slate-400 mb-0.5">
            Multi-Role Community & Learning Platform
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>PostgreSQL 14+</span>
          <span>·</span>
          <span>{totalTables} tables</span>
          <span>·</span>
          <span>{domains.length} domains</span>
          <span>·</span>
          <span>UUID primary keys</span>
          <span>·</span>
          <span>Soft deletes on UGC</span>
        </div>
      </div>

      <Legend />

      {domains.map((domain) => (
        <DomainSection key={domain.id} domain={domain} />
      ))}
    </div>
  );
}
