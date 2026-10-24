import { useState, type FormEvent } from "react";
import { Check, UserRound } from "lucide-react";

import { validateUsername } from "../../features/auth/validation";
import { renameStoredUsername } from "../../features/auth/storage";
import { useSavedWeatherStore } from "../../stores/savedWeatherStore";

interface Props {
  currentUsername: string;
  onUsernameChanged: (username: string) => void;
}

function ChangeUsernameForm({ currentUsername, onUsernameChanged }: Props) {
  const [newUsername, setNewUsername] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const renameSavedLocations = useSavedWeatherStore(
    (state) => state.renameUsername,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateUsername(newUsername);

    if (validationError) {
      setIsError(true);
      setMessage(validationError);
      return;
    }

    const error = renameStoredUsername(currentUsername, newUsername);

    if (error) {
      setIsError(true);
      setMessage(error);
      return;
    }

    renameSavedLocations(currentUsername, newUsername);
    onUsernameChanged(newUsername);

    setNewUsername("");
    setIsError(false);
    setMessage("Username updated successfully.");
  }

  return (
    <section className="rounded-2xl border border-muted bg-background/90 p-5 shadow-sm shadow-foreground/5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/40">
          <UserRound size={20} />
        </span>

        <div>
          <h2 className="font-anton text-xl tracking-wide">Change username</h2>
          <p className="mt-1 text-sm text-foreground/65">
            Current username: {currentUsername}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="new-username"
            className="mb-2 block text-sm font-medium"
          >
            New username
          </label>

          <input
            id="new-username"
            name="newUsername"
            value={newUsername}
            onChange={(event) => {
              setNewUsername(event.target.value);
              setMessage("");
            }}
            autoComplete="username"
            maxLength={10}
            required
            className="w-full rounded-xl border border-muted bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="Enter a new username"
          />

          <p className="mt-2 text-xs text-foreground/60">
            Up to 10 letters, with no spaces or numbers.
          </p>
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
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <Check size={16} />
          Update username
        </button>
      </form>
    </section>
  );
}

export default ChangeUsernameForm;
