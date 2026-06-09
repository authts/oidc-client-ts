import yn from "yn";
import { defineConfig } from "vitest/config";

const collectCoverage = yn(process.env.CI);

export default defineConfig({
    test: {
        clearMocks: true,
        setupFiles: ["./test/setup.ts"],
        include: ["**/{src,test}/**/*.test.ts"],
        environment: "jsdom",
        coverage: {
            enabled: collectCoverage,
            reporter: collectCoverage ? ["lcov"] : ["lcov", "text"],
        },
    },
});
