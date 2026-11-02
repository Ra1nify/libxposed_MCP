import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  banner: {
    js: `import { createRequire } from 'module';\nconst require = createRequire(import.meta.url);\n`,
  },
  outfile: "dist/index.js",
  sourcemap: false,
});

console.log("Build successfully generated dist/index.js");
