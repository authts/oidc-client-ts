// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "../../src/utils";
import { OidcClientSettingsStore } from "../../src/OidcClientSettings";
import type { StateStore } from "../../src/StateStore";

describe("OidcClientSettings", () => {

    beforeEach(() => {
        Log.logger = console;
        Log.level = Log.NONE;
    });

    describe("client_id", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect"
            });

            // assert
            expect(subject.client_id).toEqual("client");
        });
    });

    describe("client_secret", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                client_secret: "secret"
            });

            // assert
            expect(subject.client_secret).toEqual("secret");
        });
    });

    describe("response_type", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                response_type: "foo"
            });

            // assert
            expect(subject.response_type).toEqual("foo");
        });

        it("should use default value", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect"
            });

            // assert
            expect(subject.response_type).toEqual("code");
        });

    });

    describe("scope", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                scope: "foo"
            });

            // assert
            expect(subject.scope).toEqual("foo");
        });

        it("should use default value", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect"
            });

            // assert
            expect(subject.scope).toEqual("openid");
        });

    });

    describe("redirect_uri", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://app"
            });

            // assert
            expect(subject.redirect_uri).toEqual("http://app");
        });

    });

    describe("post_logout_redirect_uri", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                post_logout_redirect_uri: "http://app/loggedout"
            });

            // assert
            expect(subject.post_logout_redirect_uri).toEqual("http://app/loggedout");
        });
    });

    describe("prompt", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                prompt: "foo"
            });

            // assert
            expect(subject.prompt).toEqual("foo");
        });
    });

    describe("display", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                display: "foo"
            });

            // assert
            expect(subject.display).toEqual("foo");
        });
    });

    describe("max_age", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                max_age: 22
            });

            // assert
            expect(subject.max_age).toEqual(22);
        });
    });

    describe("ui_locales", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                ui_locales: "foo"
            });

            // assert
            expect(subject.ui_locales).toEqual("foo");
        });
    });

    describe("acr_values", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                acr_values: "foo"
            });

            // assert
            expect(subject.acr_values).toEqual("foo");
        });
    });

    describe("resource", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                resource: "foo"
            });

            // assert
            expect(subject.resource).toEqual("foo");
        });
    });

    describe("response_mode", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                response_mode: "query"
            });

            // assert
            expect(subject.response_mode).toEqual("query");
        });
    });

    describe("authority", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                client_id: "client",
                redirect_uri: "redirect",
                authority: "http://sts"
            });

            // assert
            expect(subject.authority).toEqual("http://sts");
        });
    });

    describe("metadataUrl", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                metadataUrl: "http://sts/metadata"
            });

            // assert
            expect(subject.metadataUrl).toEqual("http://sts/metadata");
        });
    });

    describe("metadata", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                metadata: { issuer: "test" }
            });

            // assert
            expect(subject.metadata).toEqual({ issuer: "test" });
        });
    });

    describe("signingKeys", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                signingKeys: [{ kid: "test" }]
            });

            // assert
            expect(subject.signingKeys).toEqual([{ kid: "test" }]);
        });
    });

    describe("filterProtocolClaims", () => {

        it("should use default value", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
            });

            // assert
            expect(subject.filterProtocolClaims).toEqual(true);
        });

        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                filterProtocolClaims: true
            });

            // assert
            expect(subject.filterProtocolClaims).toEqual(true);

            // act
            subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                filterProtocolClaims: false
            });

            // assert
            expect(subject.filterProtocolClaims).toEqual(false);
        });
    });

    describe("staleStateAge", () => {

        it("should use default value", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect"
            });

            // assert
            expect(subject.staleStateAgeInSeconds).toEqual(900);
        });

        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                staleStateAgeInSeconds: 100
            });

            // assert
            expect(subject.staleStateAgeInSeconds).toEqual(100);
        });
    });

    describe("clockSkew", () => {

        it("should use default value", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect"
            });

            // assert
            expect(subject.clockSkewInSeconds).toEqual(5 * 60); // 5 mins
        });

        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                clockSkewInSeconds: 10
            });

            // assert
            expect(subject.clockSkewInSeconds).toEqual(10);
        });
    });

    describe("stateStore", () => {

        it("should return value from initial settings", () => {
            // arrange
            const temp = {} as StateStore;

            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                stateStore: temp
            });

            // assert
            expect(subject.stateStore).toEqual(temp);
        });
    });

    describe("stateStore", () => {

        it("should return value from initial settings", () => {
            // arrange
            const temp = {} as StateStore;

            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                stateStore: temp
            });

            // assert
            expect(subject.stateStore).toEqual(temp);
        });
    });

    describe("extraQueryParams", () => {

        it("should use default value", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect"
            });

            // assert
            expect(subject.extraQueryParams).toEqual({});
        });

        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                extraQueryParams: {
                    "hd": "domain.com"
                }
            });

            // assert
            expect(subject.extraQueryParams).toEqual({ "hd": "domain.com" });
        });
    });

    describe("extraTokenParams", () => {

        it("should use default value", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect"
            });

            // assert
            expect(subject.extraTokenParams).toEqual({});
        });

        it("should return value from initial settings", () => {
            // act
            const subject = new OidcClientSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                extraTokenParams: {
                    "resourceServer": "abc"
                }
            });

            // assert
            expect(subject.extraTokenParams).toEqual({ "resourceServer": "abc" });
        });
    });
});
