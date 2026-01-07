// User roles
export const UserRoles = {
  Admin: "Admin",
  HRManager: "HRManager",
  Accountant: "Accountant",
  SalesProcurement: "SalesProcurement",
  Employee: "Employee",
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];

// User interface
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

// Get user from localStorage
export const getUser = (): User | null => {
  if (typeof window === "undefined") return null;
  
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

// Get token from localStorage
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

// Set authentication data
export const setAuthData = (token: string, user: User): void => {
  if (typeof window === "undefined") return;
  
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

// Clear authentication data
export const clearAuthData = (): void => {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getToken() !== null && getUser() !== null;
};

// Check if user has specific role
export const hasRole = (role: UserRole | UserRole[]): boolean => {
  const user = getUser();
  if (!user) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  return user.role === role;
};

// Check if user has any of the specified roles
export const hasAnyRole = (roles: UserRole[]): boolean => {
  const user = getUser();
  if (!user) return false;
  return roles.includes(user.role);
};

// Check if user is admin
export const isAdmin = (): boolean => {
  return hasRole(UserRoles.Admin);
};

// Check if user can manage HR
export const canManageHR = (): boolean => {
  const user = getUser();
  return user?.role === UserRoles.Admin || user?.role === UserRoles.HRManager;
};

// Check if user can manage accounting
export const canManageAccounting = (): boolean => {
  const user = getUser();
  return user?.role === UserRoles.Admin || user?.role === UserRoles.Accountant;
};

// Check if user can manage sales/procurement
export const canManageSalesProcurement = (): boolean => {
  const user = getUser();
  return user?.role === UserRoles.Admin || user?.role === UserRoles.SalesProcurement;
};

// Check if user is employee (default role)
export const isEmployee = (): boolean => {
  return hasRole(UserRoles.Employee);
};
