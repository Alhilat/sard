import prisma from '../../lib/prisma';

export async function getAdminDashboard() {
  const [totalUsers, totalOrgs, totalPosts, totalGroups, totalActivities, totalCourses, pendingReports, pendingVerifications] = await Promise.all([
    prisma.users.count({ where: { deleted_at: null } }),
    prisma.organizations.count(),
    prisma.posts.count({ where: { deleted_at: null } }),
    prisma.groups.count({ where: { status: 'active' } }),
    prisma.activities.count({ where: { status: { not: 'cancelled' } } }),
    prisma.courses.count({ where: { status: { not: 'cancelled' } } }),
    prisma.reports.count({ where: { status: 'pending' } }),
    prisma.organization_verification_requests.count({ where: { status: 'pending' } }),
  ]);

  const recentUsers = await prisma.users.findMany({
    where: { deleted_at: null }, orderBy: { created_at: 'desc' }, take: 5,
    select: { id: true, email: true, created_at: true, status: true, roles: { select: { name: true } } },
  });

  const recentReports = await prisma.reports.findMany({
    where: { status: 'pending' }, orderBy: { created_at: 'desc' }, take: 5,
  });

  return {
    stats: { totalUsers, totalOrgs, totalPosts, totalGroups, totalActivities, totalCourses, pendingReports, pendingVerifications },
    recentUsers,
    recentReports,
  };
}

export async function getOrgDashboard(userId: string) {
  const org = await prisma.organizations.findFirst({ where: { user_id: userId } });
  if (!org) return { message: 'No organization linked to this account' };

  const [totalActivities, totalCourses] = await Promise.all([
    prisma.activities.count({ where: { organization_id: org.id } }),
    prisma.courses.count({ where: { organization_id: org.id } }),
  ]);
  const totalFollowers = 0;

  const upcomingActivities = await prisma.activities.findMany({
    where: { organization_id: org.id, start_at: { gte: new Date() }, status: 'published' },
    orderBy: { start_at: 'asc' }, take: 5,
  });

  const recentRegistrations = await prisma.activity_registrations.findMany({
    where: { activities: { organization_id: org.id } },
    orderBy: { registered_at: 'desc' }, take: 5,
    include: { activities: { select: { title: true } } },
  });

  return {
    organization: org,
    stats: { totalActivities, totalCourses, totalFollowers },
    upcomingActivities,
    recentRegistrations,
  };
}

export async function getIndividualDashboard(userId: string) {
  const [postsCount, followingCount, followersCount, enrollmentsCount, upcomingActivitiesCount] = await Promise.all([
    prisma.posts.count({ where: { author_id: userId, deleted_at: null } }),
    prisma.follows.count({ where: { follower_id: userId } }),
    prisma.follows.count({ where: { followable_type: 'user', followable_id: userId } }),
    prisma.course_registrations.count({ where: { user_id: userId, status: 'enrolled' } }),
    prisma.activity_registrations.count({ where: { user_id: userId, status: 'registered', activities: { start_at: { gte: new Date() } } } }),
  ]);

  const recentPosts = await prisma.posts.findMany({
    where: { author_id: userId, deleted_at: null }, orderBy: { created_at: 'desc' }, take: 5,
  });

  const unreadNotifications = await prisma.notifications.count({ where: { recipient_id: userId, is_read: false } });

  return {
    stats: { postsCount, followingCount, followersCount, enrollmentsCount, upcomingActivitiesCount, unreadNotifications },
    recentPosts,
  };
}
