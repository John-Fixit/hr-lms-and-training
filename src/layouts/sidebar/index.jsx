import { useContext, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { dashboardContext } from "../../context/Dashboard";
import useCurrentUser from "../../hooks/useCurrentUser";
import { filePrefix } from "../../utils/filePrefix";
import { appNavigationMenu } from "./appNavigationMenu";
import { filterNavigationMenu } from "./filterNavigationMenu";
import SidebarNavItem from "./SidebarNavItem";
import { brand } from "../../config/brand";

const SIDEBAR_WIDTH = 260;

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen, isTablet } =
    useContext(dashboardContext);
  const sidebarRef = useRef();
  const { pathname } = useLocation();
  const { userData } = useCurrentUser();

  const navigationSections = useMemo(
    () => filterNavigationMenu(appNavigationMenu, userData),
    [userData],
  );

  useEffect(() => {
    if (isTablet) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isTablet, setSidebarOpen]);

  useEffect(() => {
    isTablet && setSidebarOpen(false);
  }, [pathname, isTablet, setSidebarOpen]);

  const overlayClicked = () => setSidebarOpen(false);

  const Nav_animation = isTablet
    ? {
        open: { x: 0, width: SIDEBAR_WIDTH, transition: { damping: 40 } },
        closed: {
          x: -SIDEBAR_WIDTH,
          width: 0,
          transition: { damping: 40, delay: 0.15 },
        },
      }
    : {
        open: { width: SIDEBAR_WIDTH, transition: { damping: 40 } },
        closed: { width: 0, transition: { damping: 40 } },
      };

  const userInitial =
    userData?.data?.FIRST_NAME?.trim()?.[0]?.toUpperCase() || "U";
  const userName = userData?.data?.LAST_NAME || "User";
  const userRole = userData?.data?.IS_ADMINISTRATOR ? "Administrator" : "Staff";

  return (
    <>
      {sidebarOpen && isTablet && (
        <div
          onClick={overlayClicked}
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}

      <motion.aside
        ref={sidebarRef}
        variants={Nav_animation}
        initial={{ x: isTablet ? -SIDEBAR_WIDTH : 0 }}
        animate={sidebarOpen ? "open" : "closed"}
        className="fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#1E293B] via-[#1B2638] to-[#0F172A] text-slate-300 lg:z-[49] z-[91]"
        style={{ maxWidth: SIDEBAR_WIDTH, width: SIDEBAR_WIDTH }}
      >
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-3 px-5 py-5">
          <div
            className={`flex h-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-md ${
              brand.showNameWithLogo ? "w-11 p-1" : "w-32 px-3 py-1.5"
            }`}
          >
            <img
              src={brand.logo}
              alt={`${brand.shortName} logo`}
              className="h-full w-full object-contain"
            />
          </div>
          {brand.showNameWithLogo && (
            <span className="text-[15px] font-bold leading-tight text-white">
              {brand.name}
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="scrollbar-slim flex-1 overflow-y-auto px-3 pb-4">
          {navigationSections.map((section, idx) => (
            <div
              key={section.title ?? `section-${idx}`}
              className={idx === 0 ? "mt-1" : "mt-5"}
            >
              {section.title && (
                <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.title}
                </p>
              )}
              <ul className="space-y-1">
                
                {section.items.map((item) => (
                  <SidebarNavItem key={item.name} item={item} />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Profile */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
          >
            {userData?.data?.FILE_NAME ? (
              <img
                src={filePrefix + userData.data.FILE_NAME}
                alt={userName}
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-indigo-500/50"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                {userInitial}
              </div>
            )}
            <div className="min-w-0 flex-1 text-left leading-tight">
              <p className="truncate text-sm font-semibold text-white uppercase">
                {userName}
              </p>
              <p className="truncate text-xs text-slate-400">{userRole}</p>
            </div>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-slate-400"
              strokeWidth={2}
            />
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
