import {
  LayoutDashboard,
  UserCog,
  CalendarDays,
  TrendingUp,
  GraduationCap,
  CheckCircle2,
  Bell,
  Wallet,
  Coins,
  CircleDollarSign,
  CalendarRange,
  FileBarChart,
  Users2,
  Building2,
  Settings,
} from "lucide-react";

/**
 * Sidebar menu matching the enterprise template layout.
 * Parents without children are hidden after filtering.
 */
export const appNavigationMenu = [
  {
    title: "Internal",
    items: [
      {
        name: "Training",
        icon: GraduationCap,
        children: [
          {
            name: "My Training",
            route: "/people/training/my_training",
            enabled: true,
          },
          {
            name: "Training Requests",
            route: "/people/training/request",
            enabled: true,
          },
        ],
      },
      {
        name: "HR Training",
        icon: Users2,
        children: [
          {
            name: "Course",
            route: "/people/hr/training/course",
            enabled: true,
            requiresHR: true,
          },
          {
            name: "Course Notification",
            route: "/people/hr/training/dashboard",
            enabled: true,
            requiresHR: true,
          },
          {
            name: "DTA",
            route: "/people/hr/training/dta",
            enabled: true,
            requiresHR: true,
          },
          {
            name: "Travelings",
            route: "/people/hr/training/traveling_fee",
            enabled: true,
            requiresHR: true,
          },
          {
            name: "Report",
            route: "/people/hr/training/report",
            enabled: true,
            requiresHR: true,
          },
          {
            name: "Templates",
            route: "/people/hr/training/templates",
            enabled: true,
            requiresHR: true,
          },
        ],
      },
    ],
  },
  {
    title: "External",
    items: [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        route: "/lms/dashboard",
        enabled: true,
      },
      {
        name: "My Learning",
        icon: GraduationCap,
        route: "/lms/learning",
        enabled: true,
      },
      {
        name: "My Courses",
        icon: UserCog,
        route: "/lms/staff",
        enabled: true,
      },
    ],
  },
];

export const buildAppNavigationMenu = () => appNavigationMenu;
