import stylistic from "@stylistic/eslint-plugin";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import testingLibrary from "eslint-plugin-testing-library";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [{
    ignores: [
        ".yarn/",
        ".pnp.*",
        "**/node_modules/",
        "**/dist/",
        "docs/pages/",
        "**/lib/",
        "**/samples/",
    ],
}, ...compat.extends("eslint:recommended", "plugin:testing-library/dom"), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
        "@stylistic": stylistic,
        "testing-library": testingLibrary,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        ecmaVersion: 2020,
        sourceType: "module",
    },

    rules: {
        "comma-dangle": ["error", "always-multiline"],
        "consistent-return": "error",

        indent: ["error", 4, {
            SwitchCase: 1,
        }],

        quotes: "error",
        semi: "error",
        "keyword-spacing": "error",
        "space-before-blocks": "error",

        "no-multiple-empty-lines": ["error", {
            max: 1,
            maxBOF: 0,
            maxEOF: 0,
        }],

        "no-multi-spaces": "error",
    },
}, ...compat.extends(
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
).map(config => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx"],
})), {
    files: ["**/*.ts", "**/*.tsx"],

    languageOptions: {
        parserOptions: {
            project: ["./tsconfig.json"],
        },
    },

    rules: {
        indent: "off",
        semi: "off",
        "no-return-await": "off",

        "@stylistic/indent": ["error", 4, {
            SwitchCase: 1,
        }],

        "@stylistic/member-delimiter-style": "error",
        "@stylistic/object-curly-spacing": ["error", "always"],
        "@stylistic/semi": "error",

        "@typescript-eslint/return-await": ["error", "always"],
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
    },
}, {
    files: ["src/**/*"],

    languageOptions: {
        globals: {
            ...Object.fromEntries(Object.entries(globals.node).map(([key]) => [key, "off"])),
        },
    },
}, {
    files: ["src/**/*.test.*", "test/**/*"],

    languageOptions: {
        globals: {
            ...globals.jest,
        },
    },

    rules: {
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/unbound-method": "off",
    },
}];
