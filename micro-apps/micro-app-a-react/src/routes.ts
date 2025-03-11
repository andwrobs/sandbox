import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    // path: /
    index("routes/home.tsx"),
    // path: /:id
    route("/accounts", "routes/accounts.tsx"),
    route("/accounts/:id", "routes/accounts.$id.tsx"),
  ]),
] satisfies RouteConfig;
