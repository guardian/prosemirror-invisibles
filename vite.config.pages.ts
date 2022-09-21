import { defineConfig } from "vite";
import packageJson from "./package.json";
import react from "@vitejs/plugin-react";
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    outDir: "pages/dist",
    lib: {
      name: "prosemirror-invisibles",
      entry: "pages/index.ts",
      formats: ["es"],
      fileName: "index"
    },
  }
});