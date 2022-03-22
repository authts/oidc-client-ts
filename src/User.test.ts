import { User } from "./User";
import { ClockService } from "./ClockService";

describe("User", () => {
    let now: number;
    let clockService: ClockService;

    beforeEach(() => {
        now = 0;
        clockService = new ClockService();
        jest.spyOn(clockService, "getEpochTime").mockImplementation(() => now);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("expired", () => {
        it("should calculate how much time left", () => {
            const subject = new User({ expires_at: 100 } as never, clockService);
            expect(subject.expired).toEqual(false);

            // act
            now += 100;

            // assert
            expect(subject.expired).toEqual(true);
        });
    });

    describe("scopes", () => {
        it("should return list of scopes", () => {
            let subject = new User({ scope: "foo" } as never, clockService);

            // assert
            expect(subject.scopes).toEqual(["foo"]);

            subject = new User({ scope: "foo bar" } as never, clockService);

            // assert
            expect(subject.scopes).toEqual(["foo", "bar"]);

            subject = new User({ scope: "foo bar baz" } as never, clockService);

            // assert
            expect(subject.scopes).toEqual(["foo", "bar", "baz"]);
        });
    });
});
