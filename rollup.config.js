import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { eslint } from "rollup-plugin-eslint";
import scss from "rollup-plugin-scss";
import typescript from "@rollup/plugin-typescript"

export default [
  {
    input: "src/js/index.ts",
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
      resolve({ browser: true }),
      typescript(),
      commonjs(),
    ]
  }
];
