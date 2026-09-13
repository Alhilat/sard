import { Router } from 'express';
import healthRouter from './health.mjs';
import authRouter from './auth.mjs';
import usersRouter from './users.mjs';
import postsRouter from './posts.mjs';
import articlesRouter from './articles.mjs';
import groupsRouter from './groups.mjs';
import coursesRouter from './courses.mjs';
import courseChatRouter from './course-chat.mjs';
import activitiesRouter from './activities.mjs';
import activityChatRouter from './activity-chat.mjs';
import notificationsRouter from './notifications.mjs';
import messagesRouter from './messages.mjs';
import orgRouter from './org.mjs';
import reportsRouter from './reports.mjs';
import petraRouter from './petra.mjs';
import backupRouter from './backup.mjs';

const apiRouter = Router();

// Health check endpoints
apiRouter.use(healthRouter);

// Auth endpoints
apiRouter.use('/auth', authRouter);

// User profile & relationships
apiRouter.use('/users', usersRouter);

// Posts, likes, comments, shares
apiRouter.use('/posts', postsRouter);

// Long-form articles & discussions
apiRouter.use('/articles', articlesRouter);

// Communities & groups
apiRouter.use('/groups', groupsRouter);

// Courses & Course Chat
apiRouter.use('/courses/:id/chat', courseChatRouter);
apiRouter.use('/courses', coursesRouter);

// Activities & Activity Chat
apiRouter.use('/activities/:id/chat', activityChatRouter);
apiRouter.use('/activities', activitiesRouter);

// Notifications & WebPush device tokens
apiRouter.use('/notifications', notificationsRouter);

// Direct messaging & conversations
apiRouter.use('/conversations', messagesRouter);

// Organization management
apiRouter.use('/org', orgRouter);

// Content reports
apiRouter.use('/reports', reportsRouter);

// Petra Central Control & Administration
apiRouter.use('/petra', petraRouter);

// Automated Backup & Telemetry (Render -> Supabase)
apiRouter.use(backupRouter);

export default apiRouter;
