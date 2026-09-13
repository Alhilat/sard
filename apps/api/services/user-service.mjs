import { getStatements } from '../db/statements/index.mjs';

/**
 * Format User response with followers, following, and post counts
 */
export function formatUserResponse(u) {
  let followersCount = 0;
  let followingCount = 0;
  let postsCount = 0;

  try {
    const stmts = getStatements();
    followersCount = stmts.stmtCountFollowers.get(u.id)?.count || 0;
    followingCount = stmts.stmtCountFollowing.get(u.id)?.count || 0;
    postsCount = stmts.stmtCountUserPosts.get(u.id)?.count || 0;
  } catch {}

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username,
    role: u.role,
    phone: u.phone || '',
    avatar: u.avatar || '',
    bio: u.bio || '',
    location: u.location || 'الأردن',
    country: u.country || 'الأردن',
    joinDate: u.join_date,
    verified: Boolean(u.verified),
    status: u.is_banned ? 'banned' : 'active',
    followers: followersCount,
    following: followingCount,
    postsCount: postsCount,
  };
}
