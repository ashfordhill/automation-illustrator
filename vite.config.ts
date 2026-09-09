import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin, ViteDevServer } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const root = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  version: string;
};

/** Re-read demo YAML from disk so overwriting a fixture then clicking Demo is not a stale Vite cache. */
function liveDemoYaml(): Plugin {
  const isDemoYaml = (id: string) => {
    const file = id.split("?")[0] ?? id;
    return /[/\\]src[/\\]demos[/\\].+\.ya?ml$/i.test(file);
  };
  const invalidate = (server: ViteDevServer) => {
    for (const [file, mods] of server.moduleGraph.fileToModulesMap) {
      if (isDemoYaml(file)) {
        for (const mod of mods) server.moduleGraph.invalidateModule(mod);
      }
    }
  };
  return {
    name: "live-demo-yaml",
    enforce: "pre",
    load(id) {
      if (!isDemoYaml(id) || !id.includes("?raw")) return;
      const file = id.split("?")[0];
      if (!file) return;
      return `export default ${JSON.stringify(readFileSync(file, "utf8"))}`;
    },
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? "";
        if (
          url.includes("oak-park-invoice") ||
          url.includes("robot-mailroom") ||
          url.includes("oakParkInvoice") ||
          url.includes("robotMailroom")
        ) {
          invalidate(server);
        }
        next();
      });
    },
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [react(), liveDemoYaml()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["src/vitest.setup.ts"],
  },
});
