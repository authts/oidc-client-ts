// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { UserManagerEvents } from '../../src/UserManagerEvents';
import { UserManagerSettingsStore } from '../../src/UserManagerSettings';

describe("UserManagerEvents", () => {

    let subject: UserManagerEvents;

    beforeEach(() => {
        let settings = new UserManagerSettingsStore({});
        subject = new UserManagerEvents(settings);
    });

    describe("silent renew error", () => {

        it("should allow callback", () => {
            // arrange
            var cb = jest.fn();

            // act
            subject.addSilentRenewError(cb);
            subject._raiseSilentRenewError(new Error("boom"));

            // assert
            expect(cb).toBeCalled();
        });

        it("should allow unregistering callback", () => {
            // arrange
            var cb = jest.fn();

            // act
            subject.addSilentRenewError(cb);
            subject.removeSilentRenewError(cb);
            subject._raiseSilentRenewError(new Error("boom"));

            // assert
            expect(cb).toBeCalledTimes(0);
        });

        it("should pass error to callback", () => {
            // arrange
            let e: Error | null = null;
            var cb = function (arg_e: Error) {
                e = arg_e;
            };
            const expected = new Error("boom");

            // act
            subject.addSilentRenewError(cb);
            subject._raiseSilentRenewError(expected);

            // assert
            expect(e).toEqual(expected);
        });
    });
});
