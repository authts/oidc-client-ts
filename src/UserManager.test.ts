// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { once } from "events";
import type { PopupWindow } from "./navigators";
import type { SigninResponse } from "./SigninResponse";
import type { SignoutResponse } from "./SignoutResponse";
import { UserManager, SigninPopupArgs, SigninRedirectArgs, SigninSilentArgs } from "./UserManager";
import { UserManagerSettingsStore } from "./UserManagerSettings";
import { User } from "./User";
import type { UserProfile } from "./User";
import { WebStorageStateStore } from "./WebStorageStateStore";
import type { SigninState } from "./SigninState";
import type { State } from "./State";

import { mocked } from "jest-mock";

describe("UserManager", () => {
    let userStoreMock: WebStorageStateStore;

    let subject: UserManager;

    beforeEach(() => {
        localStorage.clear();

        userStoreMock = new WebStorageStateStore();

        subject = new UserManager({
            authority: "http://sts/oidc",
            client_id: "client",
            redirect_uri: "http://app/cb",
            monitorSession : false,
            userStore: userStoreMock,
            metadata: {
                authorization_endpoint: "http://sts/oidc/authorize",
                token_endpoint: "http://sts/oidc/token",
                revocation_endpoint: "http://sts/oidc/revoke",
            },
        });
    });

    describe("constructor", () => {
        it("should accept settings", () => {
            // act
            expect(subject.settings.client_id).toEqual("client");
        });

        it.each([
            { monitorSession: true, message: "should" },
            { monitorSession: false, message: "should not" },
        ])("when monitorSession is $monitorSession $message init sessionMonitor", (args) => {
            const settings = { ...subject.settings, monitorSession: args.monitorSession };

            const userManager = new UserManager(settings);
            const sessionMonitor = userManager["_sessionMonitor"];
            if (args.monitorSession) {
                expect(sessionMonitor).toBeDefined();
            } else {
                expect(sessionMonitor).toBeNull();
            }
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
            subject.events.addUserLoaded(async () => {
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
                profile: {} as UserProfile,
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

    describe("revokeTokens", () => {
        it("should revoke the token types specified", async () => {
            // arrange
            const user = {
                access_token: "foo",
                refresh_token: "bar",
            };
            subject["_loadUser"] = jest.fn().mockReturnValue(user);
            const revokeSpy = jest.spyOn(subject["_client"], "revokeToken").mockResolvedValue(undefined);
            const storeUserSpy = jest.spyOn(subject, "storeUser").mockResolvedValue(undefined);

            // act
            await subject.revokeTokens(["access_token", "refresh_token"]);

            // assert
            expect(revokeSpy).toHaveBeenNthCalledWith(1, "foo", "access_token");
            expect(revokeSpy).toHaveBeenNthCalledWith(2, "bar", "refresh_token");
            expect(user).toMatchObject({
                access_token: "foo",
                refresh_token: null,
            });
            expect(storeUserSpy).toHaveBeenCalled();
        });

        it("should skip revoking absent token types", async () => {
            // arrange
            subject["_loadUser"] = jest.fn().mockReturnValue({
                access_token: "foo",
            });
            const revokeSpy = jest.spyOn(subject["_client"], "revokeToken").mockResolvedValue(undefined);
            jest.spyOn(subject, "storeUser").mockResolvedValue(undefined);

            // act
            await subject.revokeTokens(["access_token", "refresh_token"]);

            // assert
            expect(revokeSpy).toHaveBeenCalledTimes(1);
            expect(revokeSpy).not.toHaveBeenCalledWith(expect.anything(), "refresh_token");
        });

        it("should succeed with no user session", async () => {
            // act
            await expect(subject.revokeTokens())
                // assert
                .resolves.toBe(undefined);
        });
    });

    describe("signinRedirect", () => {
        it("should redirect the browser to the authorize url", async () => {
            // act
            const spy = jest.fn();
            subject.signinRedirect().finally(spy);

            // signinRedirect is a promise that will never resolve (since we
            // want it to hold until the page has redirected), so we wait for
            // the browser unload event before checking the test assertions.
            await once(window, "unload");

            // assert
            expect(window.location.assign).toHaveBeenCalledWith(
                expect.stringContaining(subject.settings.metadata!.authorization_endpoint!),
            );
            const [location] = mocked(window.location.assign).mock.calls[0];
            const state = new URL(location).searchParams.get("state");
            const item = await userStoreMock.get(state!);
            expect(JSON.parse(item!)).toHaveProperty("request_type", "si:r");

            // We check to make sure the promise has not resolved
            expect(spy).not.toHaveBeenCalled();
        });

        it("should pass navigator params to navigator", async () => {
            // arrange
            const prepareMock = jest.spyOn(subject["_redirectNavigator"], "prepare");
            subject["_signinStart"] = jest.fn();
            const navParams: SigninRedirectArgs = {
                redirectMethod: "assign",
            };

            // act
            await subject.signinRedirect(navParams);

            // assert
            expect(prepareMock).toBeCalledWith(navParams);
        });

        it("should pass extra args to _signinStart", async () => {
            // arrange
            jest.spyOn(subject["_redirectNavigator"], "prepare");
            subject["_signinStart"] = jest.fn();
            const extraArgs: SigninRedirectArgs = {
                extraQueryParams: { q : "q" },
                extraTokenParams: { t: "t" },
                state: "state",
                nonce: "random_nonce",
                redirect_uri: "http://app/extra_callback",
                prompt: "login",
            };

            // act
            await subject.signinRedirect(extraArgs);

            // assert
            expect(subject["_signinStart"]).toBeCalledWith(
                {
                    request_type: "si:r",
                    ...extraArgs,
                },
                expect.objectContaining({
                    close: expect.any(Function),
                    navigate: expect.any(Function),
                }),
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
                ...subject.settings,
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
                profile: {} as UserProfile,
            });
            const handle = { } as PopupWindow;
            jest.spyOn(subject["_popupNavigator"], "prepare")
                .mockImplementation(() => Promise.resolve(handle));
            subject["_signin"] = jest.fn().mockResolvedValue(user);
            const extraArgs: SigninPopupArgs = {
                extraQueryParams: { q : "q" },
                extraTokenParams: { t: "t" },
                state: "state",
                nonce: "random_nonce",
                redirect_uri: "http://app/extra_callback",
                prompt: "login",
            };

            // act
            await subject.signinPopup(extraArgs);

            // assert
            expect(subject["_signin"]).toBeCalledWith(
                {
                    request_type: "si:p",
                    display: "popup",
                    ...extraArgs,
                },
                handle,
            );
        });
    });

    describe("signinPopupCallback", () => {
        it("should call navigator callback", async () => {
            // arrange
            const callbackMock = jest.spyOn(subject["_popupNavigator"], "callback").mockResolvedValue();
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
                profile: {} as UserProfile,
            });

            Object.assign(subject.settings, {
                silentRequestTimeoutInSeconds: 123,
                silent_redirect_uri: "http://client/silent_callback",
            });
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
                silentRequestTimeoutInSeconds: 234,
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
                profile: {} as UserProfile,
            });
            jest.spyOn(subject["_popupNavigator"], "prepare");
            subject["_signin"] = jest.fn().mockResolvedValue(user);
            const extraArgs: SigninSilentArgs = {
                extraQueryParams: { q : "q" },
                extraTokenParams: { t: "t" },
                state: "state",
                nonce: "random_nonce",
                redirect_uri: "http://app/extra_callback",
            };

            // act
            await subject.signinSilent(extraArgs);

            // assert
            expect(subject["_signin"]).toBeCalledWith(
                {
                    request_type: "si:s",
                    prompt: "none",
                    id_token_hint: undefined,
                    ...extraArgs,
                },
                expect.objectContaining({
                    close: expect.any(Function),
                    navigate: expect.any(Function),
                }),
                undefined,
            );
        });

        it("should work when having no user present", async () => {
            // arrange
            const user = new User({
                access_token: "access_token",
                token_type: "token_type",
                profile: {} as UserProfile,
            });
            Object.assign(subject.settings, {
                silent_redirect_uri: "http://client/silent_callback",
            });
            subject["_signin"] = jest.fn().mockResolvedValue(user);

            // act
            await subject.signinSilent();
        });

        it("should use the refresh_token grant when a refresh token is present", async () => {
            // arrange
            const user = new User({
                access_token: "access_token",
                token_type: "token_type",
                refresh_token: "refresh_token",
                profile: {
                    sub: "sub",
                    nickname: "Nick",
                } as UserProfile,
            });

            const useRefreshTokenSpy = jest.spyOn(subject["_client"], "useRefreshToken").mockResolvedValue({
                access_token: "new_access_token",
                profile: {
                    sub: "sub",
                    nickname: "Nicholas",
                },
            } as unknown as SigninResponse);
            subject["_loadUser"] = jest.fn().mockResolvedValue(user);

            // act
            const refreshedUser = await subject.signinSilent();
            expect(refreshedUser).toHaveProperty("access_token", "new_access_token");
            expect(refreshedUser!.profile).toHaveProperty("nickname", "Nicholas");
            expect(useRefreshTokenSpy).toBeCalledWith(
                expect.objectContaining({
                    state: {
                        refresh_token: user.refresh_token,
                        session_state: null,
                        "profile": { "nickname": "Nick", "sub": "sub" },
                    },
                }),
            );
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
                profile: {} as UserProfile,
            });
            const responseState = {
                state: { request_type: "si:r" } as SigninState,
                response: { } as SigninResponse,
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
                response: { } as SigninResponse,
            };
            jest.spyOn(subject["_client"], "readSigninResponseState")
                .mockImplementation(() => Promise.resolve(responseState));
            const signinPopupCallbackMock = jest.spyOn(subject, "signinPopupCallback").mockResolvedValue();
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
                response: { } as SigninResponse,
            };
            jest.spyOn(subject["_client"], "readSigninResponseState")
                .mockImplementation(() => Promise.resolve(responseState));
            const signinRedirectCallbackMock = jest.spyOn(subject, "signinSilentCallback").mockResolvedValue();
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
                response: { } as SigninResponse,
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
                response: { } as SignoutResponse,
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
                response: { } as SignoutResponse,
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
                response: { } as SignoutResponse,
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
                profile: {} as UserProfile,
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
                profile: {} as UserProfile,
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
