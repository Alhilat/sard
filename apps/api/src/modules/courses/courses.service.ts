import prisma from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ConflictError, AppError } from '../../middleware/errorHandler';
import { parsePagination, buildPagination } from '../../utils/paginate';

async function getOrgByUserId(userId: string) {
  return prisma.organizations.findFirst({ where: { user_id: userId } });
}

export async function listCourses(query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const where: Record<string, unknown> = { status: { not: 'cancelled' } };
  if (query['org_id']) where['organization_id'] = query['org_id'];
  const [courses, total] = await Promise.all([
    prisma.courses.findMany({ where, orderBy: { created_at: 'desc' }, skip, take }),
    prisma.courses.count({ where }),
  ]);
  return { courses, pagination: buildPagination(page, limit, total) };
}

export async function createCourse(userId: string, data: {
  title: string; description?: string; syllabus?: string; schedule?: object;
  capacity?: number; prerequisites?: string; status?: string; cover_media_id?: string;
}) {
  const org = await getOrgByUserId(userId);
  if (!org) throw new AppError('No organization associated with this account', 403);
  return prisma.courses.create({
    data: { ...data, organization_id: org.id, status: (data.status ?? 'draft') as any },
  });
}

export async function getCourse(courseId: string) {
  const course = await prisma.courses.findUnique({
    where: { id: courseId },
    include: { course_materials: true },
  });
  if (!course) throw new NotFoundError('Course');
  return course;
}

export async function updateCourse(courseId: string, userId: string, data: Record<string, unknown>) {
  const course = await prisma.courses.findUnique({ where: { id: courseId }, include: { organizations: true } });
  if (!course) throw new NotFoundError('Course');
  if (course.organizations.user_id !== userId) throw new ForbiddenError();
  return prisma.courses.update({ where: { id: courseId }, data: { ...data, updated_at: new Date() } });
}

export async function enroll(courseId: string, userId: string) {
  const course = await prisma.courses.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course');
  if (course.status !== 'published') throw new AppError('Course is not open for enrollment', 400);
  const existing = await prisma.course_registrations.findFirst({ where: { course_id: courseId, user_id: userId } });
  if (existing?.status === 'enrolled') throw new ConflictError('Already enrolled');
  const count = await prisma.course_registrations.count({ where: { course_id: courseId, status: 'enrolled' } });
  const status: 'enrolled' | 'waitlisted' = course.capacity && count >= course.capacity ? 'waitlisted' : 'enrolled';
  return prisma.course_registrations.create({ data: { course_id: courseId, user_id: userId, status } });
}

export async function cancelEnrollment(courseId: string, userId: string) {
  const reg = await prisma.course_registrations.findFirst({ where: { course_id: courseId, user_id: userId } });
  if (!reg) throw new NotFoundError('Enrollment');
  return prisma.course_registrations.update({ where: { id: reg.id }, data: { status: 'cancelled' } });
}

export async function getEnrollments(courseId: string, userId: string, query: Record<string, string>) {
  const course = await prisma.courses.findUnique({ where: { id: courseId }, include: { organizations: true } });
  if (!course) throw new NotFoundError('Course');
  if (course.organizations.user_id !== userId) throw new ForbiddenError();
  const { skip, take, page, limit } = parsePagination(query);
  const [regs, total] = await Promise.all([
    prisma.course_registrations.findMany({ where: { course_id: courseId }, skip, take }),
    prisma.course_registrations.count({ where: { course_id: courseId } }),
  ]);
  return { enrollments: regs, pagination: buildPagination(page, limit, total) };
}

export async function addMaterial(courseId: string, userId: string, data: { media_id: string; title?: string; position?: number }) {
  const course = await prisma.courses.findUnique({ where: { id: courseId }, include: { organizations: true } });
  if (!course) throw new NotFoundError('Course');
  if (course.organizations.user_id !== userId) throw new ForbiddenError();
  return prisma.course_materials.create({ data: { course_id: courseId, ...data } });
}

export async function removeMaterial(materialId: string, userId: string) {
  const material = await prisma.course_materials.findUnique({ where: { id: materialId }, include: { courses: { include: { organizations: true } } } });
  if (!material) throw new NotFoundError('Material');
  if (material.courses.organizations.user_id !== userId) throw new ForbiddenError();
  await prisma.course_materials.delete({ where: { id: materialId } });
  return { message: 'Material removed' };
}
