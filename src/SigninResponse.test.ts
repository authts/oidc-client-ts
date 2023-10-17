// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { SigninResponse } from "./SigninResponse";
import { Timer } from "./utils";

describe("SigninResponse", () => {
    let now: number;

    beforeEach(() => {
        now = 0;
        jest.spyOn(Timer, "getEpochTime").mockImplementation(() => now);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("constructor", () => {
        it("should read error", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("error=foo"));

            // assert
            expect(subject.error).toEqual("foo");
        });

        it("should read error_description", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("error_description=foo"));

            // assert
            expect(subject.error_description).toEqual("foo");
        });

        it("should read error_uri", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("error_uri=foo"));

            // assert
            expect(subject.error_uri).toEqual("foo");
        });

        it("should read state", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("state=foo"));

            // assert
            expect(subject.state).toEqual("foo");
        });

        it("should read url_state", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("state=foo;bar"));

            // assert
            expect(subject.state).toEqual("foo");
            expect(subject.url_state).toEqual("bar");
        });

        it("should return url_state that uses the delimiter unmodified", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("state=foo;bar;baz"));

            // assert
            expect(subject.state).toEqual("foo");
            expect(subject.url_state).toEqual("bar;baz");
        });

        it("should read code", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("code=foo"));

            // assert
            expect(subject.code).toEqual("foo");
        });

        it("should read session_state", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("session_state=foo"));

            // assert
            expect(subject.session_state).toEqual("foo");
        });

        it("should calculate expires_at", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams());
            Object.assign(subject, { expires_in: 10 });

            // assert
            expect(subject.expires_at).toEqual(Timer.getEpochTime() + 10);
        });

        it.each([
            ["foo"],
            [-10],
        ])("should not read invalid expires_in", (expires_in) => {
            // act
            const subject = new SigninResponse(new URLSearchParams());
            Object.assign(subject, { expires_in });

            // assert
            expect(subject.expires_in).toBeUndefined();
            expect(subject.expires_at).toBeUndefined();
        });
    });

    describe("expires_in", () => {
        it("should calculate how much time left", () => {
            const subject = new SigninResponse(new URLSearchParams());
            Object.assign(subject, { expires_in: 100 });

            // act
            now += 50;

            // assert
            expect(subject.expires_in).toEqual(50);
        });
    });

    describe("isOpenId", () => {
        it("should detect openid scope", () => {
            const subject = new SigninResponse(new URLSearchParams());

            // act
            Object.assign(subject, { scope: "foo openid bar" });

            // assert
            expect(subject.isOpenId).toEqual(true);

            // act
            Object.assign(subject, { scope: "openid foo bar" });

            // assert
            expect(subject.isOpenId).toEqual(true);

            // act
            Object.assign(subject, { scope: "foo bar openid" });

            // assert
            expect(subject.isOpenId).toEqual(true);

            // act
            Object.assign(subject, { scope: "foo bar" });

            // assert
            expect(subject.isOpenId).toEqual(false);
        });

        it("shoud detect id_token", () => {
            const subject = new SigninResponse(new URLSearchParams());

            // act
            Object.assign(subject, { id_token: undefined });

            // assert
            expect(subject.isOpenId).toEqual(false);

            // act
            Object.assign(subject, { id_token: "id_token" });

            // assert
            expect(subject.isOpenId).toEqual(true);
        });
    });
});
