// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "../../src/utils";
import { UserManager } from "../../src/UserManager";
import { UserManagerSettings, UserManagerSettingsStore } from "../../src/UserManagerSettings";
import { User } from "../../src/User";
import { WebStorageStateStore } from "../../src/WebStorageStateStore";

import { mocked } from "ts-jest/utils";
import { INavigator } from "../../src/navigators";

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
            const user = new User({ id_token: "id_token" });
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
            const user = new User({id_token:"id_token"});
            userStoreMock.item = user.toStorageString();

            settings = {
                ...settings,
                silentRequestTimeout: 123,
                silent_redirect_uri: "http://client/silent_callback"
            };
            subject = new UserManager(settings);

            let navArgs: any = null;

            subject["_signin"] = function(args: any, navigator: INavigator, navigatorParams: any = {}) {
                Log.debug("_signin", args, navigator, navigatorParams);
                navArgs = navigatorParams;
                return Promise.resolve(user);
            };

            // act
            await subject.signinSilent();

            // assert
            expect(navArgs.silentRequestTimeout).toEqual(123);
        });

        it("should work when having no User present", async () => {
            // arrange
            settings = {
                ...settings,
                silent_redirect_uri: "http://client/silent_callback"
            };
            subject = new UserManager(settings);

            subject["_signin"] = function(args: any, navigator: INavigator, navigatorParams: any = {}) {
                Log.debug("_signin", args, navigator, navigatorParams);
                return Promise.resolve(new User({}));
            };

            // act
            await subject.signinSilent();
        });
    });
});
