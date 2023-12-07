import { DPoPService } from "./DPoPService";
import { jwtVerify, decodeProtectedHeader, importJWK, type JWK } from "jose";

describe("DPoPService", () => {
    let subject: DPoPService;

    beforeEach(() => {
        subject = new DPoPService();
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
    });
});
