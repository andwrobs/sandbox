import { isRouteErrorResponse } from "react-router";
import { MicroAppIframeContainer } from "@andwrobs/portal-sdk/react";
import type { Route } from "./+types/micro-app-a";

export const clientLoader = async ({}: Route.ClientLoaderArgs) => {
  return {};
};

export default function MicroAppA() {
  return <MicroAppIframeContainer appId="micro-app-a" />;
}
