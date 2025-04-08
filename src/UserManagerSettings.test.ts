// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { UserManagerSettingsStore } from "./UserManagerSettings";
import type { WebStorageStateStore } from "./WebStorageStateStore";

describe("UserManagerSettings", () => {
    describe("constructor", () => {

        it("should pass settings to base class", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
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
                popup_redirect_uri: "test",
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
                popupWindowFeatures: { status: true },
            });

            // assert
            expect(subject.popupWindowFeatures).toEqual({ status: true });
        });

        it("should set closePopupWindowAfterInMilliseconds", () => {
            // act
            const closePopupWindowAfterInSeconds = 100;
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                popupWindowFeatures: { status: true, closePopupWindowAfterInSeconds },
            });

            // assert
            expect(subject.popupWindowFeatures).toEqual({ status: true, closePopupWindowAfterInSeconds });
        });
    });

    describe("popupWindowTarget", () => {

        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                popupWindowTarget: "foo",
            });

            // assert
            expect(subject.popupWindowTarget).toEqual("foo");
        });

    });

    describe("redirectMethod", () => {

        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                redirectMethod: "replace",
            });

            // assert
            expect(subject.redirectMethod).toEqual("replace");
        });

    });

    describe("silent_redirect_uri", () => {

        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                silent_redirect_uri: "test",
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
                silentRequestTimeoutInSeconds: 123,
            });

            // assert
            expect(subject.silentRequestTimeoutInSeconds).toEqual(123);
        });

    });

    describe("automaticSilentRenew", () => {

        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                automaticSilentRenew: false,
            });

            // assert
            expect(subject.automaticSilentRenew).toEqual(false);
        });

        it("should use default value", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
            });

            // assert
            expect(subject.automaticSilentRenew).toEqual(true);
        });

    });

    describe("validateSubOnSilentRenew", () => {

        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                validateSubOnSilentRenew: false,
            });

            // assert
            expect(subject.validateSubOnSilentRenew).toEqual(false);
        });

        it("should use default value", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
            });

            // assert
            expect(subject.validateSubOnSilentRenew).toEqual(true);
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

        it("should use default value", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
            });

            // assert
            expect(subject.includeIdTokenInSilentRenew).toEqual(false);
        });
    });

    describe("accessTokenExpiringNotificationTime", () => {

        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                accessTokenExpiringNotificationTimeInSeconds: 10,
            });

            // assert
            expect(subject.accessTokenExpiringNotificationTimeInSeconds).toEqual(10);
        });

        it("should use default value", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
            });

            // assert
            expect(subject.accessTokenExpiringNotificationTimeInSeconds).toEqual(60);
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
                userStore : temp,
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
                revokeTokensOnSignout : true,
            });

            // assert
            expect(subject.revokeTokensOnSignout).toEqual(true);
        });
    });

    describe("checkSessionInterval", () => {
        it("should return value from initial settings", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                checkSessionIntervalInSeconds: 6,
            });

            // assert
            expect(subject.checkSessionIntervalInSeconds).toEqual(6);
        });
        it("should use default value", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
            });

            // assert
            expect(subject.checkSessionIntervalInSeconds).toEqual(2);
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
                query_status_response_type : temp,
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
                    response_type: "id_token token",
                });

                // assert
                expect(subject.query_status_response_type).toEqual("code");
            }
            {
                // act
                const subject = new UserManagerSettingsStore({
                    authority: "authority",
                    client_id: "client",
                    redirect_uri: "redirect",
                    response_type: "code",
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
                stopCheckSessionOnError : false,
            });

            // assert
            expect(subject.stopCheckSessionOnError).toEqual(false);
        });
        it("should use default value", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
            });

            // assert
            expect(subject.stopCheckSessionOnError).toEqual(true);
        });
    });

    describe("silentRequestTimeoutInSeconds", () => {
        it("should set if defined in the constructor", () => {
            const temp = 100;

            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                silentRequestTimeoutInSeconds : temp,
            });

            // assert
            expect(subject.silentRequestTimeoutInSeconds).toEqual(temp);
        });

        it("should set to requestTimeoutInSeconds if defined in the constructor", () => {
            const temp = 100;

            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
                requestTimeoutInSeconds : temp,
            });

            // assert
            expect(subject.silentRequestTimeoutInSeconds).toEqual(temp);
        });

        it("should set to the default if neither requestTimeoutInSeconds are defined", () => {
            // act
            const subject = new UserManagerSettingsStore({
                authority: "authority",
                client_id: "client",
                redirect_uri: "redirect",
            });

            // assert
            expect(subject.silentRequestTimeoutInSeconds).toEqual(10);
        });
    });
});
