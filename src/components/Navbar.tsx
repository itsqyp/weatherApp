import { useEffect, useRef, useState } from "react";
import {
  CloudSun,
  CircleUserRound,
  ChevronDown,
  LogOut,
  UserRound,
  Menu,
  X,
} from "lucide-react";
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
  const navigate = useNavigate();
  const location = useLocation();

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(() => getActiveUser());

  const accountRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  function closeMenus() {
    setIsAccountOpen(false);
    setIsMobileMenuOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (!accountRef.current?.contains(target)) {
        setIsAccountOpen(false);
      }

      if (!mobileMenuRef.current?.contains(target)) {
        setIsMobileMenuOpen(false);
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
    closeMenus();
    navigate("/login", { replace: true });
  }

  function renderNavigationLinks(mobile = false) {
    return data.links.map((link) => {
      const isActive = location.pathname === link.path;

      return (
        <Link
          key={link.label}
          to={link.path}
          onClick={closeMenus}
          className={`relative ${
            mobile ? "block rounded-xl px-3 py-2.5" : "py-2"
          } text-sm font-medium transition-colors duration-200 ${
            isActive
              ? "text-foreground"
              : "text-foreground/75 hover:text-foreground"
          } ${
            mobile && isActive
              ? "bg-primary/50"
              : mobile
                ? "hover:bg-muted/60"
                : ""
          }`}
          role={mobile ? "menuitem" : undefined}
        >
          {link.label}

          {!mobile && (
            <motion.span
              className="absolute right-0 bottom-0 left-0 h-0.5 origin-left rounded-full bg-primary"
              initial={false}
              animate={{
                scaleX: isActive ? 1 : 0,
                opacity: isActive ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
            />
          )}
        </Link>
      );
    });
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative z-50 border-b border-muted/80 bg-background/95 text-foreground shadow-sm shadow-foreground/5 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to={data.brand.path}
          onClick={closeMenus}
          aria-label={data.brand.label}
          className="group flex shrink-0 items-center gap-2 text-foreground transition-colors duration-300 hover:text-foreground/75"
        >
          <CloudSun
            size={28}
            strokeWidth={1.7}
            className="text-foreground transition-colors duration-200 group-hover:text-primary md:hidden"
          />

          <span className="hidden font-anton text-2xl tracking-wide md:inline">
            {data.brand.label}
            <span className="ml-0.5 text-primary">.</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-7 md:flex">
          {renderNavigationLinks()}
        </div>

        {/* Mobile menu and account */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Mobile navigation dropdown */}
          <div ref={mobileMenuRef} className="relative md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              aria-label={
                isMobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={isMobileMenuOpen}
              aria-haspopup="menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isMobileMenuOpen ? "close" : "open"}
                  initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="flex"
                >
                  {isMobileMenuOpen ? (
                    <X size={22} strokeWidth={1.7} />
                  ) : (
                    <Menu size={22} strokeWidth={1.7} />
                  )}
                </motion.span>
              </AnimatePresence>
            </button>

            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute top-full right-0 z-[100] mt-3 flex w-48 origin-top-right flex-col gap-1 overflow-hidden rounded-2xl border border-muted bg-background p-2 shadow-xl shadow-foreground/15"
                  role="menu"
                >
                  {renderNavigationLinks(true)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Account dropdown */}
          <div
            ref={accountRef}
            className="relative border-l border-muted pl-3 sm:pl-5"
          >
            <button
              type="button"
              onClick={() => setIsAccountOpen((current) => !current)}
              className="flex items-center gap-2 rounded-full py-2 text-sm text-foreground transition-colors hover:text-foreground/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
              aria-label="Open account menu"
              aria-expanded={isAccountOpen}
              aria-haspopup="menu"
            >
              <CircleUserRound
                size={21}
                strokeWidth={1.6}
                className="shrink-0 text-foreground"
              />

              <span className="hidden max-w-32 truncate sm:inline">
                {activeUser?.username ?? "Account"}
              </span>

              <ChevronDown
                size={15}
                strokeWidth={1.8}
                className={`hidden transition-transform duration-200 sm:block ${
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
                  className="absolute top-full right-0 z-[100] mt-3 flex w-48 origin-top-right flex-col overflow-hidden rounded-2xl border border-muted bg-background p-1.5 shadow-xl shadow-foreground/15"
                  role="menu"
                >
                  {data.account.menu.map((item) => {
                    if (item.action === "logout") {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={handleLogout}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-primary/50"
                          role="menuitem"
                        >
                          <LogOut
                            size={16}
                            strokeWidth={1.8}
                            className="text-foreground"
                          />
                          {item.label}
                        </button>
                      );
                    }

                    if (item.path) {
                      return (
                        <Link
                          key={item.label}
                          to={item.path}
                          onClick={closeMenus}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/60"
                          role="menuitem"
                        >
                          <UserRound
                            size={16}
                            strokeWidth={1.8}
                            className="text-foreground"
                          />
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
