export type User = {
  id: string;
  name: string;
  email: string;
};

export function getCurrentUser(): User | null {
  return null;
}

export function isAuthenticated() {
  return getCurrentUser() !== null;
}