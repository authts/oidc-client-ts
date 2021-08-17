// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, Logger } from "../../../src/utils";

describe("Log", () => {
    beforeEach(() => {
        Log.reset();
        Log.level = Log.INFO;
    });

    describe("level", () => {

        it("should not log when set to NONE", () => {
            // arrange
            const stub = new StubLog();
            Log.logger = stub;
            Log.level = Log.NONE;

            // act
            Log.info("test info");
            Log.warn("test warn");
            Log.error("test error");

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
            Log.info("test info");
            Log.warn("test warn");
            Log.error("test error");

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
            Log.info("test info");
            Log.warn("test warn");
            Log.error("test error");

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
            Log.info("test info");
            Log.warn("test warn");
            Log.error("test error");

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
            Log.info("test info");
            Log.warn("test warn");
            Log.error("test error");

            // assert
            expect(stub.infoParam).toEqual("test info");
            expect(stub.warnParam).toEqual("test warn");
            expect(stub.errorParam).toEqual("test error");
        });
    });

    describe("info", () => {

        it("should work with no config", () => {
            Log.info("test");
        });
    });

    describe("warn", () => {

        it("should work with no config", () => {
            Log.warn("test");
        });

    });

    describe("error", () => {

        it("should work with no config", () => {
            Log.error("test");
        });
    });
});

class StubLog implements Logger {
    debugWasCalled: boolean;
    infoWasCalled: boolean;
    warnWasCalled: boolean;
    errorWasCalled: boolean;
    debugParam: any;
    infoParam: any;
    warnParam: any;
    errorParam: any;

    constructor() {
        this.debugWasCalled = false;
        this.infoWasCalled = false;
        this.warnWasCalled = false;
        this.errorWasCalled = false;
    }
    debug(arg: any) {
        this.debugParam = arg;
        this.debugWasCalled = true;
    }
    info(arg: any) {
        this.infoParam = arg;
        this.infoWasCalled = true;
    }
    warn(arg: any) {
        this.warnParam = arg;
        this.warnWasCalled = true;
    }
    error(arg: any) {
        this.errorParam = arg;
        this.errorWasCalled = true;
    }
}
