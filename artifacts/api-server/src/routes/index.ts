import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "../modules/auth/auth.routes";
import usersRouter from "../modules/users/users.routes";
import organizationsRouter from "../modules/organizations/organizations.routes";
import postsRouter from "../modules/posts/posts.routes";
import groupsRouter from "../modules/groups/groups.routes";
import activitiesRouter from "../modules/activities/activities.routes";
import coursesRouter from "../modules/courses/courses.routes";
import blogRouter from "../modules/blog/blog.routes";
import notificationsRouter from "../modules/notifications/notifications.routes";
import messagesRouter from "../modules/messages/messages.routes";
import aiChatRouter from "../modules/ai-chat/ai-chat.routes";
import reportsRouter from "../modules/reports/reports.routes";
import adminRouter from "../modules/admin/admin.routes";
import dashboardRouter from "../modules/dashboard/dashboard.routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/organizations", organizationsRouter);
router.use("/posts", postsRouter);
router.use("/groups", groupsRouter);
router.use("/activities", activitiesRouter);
router.use("/courses", coursesRouter);
router.use("/blog", blogRouter);
router.use("/notifications", notificationsRouter);
router.use("/messages", messagesRouter);
router.use("/ai-chat", aiChatRouter);
router.use("/reports", reportsRouter);
router.use("/admin", adminRouter);
router.use("/dashboard", dashboardRouter);

export default router;
