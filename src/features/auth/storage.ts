export interface StoredUser {
  username: string;
  password: string;
  status: 0 | 1;
}

const USERS_STORAGE_KEY = "weather-app-users";

export function getStoredUsers(): StoredUser[] {
  const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);

  if (!storedUsers) {
    return [];
  }

  try {
    return JSON.parse(storedUsers) as StoredUser[];
  } catch {
    return [];
  }
}

export function usernameExists(username: string): boolean {
  const users = getStoredUsers();

  return users.some(
    (user) => user.username.toLowerCase() === username.toLowerCase(),
  );
}

export function saveUser(user: StoredUser): void {
  const users = getStoredUsers();

  users.push(user);

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function getActiveUser(): StoredUser | null {
  const users = getStoredUsers();

  return users.find((user) => user.status === 1) ?? null;
}

export function logoutUser(): void {
  const users = getStoredUsers();

  const updatedUsers = users.map((user) => ({
    ...user,
    status: 0 as 0 | 1,
  }));

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
}
