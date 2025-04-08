// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Event } from "./Event";

describe("Event", () => {

    let subject: Event<unknown[]>;

    beforeEach(() => {
        subject = new Event("test name");
    });

    describe("addHandler", () => {

        it("should allow callback to be invoked", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addHandler(cb);
            await subject.raise();

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
            await subject.raise();

            // assert
            expect(cb).toHaveBeenCalledTimes(4);
        });
    });

    describe("removeHandler", () => {

        it("should remove callback from being invoked", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addHandler(cb);
            subject.removeHandler(cb);
            await subject.raise();

            // assert
            expect(cb).toHaveBeenCalledTimes(0);
        });

        it("should remove individual callback", async () => {
            // arrange
            const cb1 = jest.fn();
            const cb2 = jest.fn();

            // act
            subject.addHandler(cb1);
            subject.addHandler(cb2);
            subject.addHandler(cb1);
            subject.removeHandler(cb1);
            subject.removeHandler(cb1);

            await subject.raise();

            // assert
            expect(cb1).toHaveBeenCalledTimes(0);
            expect(cb2).toHaveBeenCalledTimes(1);
        });
    });

    describe("raise", () => {

        it("should pass params", async () => {
            // arrange
            const typedSubject = subject as Event<[number, number, number]>;
            let a = 10;
            let b = 11;
            let c = 12;
            const cb = function (arg_a: number, arg_b: number, arg_c: number) {
                a = arg_a;
                b = arg_b;
                c = arg_c;
            };
            typedSubject.addHandler(cb);

            // act
            await typedSubject.raise(1, 2, 3);

            // assert
            expect(a).toEqual(1);
            expect(b).toEqual(2);
            expect(c).toEqual(3);
        });
    });
});
