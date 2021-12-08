// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, ILogger, Logger } from "./Log";

describe("Log", () => {
    let subject: Logger;

    beforeEach(() => {
        Log.reset();
        Log.level = Log.INFO;
        subject = new Logger("name");
    });

    describe("level", () => {

        it("should not log when set to NONE", () => {
            // arrange
            const stub = new StubLog();
            Log.logger = stub;
            Log.level = Log.NONE;

            // act
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(stub.infoWasCalled).toEqual(false);
            expect(stub.warnWasCalled).toEqual(false);
            expect(stub.errorWasCalled).toEqual(false);
        });

        it("should not log info or warn for ERROR level", () => {
            // arrange
            const stub = new StubLog();
            Log.logger = stub;
            Log.level = Log.ERROR;

            // act
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(stub.infoWasCalled).toEqual(false);
            expect(stub.warnWasCalled).toEqual(false);
            expect(stub.errorWasCalled).toEqual(true);
        });

        it("should not log info for WARN level", () => {
            // arrange
            const stub = new StubLog();
            Log.logger = stub;
            Log.level = Log.WARN;

            // act
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(stub.infoWasCalled).toEqual(false);
            expect(stub.warnWasCalled).toEqual(true);
            expect(stub.errorWasCalled).toEqual(true);
        });

        it("should log to all for INFO level", () => {
            // arrange
            const stub = new StubLog();
            Log.logger = stub;
            Log.level = Log.INFO;

            // act
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(stub.infoWasCalled).toEqual(true);
            expect(stub.warnWasCalled).toEqual(true);
            expect(stub.errorWasCalled).toEqual(true);
        });
    });

    describe("logger", () => {

        it("should use the logger specified", () => {
            // arrange
            const stub = new StubLog();
            Log.logger = stub;

            // act
            subject.info("test info");
            subject.warn("test warn");
            subject.error("test error");

            // assert
            expect(stub.infoParam).toEqual("[name] test info");
            expect(stub.warnParam).toEqual("[name] test warn");
            expect(stub.errorParam).toEqual("[name] test error");
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
});

class StubLog implements ILogger {
    debugWasCalled: boolean;
    infoWasCalled: boolean;
    warnWasCalled: boolean;
    errorWasCalled: boolean;
    debugParam: string | undefined;
    infoParam: string | undefined;
    warnParam: string | undefined;
    errorParam: string | undefined;

    constructor() {
        this.debugWasCalled = false;
        this.infoWasCalled = false;
        this.warnWasCalled = false;
        this.errorWasCalled = false;
    }
    debug(...args: unknown[]) {
        this.debugParam = args.join(" ");
        this.debugWasCalled = true;
    }
    info(...args: unknown[]) {
        this.infoParam = args.join(" ");
        this.infoWasCalled = true;
    }
    warn(...args: unknown[]) {
        this.warnParam = args.join(" ");
        this.warnWasCalled = true;
    }
    error(...args: unknown[]) {
        this.errorParam = args.join(" ");
        this.errorWasCalled = true;
    }
}
