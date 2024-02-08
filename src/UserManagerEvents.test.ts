// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

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

    describe("silent renew error", () => {

        it("should allow callback", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addSilentRenewError(cb);
            await subject._raiseSilentRenewError(new Error("boom"));

            // assert
            expect(cb).toHaveBeenCalled();
        });

        it("should allow unregistering callback", async () => {
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
});
