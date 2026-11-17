import { Fragment, useContext, useEffect } from "react";
import { useRef } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { dashboardContext } from "../../context/Dashboard";
import { defaultMenuHome } from "../sidebar/routes";
import { Tooltip, Avatar } from "@nextui-org/react";
import { IoIosArrowForward } from "react-icons/io";
import useCurrentUser from "../../hooks/useCurrentUser";
import { brand } from "../../config/brand";
import { filePrefix } from "../../utils/filePrefix";

const DefaultSidebar = () => {
  const {
    sidebarOpen,
    setSidebarOpen,
    isTablet,
    sidebarMinimizedHome,
    setCurrentHomeSidemenu,
  } = useContext(dashboardContext);
  const sidebarRef = useRef();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userData } = useCurrentUser();

  useEffect(() => {
    if (isTablet) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isTablet, setSidebarOpen]);

  const overlayClicked = () => setSidebarOpen(false);

  useEffect(() => {
    isTablet && setSidebarOpen(false);
  }, [pathname, isTablet, setSidebarOpen]);

  const Nav_animation = isTablet
    ? {
        open: { x: 0, width: "16rem", transition: { damping: 40 } },
        closed: { x: -350, width: 0, transition: { damping: 40, delay: 0.15 } },
        minimize: { x: 0, width: "7.5rem", transition: { damping: 40, delay: 0.15 } },
      }
    : {
        open: { width: "16rem", transition: { damping: 40 } },
        closed: { width: "0rem", transition: { damping: 40 } },
        minimize: { width: "7.5rem", transition: { damping: 40 } },
      };

  const showSubMenu = (menu) => {
    if (menu === "Dashboard") {
      navigate("/lms/dashboard");
      return;
    }
    if (menu === "My Learning") {
      navigate("/lms/learning");
      return;
    }
    if (menu === "Performance") {
      navigate("/performance/dashboard");
      return;
    }
    if (menu === "LMS") {
      navigate("/lms/dashboard");
      return;
    }
    setCurrentHomeSidemenu(menu);
  };

  const isDashboardActive =
    pathname.includes("/engage/home") || pathname.includes("/lms/dashboard");

  return (
    <div className="relative bg-sidebarBg shadow-sidebar">
      <div
        onClick={overlayClicked}
        className={`lg:hidden fixed inset-0 max-h-screen z-[90] bg-chatoverlay cursor-pointer ${
          sidebarOpen ? "block" : "hidden"
        }`}
      />
      <motion.div
        ref={sidebarRef}
        variants={Nav_animation}
        initial={{ x: isTablet ? -350 : 0 }}
        animate={
          sidebarMinimizedHome && sidebarOpen
            ? "minimize"
            : !sidebarMinimizedHome && sidebarOpen
            ? "open"
            : "closed"
        }
        className="shadow-sidebar group lg:z-[49] z-[91] max-w-[16rem] w-[16rem] fixed top-0 left-0 h-screen dark:!text-gray-100 bg-sidebarBg flex flex-col"
        id="s-sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className={`px-4 py-5 border-b border-white/5 shrink-0 ${
              sidebarMinimizedHome ? "flex justify-center" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 shrink-0 items-center justify-center rounded-lg bg-white ${
                  sidebarMinimizedHome || brand.showNameWithLogo
                    ? "w-10 p-1"
                    : "w-28 px-3 py-1.5"
                }`}
              >
                <img
                  src={brand.logo}
                  alt={`${brand.shortName} logo`}
                  className="h-full w-full object-contain"
                />
              </div>
              {!sidebarMinimizedHome && brand.showNameWithLogo && (
                <p className="text-white text-sm font-semibold leading-tight">
                  {brand.name}
                </p>
              )}
            </div>
          </div>

          {/* Nav items */}
          <ul className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-transparent py-4 px-2 space-y-1">
            {defaultMenuHome?.map((route) => {
              const isActive =
                route.name === "Dashboard"
                  ? isDashboardActive
                  : pathname.includes(route.route?.replace("/", "") || "");

              const itemContent = (
                <li
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-200 ${
                    sidebarMinimizedHome ? "flex-col py-3" : ""
                  } ${
                    isActive
                      ? "bg-dashboard-purple text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                  onClick={() =>
                    route?.enabled || route?.name === "More"
                      ? showSubMenu(route?.name)
                      : undefined
                  }
                >
                  <route.icon
                    size={sidebarMinimizedHome ? 24 : 18}
                    className={`shrink-0 ${isActive ? "text-white" : ""}`}
                  />
                  {!sidebarMinimizedHome && (
                    <>
                      <span className="flex-1 text-sm font-medium capitalize truncate">
                        {route?.name}
                      </span>
                      <IoIosArrowForward
                        size={14}
                        className={`shrink-0 opacity-60 ${isActive ? "text-white" : ""}`}
                      />
                    </>
                  )}
                  {sidebarMinimizedHome && (
                    <span className="text-[10px] text-center truncate w-full mt-1">
                      {route?.name}
                    </span>
                  )}
                </li>
              );

              return (
                <Fragment key={route.name}>
                  {sidebarMinimizedHome ? (
                    <Tooltip placement="right" content={route?.name}>
                      {itemContent}
                    </Tooltip>
                  ) : (
                    itemContent
                  )}
                </Fragment>
              );
            })}
          </ul>

          {/* Bottom profile */}
          <div
            className={`shrink-0 border-t border-white/10 p-4 ${
              sidebarMinimizedHome ? "flex justify-center" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={
                  userData?.data?.FILE_NAME
                    ? filePrefix + userData.data.FILE_NAME
                    : undefined
                }
                name={userData?.data?.FIRST_NAME?.trim()?.[0]}
                className="w-9 h-9 shrink-0"
              />
              {!sidebarMinimizedHome && (
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">
                    {userData?.data?.LAST_NAME || "User"}
                  </p>
                  <p className="text-slate-400 text-xs truncate">
                    {userData?.data?.IS_ADMINISTRATOR
                      ? "Administrator"
                      : "Staff"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DefaultSidebar;
