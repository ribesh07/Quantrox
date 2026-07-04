export type Permission =
  | "VIEW_ORDERS"
  | "MANAGE_ORDERS"
  | "VIEW_USERS"
  | "MANAGE_USERS"
  | "VIEW_GAMES"
  | "MANAGE_GAMES"
  | "VIEW_MERCHANTS"
  | "MANAGE_MERCHANTS"
  | "VIEW_PAYMENT_METHODS"
  | "MANAGE_PAYMENT_METHODS"
  | "VIEW_DEPOSITS"
  | "MANAGE_DEPOSITS"
  | "VIEW_PAYOUTS"
  | "MANAGE_PAYOUTS"
  | "VIEW_SETTINGS"
  | "MANAGE_SETTINGS"
  | "VIEW_GAME_ID_REQUESTS"
  | "MANAGE_GAME_ID_REQUESTS";

export function hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
  // SUPER_ADMIN has all permissions implicitly (check role)
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(perm => userPermissions.includes(perm));
}
