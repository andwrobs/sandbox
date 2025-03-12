import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      include: ["shared/**/*", "react/**/*", "angular/**/*"],
      outDir: "dist",
    }),
  ],
  build: {
    lib: {
      entry: {
        "shared/index": resolve(__dirname, "shared/index.ts"),
        "react/index": resolve(__dirname, "react/index.ts"),
        "angular/index": resolve(__dirname, "angular/index.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        preserveModules: true,
        entryFileNames: "[name].js",
      },
    },
    target: "es2020",
    outDir: "dist",
    emptyOutDir: true,
  },
});
