import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter(),

    experimental: {
      remoteFunctions: true,
    },

    alias: {
      $: "./src",
      "$/*": "./src/*",
      $api: "./src/routes/api",
      "$api/*": "./src/routes/api/*",
      $com: "./src/lib/components",
      "$com/*": "./src/lib/components/*",
      $db: "./src/lib/server/db",
      "$db/*": "./src/lib/server/db/*",
      $server: "./src/lib/server",
      "$server/*": "./src/lib/server/*",
      $types: "./src/lib/types",
      "$types/*": "./src/lib/types/*",
    },
  },

  compilerOptions: {
    experimental: {
      async: true,
    },
  },
};

export default config;
