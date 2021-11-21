// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, Logger } from "./utils";
import type { SigninResponse } from "./SigninResponse";
import { UserManager } from "./UserManager";
import { UserManagerSettings, UserManagerSettingsStore } from "./UserManagerSettings";
import { User } from "./User";
import { WebStorageStateStore } from "./WebStorageStateStore";

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
    });

    describe("signinRedirect", () => {
        it("should redirect the browser to the authorize url", async () => {
            await subject.signinRedirect();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            expect(window.location.assign).toHaveBeenCalledWith(expect.stringContaining(settings.metadata!.authorization_endpoint!));
            const [location] = mocked(window.location.assign).mock.calls[0];
            const state = new URL(location).searchParams.get("state");
            const item = await userStoreMock.get(state!);
            expect(JSON.parse(item!)).toHaveProperty("request_type", "si:r");
        });
    });

    describe("signinRedirectCallback", () => {
        it("should return a user", async () => {
            const spy = jest.spyOn(subject["_client"], "processSigninResponse").mockResolvedValue({} as SigninResponse);
            await userStoreMock.set("test", JSON.stringify({
                id: "test",
                request_type: "si:r",
                ...settings,
            }));
            const user = await subject.signinRedirectCallback("http://app/cb?state=test&code=code");
            expect(user).toBeInstanceOf(User);
            spy.mockRestore();
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

        it("should pass silentRequestTimeout from params", async () => {
            // arrange
            const user = new User({
                id_token: "id_token",
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
            await subject.signinSilent({ silentRequestTimeoutInSeconds: 234 });
            const [, navInstance] = mocked(subject["_signin"]).mock.calls[0];

            // assert
            expect(navInstance).toHaveProperty("_timeoutInSeconds", 234);
        });

        it("should work when having no User present", async () => {
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
});
