module.exports = {
    preset: "ts-jest",
    clearMocks: true,
    testMatch: ["**/test/unit/**/*.test.ts"],
    testEnvironment: "jsdom",
    globals: {
        "ts-jest": {
            // skip ts-jest type checking, incremental compilation with tsc is much faster
            isolatedModules: true
        },
    },
};
