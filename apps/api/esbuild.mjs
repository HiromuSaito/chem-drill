import { build } from "esbuild";

await build({
  entryPoints: ["src/lambda.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: "dist/lambda.mjs",
  format: "esm",
  minify: false,
  sourcemap: true,
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});

/* eslint-disable no-undef */
console.log("Lambda bundle built successfully");
