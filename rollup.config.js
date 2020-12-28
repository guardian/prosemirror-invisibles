import resolve from "rollup-plugin-node-resolve";
import scss from "rollup-plugin-scss";
import commonjs from "@rollup/plugin-commonjs";
import eslint from "@rollup/plugin-eslint";
import typescript from "@rollup/plugin-typescript";
import babel from "@rollup/plugin-babel";

export default [
  {
    input: "src/ts/index.ts",
    output: {
      file: "dist/invisibles.js",
      format: "cjs"
    },
    plugins: [
      typescript(),
      scss({
        output: "dist/invisibles.css"
      }),
      eslint({
        exclude: ["node_modules/**"]
      }),
      babel()
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
      typescript(),
      scss({
        output: "pages/dist/styles.css"
      }),
      eslint({
        exclude: ["node_modules/**"]
      }),
      resolve({ browser: true }),
      commonjs(),
    ]
  }
];
