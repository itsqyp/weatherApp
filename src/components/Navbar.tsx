import { useEffect, useRef, useState } from "react";
import { CircleUserRound, ChevronDown, LogOut, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";

import navbarData from "../data/navbar.json";
import { getActiveUser, logoutUser } from "../features/auth/storage";

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
  function closeAccountMenu() {
    setIsAccountOpen(false);
  }
  const navigate = useNavigate();
  const location = useLocation();

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const [activeUser, setActiveUser] = useState(() => getActiveUser());

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

  function handleLogout() {
    logoutUser();
    setActiveUser(null);
    setIsAccountOpen(false);
    navigate("/login", { replace: true });
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative z-50 border-b border-white/10 bg-slate-950/15 text-white backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to={data.brand.path}
          onClick={closeAccountMenu}
          className="group shrink-0 font-anton text-2xl tracking-wide text-white transition-colors duration-300 hover:text-primary"
        >
          {data.brand.label}
          <span className="ml-0.5 text-primary">.</span>
        </Link>

        {/* Navigation and account */}
        <div className="flex items-center gap-4 sm:gap-7">
          {/* Navigation links */}
          <div className="flex items-center gap-4 sm:gap-7">
            {data.links.map((link) => {
              const isActive = location.pathname === link.path;

              return (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={closeAccountMenu}
                  className={`relative py-2 text-sm transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.label}

                  <motion.span
                    className="absolute right-0 bottom-0 left-0 h-0.5 origin-left rounded-full bg-primary"
                    initial={false}
                    animate={{
                      scaleX: isActive ? 1 : 0,
                      opacity: isActive ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                  />
                </Link>
              );
            })}
          </div>

          {/* Account dropdown */}
          <div
            ref={accountRef}
            className="relative border-l border-white/15 pl-4 sm:pl-6"
          >
            <button
              type="button"
              onClick={() => setIsAccountOpen((current) => !current)}
              className="flex items-center gap-2 rounded-full py-2 text-sm text-white/90 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              aria-expanded={isAccountOpen}
              aria-haspopup="menu"
            >
              <CircleUserRound
                size={21}
                strokeWidth={1.6}
                className="shrink-0"
              />

              <span className="max-w-20 truncate sm:max-w-32">
                {activeUser?.username ?? "Account"}
              </span>

              <ChevronDown
                size={15}
                strokeWidth={1.8}
                className={`transition-transform duration-200 ${
                  isAccountOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {isAccountOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute top-full right-0 mt-3 flex w-44 origin-top-right flex-col overflow-hidden rounded-xl border border-white/15 bg-slate-950/85 p-1.5 shadow-xl shadow-black/20 backdrop-blur-xl"
                  role="menu"
                >
                  {data.account.menu.map((item) => {
                    if (item.action === "logout") {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={handleLogout}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-primary"
                          role="menuitem"
                        >
                          <LogOut size={16} strokeWidth={1.8} />
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
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-primary"
                          role="menuitem"
                        >
                          <UserRound size={16} strokeWidth={1.8} />
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
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
