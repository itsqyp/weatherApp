import { getStoredUsers } from "./storage";

interface LoginResult {
  success: boolean;
  message?: string;
}

export function loginUser(username: string, password: string): LoginResult {
  const users = getStoredUsers();

  const user = users.find(
    (storedUser) =>
      storedUser.username.toLowerCase() === username.toLowerCase() &&
      storedUser.password === password,
  );

  if (!user) {
    return {
      success: false,
      message: "Invalid username or password.",
    };
  }

  return {
    success: true,
  };
}
