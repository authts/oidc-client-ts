import { describe, beforeEach, vi, afterEach, it, expect } from "vitest";
import { User } from "./User";
import { Timer } from "./utils";

describe("User", () => {

    let now: number;

    beforeEach(() => {
        now = 0;
        vi.spyOn(Timer, "getEpochTime").mockImplementation(() => now);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("expired", () => {
        it("should calculate how much time left", () => {
            const subject = new User({ expires_at: 100 } as never);
            expect(subject.expired).toEqual(false);

            // act
            now += 100;

            // assert
            expect(subject.expired).toEqual(true);
        });
    });

    describe("scopes", () => {
        it("should return list of scopes", () => {
            let subject = new User({ scope: "foo" } as never);

            // assert
            expect(subject.scopes).toEqual(["foo"]);

            subject = new User({ scope: "foo bar" } as never);

            // assert
            expect(subject.scopes).toEqual(["foo", "bar"]);

            subject = new User({ scope: "foo bar baz" } as never);

            // assert
            expect(subject.scopes).toEqual(["foo", "bar", "baz"]);
        });
    });
});
