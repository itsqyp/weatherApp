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
              ? "text-[#4a5759]"
              : "text-[#4a5759]/75 hover:text-[#4a5759]"
          } ${
            mobile && isActive
              ? "bg-[#edafb8]/50"
              : mobile
                ? "hover:bg-[#dedbd2]/60"
                : ""
          }`}
          role={mobile ? "menuitem" : undefined}
        >
          {link.label}

          {!mobile && (
            <motion.span
              className="absolute right-0 bottom-0 left-0 h-0.5 origin-left rounded-full bg-[#edafb8]"
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
      className="relative z-50 border-b border-[#dedbd2]/80 bg-[#f7e1d7]/95 text-[#4a5759] shadow-sm shadow-[#4a5759]/5 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to={data.brand.path}
          onClick={closeMenus}
          aria-label={data.brand.label}
          className="group flex shrink-0 items-center gap-2 text-[#4a5759] transition-colors duration-300 hover:text-[#4a5759]/75"
        >
          <CloudSun
            size={28}
            strokeWidth={1.7}
            className="text-[#4a5759] transition-colors duration-200 group-hover:text-[#edafb8] md:hidden"
          />

          <span className="hidden font-anton text-2xl tracking-wide md:inline">
            {data.brand.label}
            <span className="ml-0.5 text-[#edafb8]">.</span>
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
              className="flex size-10 items-center justify-center rounded-full text-[#4a5759] transition-colors hover:bg-[#dedbd2]/70 hover:text-[#4a5759] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a5759]"
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
                  className="absolute top-full right-0 z-[100] mt-3 flex w-48 origin-top-right flex-col gap-1 overflow-hidden rounded-2xl border border-[#dedbd2] bg-[#f7e1d7] p-2 shadow-xl shadow-[#4a5759]/15"
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
            className="relative border-l border-[#dedbd2] pl-3 sm:pl-5"
          >
            <button
              type="button"
              onClick={() => setIsAccountOpen((current) => !current)}
              className="flex items-center gap-2 rounded-full py-2 text-sm text-[#4a5759] transition-colors hover:text-[#4a5759]/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4a5759]"
              aria-label="Open account menu"
              aria-expanded={isAccountOpen}
              aria-haspopup="menu"
            >
              <CircleUserRound
                size={21}
                strokeWidth={1.6}
                className="shrink-0 text-[#4a5759]"
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
                  className="absolute top-full right-0 z-[100] mt-3 flex w-48 origin-top-right flex-col overflow-hidden rounded-2xl border border-[#dedbd2] bg-[#f7e1d7] p-1.5 shadow-xl shadow-[#4a5759]/15"
                  role="menu"
                >
                  {data.account.menu.map((item) => {
                    if (item.action === "logout") {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={handleLogout}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#4a5759] transition-colors hover:bg-[#edafb8]/50"
                          role="menuitem"
                        >
                          <LogOut
                            size={16}
                            strokeWidth={1.8}
                            className="text-[#4a5759]"
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
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#4a5759] transition-colors hover:bg-[#b0c4b1]/60"
                          role="menuitem"
                        >
                          <UserRound
                            size={16}
                            strokeWidth={1.8}
                            className="text-[#4a5759]"
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
