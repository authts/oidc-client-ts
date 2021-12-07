// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, Logger } from "./utils";
import type { PopupWindow } from "./navigators";
import type { SigninResponse } from "./SigninResponse";
import type { SignoutResponse } from "./SignoutResponse";
import { UserManager, SigninPopupArgs, SigninRedirectArgs, SigninSilentArgs } from "./UserManager";
import { UserManagerSettings, UserManagerSettingsStore } from "./UserManagerSettings";
import { User } from "./User";
import { WebStorageStateStore } from "./WebStorageStateStore";
import type { SigninState } from "./SigninState";
import type { State } from "./State";

import { mocked } from "ts-jest/utils";

describe("UserManager", () => {
    let settings: UserManagerSettings;
    let logger: Logger;
    let userStoreMock: WebStorageStateStore;

    let subject: UserManager;

    beforeEach(() => {
        Log.logger = console;
        Log.level = Log.NONE;
        localStorage.clear();

        userStoreMock = new WebStorageStateStore();
        logger = new Logger("UserManager.test");

        settings = {
            authority: "http://sts/oidc",
            client_id: "client",
            redirect_uri: "http://app/cb",
            monitorSession : false,
            userStore: userStoreMock,
            metadata: {
                authorization_endpoint: "http://sts/oidc/authorize",
                token_endpoint: "http://sts/oidc/token"
            }
        };
        subject = new UserManager(settings);

        const location = Object.defineProperties({}, {
            ...Object.getOwnPropertyDescriptors(window.location),
            assign: {
                enumerable: true,
                value: jest.fn()
            },
            replace: {
                enumerable: true,
                value: jest.fn()
            }
        });
        Object.defineProperty(window, "location", {
            enumerable: true,
            get: () => location
        });
    });

    describe("constructor", () => {
        it("should accept settings", () => {
            // act
            expect(subject.settings.client_id).toEqual("client");
        });
    });

    describe("settings", () => {
        it("should be UserManagerSettings", () => {
            // act
            expect(subject.settings).toBeInstanceOf(UserManagerSettingsStore);
        });
    });

    describe("getUser", () => {
        it("should be able to call getUser without recursion", () => {
            // arrange
            subject.events.addUserLoaded(async (user) => {
                logger.debug("event.load", user);
                await subject.getUser();
            });

            // act
            subject.events.load({} as User);
        });

        it("should return user if there is a user stored", async () => {
            // arrange
            const user = new User({
                access_token: "access_token",
                token_type: "token_type",
                profile: {}
            });
            subject["_loadUser"] = jest.fn().mockReturnValue(user);
            const loadMock = jest.spyOn(subject["_events"], "load");

            // act
            const result = await subject.getUser();

            // assert
            expect(result).toEqual(user);
            expect(loadMock).toBeCalledWith(user, false);
        });

        it("should return null if there is no user stored", async () => {
            // arrange
            subject["_loadUser"] = jest.fn().mockReturnValue(null);
            const loadMock = jest.spyOn(subject["_events"], "load");

            // act
            const result = await subject.getUser();

            // assert
            expect(result).toBeNull();
            expect(loadMock).not.toBeCalled();
        });
    });

    describe("removeUser", () => {
        it("should remove user from store and event unload", async () => {
            // arrange
            const storeUserMock = jest.spyOn(subject, "storeUser");
            const unloadMock = jest.spyOn(subject["_events"], "unload");

            // act
            await subject.removeUser();

            // assert
            expect(storeUserMock).toBeCalledWith(null);
            expect(unloadMock).toBeCalled();
        });
    });

    describe("signinRedirect", () => {
        it("should redirect the browser to the authorize url", async () => {
            // act
            await subject.signinRedirect();

            // assert
            expect(window.location.assign).toHaveBeenCalledWith(
                expect.stringContaining(settings.metadata!.authorization_endpoint!)
            );
            const [location] = mocked(window.location.assign).mock.calls[0];
            const state = new URL(location).searchParams.get("state");
            const item = await userStoreMock.get(state!);
            expect(JSON.parse(item!)).toHaveProperty("request_type", "si:r");
        });

        it("should pass navigator params to navigator", async () => {
            // arrange
            const prepareMock = jest.spyOn(subject["_redirectNavigator"], "prepare");
            subject["_signinStart"] = jest.fn();
            const navParams: SigninRedirectArgs = {
                redirectMethod: "assign"
            };

            // act
            await subject.signinRedirect(navParams);

            // assert
            expect(prepareMock).toBeCalledWith(navParams);
        });

        it("should pass extra args to _signinStart", async () => {
            // arrange
            jest.spyOn(subject["_redirectNavigator"], "prepare");
            const signinStartMock = jest.spyOn(subject as any, "_signinStart");
            const extraArgs: SigninRedirectArgs = {
                extraQueryParams: { q : "q" },
                extraTokenParams: { t: "t" },
                state: "state"
            };

            // act
            await subject.signinRedirect(extraArgs);

            // assert
            expect(signinStartMock).toBeCalledWith(
                {
                    request_type: "si:r",
                    ...extraArgs
                },
                expect.objectContaining({
                    close: expect.any(Function),
                    navigate: expect.any(Function),
                })
            );
        });
    });

    describe("signinRedirectCallback", () => {
        it("should return a user", async () => {
            // arrange
            const spy = jest.spyOn(subject["_client"], "processSigninResponse")
                .mockResolvedValue({} as SigninResponse);
            await userStoreMock.set("test", JSON.stringify({
                id: "test",
                request_type: "si:r",
                ...settings,
            }));

            // act
            const user = await subject.signinRedirectCallback("http://app/cb?state=test&code=code");

            // assert
            expect(user).toBeInstanceOf(User);
            spy.mockRestore();
        });
    });

    describe("signinPopup", () => {
        it("should pass navigator params to navigator", async () => {
            // arrange
            const handle = { } as PopupWindow;
            const prepareMock = jest.spyOn(subject["_popupNavigator"], "prepare")
                .mockImplementation(() => Promise.resolve(handle));
            subject["_signin"] = jest.fn();
            const navParams: SigninPopupArgs = {
                popupWindowFeatures: {
                    location: false,
                    toolbar: false,
                    height: 100,
                },
                popupWindowTarget: "popupWindowTarget",
            };

            // act
            await subject.signinPopup(navParams);

            // assert
            expect(prepareMock).toBeCalledWith(navParams);
        });

        it("should pass extra args to _signinStart", async () => {
            // arrange
            const user = new User({
                access_token: "access_token",
                token_type: "token_type",
                profile: {}
            });
            const handle = { } as PopupWindow;
            jest.spyOn(subject["_popupNavigator"], "prepare")
                .mockImplementation(() => Promise.resolve(handle));
            const signinMock = jest.spyOn(subject as any, "_signin")
                .mockImplementation(() => Promise.resolve(user));
            const extraArgs: SigninPopupArgs = {
                extraQueryParams: { q : "q" },
                extraTokenParams: { t: "t" },
                state: "state"
            };

            // act
            await subject.signinPopup(extraArgs);

            // assert
            expect(signinMock).toBeCalledWith(
                {
                    request_type: "si:p",
                    redirect_uri: subject.settings.redirect_uri,
                    display: "popup",
                    ...extraArgs
                },
                handle
            );
        });
    });

    describe("signinPopupCallback", () => {
        it("should call navigator callback", async () => {
            // arrange
            const callbackMock = jest.spyOn(subject["_popupNavigator"], "callback");
            const url = "http://app/cb?state=test&code=code";
            const keepOpen = true;

            // act
            await subject.signinPopupCallback(url, keepOpen);

            // assert
            expect(callbackMock).toBeCalledWith(url, keepOpen);
        });
    });

    describe("signinSilent", () => {
        it("should pass silentRequestTimeout from settings", async () => {
            // arrange
            const user = new User({
                id_token: "id_token",
                access_token: "access_token",
                token_type: "token_type",
                profile: {}
            });

            settings = {
                ...settings,
                silentRequestTimeoutInSeconds: 123,
                silent_redirect_uri: "http://client/silent_callback"
            };
            subject = new UserManager(settings);
            subject["_signin"] = jest.fn().mockResolvedValue(user);

            // act
            await subject.signinSilent();
            const [, navInstance] = mocked(subject["_signin"]).mock.calls[0];

            // assert
            expect(navInstance).toHaveProperty("_timeoutInSeconds", 123);
        });

        it("should pass navigator params to navigator", async () => {
            // arrange
            const prepareMock = jest.spyOn(subject["_iframeNavigator"], "prepare");
            subject["_signin"] = jest.fn();
            const navParams: SigninSilentArgs = {
                silentRequestTimeoutInSeconds: 234
            };

            // act
            await subject.signinSilent(navParams);

            // assert
            expect(prepareMock).toBeCalledWith(navParams);
        });

        it("should pass extra args to _signinStart", async () => {
            // arrange
            const user = new User({
                access_token: "access_token",
                token_type: "token_type",
                profile: {}
            });
            jest.spyOn(subject["_popupNavigator"], "prepare");
            const signinMock = jest.spyOn(subject as any, "_signin")
                .mockImplementation(() => Promise.resolve(user));
            const extraArgs: SigninSilentArgs = {
                extraQueryParams: { q : "q" },
                extraTokenParams: { t: "t" },
                state: "state"
            };

            // act
            await subject.signinSilent(extraArgs);

            // assert
            expect(signinMock).toBeCalledWith(
                {
                    request_type: "si:s",
                    redirect_uri: subject.settings.redirect_uri,
                    prompt: "none",
                    id_token_hint: undefined,
                    ...extraArgs
                },
                expect.objectContaining({
                    close: expect.any(Function),
                    navigate: expect.any(Function),
                }),
                undefined
            );
        });

        it("should work when having no user present", async () => {
            // arrange
            const user = new User({
                access_token: "access_token",
                token_type: "token_type",
                profile: {}
            });
            settings = {
                ...settings,
                silent_redirect_uri: "http://client/silent_callback"
            };
            subject = new UserManager(settings);
            subject["_signin"] = jest.fn().mockResolvedValue(user);

            // act
            await subject.signinSilent();
        });
    });

    describe("signinSilentCallback", () => {
        it("should call navigator callback", async () => {
            // arrange
            const callbackMock = jest.spyOn(subject["_iframeNavigator"], "callback");
            const url = "http://app/cb?state=test&code=code";

            // act
            await subject.signinSilentCallback(url);

            // assert
            expect(callbackMock).toBeCalledWith(url);
        });
    });

    describe("signinCallback", () => {
        it("should signin redirect callback for request type si:r", async () => {
            // arrange
            const user = new User({
                access_token: "access_token",
                token_type: "token_type",
                profile: {}
            });
            const responseState = {
                state: { request_type: "si:r" } as SigninState,
                response: { } as SigninResponse
            };
            jest.spyOn(subject["_client"], "readSigninResponseState")
                .mockImplementation(() => Promise.resolve(responseState));
            const signinRedirectCallbackMock = jest.spyOn(subject, "signinRedirectCallback")
                .mockImplementation(() => Promise.resolve(user));
            const url = "http://app/cb?state=test&code=code";

            // act
            const result = await subject.signinCallback(url);

            // assert
            expect(signinRedirectCallbackMock).toBeCalledWith(url);
            expect(result).toEqual(user);
        });

        it("should signin popup callback for request type si:p", async () => {
            // arrange
            const responseState = {
                state: { request_type: "si:p" } as SigninState,
                response: { } as SigninResponse
            };
            jest.spyOn(subject["_client"], "readSigninResponseState")
                .mockImplementation(() => Promise.resolve(responseState));
            const signinPopupCallbackMock = jest.spyOn(subject, "signinPopupCallback");
            const url = "http://app/cb?state=test&code=code";

            // act
            const result = await subject.signinCallback(url);

            // assert
            expect(signinPopupCallbackMock).toBeCalledWith(url);
            expect(result).toBe(undefined);
        });

        it("should signin silent callback for request type si:s", async () => {
            // arrange
            const responseState = {
                state: { request_type: "si:s" } as SigninState,
                response: { } as SigninResponse
            };
            jest.spyOn(subject["_client"], "readSigninResponseState")
                .mockImplementation(() => Promise.resolve(responseState));
            const signinRedirectCallbackMock = jest.spyOn(subject, "signinSilentCallback");
            const url = "http://app/cb?state=test&code=code";

            // act
            const result = await subject.signinCallback(url);

            // assert
            expect(signinRedirectCallbackMock).toBeCalledWith(url);
            expect(result).toBe(undefined);
        });

        it("should have valid request type", async () => {
            // arrange
            const responseState = {
                state: { request_type: "dummy" } as SigninState,
                response: { } as SigninResponse
            };
            jest.spyOn(subject["_client"], "readSigninResponseState")
                .mockImplementation(() => Promise.resolve(responseState));

            // act
            await expect(subject.signinCallback())
                // assert
                .rejects.toThrow(Error);
        });
    });

    describe("signoutCallback", () => {
        it("should signout redirect callback for request type so:r", async () => {
            // arrange
            const responseState = {
                state: { request_type: "so:r" } as State,
                response: { } as SignoutResponse
            };
            jest.spyOn(subject["_client"], "readSignoutResponseState")
                .mockImplementation(() => Promise.resolve(responseState));
            const signoutRedirectCallbackMock = jest.spyOn(subject, "signoutRedirectCallback")
                .mockImplementation();
            const url = "http://app/cb?state=test&code=code";

            // act
            await subject.signoutCallback(url, true);

            // assert
            expect(signoutRedirectCallbackMock).toBeCalledWith(url);
        });

        it("should signout popup callback for request type so:p", async () => {
            // arrange
            const responseState = {
                state: { request_type: "so:p" } as State,
                response: { } as SignoutResponse
            };
            jest.spyOn(subject["_client"], "readSignoutResponseState")
                .mockImplementation(() => Promise.resolve(responseState));
            const signoutPopupCallbackMock = jest.spyOn(subject, "signoutPopupCallback")
                .mockImplementation();
            const url = "http://app/cb?state=test&code=code";
            const keepOpen = true;

            // act
            await subject.signoutCallback(url, keepOpen);

            // assert
            expect(signoutPopupCallbackMock).toBeCalledWith(url, keepOpen);
        });

        it("should have valid request type", async () => {
            // arrange
            const responseState = {
                state: { request_type: "dummy" } as State,
                response: { } as SignoutResponse
            };
            jest.spyOn(subject["_client"], "readSignoutResponseState")
                .mockImplementation(() => Promise.resolve(responseState));

            // act
            await expect(subject.signoutCallback())
                // assert
                .rejects.toThrow(Error);
        });
    });

    describe("storeUser", () => {
        it("should add user to store", async () => {
            // arrange
            const user = new User({
                access_token: "access_token",
                token_type: "token_type",
                profile: {}
            });

            // act
            await subject.storeUser(user);

            // assert
            const storageString = await subject.settings.userStore.get(subject["_userStoreKey"]);
            expect(storageString).not.toBeNull();
        });

        it("should remove user from store", async () => {
            // arrange
            const user = new User({
                access_token: "access_token",
                token_type: "token_type",
                profile: {}
            });
            await subject.storeUser(user);

            // act
            await subject.storeUser(null);

            // assert
            const storageString = await subject.settings.userStore.get(subject["_userStoreKey"]);
            expect(storageString).toBeNull();
        });
    });
});
