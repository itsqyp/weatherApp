import { useEffect, useRef, useState } from "react";
import { CircleUserRound, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

import navbarData from "../data/navbar.json";
import { getActiveUser } from "../features/auth/storage";

interface NavbarLink {
  label: string;
  path: string;
}

interface AccountMenuItem {
  label: string;
  path?: string;
  action?: string;
}

interface NavbarData {
  brand: {
    label: string;
    path: string;
  };
  links: NavbarLink[];
  account: {
    menu: AccountMenuItem[];
  };
}

const data = navbarData as NavbarData;

function Navbar() {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const activeUser = getActiveUser();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setIsAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="border-b border-foreground/10 bg-background">
      {" "}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}{" "}
        <Link
          to={data.brand.path}
          className="font-anton text-2xl tracking-wide text-foreground"
        >
          {data.brand.label}{" "}
        </Link>
        {/* Right side */}
        <div className="flex items-center gap-6">
          {/* Account */}
          <div ref={accountRef} className="relative">
            <button
              type="button"
              onClick={() => setIsAccountOpen((current) => !current)}
              className="flex items-center gap-2 text-sm text-foreground transition-opacity hover:opacity-70"
              aria-expanded={isAccountOpen}
              aria-haspopup="menu"
            >
              <CircleUserRound size={20} strokeWidth={1.8} />

              <span>{activeUser?.username ?? "Account"}</span>

              <ChevronDown
                size={16}
                strokeWidth={1.8}
                className={`transition-transform duration-200 ${
                  isAccountOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {isAccountOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-3 flex w-36 flex-col overflow-hidden rounded-lg border border-foreground/10 bg-muted shadow-md"
                  role="menu"
                >
                  {data.account.menu.map((item) => {
                    if (item.action === "logout") {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          className="px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-background"
                          role="menuitem"
                        >
                          {item.label}
                        </button>
                      );
                    }

                    if (item.path) {
                      return (
                        <Link
                          key={item.label}
                          to={item.path}
                          onClick={() => setIsAccountOpen(false)}
                          className="px-4 py-3 text-sm text-foreground transition-colors hover:bg-background"
                          role="menuitem"
                        >
                          {item.label}
                        </Link>
                      );
                    }

                    return null;
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation links */}
          <div className="flex items-center gap-5">
            {data.links.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className="text-sm text-foreground transition-opacity hover:opacity-70"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
