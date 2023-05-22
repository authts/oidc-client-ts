// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, Logger, type ILogger } from "./Logger";

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
            subject.debug("test debug");
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(testLogger.debug).not.toHaveBeenCalled();
            expect(testLogger.info).not.toHaveBeenCalled();
            expect(testLogger.warn).not.toHaveBeenCalled();
            expect(testLogger.error).not.toHaveBeenCalled();
        });

        it("should not log debug, info or warn for ERROR level", () => {
            // arrange
            Log.setLevel(Log.ERROR);

            // act
            subject.debug("test debug");
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(testLogger.debug).not.toHaveBeenCalled();
            expect(testLogger.info).not.toHaveBeenCalled();
            expect(testLogger.warn).not.toHaveBeenCalled();
            expect(testLogger.error).toHaveBeenCalled();
        });

        it("should not log debug, info for WARN level", () => {
            // arrange
            Log.setLevel(Log.WARN);

            // act
            subject.debug("test debug");
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(testLogger.debug).not.toHaveBeenCalled();
            expect(testLogger.info).not.toHaveBeenCalled();
            expect(testLogger.warn).toHaveBeenCalled();
            expect(testLogger.error).toHaveBeenCalled();
        });

        it("should not log debug for INFO level", () => {
            // arrange
            Log.setLevel(Log.INFO);

            // act
            subject.debug("test debug");
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(testLogger.debug).not.toHaveBeenCalled();
            expect(testLogger.info).toHaveBeenCalled();
            expect(testLogger.warn).toHaveBeenCalled();
            expect(testLogger.error).toHaveBeenCalled();
        });

        it("should log to all for DEBUG level", () => {
            // arrange
            Log.setLevel(Log.DEBUG);

            // act
            subject.debug("test debug");
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(testLogger.debug).toHaveBeenCalled();
            expect(testLogger.info).toHaveBeenCalled();
            expect(testLogger.warn).toHaveBeenCalled();
            expect(testLogger.error).toHaveBeenCalled();
        });

        it("should prevent setting an invalid level", () => {
            // act
            expect(() => Log.setLevel("foo" as never))
                // assert
                .toThrow(Error);
        });
    });

    describe("setLogger", () => {
        it("should use the logger specified", () => {
            // arrange
            Log.setLevel(Log.DEBUG);
            Log.setLogger(testLogger);

            // act
            subject.debug("test debug");
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(testLogger.debug).toHaveBeenCalledWith("[name]", "test debug");
            expect(testLogger.info).toHaveBeenCalledWith("[name]", "test info");
            expect(testLogger.warn).toHaveBeenCalledWith("[name]", "test warn");
            expect(testLogger.error).toHaveBeenCalledWith("[name]", "test error");
        });
    });
});

describe("Logger", () => {
    describe("debug", () => {
        it("should work with no config", () => {
            subject.debug("test");
        });
    });

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

    describe("throw", () => {
        it("should work with no config", () => {
            // arrange
            const error = new Error("test");

            // act
            expect(() => subject.throw(error))
                // assert
                .toThrow(Error);
        });

        it("should throw and log to ERROR level", () => {
            // arrange
            Log.setLogger(testLogger);
            const error = new Error("test");

            // act
            expect(() => subject.throw(error))
                // assert
                .toThrow(Error);
            expect(testLogger.error).toHaveBeenCalledWith("[name]", error);
        });
    });

    describe("create", () => {
        it("should return logger and log to DEBUG level", () => {
            // arrange
            Log.setLevel(Log.DEBUG);
            Log.setLogger(testLogger);

            // act
            const result = subject.create("method");

            // assert
            expect(result).toBeInstanceOf(Logger);
            expect(testLogger.debug).toHaveBeenCalledWith("[name] method:", "begin");
        });
    });

    describe("createStatic", () => {
        it("should return logger and log to DEBUG level", () => {
            // arrange
            Log.setLevel(Log.DEBUG);
            Log.setLogger(testLogger);

            // act
            const result = Logger.createStatic("name", "method");

            // assert
            expect(result).toBeInstanceOf(Logger);
            expect(testLogger.debug).toHaveBeenCalledWith("[name.method]", "begin");
        });
    });
});
