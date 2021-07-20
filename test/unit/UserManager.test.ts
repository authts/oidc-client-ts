// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from '../../src/Log';
import { UserManager } from '../../src/UserManager';
import { UserManagerSettings, UserManagerSettingsStore } from '../../src/UserManagerSettings';
import { User } from '../../src/User';
import { WebStorageStateStore } from '../../src/WebStorageStateStore';
import { mocked } from 'ts-jest/utils';

// workaround jest parse error
jest.mock('../../jsrsasign/dist/jsrsasign.js', () => {
    return {
        jws: jest.fn(),
        KEYUTIL: jest.fn(),
        X509: jest.fn(),
        crypto: jest.fn(),
        hextob64u: jest.fn(),
        b64tohex: jest.fn()
    };
});

describe("UserManager", () => {
    let settings: UserManagerSettings;
    let userStoreMock: any;
    let subject: UserManager;

    beforeEach(() => {
        Log.logger = console;
        Log.level = Log.NONE;

        userStoreMock = mocked(new WebStorageStateStore())

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

        it("should be able to call getUser without recursion", async () => {
            // arrange
            const user = new User({ id_token: "id_token" });
            userStoreMock.item = user.toStorageString();

            subject.events.addUserLoaded(async (_user) => {
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

            // @ts-ignore
            subject._signin = function(args: any, nav: any, arg_navArgs: any) {
                Log.debug("_signin", args, nav, navArgs);

                navArgs = arg_navArgs;
                return Promise.resolve()
            }

            // act
            await subject.signinSilent();

            // assert
            expect(navArgs.silentRequestTimeout).toEqual(123);
        });

        it("should pass silentRequestTimeout from params", async () =>{
            // arrange
            const user = new User({id_token:"id_token"});
            userStoreMock.item = user.toStorageString();

            settings = {
                ...settings,
                silent_redirect_uri: "http://client/silent_callback"
            };
            subject = new UserManager(settings);

            let navArgs: any = null;

            // @ts-ignore
            subject._signin = function(args: any, nav: any, arg_navArgs: any) {
                navArgs = arg_navArgs;
                return Promise.resolve()
            }

            // act
            await subject.signinSilent({ silentRequestTimeout: 234 });

            // assert
            expect(navArgs.silentRequestTimeout).toEqual(234);
        });

        it("should pass prompt from params", async () =>{
            // arrange
            const user = new User({id_token:"id_token"})
            userStoreMock.item = user.toStorageString();

            settings = {
                ...settings,
                silent_redirect_uri: "http://client/silent_callback"
            };
            subject = new UserManager(settings);

            let args: any = null;

            // @ts-ignore
            subject._signin = function(arg_args: any, nav: any, navArgs: any) {
                args = arg_args;
                return Promise.resolve()
            }

            // act
            await subject.signinSilent({ prompt:"foo" });

            // assert
            expect(args.prompt).toEqual("foo");
        });

        it("should work when having no User present", async () => {
            // arrange
            settings = {
                ...settings,
                silent_redirect_uri: "http://client/silent_callback"
            };
            subject = new UserManager(settings);

            // @ts-ignore
            subject._signin = function(args: any, nav: any, arg_navArgs: any) {
                return Promise.resolve()
            }

            // act
            await subject.signinSilent({ prompt:"foo" });
        });
    });
});
