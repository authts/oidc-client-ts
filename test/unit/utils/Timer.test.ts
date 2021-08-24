// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { IntervalTimer, Timer } from "../../../src/utils";

class IntervalTimerMock implements IntervalTimer {
    callback: ((...args: any[]) => void);
    duration?: number;

    clearTimeoutWasCalled: boolean;
    clearHandle: number | null;

    constructor() {
        this.callback = () => { fail("should not come here"); };
        this.duration = undefined;

        this.clearTimeoutWasCalled = false;
        this.clearHandle = null;
    }

    setInterval(cb: (...args: any[]) => void, duration?: number) {
        this.callback = cb;
        this.duration = duration;
        return 5;
    }

    clearInterval(handle: number) {
        this.clearTimeoutWasCalled = true;
        this.clearHandle = handle;
    }
}

describe("Timer", () => {

    let subject: Timer;
    let intervalTimerMock: IntervalTimerMock;
    let now = 1;

    beforeEach(() => {
        intervalTimerMock = new IntervalTimerMock();
        subject = new Timer("test name");
        jest.spyOn(Timer, "getEpochTime").mockImplementation(() => now);
        subject["_timer"] = intervalTimerMock;
    });

    describe("init", () => {

        it("should setup a timer", () => {
            // act
            subject.init(10);

            // assert
            expect(intervalTimerMock.callback).not.toBeNull();
        });

        it("should use 1 second if duration is too low", () => {
            // act
            subject.init(0);

            // assert
            expect(intervalTimerMock.duration).toEqual(1000);

            // act
            subject.init(-1);

            // assert
            expect(intervalTimerMock.duration).toEqual(1000);

            // act
            subject.init(-5);

            // assert
            expect(intervalTimerMock.duration).toEqual(1000);
        });

        it("should use duration if less than default", () => {
            // act
            subject.init(2);

            // assert
            expect(intervalTimerMock.duration).toEqual(2000);

            // act
            subject.init(3);

            // assert
            expect(intervalTimerMock.duration).toEqual(3000);
        });

        it("should cancel previous timer if new time is not the same", () => {
            // act
            subject.init(10);

            // assert
            expect(intervalTimerMock.clearTimeoutWasCalled).toEqual(false);

            // act
            now = now + 1;
            subject.init(10);

            // assert
            expect(intervalTimerMock.clearTimeoutWasCalled).toEqual(true);
        });

        it("should not cancel previous timer if new time is same", () => {
            // act
            subject.init(10);

            // assert
            expect(intervalTimerMock.clearTimeoutWasCalled).toEqual(false);

            // act
            subject.init(10);

            // assert
            expect(intervalTimerMock.clearTimeoutWasCalled).toEqual(false);
        });
    });

    describe("_callback", () => {

        it("should fire when timer expires", () => {
            // arrange
            const cb = jest.fn();
            subject.addHandler(cb);

            now = 100;
            subject.init(10);

            // assert
            expect(intervalTimerMock.callback).not.toBeNull();

            // act
            now = 109;
            intervalTimerMock.callback();

            // assert
            expect(cb).toBeCalledTimes(0);

            // act
            now = 110;
            intervalTimerMock.callback();

            // assert
            expect(cb).toBeCalledTimes(1);
        });

        it("should fire if timer late", () => {
            // arrange
            const cb = jest.fn();
            subject.addHandler(cb);

            now = 100;
            subject.init(10);

            // assert
            expect(intervalTimerMock.callback).not.toBeNull();

            now = 109;
            intervalTimerMock.callback();

            // assert
            expect(cb).toBeCalledTimes(0);

            now = 111;
            intervalTimerMock.callback();

            // assert
            expect(cb).toBeCalledTimes(1);
        });

        it("should cancel window timer", () => {
            // arrange
            now = 100;
            subject.init(10);

            // assert
            expect(intervalTimerMock.callback).not.toBeNull();

            now = 110;
            intervalTimerMock.callback();

            // assert
            expect(intervalTimerMock.clearTimeoutWasCalled).toEqual(true);
        });
    });

    describe("cancel", () => {

        it("should cancel timer", () => {
            // act
            subject.init(10);

            // assert
            expect(intervalTimerMock.clearTimeoutWasCalled).toEqual(false);

            // act
            subject.cancel();

            // assert
            expect(intervalTimerMock.clearTimeoutWasCalled).toEqual(true);
        });

        it("should do nothing if no existing timer", () => {
            // act
            subject.cancel();

            // assert
            expect(intervalTimerMock.clearTimeoutWasCalled).toEqual(false);
        });
    });

    describe("addHandler", () => {

        it("should allow callback to be invoked", () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addHandler(cb);
            now = 100;
            subject.init(10);
            now = 110;
            intervalTimerMock.callback();

            // assert
            expect(cb).toBeCalled();
        });

        it("should allow multiple callbacks", () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addHandler(cb);
            subject.addHandler(cb);
            subject.addHandler(cb);
            subject.addHandler(cb);
            now = 100;
            subject.init(10);
            now = 110;
            intervalTimerMock.callback();

            // assert
            expect(cb).toBeCalledTimes(4);
        });
    });

    describe("removeHandler", () => {

        it("should remove callback from being invoked", () => {
            // arrange
            const cb = jest.fn();
            now = 100;
            subject.addHandler(cb);
            subject.init(10);

            // act
            subject.removeHandler(cb);
            now = 110;
            intervalTimerMock.callback();

            // assert
            expect(cb).toBeCalledTimes(0);
        });

        it("should remove individual callback", () => {
            // arrange
            const cb1 = jest.fn();
            const cb2 = jest.fn();
            subject.addHandler(cb1);
            subject.addHandler(cb2);
            subject.addHandler(cb1);

            // act
            now = 100;
            subject.init(10);
            subject.removeHandler(cb1);
            subject.removeHandler(cb1);
            now = 110;
            intervalTimerMock.callback();

            // assert
            expect(cb1).toBeCalledTimes(0);
            expect(cb2).toBeCalledTimes(1);
        });
    });
});
