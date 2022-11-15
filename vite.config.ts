import { defineConfig } from "vite";
import packageJson from "./package.json";
import react from "@vitejs/plugin-react";
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 5001,
  },
  build: {
    outDir: "dist/",
    lib: {
      entry: "src/ts/index.ts",
      formats: ["cjs", "es"],
      fileName: "index",
    },
    rollupOptions: {
      // We do not bundle any peer dependencies specified by node_modules – they
      // should be bundled by the application using this module.
      external: Object.keys(packageJson.peerDependencies)
    },
  }
});
