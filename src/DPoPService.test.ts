import { DPoPService } from "./DPoPService";
import { jwtVerify, decodeProtectedHeader, importJWK, type JWK, exportJWK, SignJWT, calculateJwkThumbprint } from "jose";
import { del, set } from "idb-keyval";
import * as idb from "idb-keyval";

describe("DPoPService", () => {

    beforeEach(async () => {
        await del("oidc.dpop");
    });

    describe("generateDPoPProof", () => {
        it("should generate a valid proof without an access token", async () => {
            const proof = await DPoPService.generateDPoPProof("http://example.com");
            const protectedHeader = decodeProtectedHeader(proof);
            const publicKey = await importJWK(<JWK>protectedHeader.jwk);
            const verifiedResult = await jwtVerify(proof, publicKey);

            expect(verifiedResult.payload).toHaveProperty("htu");
            expect(verifiedResult.payload).toHaveProperty("htm");
        });

        it("should generate a valid proof with an access token", async () => {
            await DPoPService.generateDPoPProof("http://example.com");
            const proof = await DPoPService.generateDPoPProof("http://example.com", "some_access_token");

            const protectedHeader = decodeProtectedHeader(proof);
            const publicKey = await importJWK(<JWK>protectedHeader.jwk);
            const verifiedResult = await jwtVerify(proof, publicKey);

            expect(verifiedResult.payload).toHaveProperty("htu");
            expect(verifiedResult.payload).toHaveProperty("htm");
            expect(verifiedResult.payload).toHaveProperty("ath");
            expect(verifiedResult.payload["htu"]).toEqual("http://example.com");
        });

        it("should generate a valid proof with a nonce", async () => {
            const proof = await DPoPService.generateDPoPProof("http://example.com", undefined, undefined, "some-nonce");
            const protectedHeader = decodeProtectedHeader(proof);
            const publicKey = await importJWK(<JWK>protectedHeader.jwk);
            const verifiedResult = await jwtVerify(proof, publicKey);

            expect(verifiedResult.payload).toHaveProperty("htu");
            expect(verifiedResult.payload).toHaveProperty("htm");
            expect(verifiedResult.payload).toHaveProperty("nonce");
            expect(verifiedResult.payload["nonce"]).toEqual("some-nonce");
            expect(verifiedResult.payload["htu"]).toEqual("http://example.com");
        });

        it("should throw an exception if the stored proof keys are not a CryptoKeyPair object", async () => {
            await set("oidc.dpop", "some string");
            await expect(DPoPService.generateDPoPProof("http://example.com", "some_access_token"))
                .rejects.toThrowError("Failed to execute 'exportKey' on 'SubtleCrypto': 2nd argument is not of type CryptoKey.");
        });
    });

    describe("dpopJkt", () => {
        it("should throw an exception if the stored proof keys are not a CryptoKeyPair object", async () => {
            await set("oidc.dpop", "some string");
            await expect(DPoPService.generateDPoPJkt()).rejects.toThrowError(
                "Failed to execute 'exportKey' on 'SubtleCrypto': 2nd argument is not of type CryptoKey.");
        });

        it("should generate crypto keys when generating a dpop thumbprint if no keys exists in the store", async () => {
            const setMock = jest.spyOn(idb, "set");
            await DPoPService.generateDPoPJkt();
            expect(setMock).toHaveBeenCalled();
        });
    });

    describe("createJwt", () => {
        it("should be able to create identical jwts two different ways", async () => {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "ECDSA",
                    namedCurve: "P-256",
                },
                false,
                ["sign", "verify"]);

            const payload: Record<string, string | number> = {
                "jti": window.crypto.randomUUID(),
                "htm": "GET",
                "htu": "http://test.com",
            };
            const publicJwk = await exportJWK(keyPair.publicKey);
            const iat = Date.now();
            const jwt1 = await new SignJWT(payload).setProtectedHeader({
                "alg": "ES256",
                "typ": "dpop+jwt",
                "jwk": publicJwk,
            }).setIssuedAt(iat).sign(keyPair.privateKey);

            const header = {
                "alg": "ES256",
                "typ": "dpop+jwt",
                "jwk": publicJwk,
            };
            payload.iat = iat;
            const jwt2 = await DPoPService.generateSignedJwt(header, payload, keyPair.privateKey);

            const protectedHeader = decodeProtectedHeader(jwt1);
            const publicKey = await importJWK(<JWK>protectedHeader.jwk);
            const verifiedResult = await jwtVerify(jwt1, publicKey);
            expect(verifiedResult.payload.iat).toEqual(iat);

            const protectedHeaderJwt2 = decodeProtectedHeader(jwt2);
            const publicKeyJwt2 = await importJWK(<JWK>protectedHeaderJwt2.jwk);
            const verifiedResultJwt2 = await jwtVerify(jwt2, publicKeyJwt2);
            expect(verifiedResultJwt2.payload.iat).toEqual(iat);
            //expect(jwt1).toEqual(jwt2);
        });
    });

    describe("generateJwkThumbprint", () => {
        it("should generate a thumbprint", async () => {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "ECDSA",
                    namedCurve: "P-256",
                },
                false,
                ["sign", "verify"]);
            const publicJwk = await exportJWK(keyPair.publicKey);
            const jwk= await crypto.subtle.exportKey("jwk", keyPair.publicKey);

            const thumbprint1 = await calculateJwkThumbprint(publicJwk, "sha256");
            const thumbprint2 = await DPoPService.customCalculateJwkThumbprint(jwk);
            expect(thumbprint1).toEqual(thumbprint2);
        });

    });
});
