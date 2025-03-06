import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // homepage
  layout("routes/portal.layout.tsx", [
    // /
    index("routes/home.tsx"),
    // /micro-app-a
    route("/micro-app-a", "routes/micro-app-a.tsx"),
    // /micro-app-a
    route("/micro-app-b", "routes/micro-app-b.tsx"),
  ]),
] satisfies RouteConfig;
