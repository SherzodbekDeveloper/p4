// eslint.config.mjs
import js from "@eslint/js";
import react from "eslint-plugin-react";

export default [
  js.configs.recommended,
  {
    plugins: {
      react,
    },
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
];
