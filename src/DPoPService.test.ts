import { DPoPService } from "./DPoPService";
import { jwtVerify, decodeProtectedHeader, importJWK, type JWK } from "jose";
import { IndexedDbCryptoKeyPairStore as idb } from "./IndexedDbCryptoKeyPairStore";

describe("DPoPService", () => {

    beforeEach(async () => {
        await idb.remove("oidc.dpop");
    });

    describe("generateDPoPProof", () => {
        it("should generate a valid proof without an access token", async () => {
            const proof = await DPoPService.generateDPoPProof({ url: "http://example.com" });
            const protectedHeader = decodeProtectedHeader(proof);
            const publicKey = await importJWK(<JWK>protectedHeader.jwk);
            const verifiedResult = await jwtVerify(proof, publicKey);

            expect(verifiedResult.payload).toHaveProperty("htu");
            expect(verifiedResult.payload).toHaveProperty("htm");
        });

        it("should generate a valid proof with an access token", async () => {
            await DPoPService.generateDPoPProof({ url: "http://example.com" });
            const proof = await DPoPService.generateDPoPProof({ url: "http://example.com", accessToken: "some_access_token" });

            const protectedHeader = decodeProtectedHeader(proof);
            const publicKey = await importJWK(<JWK>protectedHeader.jwk);
            const verifiedResult = await jwtVerify(proof, publicKey);

            expect(verifiedResult.payload).toHaveProperty("htu");
            expect(verifiedResult.payload).toHaveProperty("htm");
            expect(verifiedResult.payload).toHaveProperty("ath");
            expect(verifiedResult.payload["htu"]).toEqual("http://example.com");
        });
    });

    describe("dpopJkt", () => {
        it("should generate crypto keys when generating a dpop thumbprint if no keys exists in the store", async () => {
            const setMock = jest.spyOn(idb, "set");
            await DPoPService.generateDPoPJkt();
            expect(setMock).toHaveBeenCalled();
        });
    });
});
