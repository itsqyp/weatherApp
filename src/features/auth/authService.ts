interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
}

interface RegisterResponse {
  message: string;
  user: {
    username: string;
  };
}

export async function registerUser(
  data: RegisterData,
): Promise<RegisterResponse> {
  const response = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to create account.");
  }

  return result as RegisterResponse;
}
