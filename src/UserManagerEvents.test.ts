// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import type { User } from "./User";
import { UserManagerEvents } from "./UserManagerEvents";
import { UserManagerSettingsStore } from "./UserManagerSettings";

describe("UserManagerEvents", () => {

    let subject: UserManagerEvents;

    beforeEach(() => {
        const settings = new UserManagerSettingsStore({
            authority: "authority",
            client_id: "client",
            redirect_uri: "redirect",
        });
        subject = new UserManagerEvents(settings);
    });

    describe("user loaded", () => {
        it("should allow add callback", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addUserLoaded(cb);
            await subject.load({} as User);

            // assert
            expect(cb).toHaveBeenCalled();
        });

        it("should allow remove callback", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addUserLoaded(cb);
            subject.removeUserLoaded(cb);
            await subject.load({} as User);

            // assert
            expect(cb).toHaveBeenCalledTimes(0);
        });

        it("should pass user to callback", async () => {
            // arrange
            let u: User | null = null;
            const cb = function (arg_user: User) {
                u = arg_user;
            };
            const expected = { access_token: "token" } as User;

            // act
            subject.addUserLoaded(cb);
            await subject.load(expected);

            // assert
            expect(u).toEqual(expected);
        });
    });

    describe("user unloaded", () => {
        it("should allow add callback", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addUserUnloaded(cb);
            await subject.unload();

            // assert
            expect(cb).toHaveBeenCalled();
        });

        it("should allow remove callback", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addUserUnloaded(cb);
            subject.removeUserUnloaded(cb);
            await subject.unload();

            // assert
            expect(cb).toHaveBeenCalledTimes(0);
        });
    });

    describe("silent renew error", () => {
        it("should allow add callback", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addSilentRenewError(cb);
            await subject._raiseSilentRenewError(new Error("boom"));

            // assert
            expect(cb).toHaveBeenCalled();
        });

        it("should allow remove callback", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addSilentRenewError(cb);
            subject.removeSilentRenewError(cb);
            await subject._raiseSilentRenewError(new Error("boom"));

            // assert
            expect(cb).toHaveBeenCalledTimes(0);
        });

        it("should pass error to callback", async () => {
            // arrange
            let e: Error | null = null;
            const cb = function (arg_e: Error) {
                e = arg_e;
            };
            const expected = new Error("boom");

            // act
            subject.addSilentRenewError(cb);
            await subject._raiseSilentRenewError(expected);

            // assert
            expect(e).toEqual(expected);
        });
    });

    describe("user signed in", () => {
        it("should allow add callback", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addUserSignedIn(cb);
            await subject._raiseUserSignedIn();

            // assert
            expect(cb).toHaveBeenCalled();
        });

        it("should allow remove callback", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addUserSignedIn(cb);
            subject.removeUserSignedIn(cb);
            await subject._raiseUserSignedIn();

            // assert
            expect(cb).toHaveBeenCalledTimes(0);
        });
    });

    describe("user signed out", () => {
        it("should allow add callback", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addUserSignedOut(cb);
            await subject._raiseUserSignedOut();

            // assert
            expect(cb).toHaveBeenCalled();
        });

        it("should allow remove callback", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addUserSignedOut(cb);
            subject.removeUserSignedOut(cb);
            await subject._raiseUserSignedOut();

            // assert
            expect(cb).toHaveBeenCalledTimes(0);
        });
    });

    describe("user session changed", () => {
        it("should allow add callback", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addUserSessionChanged(cb);
            await subject._raiseUserSessionChanged();

            // assert
            expect(cb).toHaveBeenCalled();
        });

        it("should allow remove callback", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addUserSessionChanged(cb);
            subject.removeUserSessionChanged(cb);
            await subject._raiseUserSessionChanged();

            // assert
            expect(cb).toHaveBeenCalledTimes(0);
        });
    });
});
