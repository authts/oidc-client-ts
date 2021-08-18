// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Event } from "../../../src/utils";

describe("Event", () => {

    let subject: Event;

    beforeEach(() => {
        subject = new Event("test name");
    });

    describe("addHandler", () => {

        it("should allow callback to be invoked", () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addHandler(cb);
            subject.raise();

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
            subject.raise();

            // assert
            expect(cb).toBeCalledTimes(4);
        });
    });

    describe("removeHandler", () => {

        it("should remove callback from being invoked", () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addHandler(cb);
            subject.removeHandler(cb);
            subject.raise();

            // assert
            expect(cb).toBeCalledTimes(0);
        });

        it("should remove individual callback", () => {
            // arrange
            const cb1 = jest.fn();
            const cb2 = jest.fn();

            // act
            subject.addHandler(cb1);
            subject.addHandler(cb2);
            subject.addHandler(cb1);
            subject.removeHandler(cb1);
            subject.removeHandler(cb1);

            subject.raise();

            // assert
            expect(cb1).toBeCalledTimes(0);
            expect(cb2).toBeCalledTimes(1);
        });
    });

    describe("raise", () => {

        it("should pass params", () => {
            // arrange
            let a: any = 10;
            let b: any = 11;
            let c: any = 12;
            const cb = function (arg_a: any, arg_b: any, arg_c: any) {
                a = arg_a;
                b = arg_b;
                c = arg_c;
            };
            subject.addHandler(cb);

            // act
            subject.raise(1, 2, 3);

            // assert
            expect(a).toEqual(1);
            expect(b).toEqual(2);
            expect(c).toEqual(3);
        });

        it("should allow passing no params", () => {
            // arrange
            let a: any = 10;
            let b: any = 11;
            let c: any = 12;
            const cb = function (arg_a: any, arg_b: any, arg_c: any) {
                a = arg_a;
                b = arg_b;
                c = arg_c;
            };
            subject.addHandler(cb);

            subject.raise();

            // assert
            expect(a).toEqual(undefined);
            expect(b).toEqual(undefined);
            expect(c).toEqual(undefined);
        });
    });
});
