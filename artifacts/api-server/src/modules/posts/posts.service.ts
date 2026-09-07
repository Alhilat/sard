import prisma from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ConflictError } from '../../middleware/errorHandler';
import { parsePagination, buildPagination } from '../../utils/paginate';

export async function getFeed(query: Record<string, string>, userId?: string) {
  const { skip, take, page, limit } = parsePagination(query);
  const where: Record<string, unknown> = { deleted_at: null, status: 'published', visibility: 'public' };
  const [posts, total] = await Promise.all([
    prisma.posts.findMany({
      where, orderBy: { created_at: 'desc' }, skip, take,
      select: { id: true, author_id: true, content: true, visibility: true, status: true, created_at: true, updated_at: true },
    }),
    prisma.posts.count({ where }),
  ]);
  return { posts, pagination: buildPagination(page, limit, total) };
}

export async function createPost(authorId: string, data: {
  content: string; visibility: string; group_id?: string; media_ids?: string[];
}) {
  const post = await prisma.posts.create({
    data: { author_id: authorId, content: data.content, visibility: data.visibility as any, group_id: data.group_id },
  });
  if (data.media_ids?.length) {
    await prisma.post_media.createMany({
      data: data.media_ids.map((id, i) => ({ post_id: post.id, media_id: id, position: i })),
    });
  }
  return post;
}

export async function getPost(postId: string) {
  const post = await prisma.posts.findFirst({
    where: { id: postId, deleted_at: null },
    include: { post_media: true },
  });
  if (!post) throw new NotFoundError('Post');
  return post;
}

export async function updatePost(postId: string, userId: string, data: { content?: string; visibility?: string }) {
  const post = await prisma.posts.findFirst({ where: { id: postId, deleted_at: null } });
  if (!post) throw new NotFoundError('Post');
  if (post.author_id !== userId) throw new ForbiddenError();
  return prisma.posts.update({ where: { id: postId }, data: { ...data, visibility: data.visibility as any, updated_at: new Date() } });
}

export async function deletePost(postId: string, userId: string, isAdmin = false) {
  const post = await prisma.posts.findFirst({ where: { id: postId, deleted_at: null } });
  if (!post) throw new NotFoundError('Post');
  if (!isAdmin && post.author_id !== userId) throw new ForbiddenError();
  return prisma.posts.update({ where: { id: postId }, data: { deleted_at: new Date(), status: 'removed' } });
}

export async function likeItem(userId: string, likeableType: 'post' | 'comment' | 'blog_article', likeableId: string) {
  const existing = await prisma.likes.findFirst({ where: { user_id: userId, likeable_type: likeableType, likeable_id: likeableId } });
  if (existing) throw new ConflictError('Already liked');
  return prisma.likes.create({ data: { user_id: userId, likeable_type: likeableType, likeable_id: likeableId } });
}

export async function unlikeItem(userId: string, likeableType: 'post' | 'comment' | 'blog_article', likeableId: string) {
  const record = await prisma.likes.findFirst({ where: { user_id: userId, likeable_type: likeableType, likeable_id: likeableId } });
  if (!record) throw new NotFoundError('Like');
  await prisma.likes.delete({ where: { id: record.id } });
  return { message: 'Unliked' };
}

export async function sharePost(userId: string, postId: string, commentary?: string) {
  try {
    // Single atomic insert leveraging unique index @@unique([user_id, post_id]) — 1 DB query instead of 3
    return await prisma.shares.create({
      data: { user_id: userId, post_id: postId, commentary },
      select: { id: true, user_id: true, post_id: true, commentary: true, created_at: true },
    });
  } catch (err: any) {
    if (err.code === 'P2002') throw new ConflictError('Already shared');
    if (err.code === 'P2003') throw new NotFoundError('Post');
    throw err;
  }
}

export async function unsharePost(userId: string, postId: string) {
  try {
    // Direct indexed delete by compound unique key — 1 DB query instead of 2
    await prisma.shares.delete({
      where: { user_id_post_id: { user_id: userId, post_id: postId } },
    });
    return { message: 'Unshared' };
  } catch (err: any) {
    if (err.code === 'P2025') throw new NotFoundError('Share');
    throw err;
  }
}

export async function getComments(commentableType: 'post' | 'blog_article', commentableId: string, query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = { commentable_type: commentableType, commentable_id: commentableId, deleted_at: null, parent_comment_id: null };
  const [comments, total] = await Promise.all([
    prisma.comments.findMany({ where, orderBy: { created_at: 'desc' }, skip, take }),
    prisma.comments.count({ where }),
  ]);
  return { comments, pagination: buildPagination(page, limit, total) };
}

export async function addComment(authorId: string, commentableType: 'post' | 'blog_article', commentableId: string, content: string, parentCommentId?: string) {
  return prisma.comments.create({
    data: { author_id: authorId, commentable_type: commentableType, commentable_id: commentableId, content, parent_comment_id: parentCommentId },
  });
}

export async function deleteComment(commentId: string, userId: string, isAdmin = false) {
  const comment = await prisma.comments.findFirst({ where: { id: commentId, deleted_at: null } });
  if (!comment) throw new NotFoundError('Comment');
  if (!isAdmin && comment.author_id !== userId) throw new ForbiddenError();
  return prisma.comments.update({ where: { id: commentId }, data: { deleted_at: new Date(), status: 'removed' } });
}
