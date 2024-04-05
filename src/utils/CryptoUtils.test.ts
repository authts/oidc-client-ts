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
        it("should return a valid rfc7638 jwk thumbprint for EC", async () => {
            const jwk = {
                "kty": "EC",
                "x": "zSau12OpG01OkWtiU8yG1ppv06v1uDrG66cNeqMWk_8",
                "y": "Mjr6rkLy4chKd7f8m0ctUFEA2DtZuk_F09FU3h98xyo",
                "crv": "P-256",
            } as JsonWebKey;
            const jwkThumbprint = await CryptoUtils.customCalculateJwkThumbprint(jwk);
            expect(jwkThumbprint).toEqual("fvRy8PxXeUhrCgW4r0hAFroUAqSnmyiCncJmlCamt9g");
        });

        it("should return a valid rfc7638 jwk thumbprint for RSA", async () => {
            const jwk = {
                "kty": "RSA",
                "e": "AQAB",
                "n": "qPfgaTEWEP3S9w0tgsicURfo-nLW09_0KfOPinhYZ4ouzU-3xC4pSlEp8Ut9FgL0AgqNslNaK34Kq-NZjO9DAQ==",
            } as JsonWebKey;
            const jwkThumbprint = await CryptoUtils.customCalculateJwkThumbprint(jwk);
            expect(jwkThumbprint).toEqual("PY09-sc60ozeKeWZNizkBrT_081gcm9YHwIRyZ__3_0");
        });

        it("should return a valid rfc7638 jwk thumbprint for OKP", async () => {
            const jwk = {
                "kty": "OKP",
                "x": "zSau12OpG01OkWtiU8yG1ppv06v1uDrG66cNeqMWk_8",
                "crv": "P-256",
            } as JsonWebKey;
            const jwkThumbprint = await CryptoUtils.customCalculateJwkThumbprint(jwk);
            expect(jwkThumbprint).toEqual("2UtIWugaDqeNZtm87tNRSAnJ6XiFqhRLf_BRFNFs9T8");
        });

        it("should return a valid rfc7638 jwk thumbprint for oct", async () => {
            const jwk = {
                "kty": "OKP",
                "crv": "P-256",
            } as JsonWebKey;
            const jwkThumbprint = await CryptoUtils.customCalculateJwkThumbprint(jwk);
            expect(jwkThumbprint).toEqual("b0HfX8_AYRZlfiRj51oOHHL9BrTz0Q4z6AqSk-2nyJM");
        });

        it("should throw an error for an unknown jwk type", async () => {
            const jwk = {
                "kty": "unknown",
            } as JsonWebKey;
            await expect(CryptoUtils.customCalculateJwkThumbprint(jwk)).rejects.toThrow("Unknown jwk type");
        });
    });
});
