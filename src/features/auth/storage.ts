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
export function renameStoredUsername(
  currentUsername: string,
  newUsername: string,
): string | null {
  const users = getStoredUsers();

  const currentUser = users.find(
    (user) => user.username.toLowerCase() === currentUsername.toLowerCase(),
  );

  if (!currentUser) {
    return "Account not found.";
  }

  const usernameTaken = users.some(
    (user) =>
      user.username.toLowerCase() !== currentUsername.toLowerCase() &&
      user.username.toLowerCase() === newUsername.toLowerCase(),
  );

  if (usernameTaken) {
    return "That username is already taken.";
  }

  const updatedUsers = users.map((user) =>
    user.username.toLowerCase() === currentUsername.toLowerCase()
      ? { ...user, username: newUsername }
      : user,
  );

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

  window.dispatchEvent(new Event("weather-app-user-updated"));

  return null;
}

export function changeStoredPassword(
  username: string,
  oldPassword: string,
  newPassword: string,
): string | null {
  const users = getStoredUsers();

  const currentUser = users.find(
    (user) => user.username.toLowerCase() === username.toLowerCase(),
  );

  if (!currentUser) {
    return "Account not found.";
  }

  if (currentUser.password !== oldPassword) {
    return "Your current password is incorrect.";
  }

  const updatedUsers = users.map((user) =>
    user.username.toLowerCase() === username.toLowerCase()
      ? { ...user, password: newPassword }
      : user,
  );

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

  return null;
}
