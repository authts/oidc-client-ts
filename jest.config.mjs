import yn from "yn";

const collectCoverage = yn(process.env.CI);

export default {
    preset: "ts-jest",
    clearMocks: true,
    testMatch: ["**/{src,test}/**/*.test.ts"],
    testEnvironment: "jsdom",
    collectCoverage,
    coverageReporters: collectCoverage ? ["lcov"] : ["lcov", "text"],
    globals: {
        "ts-jest": {
            // skip ts-jest type checking, incremental compilation with tsc is much faster
            isolatedModules: true
        },
    },
};
