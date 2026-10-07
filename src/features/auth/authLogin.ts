import { getStoredUsers } from "./storage";
import type { StoredUser } from "./storage";

interface LoginResult {
  success: boolean;
  message?: string;
}

export function loginUser(username: string, password: string): LoginResult {
  const users = getStoredUsers();

  const userIndex = users.findIndex(
    (user) =>
      user.username.toLowerCase() === username.toLowerCase() &&
      user.password === password,
  );

  if (userIndex === -1) {
    return {
      success: false,
      message: "Invalid username or password.",
    };
  }

  const updatedUsers: StoredUser[] = users.map((user, index) => ({
    ...user,
    status: index === userIndex ? 1 : 0,
  }));

  localStorage.setItem("weather-app-users", JSON.stringify(updatedUsers));

  return {
    success: true,
  };
}
