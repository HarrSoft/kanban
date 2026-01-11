import type { Config } from "prettier";

const config: Config = {
  experimentalTernaries: true,
  arrowParens: "avoid",
  plugins: ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"],
  overrides: [
    {
      files: "*.svelte",
      options: {
        parser: "svelte",
      },
    },
  ],
  tailwindStylesheet: "./src/app.css",
};

export default config;
