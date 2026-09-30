export function validateUsername(username: string): string | null {
  if (!username) {
    return "Username is required.";
  }

  if (username.length > 10) {
    return "Username cannot be more than 10 characters.";
  }

  if (!/^[A-Za-z]+$/.test(username)) {
    return "Username can contain only letters with no spaces.";
  }

  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return "Password is required.";
  }

  if (!/^[A-Za-z0-9]+$/.test(password)) {
    return "Password can contain only letters and numbers with no spaces.";
  }

  return null;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | null {
  if (!confirmPassword) {
    return "Please confirm your password.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}
