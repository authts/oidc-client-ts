// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "../../src/utils";
import { UserManager } from "../../src/UserManager";
import { UserManagerSettings, UserManagerSettingsStore } from "../../src/UserManagerSettings";
import { User } from "../../src/User";
import { WebStorageStateStore } from "../../src/WebStorageStateStore";

import { mocked } from "ts-jest/utils";
import type { IWindow } from "../../src/navigators";

describe("UserManager", () => {
    let settings: UserManagerSettings;
    let userStoreMock: any;
    let subject: UserManager;

    beforeEach(() => {
        Log.logger = console;
        Log.level = Log.NONE;

        userStoreMock = mocked(new WebStorageStateStore());

        settings = {
            authority: "http://sts/oidc",
            client_id: "client",
            redirect_uri: "redirect",
            monitorSession : false,
            userStore: userStoreMock,
        };
        subject = new UserManager(settings);
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

    describe("userLoaded", () => {

        it("should be able to call getUser without recursion", () => {
            // arrange
            const user = new User({
                access_token: "access_token",
                token_type: "token_type",
                profile: {}
            });
            userStoreMock.item = user.toStorageString();

            // lamda function is never called but complier thinks it returns Promise
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            subject.events.addUserLoaded(async (user) => {
                Log.debug("event.load", user);
                await subject.getUser();
            });

            // act
            subject.events.load({} as User);
        });
    });

    describe("signinSilent", () =>{

        it("should pass silentRequestTimeout from settings", async () => {
            // arrange
            const user = new User({
                access_token: "access_token",
                token_type: "token_type",
                profile: {}
            });
            userStoreMock.item = user.toStorageString();

            settings = {
                ...settings,
                silentRequestTimeoutInSeconds: 123,
                silent_redirect_uri: "http://client/silent_callback"
            };
            subject = new UserManager(settings);

            let navInstance: any = null;

            subject["_signin"] = async function (args: any, handle: IWindow) {
                Log.debug("_signin", args, handle);
                navInstance = handle;
                return user;
            };

            // act
            await subject.signinSilent();

            // assert
            expect(navInstance._timeoutInSeconds).toEqual(123);
        });

        it("should pass silentRequestTimeout from params", async () => {
            // arrange
            const user = new User({
                access_token: "access_token",
                token_type: "token_type",
                profile: {}
            });
            userStoreMock.item = user.toStorageString();

            settings = {
                ...settings,
                silent_redirect_uri: "http://client/silent_callback"
            };
            subject = new UserManager(settings);

            let navInstance: any = null;
            subject["_signin"] = async function (args: any, handle: IWindow) {
                Log.debug("_signin", args, handle);
                navInstance = handle;
                return user;
            };

            // act
            await subject.signinSilent({ silentRequestTimeoutInSeconds: 234 });

            // assert
            expect(navInstance._timeoutInSeconds).toEqual(234);
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

            subject["_signin"] = async function (args: any, handle: IWindow) {
                Log.debug("_signin", args, handle);
                return user;
            };

            // act
            await subject.signinSilent();
        });
    });
});
