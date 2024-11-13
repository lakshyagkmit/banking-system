import globals from "globals";
import pluginJs from "@eslint/js";
import js from "@eslint/js";


export default [
  {files: ["**/*.js"], languageOptions: {sourceType: "commonjs"}},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  js.configs.recommended,
  {
        rules: {
            "no-unused-vars": "error",
            "no-undef": "error"
        }
    }
];