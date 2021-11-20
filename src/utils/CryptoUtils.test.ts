import { CryptoUtils } from "./CryptoUtils";

const pattern = /^[0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}$/;

describe("CryptoUtils", () => {
    describe("generateUUIDv4", () => {
        it("should return a valid RFC4122 v4 guid (sans dashes)", () => {
            // act
            const rnd = CryptoUtils.generateUUIDv4();

            // assert
            expect(rnd).toMatch(pattern);
        });
    });
});
