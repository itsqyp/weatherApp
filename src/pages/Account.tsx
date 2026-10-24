import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Settings2 } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ChangeUsernameForm from "../components/account/ChangeUsernameForm";
import ChangePasswordForm from "../components/account/ChangePasswordForm";
import SavedWeatherLocations from "../components/account/SavedWeatherLocations";

import { getActiveUser, type StoredUser } from "../features/auth/storage";

function Account() {
  const [activeUser, setActiveUser] = useState<StoredUser | null>(() =>
    getActiveUser(),
  );

  if (!activeUser) {
    return <Navigate to="/login" replace />;
  }

  function handleUsernameChanged(username: string) {
    setActiveUser((current) => (current ? { ...current, username } : current));
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/50">
              <Settings2 size={24} />
            </span>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                Personal settings
              </p>
              <h1 className="font-anton text-3xl tracking-wide sm:text-4xl">
                Your Account
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-foreground/70 sm:text-base">
            Manage your login details and keep your favorite weather locations
            close at hand.
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          <ChangeUsernameForm
            currentUsername={activeUser.username}
            onUsernameChanged={handleUsernameChanged}
          />

          <ChangePasswordForm username={activeUser.username} />
        </div>

        <div className="mt-5">
          <SavedWeatherLocations username={activeUser.username} />
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default Account;
