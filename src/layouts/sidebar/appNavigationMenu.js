import {
  LayoutDashboard,
  GraduationCap,
  Users2,
} from "lucide-react";

/**
 * Sidebar menu matching the enterprise template layout.
 * Parents without children are hidden after filtering.
 */
export const appNavigationMenu = [
  {
    items: [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        route: "/lms/dashboard",
        enabled: true,
      },
      {
        name: "Self service",
        icon: GraduationCap,
        children: [
          {
            name: "My Training",
            route: "/people/training/my_training",
            enabled: true,
          },
          {
            name: "My Learning",
            route: "/lms/learning",
            enabled: true,
          },
          {
            name: "Training Approval",
            route: "/people/training/request",
            enabled: true,
          },
        ],
      },
      {
        name: "Administration",
        icon: Users2,
        children: [
          {
            name: "Skills & Competency",
            route: "/people/hr/training/skills",
            enabled: true,
            requiresHR: true,
          },
          {
            name: "Training Needs",
            route: "/people/hr/training/needs",
            enabled: true,
            requiresHR: true,
          },
          {
            name: "LMS Course",
            route: "/lms/staff",
            enabled: true,
            requiresHR: true,
          },
          {
            name: "Training Course",
            route: "/people/hr/training/course",
            enabled: true,
            requiresHR: true,
          },
          {
            name: "Catalogue",
            route: "/people/hr/training/catalogue",
            enabled: true,
            requiresHR: true,
          },
          {
            name: "Calendar",
            route: "/people/hr/training/calendar",
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
          {
            name: "Requests & Approvals",
            route: "/people/hr/training/requests",
            enabled: true,
            requiresHR: true,
          },
          {
            name: "Trainers & Providers",
            route: "/people/hr/training/providers",
            enabled: true,
            requiresHR: true,
          },
        ],
      },
    ],
  },
];

export const buildAppNavigationMenu = () => appNavigationMenu;
