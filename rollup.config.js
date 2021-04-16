import scss from "rollup-plugin-scss";
import commonjs from "@rollup/plugin-commonjs";
import eslint from "@rollup/plugin-eslint";
import typescript from "rollup-plugin-typescript2";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default [
  {
    input: "src/ts/index.ts",
    output: {
      file: "dist/invisibles.js",
      format: "cjs"
    },
    plugins: [
      scss({
        output: "dist/invisibles.css"
      }),
      eslint({
        exclude: ["node_modules/**"]
      }),
      typescript()
    ]
  },
  {
    // Github pages
    input: "pages/index.ts",
    output: {
      file: "pages/dist/bundle.js",
      format: "iife",
      name: "Pages"
    },
    plugins: [
      scss({
        output: "pages/dist/styles.css"
      }),
      eslint({
        exclude: ["node_modules/**"]
      }),
      typescript(),
      nodeResolve({ browser: true }),
      commonjs(),
    ]
  }
];
