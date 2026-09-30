import { useState, type FormEvent } from "react";
import { Copyright, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

import WarningModal from "../components/WarningModal";
import { registerUser } from "../features/auth/authService";
import {
  validateConfirmPassword,
  validatePassword,
  validateUsername,
} from "../features/auth/validation";

function CreateAccount() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [warning, setWarning] = useState<string | null>(null);

  async function handleCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const usernameError = validateUsername(username);

    if (usernameError) {
      setWarning(usernameError);
      return;
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      setWarning(passwordError);
      return;
    }

    const confirmPasswordError = validateConfirmPassword(
      password,
      confirmPassword,
    );

    if (confirmPasswordError) {
      setWarning(confirmPasswordError);
      return;
    }

    setWarning(null);

    try {
      const result = await registerUser({
        username,
        password,
        confirmPassword,
      });

      console.log(result);
    } catch (error) {
      if (error instanceof Error) {
        setWarning(error.message);
      } else {
        setWarning("Unable to create account.");
      }
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      {warning && (
        <WarningModal message={warning} onClose={() => setWarning(null)} />
      )}

      <div className="login-enter w-full max-w-md rounded-2xl border border-foreground/15 bg-muted p-8 shadow-lg sm:p-10">
        <div className="mb-8 text-center">
          <h1 className="font-anton text-5xl tracking-wide">Create Account</h1>

          <p className="mt-2 text-sm text-foreground/70">Create your account</p>
        </div>

        <form className="space-y-6" onSubmit={handleCreateAccount}>
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium"
            >
              Username
            </label>

            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              maxLength={10}
              className="w-full rounded-lg border border-foreground/20 bg-background px-4 py-3 text-sm outline-none transition placeholder:text-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-foreground/20 bg-background px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/30"
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 transition hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium"
            >
              Confirm Password
            </label>

            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your password"
                className="w-full rounded-lg border border-foreground/20 bg-background px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/30"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 transition hover:text-foreground"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-foreground transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
          >
            Create
          </button>

          <div className="text-center">
            <p className="text-sm text-foreground/70">
              Already have an account?{" "}
              <Link
                to="/"
                className="font-medium text-foreground underline-offset-4 transition hover:text-primary hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>

      <div className="absolute bottom-4 right-4 flex max-w-[calc(100%-2rem)] flex-wrap items-center justify-end gap-x-1.5 gap-y-1 text-right text-xs text-foreground/60 sm:bottom-5 sm:right-6">
        <span>Made by Abir Bro.</span>

        <Copyright size={14} strokeWidth={1.8} aria-hidden="true" />

        <span>{new Date().getFullYear()}</span>

        <span>All Rights Reserved</span>
      </div>
    </main>
  );
}

export default CreateAccount;
