import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";

import {
  validatePassword,
  validateConfirmPassword,
} from "../../features/auth/validation";
import { changeStoredPassword } from "../../features/auth/storage";

interface Props {
  username: string;
}

function ChangePasswordForm({ username }: Props) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      setIsError(true);
      setMessage(passwordError);
      return;
    }

    const confirmError = validateConfirmPassword(newPassword, confirmPassword);

    if (confirmError) {
      setIsError(true);
      setMessage(confirmError);
      return;
    }

    const error = changeStoredPassword(username, oldPassword, newPassword);

    if (error) {
      setIsError(true);
      setMessage(error);
      return;
    }

    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsError(false);
    setMessage("Password updated successfully.");
  }

  return (
    <section className="rounded-2xl border border-muted bg-background/90 p-5 shadow-sm shadow-foreground/5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-secondary/50">
          <KeyRound size={20} />
        </span>

        <div>
          <h2 className="font-anton text-xl tracking-wide">Change password</h2>
          <p className="mt-1 text-sm text-foreground/65">
            Choose a new password for your account.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="old-password"
            className="mb-2 block text-sm font-medium"
          >
            Current password
          </label>
          <input
            id="old-password"
            type="password"
            autoComplete="current-password"
            value={oldPassword}
            onChange={(event) => {
              setOldPassword(event.target.value);
              setMessage("");
            }}
            required
            className="w-full rounded-xl border border-muted bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label
            htmlFor="new-password"
            className="mb-2 block text-sm font-medium"
          >
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setMessage("");
            }}
            required
            className="w-full rounded-xl border border-muted bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label
            htmlFor="confirm-new-password"
            className="mb-2 block text-sm font-medium"
          >
            Confirm new password
          </label>
          <input
            id="confirm-new-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setMessage("");
            }}
            required
            className="w-full rounded-xl border border-muted bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {message && (
          <p
            role="status"
            className={`text-sm ${isError ? "text-red-700" : "text-foreground"}`}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Update password
        </button>
      </form>
    </section>
  );
}

export default ChangePasswordForm;
