import { DPoPService } from "./DPoPService";
import { jwtVerify, decodeProtectedHeader, importJWK, type JWK } from "jose";
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
});
