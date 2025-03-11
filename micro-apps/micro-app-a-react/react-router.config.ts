import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  appDirectory: "src",
  basename: "/micro-app-a",
  ssr: false,
} satisfies Config;
