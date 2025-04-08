// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Timer } from "./Timer";

describe("Timer", () => {

    let subject: Timer;
    let now = 1;

    beforeEach(() => {
        subject = new Timer("test name");
        jest.spyOn(Timer, "getEpochTime").mockImplementation(() => now);
        jest.useFakeTimers();
        jest.spyOn(globalThis, "clearInterval");
        jest.spyOn(globalThis, "setInterval");
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    describe("init", () => {

        it("should setup a timer", () => {
            // act
            subject.init(10);

            // assert
            expect(setInterval).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));
        });

        it("should use 1 second if duration is too low", () => {
            // act
            subject.init(0);

            // assert
            expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 1000);

            // act
            subject.init(-1);
            // assert
            expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 1000);

            // act
            subject.init(-5);

            // assert
            expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 1000);
        });

        it("should use duration if less than default", () => {
            // act
            subject.init(2);

            // assert
            expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 2000);
        });

        it("should cancel previous timer if new time is not the same", () => {
            // act
            subject.init(10);

            // assert
            expect(clearInterval).not.toHaveBeenCalled();

            // act
            now += 1;
            subject.init(10);

            // assert
            expect(clearInterval).toHaveBeenCalled();
        });

        it("should not cancel previous timer if new time is same", () => {
            // act
            subject.init(10);

            // assert
            expect(clearInterval).not.toHaveBeenCalled();

            // act
            subject.init(10);

            // assert
            expect(clearInterval).not.toHaveBeenCalled();
        });
    });

    describe("_callback", () => {

        it("should fire when timer expires", () => {
            // arrange
            const cb = jest.fn();
            subject.addHandler(cb);

            subject.init(10);

            // assert
            expect(setInterval).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));

            // act
            now += 9;
            jest.runOnlyPendingTimers();

            // assert
            expect(cb).toHaveBeenCalledTimes(0);

            // act
            now += 1;
            jest.runOnlyPendingTimers();

            // assert
            expect(cb).toHaveBeenCalledTimes(1);
        });

        it("should fire if timer late", () => {
            // arrange
            const cb = jest.fn();
            subject.addHandler(cb);

            subject.init(10);

            // assert
            expect(setInterval).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));

            now += 9;
            jest.runOnlyPendingTimers();

            // assert
            expect(cb).toHaveBeenCalledTimes(0);

            now += 2;
            jest.runOnlyPendingTimers();

            // assert
            expect(cb).toHaveBeenCalledTimes(1);
        });

        it("should cancel window timer", () => {
            // arrange
            subject.init(10);

            // assert
            expect(setInterval).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));

            now += 10;
            jest.runOnlyPendingTimers();

            // assert
            expect(clearInterval).toHaveBeenCalled();
        });
    });

    describe("cancel", () => {

        it("should cancel timer", () => {
            // act
            subject.init(10);

            // assert
            expect(clearInterval).not.toHaveBeenCalled();

            // act
            subject.cancel();

            // assert
            expect(clearInterval).toHaveBeenCalled();
        });

        it("should do nothing if no existing timer", () => {
            // act
            subject.cancel();

            // assert
            expect(clearInterval).not.toHaveBeenCalled();
        });
    });

    describe("addHandler", () => {

        it("should allow callback to be invoked", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addHandler(cb);
            subject.init(10);
            now += 10;
            await jest.runOnlyPendingTimersAsync();

            // assert
            expect(cb).toHaveBeenCalled();
        });

        it("should allow multiple callbacks", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addHandler(cb);
            subject.addHandler(cb);
            subject.addHandler(cb);
            subject.addHandler(cb);
            subject.init(10);
            now += 10;
            await jest.runOnlyPendingTimersAsync();

            // assert
            expect(cb).toHaveBeenCalledTimes(4);
        });
    });

    describe("removeHandler", () => {

        it("should remove callback from being invoked", () => {
            // arrange
            const cb = jest.fn();
            subject.addHandler(cb);
            subject.init(10);

            // act
            subject.removeHandler(cb);
            now += 10;
            jest.runOnlyPendingTimers();

            // assert
            expect(cb).toHaveBeenCalledTimes(0);
        });

        it("should remove individual callback", () => {
            // arrange
            const cb1 = jest.fn();
            const cb2 = jest.fn();
            subject.addHandler(cb1);
            subject.addHandler(cb2);
            subject.addHandler(cb1);

            // act
            subject.init(10);
            subject.removeHandler(cb1);
            subject.removeHandler(cb1);
            now += 10;
            jest.runOnlyPendingTimers();

            // assert
            expect(cb1).toHaveBeenCalledTimes(0);
            expect(cb2).toHaveBeenCalledTimes(1);
        });
    });
});
