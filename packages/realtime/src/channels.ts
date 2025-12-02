export const channels = {
  thread: (threadId: string) => `conversations:thread:${threadId}`,
  presence: (threadId: string) => `presence:thread:${threadId}`,
  team: (teamId: string) => `team:${teamId}`,
  notifications: (teamId: string) => `notifications:team:${teamId}`,
};
