// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { AccessTokenEvents } from '../../src/AccessTokenEvents';
import { Timer } from '../../src/Timer';
import { User } from '../../src/User';

describe("AccessTokenEvents", () => {

    let subject: AccessTokenEvents;
    let accessTokenExpiringTimer: StubTimer;
    let accessTokenExpiredTimer: StubTimer;

    beforeEach(() => {
        accessTokenExpiringTimer = new StubTimer("stub expiring timer");
        accessTokenExpiredTimer = new StubTimer("stub expired timer");
        subject = new AccessTokenEvents({
            accessTokenExpiringTimer, accessTokenExpiredTimer
        });
    });

    describe("constructor", () => {

        it("should use default expiringNotificationTime", () => {
            // @ts-ignore
            expect(subject._accessTokenExpiringNotificationTime).toEqual(60);
        });

    });

    describe("load", () => {

        it("should cancel existing timers", () => {
            // act
            subject.load({} as User);

            // assert
            expect(accessTokenExpiringTimer.cancelWasCalled).toEqual(true);
            expect(accessTokenExpiredTimer.cancelWasCalled).toEqual(true);
        });

        it("should initialize timers", () => {
            // act
            subject.load({
                access_token:"token",
                expires_in : 70
            } as User);

            // assert
            expect(accessTokenExpiringTimer.duration).toEqual(10);
            expect(accessTokenExpiredTimer.duration).toEqual(71);
        });

        it("should immediately schedule expiring timer if expiration is soon", () => {
            // act
            subject.load({
                access_token:"token",
                expires_in : 10
            } as User);

            // assert
            expect(accessTokenExpiringTimer.duration).toEqual(1);
        });

        it("should not initialize expiring timer if already expired", () => {
            // act
            subject.load({
                access_token:"token",
                expires_in : 0
            } as User);

            // assert
            expect(accessTokenExpiringTimer.duration).toEqual(undefined);
        });

        it("should initialize expired timer if already expired", () => {
            // act
            subject.load({
                access_token:"token",
                expires_in : 0
            } as User);

            // assert
            expect(accessTokenExpiredTimer.duration).toEqual(1);
        });

        it("should not initialize timers if no access token", () => {
            // act
            subject.load({
                expires_in : 70
            } as User);

            // assert
            expect(accessTokenExpiringTimer.duration).toEqual(undefined);
            expect(accessTokenExpiredTimer.duration).toEqual(undefined);
        });

        it("should not initialize timers if no expiration on access token", () => {
            // act
            subject.load({
                access_token:"token"
            } as User);

            // assert
            expect(accessTokenExpiringTimer.duration).toEqual(undefined);
            expect(accessTokenExpiredTimer.duration).toEqual(undefined);
        });
    });

    describe("unload", () => {

        it("should cancel timers", () => {
            // act
            subject.unload();

            // assert
            expect(accessTokenExpiringTimer.cancelWasCalled).toEqual(true);
            expect(accessTokenExpiredTimer.cancelWasCalled).toEqual(true);
        });
    });
});

class StubTimer extends Timer {
    cancelWasCalled: boolean;
    duration: any;

    constructor(name: string) {
        super(name)
        this.cancelWasCalled = false;
    }

    init(duration: number) {
        this.duration = duration;
    }

    cancel() {
        this.cancelWasCalled = true;
    }

    addHandler() {}
    removeHandler() {}
}
