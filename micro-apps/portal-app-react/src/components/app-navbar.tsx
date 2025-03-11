import { NavLink } from "react-router";

/**
 * Sidebar component containing header and navigation
 */
export const AppNavbar = () => (
  <div className="flex flex-col gap-2 p-6">
    <PortalHeader />
    <NavGroup />
  </div>
);

/**
 * Navigation link item props for the sidebar
 */
type NavItemProps = {
  to: string;
  children: React.ReactNode;
};

/**
 * Navigation link component with consistent styling
 */
const NavItem = ({ to, children }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `p-2 rounded-lg text-left transition-colors flex items-center gap-3 ${
        isActive
          ? "bg-blue-900 text-blue-100 dark:bg-blue-800 dark:text-blue-100"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`
    }
  >
    {children}
  </NavLink>
);

/**
 * Header component for the portal
 */
const PortalHeader = () => (
  <>
    <span className="inline-flex items-center gap-2">
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg"
        alt=""
        className="w-12"
      />
      <span>Micro-Apps Lab</span>
    </span>
    <div className="w-full border-b-4 border-dashed pt-6" />
  </>
);

// Define a type for the app IDs
type AppId = "micro-app-a" | "micro-app-b";

/**
 * Navigation group component containing all nav items
 */
const NavGroup = () => {
  return (
    <nav className="flex flex-col gap-2 pt-4">
      <NavItem key={"home"} to={`/`}>
        <span>README</span>
      </NavItem>
      <NavItem key={"micro-app-a"} to={`/micro-app-a`}>
        <img
          src={
            "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg"
          }
          alt=""
          className="w-6 h-6"
        />
        <span>Micro-App A - React</span>
      </NavItem>
      <NavItem key={"micro-app-b"} to={`/micro-app-b`}>
        <img
          src={
            "https://upload.wikimedia.org/wikipedia/commons/c/cf/Angular_full_color_logo.svg"
          }
          alt=""
          className="w-6 h-6"
        />
        <span>Micro-App B - Angular</span>
      </NavItem>
    </nav>
  );
};
