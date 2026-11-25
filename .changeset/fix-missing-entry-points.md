---
"@guardian/prosemirror-invisibles": patch
---

Fix broken package entry points. `main` and `module` pointed to `dist/index.cjs.js` and `dist/index.es.js`, which the Vite build no longer emits, so the published package could not be imported. They now point to the files the build actually emits (`dist/index.js` for CommonJS and `dist/index.mjs` for ESM), and an `exports` map has been added.
