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

    describe("extraTokenResponseProperties", () => {
        it("should not provide extraTokenResponseProperties if extraTokenResponseKeys is not provided", () => {
            // arrange
            const args = {
                access_token: "notAToken",
                id_token: "not",
                patient: "12345", // extra
                token_type: "Bearer",
                extra1: 0, // extra
                extra2: null,
                extra3: true,
            };

            // act
            const subject = new User(args as never);

            // assert
            expect(subject.extraTokenResponseProperties).not.toBeDefined();
        });

        it("should provide extraTokenResponseProperties if extraTokenResponseKeys is provided", () => {
            // arrange
            const args = {
                access_token: "access_token",
                id_token: "id_token",
                patient: "12345", // extra
                token_type: "Bearer",
                extra1: 0, // extra
                extra2: null,
                extra3: true, // extra but not specified
            };

            // act
            const subject = new User(args as never, [
                "patient",
                "extra1",
                "extra2",
            ]);

            // assert
            expect(subject.extraTokenResponseProperties).toBeDefined();
            const actualTokenProps = subject.extraTokenResponseProperties ?? {};
            const patient = actualTokenProps["patient"];
            expect(patient).toBeDefined();
            expect(patient).toEqual(args.patient);
            const extra1 = actualTokenProps["extra1"];
            expect(extra1).toBeDefined();
            expect(extra1).toEqual(args.extra1);
            const extra2 = actualTokenProps["extra2"];
            expect(extra2).toBeDefined();
            expect(extra2).toEqual(args.extra2);
            const extra3 = actualTokenProps["extra3"];
            expect(extra3).not.toBeDefined();
        });
    });
});
