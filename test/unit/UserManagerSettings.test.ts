// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "../../src/utils";
import { UserManagerSettingsStore } from "../../src/UserManagerSettings";
import { WebStorageStateStore } from "../../src/WebStorageStateStore";

describe("UserManagerSettings", () => {

    beforeEach(() => {
        Log.logger = console;
        Log.level = Log.NONE;
    });

    describe("constructor", () => {

        it("should pass settings to base class", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect"
            });

            // assert
            expect(subject.client_id).toEqual("client");
        });

    });

    describe("popup_redirect_uri", () => {

        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                popup_redirect_uri: "test"
            });

            // assert
            expect(subject.popup_redirect_uri).toEqual("test");
        });

    });

    describe("popupWindowFeatures", () => {

        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                popupWindowFeatures: "foo"
            });

            // assert
            expect(subject.popupWindowFeatures).toEqual("foo");
        });

    });

    describe("popupWindowTarget", () => {

        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                popupWindowTarget: "foo"
            });

            // assert
            expect(subject.popupWindowTarget).toEqual("foo");
        });

    });

    describe("silent_redirect_uri", () => {

        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                silent_redirect_uri: "test"
            });

            // assert
            expect(subject.silent_redirect_uri).toEqual("test");
        });

    });

    describe("silentRequestTimeout", () => {

        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                silentRequestTimeout: 123
            });

            // assert
            expect(subject.silentRequestTimeout).toEqual(123);
        });

    });

    describe("automaticSilentRenew", () => {

        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                automaticSilentRenew: true
            });

            // assert
            expect(subject.automaticSilentRenew).toEqual(true);
        });

        it("should use default value", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect"
            });

            // assert
            expect(subject.automaticSilentRenew).toEqual(false);
        });

    });

    describe("validateSubOnSilentRenew", () => {

        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                validateSubOnSilentRenew: true
            });

            // assert
            expect(subject.validateSubOnSilentRenew).toEqual(true);
        });

        it("should use default value", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect"
            });

            // assert
            expect(subject.validateSubOnSilentRenew).toEqual(false);
        });

    });

    describe("includeIdTokenInSilentRenew", () => {
        it("should return true value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                includeIdTokenInSilentRenew: true,
            });

            // assert
            expect(subject.includeIdTokenInSilentRenew).toEqual(true);
        });

        it("should return false value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                includeIdTokenInSilentRenew: false,
            });

            // assert
            expect(subject.includeIdTokenInSilentRenew).toEqual(false);
        });

        it("should use default value", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect"
            });

            // assert
            expect(subject.includeIdTokenInSilentRenew).toEqual(true);
        });
    });

    describe("accessTokenExpiringNotificationTime", () => {

        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                accessTokenExpiringNotificationTime: 10
            });

            // assert
            expect(subject.accessTokenExpiringNotificationTime).toEqual(10);
        });

        it("should use default value", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect"
            });

            // assert
            expect(subject.accessTokenExpiringNotificationTime).toEqual(60);
        });

    });

    describe("userStore", () => {
        it("should return value from initial settings", () => {
            const temp = {} as WebStorageStateStore;

            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                userStore : temp
            });

            // assert
            expect(subject.userStore).toEqual(temp);
        });
    });

    describe("revokeAccessTokenOnSignout", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                revokeAccessTokenOnSignout : true
            });

            // assert
            expect(subject.revokeAccessTokenOnSignout).toEqual(true);
        });
    });

    describe("checkSessionInterval", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                checkSessionInterval : 6000
            });

            // assert
            expect(subject.checkSessionInterval).toEqual(6000);
        });
        it("should use default value", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect"
            });

            // assert
            expect(subject.checkSessionInterval).toEqual(2000);
        });
    });

    describe("query_status_response_type", () => {
        it("should return value from initial settings", () => {
            const temp = "type";

            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                query_status_response_type : temp
            });

            // assert
            expect(subject.query_status_response_type).toEqual(temp);
        });
        it("should infer default value", () => {
            {
                // act
                const subject = new UserManagerSettingsStore({
                    authority: "authority",
                    client_id: "client",
                    redirect_uri: "redirect",
                    response_type: "id_token token"
                });

                // assert
                expect(subject.query_status_response_type).toEqual("id_token");
            }
            {
                // act
                const subject = new UserManagerSettingsStore({
                    authority: "authority",
                    client_id: "client",
                    redirect_uri: "redirect",
                    response_type: "code"
                });

                // assert
                expect(subject.query_status_response_type).toEqual("code");
            }
        });
    });

    describe("stopCheckSessionOnError", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                stopCheckSessionOnError : false
            });

            // assert
            expect(subject.stopCheckSessionOnError).toEqual(false);
        });
        it("should use default value", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect"
            });

            // assert
            expect(subject.stopCheckSessionOnError).toEqual(true);
        });
    });
});
