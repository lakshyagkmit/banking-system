import globals from "globals";
import pluginJs from "@eslint/js";
import js from "@eslint/js";


export default [
  {files: ["**/*.js"], languageOptions: {sourceType: "commonjs"}},
  {ignores: ["temp.js", "src/migrations/*", "src/models/*"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  js.configs.recommended,
  {
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "warn"
        }
  }
];