// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { ErrorResponse } from "./ErrorResponse";

describe("ErrorResponse", () => {

    describe("constructor", () => {

        it("should require a error param", () => {
            // act
            try {
                new ErrorResponse({});
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("error");
                return;
            }

            fail("should not come here");
        });

        it("should read error", () => {
            // act
            const subject = new ErrorResponse({ error:"foo" });

            // assert
            expect(subject.error).toEqual("foo");
        });

        it("should read error_description", () => {
            // act
            const subject = new ErrorResponse({ error:"error", error_description:"foo" });

            // assert
            expect(subject.error_description).toEqual("foo");
        });

        it("should read error_uri", () => {
            // act
            const subject = new ErrorResponse({ error:"error", error_uri:"foo" });

            // assert
            expect(subject.error_uri).toEqual("foo");
        });

        it("should read state", () => {
            // act
            const subject = new ErrorResponse({ error:"error", userState:"foo" });

            // assert
            expect(subject.state).toEqual("foo");
        });

        it("should read url_state", () => {
            // act
            const subject = new ErrorResponse({ error:"error", url_state:"foo" });

            // assert
            expect(subject.url_state).toEqual("foo");
        });
    });

    describe("message", () => {
        it("should be description if set", () => {
            // act
            const subject = new ErrorResponse({ error:"error", error_description:"foo" });

            // assert
            expect(subject.message).toEqual("foo");
        });

        it("should be error if description not set", () => {
            // act
            const subject = new ErrorResponse({ error:"error" });

            // assert
            expect(subject.message).toEqual("error");
        });
    });

    describe("name", () => {
        it("should be class name", () => {
            // act
            const subject = new ErrorResponse({ error:"error" });

            // assert
            expect(subject.name).toEqual("ErrorResponse");
        });
    });

    describe("stack", () => {
        it("should be set", () => {
            // act
            const subject = new ErrorResponse({ error:"error" });

            // assert
            expect(subject.stack).not.toBeNull();
        });
    });
});
