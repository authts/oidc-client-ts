import { CryptoUtils } from "./CryptoUtils";
import { jwtVerify, decodeProtectedHeader, importJWK, type JWK } from "jose";

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

    describe("generateDPoPProof", () => {
        it("should generate a valid proof without an access token", async () => {
            // arrange
            const url = "https://localhost:5005/identity";
            const httpMethod = "GET";
            const keyPair = await CryptoUtils.generateDPoPKeys();

            // act
            const dpopProof = await CryptoUtils.generateDPoPProof({ url, httpMethod, keyPair });
            const protectedHeader = decodeProtectedHeader(dpopProof);
            const publicKey = await importJWK(<JWK>protectedHeader.jwk);
            const verifiedResult = await jwtVerify(dpopProof, publicKey);

            // assert
            expect(verifiedResult.payload).toHaveProperty("htu");
            expect(verifiedResult.payload).toHaveProperty("htm");
        });

        it("should generate a valid proof with an access token", async () => {
            // arrange
            const url = "https://localhost:5005/identity";
            const httpMethod = "GET";
            const accessToken = "access_token";
            const keyPair = await CryptoUtils.generateDPoPKeys();

            // act
            const dpopProof = await CryptoUtils.generateDPoPProof({ url, accessToken, httpMethod, keyPair });
            const protectedHeader = decodeProtectedHeader(dpopProof);
            const publicKey = await importJWK(<JWK>protectedHeader.jwk);
            const verifiedResult = await jwtVerify(dpopProof, publicKey);

            // assert
            expect(verifiedResult.payload).toHaveProperty("htu");
            expect(verifiedResult.payload).toHaveProperty("htm");
            expect(verifiedResult.payload).toHaveProperty("ath");
        });

        it("should throw an exception if there is an error generating the signed JWT", async () => {
            const keyPair = await CryptoUtils.generateDPoPKeys();
            const exportKeyMock = jest.spyOn(crypto.subtle, "exportKey").mockResolvedValue({} as JsonWebKey);
            const generateSignedJwtMock = jest.spyOn(crypto.subtle, "sign").mockRejectedValue(new Error("Generate signed JWT error"));
            await expect(CryptoUtils.generateDPoPProof({
                url: "http://example.com", keyPair: keyPair })).rejects.toThrow("Generate signed JWT error");
            exportKeyMock.mockRestore();
            generateSignedJwtMock.mockRestore();
        });

        it("should generate a valid proof with a nonce", async () => {
            // arrange
            const url = "https://localhost:5005/identity";
            const httpMethod = "GET";
            const accessToken = "access_token";
            const keyPair = await CryptoUtils.generateDPoPKeys();
            const nonce = "some-nonce";

            // act
            const dpopProof = await CryptoUtils.generateDPoPProof({ url, accessToken, httpMethod, keyPair, nonce });
            const protectedHeader = decodeProtectedHeader(dpopProof);
            const publicKey = await importJWK(<JWK>protectedHeader.jwk);
            const verifiedResult = await jwtVerify(dpopProof, publicKey);

            // assert
            expect(verifiedResult.payload).toHaveProperty("htu");
            expect(verifiedResult.payload).toHaveProperty("htm");
            expect(verifiedResult.payload).toHaveProperty("ath");
            expect(verifiedResult.payload).toHaveProperty("nonce");
            expect(verifiedResult.payload.nonce).toEqual(nonce);
        });
    });
});
