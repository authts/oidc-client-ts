// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, Logger, ILogger } from "./Logger";

let subject: Logger;
let testLogger: ILogger;

beforeEach(() => {
    testLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
    Log.reset();
    subject = new Logger("name");
});

describe("Log", () => {

    describe("setLevel", () => {
        beforeEach(() => {
            Log.setLogger(testLogger);
        });

        it("should not log when set to NONE", () => {
            // arrange
            Log.setLevel(Log.NONE);

            // act
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(testLogger.info).not.toHaveBeenCalled();
            expect(testLogger.warn).not.toHaveBeenCalled();
            expect(testLogger.error).not.toHaveBeenCalled();
        });

        it("should not log info or warn for ERROR level", () => {
            // arrange
            Log.setLevel(Log.ERROR);

            // act
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(testLogger.info).not.toHaveBeenCalled();
            expect(testLogger.warn).not.toHaveBeenCalled();
            expect(testLogger.error).toHaveBeenCalled();
        });

        it("should not log info for WARN level", () => {
            // arrange
            Log.setLevel(Log.WARN);

            // act
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(testLogger.info).not.toHaveBeenCalled();
            expect(testLogger.warn).toHaveBeenCalled();
            expect(testLogger.error).toHaveBeenCalled();
        });

        it("should log to all for INFO level", () => {
            // arrange
            Log.setLevel(Log.INFO);

            // act
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(testLogger.info).toHaveBeenCalled();
            expect(testLogger.warn).toHaveBeenCalled();
            expect(testLogger.error).toHaveBeenCalled();
        });

        it("should prevent setting an invalid level", () => {
            expect(() => Log.setLevel("foo" as never)).toThrow(Error);
        });
    });

    describe("setLogger", () => {

        it("should use the logger specified", () => {
            // arrange
            Log.setLogger(testLogger);

            // act
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(testLogger.info).toHaveBeenCalledWith("[name]", "test info");
            expect(testLogger.warn).toHaveBeenCalledWith("[name]", "test warn");
            expect(testLogger.error).toHaveBeenCalledWith("[name]", "test error");
        });
    });
});

describe("Logger", () => {
    describe("info", () => {
        it("should work with no config", () => {
            subject.info("test");
        });
    });

    describe("warn", () => {

        it("should work with no config", () => {
            subject.warn("test");
        });

    });

    describe("error", () => {

        it("should work with no config", () => {
            subject.error("test");
        });
    });
});
