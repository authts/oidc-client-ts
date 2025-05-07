import yn from "yn";

const collectCoverage = yn(process.env.CI);

export default {
    preset: "ts-jest",
    clearMocks: true,
    setupFilesAfterEnv: ["./test/setup.ts"],
    testMatch: ["**/{src,test}/**/*.test.ts"],
    testEnvironment: "./jest-environment-jsdom.cjs",
    collectCoverage,
    coverageReporters: collectCoverage ? ["lcov"] : ["lcov", "text"],
    moduleNameMapper: {
        "^jose": "jose", // map to jose cjs module otherwise jest breaks
    },
};
