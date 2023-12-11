import { DPoPService } from "./DPoPService";
import { jwtVerify, decodeProtectedHeader, importJWK, type JWK } from "jose";
import { del } from "idb-keyval";

describe("DPoPService", () => {
    let subject: DPoPService;

    beforeEach(async () => {
        subject = new DPoPService();
        await del("oidc.dpop");
    });

    describe("generateDPoPProof", () => {
        it("should generate a valid proof without an access token", async () => {
            const proof = await subject.generateDPoPProof("http://example.com");
            const protectedHeader = decodeProtectedHeader(proof);
            const publicKey = await importJWK(<JWK>protectedHeader.jwk);
            const verifiedResult = await jwtVerify(proof, publicKey);

            expect(verifiedResult.payload).toHaveProperty("htu");
            expect(verifiedResult.payload).toHaveProperty("htm");
        });

        it("should generate a valid proof with an access token", async () => {
            await subject.generateDPoPProof("http://example.com");
            const proof = await subject.generateDPoPProof("http://example.com", "some_access_token");

            const protectedHeader = decodeProtectedHeader(proof);
            const publicKey = await importJWK(<JWK>protectedHeader.jwk);
            const verifiedResult = await jwtVerify(proof, publicKey);

            expect(verifiedResult.payload).toHaveProperty("htu");
            expect(verifiedResult.payload).toHaveProperty("htm");
            expect(verifiedResult.payload).toHaveProperty("ath");
            expect(verifiedResult.payload["htu"]).toEqual("http://example.com");
        });

        it("should throw an exception if an access token is provided but no keys are found in the store", async () => {
            await expect(subject.generateDPoPProof("http://example.com", "some_access_token"))
                .rejects.toThrowError("Could not retrieve dpop keys from storage");
        });
    });
});
