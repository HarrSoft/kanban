import type { Config } from "prettier";

const config: Config = {
  experimentalTernaries: true,
  bracketSameLine: true,
  arrowParens: "avoid",
  plugins: ["prettier-plugin-svelte"],
  overrides: [
    {
      files: "*.svelte",
      options: {
        parser: "svelte",
      },
    },
  ],
};

export default config;
