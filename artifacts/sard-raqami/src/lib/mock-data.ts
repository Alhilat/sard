// Production data types and empty initial state for منصة سرد رقمي (Zero Fake Data)

export interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  location: string;
  followers: number;
  following: number;
  activities: number;
  courses: number;
  joinDate?: string;
  verified?: boolean;
  role?: 'individual' | 'org' | 'admin';
  status: string;
}

export interface Organization {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  cover?: string;
  bio?: string;
  category?: string;
  location?: string;
  followers: number;
  activities: number;
  courses: number;
  members: number;
  verified?: boolean;
  role?: 'org';
  status?: string;
  joinDate?: string;
}

export interface Activity {
  id: string;
  title: string;
  organization?: {
    id: string;
    name: string;
    avatar?: string;
  };
  org: {
    id: string;
    name: string;
    avatar?: string;
  };
  orgName?: string;
  date: string;
  time?: string;
  location: string;
  locationType?: 'in_person' | 'online';
  capacity?: number;
  seats: number;
  attendeesCount?: number;
  registered: number;
  price?: string;
  category: string;
  image?: string;
  status?: string;
  description?: string;
  isRegistered?: boolean;
  tags?: string[];
}

export interface Course {
  id: string;
  title: string;
  tagline?: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  totalHours: number;
  lectures: number;
  students: number;
  rating: number;
  price: string;
  enrolled?: boolean;
  progress?: number;
  org: {
    id: string;
    name: string;
    avatar?: string;
  };
  instructor?: {
    id: string;
    name: string;
    title: string;
    role: string;
    avatar?: string;
    bio: string;
    experience: string;
    rating: number;
    studentsTaught: number;
  };
}

export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    verified?: boolean;
    role?: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  time?: string;
  timestamp?: string;
  liked?: boolean;
  isLiked?: boolean;
  isBookmarked?: boolean;
  tags?: string[];
  groupId?: string;
  org?: string | null;
}

export interface Notification {
  id: string;
  type: string;
  title?: string;
  content: string;
  read: boolean;
  time: string;
  user: {
    name: string;
    avatar?: string;
  };
}

export const currentOrg: Organization = {
  id: '',
  name: 'منظمة معتمدة',
  username: 'org',
  avatar: '',
  cover: '',
  bio: '',
  category: 'عام',
  location: 'المملكة العربية السعودية',
  followers: 0,
  activities: 0,
  courses: 0,
  members: 0,
  verified: true,
  role: 'org',
};

export const users: User[] = [];
export const organizations: Organization[] = [];
export const posts: Post[] = [];
export const activities: Activity[] = [];
export const courses: Course[] = [];
export const notifications: Notification[] = [];

export const conversations: Array<{
  id: string;
  user: { id: string; name: string; avatar?: string; online?: boolean };
  lastMessage: string;
  time: string;
  unread: number;
  messages: Array<{ id: string; sender: string; content: string; time: string }>;
}> = [];

export const adminStats = {
  totalUsers: 0,
  totalOrgs: 0,
  totalPosts: 0,
  totalActivities: 0,
  totalCourses: 0,
  pendingOrgs: 0,
  reportedPosts: 0,
  activeUsers: 0,
};

export const systemLogs: Array<{ id: string; type: string; message: string; time: string; ip: string }> = [];

export const orgAnalyticsData = {
  followerGrowth: [],
  activityParticipation: [],
  engagementByType: [],
};

export const adminAnalyticsData = {
  userGrowth: [] as Array<{ month: string; users: number }>,
  contentByType: [] as Array<{ type: string; value: number }>,
  reportsByStatus: [] as Array<{ status: string; count: number }>,
};
