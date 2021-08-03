// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from '../../src/utils';
import { MetadataService } from '../../src/MetadataService';
import { OidcClientSettingsStore } from '../../src/OidcClientSettings';
import { ResponseValidator } from '../../src/ResponseValidator';
import { StateStore } from '../../src/StateStore';

import { mocked } from 'ts-jest/utils';

describe("OidcClientSettings", () => {

    beforeEach(() => {
        Log.logger = console;
        Log.level = Log.NONE;
    });

    describe("client_id", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client'
            });

            // assert
            expect(subject.client_id).toEqual("client");
        });
    });

    describe("client_secret", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_secret: 'secret'
            });

            // assert
            expect(subject.client_secret).toEqual("secret");
        });
    });

    describe("response_type", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                response_type: "foo"
            });

            // assert
            expect(subject.response_type).toEqual("foo");
        });

        it("should use default value", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client'
            });

            // assert
            expect(subject.response_type).toEqual("id_token");
        });

    });

    describe("scope", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                scope: "foo"
            });

            // assert
            expect(subject.scope).toEqual("foo");
        });

        it("should use default value", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client'
            });

            // assert
            expect(subject.scope).toEqual("openid");
        });

    });

    describe("redirect_uri", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                redirect_uri: "foo"
            });

            // assert
            expect(subject.redirect_uri).toEqual("foo");
        });

    });

    describe("post_logout_redirect_uri", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                post_logout_redirect_uri: "http://app/loggedout"
            });

            // assert
            expect(subject.post_logout_redirect_uri).toEqual("http://app/loggedout");
        });
    });

    describe("prompt", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                prompt: "foo"
            });

            // assert
            expect(subject.prompt).toEqual("foo");
        });
    });

    describe("display", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                display: "foo"
            });

            // assert
            expect(subject.display).toEqual("foo");
        });
    });

    describe("max_age", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                max_age: 22
            });

            // assert
            expect(subject.max_age).toEqual(22);
        });
    });

    describe("ui_locales", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                ui_locales: "foo"
            });

            // assert
            expect(subject.ui_locales).toEqual("foo");
        });
    });

    describe("acr_values", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                acr_values: "foo"
            });

            // assert
            expect(subject.acr_values).toEqual("foo");
        });
    });

    describe("resource", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                resource: "foo"
            });

            // assert
            expect(subject.resource).toEqual("foo");
        });
    });

    describe("response_mode", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                response_mode: "foo"
            });

            // assert
            expect(subject.response_mode).toEqual("foo");
        });
    });

    describe("authority", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                authority: "http://sts"
            });

            // assert
            expect(subject.authority).toEqual("http://sts");
        });
    });

    describe("metadataUrl", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                metadataUrl: "http://sts/metadata"
            });

            // assert
            expect(subject.metadataUrl).toEqual("http://sts/metadata");
        });
    });

    describe("metadata", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                metadata: { issuer: "test" }
            });

            // assert
            expect(subject.metadata).toEqual({ issuer: "test" });
        });
    });

    describe("signingKeys", () => {
        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                signingKeys: ["test"]
            });

            // assert
            expect(subject.signingKeys).toEqual(["test"]);
        });
    });

    describe("filterProtocolClaims", () => {

        it("should use default value", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
            });

            // assert
            expect(subject.filterProtocolClaims).toEqual(true);
        });

        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                filterProtocolClaims: true
            });

            // assert
            expect(subject.filterProtocolClaims).toEqual(true);

            // act
            subject = new OidcClientSettingsStore({
                client_id: 'client',
                filterProtocolClaims: false
            });

            // assert
            expect(subject.filterProtocolClaims).toEqual(false);
        });
    });

    describe("loadUserInfo", () => {

        it("should use default value", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
            });

            // assert
            expect(subject.loadUserInfo).toEqual(true);
        });

        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                loadUserInfo: true
            });

            // assert
            expect(subject.loadUserInfo).toEqual(true);

            // act
            subject = new OidcClientSettingsStore({
                client_id: 'client',
                loadUserInfo: false
            });

            // assert
            expect(subject.loadUserInfo).toEqual(false);
        });
    });

    describe("staleStateAge", () => {

        it("should use default value", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
            });

            // assert
            expect(subject.staleStateAge).toEqual(900);
        });

        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                staleStateAge: 100
            });

            // assert
            expect(subject.staleStateAge).toEqual(100);
        });
    });

    describe("clockSkew", () => {

        it("should use default value", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client'
            });

            // assert
            expect(subject.clockSkew).toEqual(5 * 60); // 5 mins
        });

        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                clockSkew: 10
            });

            // assert
            expect(subject.clockSkew).toEqual(10);
        });
    });

    describe("stateStore", () => {

        it("should return value from initial settings", () => {
            // arrange
            let temp = {} as StateStore;

            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                stateStore: temp
            });

            // assert
            expect(subject.stateStore).toEqual(temp);
        });
    });

    describe("stateStore", () => {

        it("should return value from initial settings", () => {
            // arrange
            let temp = {} as StateStore;

            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                stateStore: temp
            });

            // assert
            expect(subject.stateStore).toEqual(temp);
        });
    });

    describe("validator", () => {

        it("should return value from initial settings", () => {
            // arrange
            const dummy = new OidcClientSettingsStore();
            const metadataService = new MetadataService(dummy);
            const mock = mocked(new ResponseValidator(dummy, metadataService));
            const settings: any = {
                client_id: 'client',
                ResponseValidatorCtor: () => mock
            };

            // act
            let subject = new OidcClientSettingsStore(settings);

            // assert
            expect(subject.validator).toEqual(mock);
        });
    });

    describe("metadataServiceCtor", () => {

        it("should return value from initial settings", () => {
            // arrange
            const dummy = new OidcClientSettingsStore();
            const mock = mocked(new MetadataService(dummy));
            const settings: any = {
                client_id: 'client',
                MetadataServiceCtor: () => mock
            };

            // act
            let subject = new OidcClientSettingsStore(settings);

            // assert
            expect(subject.metadataService).toEqual(mock);
        });
    });

    describe("extraQueryParams", () => {

        it("should use default value", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client'
            });

            // assert
            expect(subject.extraQueryParams).toEqual({});
        });

        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                extraQueryParams: {
                    'hd': 'domain.com'
                }
            });

            // assert
            expect(subject.extraQueryParams).toEqual({ 'hd': 'domain.com' });
        });

        it("should not set value from initial settings if not object, but set default value ({})", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                extraQueryParams: 123456 as unknown as Record<string, any>
            });

            // assert
            expect(subject.extraQueryParams).toEqual({});
        });
    })

    describe("extraTokenParams", () => {

        it("should use default value", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client'
            });

            // assert
            expect(subject.extraTokenParams).toEqual({});
        });

        it("should return value from initial settings", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                extraTokenParams: {
                    'resourceServer': 'abc'
                }
            });

            // assert
            expect(subject.extraTokenParams).toEqual({ 'resourceServer': 'abc' });
        });

        it("should not set value from initial settings if not object, but set default value ({})", () => {
            // act
            let subject = new OidcClientSettingsStore({
                client_id: 'client',
                extraTokenParams: 123456 as unknown as Record<string, any>
            });

            // assert
            expect(subject.extraTokenParams).toEqual({});
        });
    });
});
