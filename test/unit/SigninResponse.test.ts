// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { SigninResponse } from "../../src/SigninResponse";
import { Timer } from "../../src/utils";

describe("SigninResponse", () => {

    describe("constructor", () => {

        it("should read error", () => {
            // act
            const subject = new SigninResponse("error=foo");

            // assert
            expect(subject.error).toEqual("foo");
        });

        it("should read error_description", () => {
            // act
            const subject = new SigninResponse("error_description=foo");

            // assert
            expect(subject.error_description).toEqual("foo");
        });

        it("should read error_uri", () => {
            // act
            const subject = new SigninResponse("error_uri=foo");

            // assert
            expect(subject.error_uri).toEqual("foo");
        });

        it("should read state", () => {
            // act
            const subject = new SigninResponse("state=foo");

            // assert
            expect(subject.state).toEqual("foo");
        });

        it("should read code", () => {
            // act
            const subject = new SigninResponse("code=foo");

            // assert
            expect(subject.code).toEqual("foo");
        });

        it("should read session_state", () => {
            // act
            const subject = new SigninResponse("session_state=foo");

            // assert
            expect(subject.session_state).toEqual("foo");
        });

        it("should read access_token", () => {
            // act
            const subject = new SigninResponse("access_token=foo");

            // assert
            expect(subject.access_token).toEqual("foo");
        });

        it("should read token_type", () => {
            // act
            const subject = new SigninResponse("token_type=foo");

            // assert
            expect(subject.token_type).toEqual("foo");
        });

        it("should read scope", () => {
            // act
            const subject = new SigninResponse("scope=foo");

            // assert
            expect(subject.scope).toEqual("foo");
        });

        it("should read expires_in", () => {
            // act
            const subject = new SigninResponse("expires_in=10");

            // assert
            expect(subject.expires_in).toEqual(10);
        });

        it("should calculate expires_at", () => {
            // act
            const subject = new SigninResponse("expires_in=10");

            // assert
            expect(subject.expires_at).toEqual(Timer.getEpochTime() + 10);
        });

        it("should not read invalid expires_in", () => {
            // act
            let subject = new SigninResponse("expires_in=foo");

            // assert
            expect(subject.expires_in).toBeUndefined();
            expect(subject.expires_at).toBeUndefined();

            // act
            subject = new SigninResponse("expires_in=-10");

            // assert
            expect(subject.expires_in).toBeUndefined();
            expect(subject.expires_at).toBeUndefined();
        });

    });

    describe("scopes", () => {
        it("should return list of scope", () => {
            // act
            let subject = new SigninResponse("scope=foo");

            // assert
            expect(subject.scopes).toEqual(["foo"]);

            subject = new SigninResponse("scope=foo%20bar");

            // assert
            expect(subject.scopes).toEqual(["foo", "bar"]);

            subject = new SigninResponse("scope=foo%20bar%20baz");

            // assert
            expect(subject.scopes).toEqual(["foo", "bar", "baz"]);
        });
    });

    describe("expires_in", () => {
        it("should calculate how much time left", () => {
            const oldNow = Date.now;
            Date.now = () => {
                return 1000 * 1000; // ms
            };

            // act
            const subject = new SigninResponse("expires_in=100");

            // assert
            expect(subject.expires_in).toEqual(100);

            Date.now = () => {
                return 1050 * 1000; // ms
            };

            // assert
            expect(subject.expires_in).toEqual(50);
            Date.now = oldNow;
        });
    });

    describe("expired", () => {
        it("should calculate how much time left", () => {
            const oldNow = Date.now;
            Date.now = () => {
                return 1000 * 1000; // ms
            };

            // act
            const subject = new SigninResponse("expires_in=100");

            // assert
            expect(subject.expired).toEqual(false);

            Date.now = () => {
                return 1100 * 1000; // ms
            };

            // assert
            expect(subject.expired).toEqual(true);
            Date.now = oldNow;
        });
    });

    describe("isOpenIdConnect", () => {
        it("should detect openid scope", () => {
            // act
            let subject = new SigninResponse("scope=foo%20openid%20bar");

            // assert
            expect(subject.isOpenIdConnect).toEqual(true);

            // act
            subject = new SigninResponse("scope=openid%20foo%20bar");

            // assert
            expect(subject.isOpenIdConnect).toEqual(true);

            // act
            subject = new SigninResponse("scope=foo%20bar%20openid");

            // assert
            expect(subject.isOpenIdConnect).toEqual(true);

            // act
            subject = new SigninResponse("scope=foo%20bar");

            // assert
            expect(subject.isOpenIdConnect).toEqual(false);
        });
    });
});
