// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { SigninResponse } from "./SigninResponse";
import { Timer } from "./utils";

describe("SigninResponse", () => {
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
            expect(subject.state_id).toEqual("foo");
        });

        it("should read code", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("code=foo"));

            // assert
            expect(subject.code).toEqual("foo");
        });

        it("should read id_token", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("id_token=foo"));

            // assert
            expect(subject.id_token).toEqual("foo");
        });

        it("should read session_state", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("session_state=foo"));

            // assert
            expect(subject.session_state).toEqual("foo");
        });

        it("should read access_token", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("access_token=foo"));

            // assert
            expect(subject.access_token).toEqual("foo");
        });

        it("should read token_type", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("token_type=foo"));

            // assert
            expect(subject.token_type).toEqual("foo");
        });

        it("should read scope", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("scope=foo"));

            // assert
            expect(subject.scope).toEqual("foo");
        });

        it("should read expires_in", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("expires_in=10"));

            // assert
            expect(subject.expires_in).toEqual(10);
        });

        it("should calculate expires_at", () => {
            // act
            const subject = new SigninResponse(new URLSearchParams("expires_in=10"));

            // assert
            expect(subject.expires_at).toEqual(Timer.getEpochTime() + 10);
        });

        it.each<[string]> ([
            ["expires_in=foo"],
            ["expires_in=-10"],
        ])("should not read invalid expires_in", (params) => {
            // act
            const subject = new SigninResponse(new URLSearchParams(params));

            // assert
            expect(subject.expires_in).toBeUndefined();
            expect(subject.expires_at).toBeUndefined();
            expect(subject.expired).toBeUndefined();
        });
    });

    describe("scopes", () => {
        it("should return list of scope", () => {
            // act
            let subject = new SigninResponse(new URLSearchParams("scope=foo"));

            // assert
            expect(subject.scopes).toEqual(["foo"]);

            subject = new SigninResponse(new URLSearchParams("scope=foo%20bar"));

            // assert
            expect(subject.scopes).toEqual(["foo", "bar"]);

            subject = new SigninResponse(new URLSearchParams("scope=foo%20bar%20baz"));

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
            const subject = new SigninResponse(new URLSearchParams("expires_in=100"));

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
            const subject = new SigninResponse(new URLSearchParams("expires_in=100"));

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
            let subject = new SigninResponse(new URLSearchParams("scope=foo%20openid%20bar"));

            // assert
            expect(subject.isOpenIdConnect).toEqual(true);

            // act
            subject = new SigninResponse(new URLSearchParams("scope=openid+foo+bar"));

            // assert
            expect(subject.isOpenIdConnect).toEqual(true);

            // act
            subject = new SigninResponse(new URLSearchParams("scope=foo+bar+openid"));

            // assert
            expect(subject.isOpenIdConnect).toEqual(true);

            // act
            subject = new SigninResponse(new URLSearchParams("scope=foo+bar"));

            // assert
            expect(subject.isOpenIdConnect).toEqual(false);
        });
    });
});
