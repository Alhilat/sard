import prisma from '../../lib/prisma';
import { NotFoundError, ForbiddenError, AppError } from '../../middleware/errorHandler';
import { parsePagination, buildPagination } from '../../utils/paginate';

export async function listArticles(query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const where: Record<string, unknown> = { status: 'published' };
  if (query['featured'] === 'true') where['featured'] = true;
  const [articles, total] = await Promise.all([
    prisma.blog_articles.findMany({ where, orderBy: { published_at: 'desc' }, skip, take }),
    prisma.blog_articles.count({ where }),
  ]);
  return { articles, pagination: buildPagination(page, limit, total) };
}

export async function createArticle(authorId: string, data: {
  title: string; slug: string; content: string; cover_media_id?: string;
  category_ids?: string[]; featured?: boolean;
}) {
  const article = await prisma.blog_articles.create({
    data: { author_id: authorId, title: data.title, slug: data.slug, content: data.content, cover_media_id: data.cover_media_id, featured: data.featured ?? false },
  });
  if (data.category_ids?.length) {
    await prisma.blog_article_categories.createMany({
      data: data.category_ids.map((id) => ({ article_id: article.id, category_id: id })),
    });
  }
  return article;
}

export async function getArticleBySlug(slug: string) {
  const article = await prisma.blog_articles.findUnique({
    where: { slug },
    include: { blog_article_categories: { include: { blog_categories: true } } },
  });
  if (!article) throw new NotFoundError('Article');
  return article;
}

export async function getArticleById(id: string) {
  const article = await prisma.blog_articles.findUnique({ where: { id } });
  if (!article) throw new NotFoundError('Article');
  return article;
}

export async function updateArticle(articleId: string, userId: string, roleName: string, data: Record<string, unknown>) {
  const article = await prisma.blog_articles.findUnique({ where: { id: articleId } });
  if (!article) throw new NotFoundError('Article');
  if (article.author_id !== userId && roleName !== 'admin') throw new ForbiddenError();
  return prisma.blog_articles.update({ where: { id: articleId }, data: { ...data, updated_at: new Date() } });
}

export async function publishArticle(articleId: string, userId: string, roleName: string) {
  const article = await prisma.blog_articles.findUnique({ where: { id: articleId } });
  if (!article) throw new NotFoundError('Article');
  if (article.author_id !== userId && roleName !== 'admin') throw new ForbiddenError();
  return prisma.blog_articles.update({ where: { id: articleId }, data: { status: 'published', published_at: new Date(), updated_at: new Date() } });
}

export async function deleteArticle(articleId: string, userId: string, roleName: string) {
  const article = await prisma.blog_articles.findUnique({ where: { id: articleId } });
  if (!article) throw new NotFoundError('Article');
  if (article.author_id !== userId && roleName !== 'admin') throw new ForbiddenError();
  return prisma.blog_articles.update({ where: { id: articleId }, data: { status: 'removed', updated_at: new Date() } });
}

export async function listCategories() {
  return prisma.blog_categories.findMany({ orderBy: { name: 'asc' } });
}

export async function createCategory(name: string, slug: string) {
  return prisma.blog_categories.create({ data: { name, slug } });
}

export async function getArticleComments(articleId: string, query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = { commentable_type: 'blog_article' as const, commentable_id: articleId, deleted_at: null, parent_comment_id: null };
  const [comments, total] = await Promise.all([
    prisma.comments.findMany({ where, orderBy: { created_at: 'desc' }, skip, take }),
    prisma.comments.count({ where }),
  ]);
  return { comments, pagination: buildPagination(page, limit, total) };
}
