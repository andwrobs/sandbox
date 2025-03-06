import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

/**
 * Main home component for the micro-apps portal
 */
export default function Home() {
  return <div className="w-full h-full p-6 bg-gray-100/10">Home</div>;
}
