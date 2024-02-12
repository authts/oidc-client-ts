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

    describe("customCalculateJwkThumbprint", () => {
        it("should return a valid rfc7638 jwk thumbprint", async () => {
            const jwk = {
                "kty": "EC",
                "x": "zSau12OpG01OkWtiU8yG1ppv06v1uDrG66cNeqMWk_8",
                "y": "Mjr6rkLy4chKd7f8m0ctUFEA2DtZuk_F09FU3h98xyo",
                "crv": "P-256",
            } as JsonWebKey;
            const jwkThumbprint = await CryptoUtils.customCalculateJwkThumbprint(jwk);
            expect(jwkThumbprint).toEqual("fvRy8PxXeUhrCgW4r0hAFroUAqSnmyiCncJmlCamt9g");
        });
    });
});
