// Role constants and helpers
export const ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
};

export const hasAnyRole = (user, roles = []) => {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
};

export const isAdmin = (user) => hasAnyRole(user, [ROLES.ADMIN]);
export const isModerator = (user) => hasAnyRole(user, [ROLES.MODERATOR]);
export const isAdminOrModerator = (user) => hasAnyRole(user, [ROLES.ADMIN, ROLES.MODERATOR]);
