import { createUsersStatements } from './users.mjs';
import { createPostsStatements } from './posts.mjs';
import { createGroupsStatements } from './groups.mjs';
import { createActivitiesStatements } from './activities.mjs';
import { createCoursesStatements } from './courses.mjs';
import { createChatsStatements } from './chats.mjs';
import { createNotificationsStatements } from './notifications.mjs';
import { createMessagesStatements } from './messages.mjs';
import { createOrgStatements } from './org.mjs';
import { createReportsStatements } from './reports.mjs';
import { createPetraStatements } from './petra.mjs';

let statementsInstance = null;

export function initStatements(db) {
  if (statementsInstance) return statementsInstance;

  statementsInstance = {
    ...createUsersStatements(db),
    ...createPostsStatements(db),
    ...createGroupsStatements(db),
    ...createActivitiesStatements(db),
    ...createCoursesStatements(db),
    ...createChatsStatements(db),
    ...createNotificationsStatements(db),
    ...createMessagesStatements(db),
    ...createOrgStatements(db),
    ...createReportsStatements(db),
    ...createPetraStatements(db),
  };

  return statementsInstance;
}

export function getStatements() {
  if (!statementsInstance) {
    throw new Error('Statements have not been initialized yet. Call initStatements(db) first.');
  }
  return statementsInstance;
}
