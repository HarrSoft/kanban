import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter(),

    alias: {
      $: "./src",
      "$/*": "./src/*",
      $com: "./src/lib/components",
      "$com/*": "./src/lib/components/*",
      $db: "./src/lib/server/db",
      "$db/*": "./src/lib/server/db/*",
      $rules: "./src/lib/server/rules",
      $server: "./src/lib/server",
      "$server/*": "./src/lib/server/*",
      $types: "./src/lib/types",
      "$types/*": "./src/lib/types/*",
    },
  },
};

export default config;
