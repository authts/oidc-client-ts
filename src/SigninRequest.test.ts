// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { SigninRequest, type SigninRequestArgs } from "./SigninRequest";
import { URL_STATE_DELIMITER } from "./utils";

describe("SigninRequest", () => {

    let subject: SigninRequest;
    let settings: SigninRequestArgs;

    beforeEach(() => {
        settings = {
            url: "http://sts/signin",
            client_id: "client",
            redirect_uri: "http://app",
            response_type: "code",
            scope: "openid",
            authority : "op",
            state_data: { data: "test" },
        };
        subject = new SigninRequest(settings);
    });

    describe("constructor", () => {
        it.each(["url", "client_id", "redirect_uri", "response_type", "scope", "authority"])("should require a %s param", (param) => {
            // arrange
            Object.assign(settings, { [param]: undefined });

            // act
            expect(() => new SigninRequest(settings))
                // assert
                .toThrow(param);
        });
    });

    describe("url", () => {

        it("should include url", () => {
            // assert
            expect(subject.url.indexOf("http://sts/signin")).toEqual(0);
        });

        it("should include client_id", () => {
            // assert
            expect(subject.url).toContain("client_id=client");
        });

        it("should include redirect_uri", () => {
            // assert
            expect(subject.url).toContain("redirect_uri=" + encodeURIComponent("http://app"));
        });

        it("should include response_type", () => {
            // assert
            expect(subject.url).toContain("response_type=code");
        });

        it("should include scope", () => {
            // assert
            expect(subject.url).toContain("scope=openid");
        });

        it("should include state", () => {
            // assert
            expect(subject.url).toContain("state=" + subject.state.id);
        });

        it("should include prompt", () => {
            // arrange
            settings.prompt = "foo";

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("prompt=foo");
        });

        it("should include display", () => {
            // arrange
            settings.display = "foo";

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("display=foo");
        });

        it("should include max_age", () => {
            // arrange
            settings.max_age = 42;

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("max_age=42");
        });

        it("should include ui_locales", () => {
            // arrange
            settings.ui_locales = "foo";

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("ui_locales=foo");
        });

        it("should include id_token_hint", () => {
            // arrange
            settings.id_token_hint = "foo";

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("id_token_hint=foo");
        });

        it("should include login_hint", () => {
            // arrange
            settings.login_hint = "foo";

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("login_hint=foo");
        });

        it("should include acr_values", () => {
            // arrange
            settings.acr_values = "foo";

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("acr_values=foo");
        });

        it("should include a resource", () => {
            // arrange
            settings.resource = "foo";

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("resource=foo");
        });

        it("should include multiple resources", () => {
            // arrange
            settings.resource = ["foo", "bar"];

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("resource=foo&resource=bar");
        });

        it("should include response_mode", () => {
            // arrange
            settings.response_mode = "fragment";

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("response_mode=fragment");
        });

        it("should include request", () => {
            // arrange
            settings.request = "foo";

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("request=foo");
        });

        it("should include request_uri", () => {
            // arrange
            settings.request_uri = "foo";

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("request_uri=foo");
        });

        it("should include extra query params", () => {
            // arrange
            settings.extraQueryParams = {
                "hd": "domain.com",
                "foo": "bar",
            };

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("hd=domain.com&foo=bar");
        });

        it("should store extra token params in state", () => {
            // arrange
            settings.extraTokenParams = {
                "resourceServer": "abc",
            };

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.state.extraTokenParams).toEqual({
                "resourceServer": "abc",
            });
        });

        it("should include code flow params", () => {
            // arrange
            settings.response_type = "code";

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("code_challenge=");
            expect(subject.url).toContain("code_challenge_method=S256");
        });

        it("should include nonce", () => {
            // arrange
            settings.nonce = "random_nonce";

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("nonce=");
        });

        it("should include url_state", () => {
            // arrange
            settings.url_state = "foo";

            // act
            subject = new SigninRequest(settings);

            // assert
            expect(subject.url).toContain("state=" + subject.state.id + encodeURIComponent(URL_STATE_DELIMITER + "foo"));
        });
    });
});
