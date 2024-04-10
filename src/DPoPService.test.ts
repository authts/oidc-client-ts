import { DPoPService } from "./DPoPService";
import { jwtVerify, decodeProtectedHeader, importJWK, type JWK } from "jose";
import { IndexedDbCryptoKeyPairStore as idb } from "./IndexedDbCryptoKeyPairStore";

describe("DPoPService", () => {
    let subject: DPoPService;

    beforeEach(async () => {
        await idb.remove("oidc.dpop");
        subject = new DPoPService();
    });

    describe("generateDPoPProof", () => {
        it("should generate a valid proof without an access token", async () => {
            const proof = await subject.generateDPoPProof({ url: "http://example.com" });
            const protectedHeader = decodeProtectedHeader(proof);
            const publicKey = await importJWK(<JWK>protectedHeader.jwk);
            const verifiedResult = await jwtVerify(proof, publicKey);

            expect(verifiedResult.payload).toHaveProperty("htu");
            expect(verifiedResult.payload).toHaveProperty("htm");
        });

        it("should generate a valid proof with an access token", async () => {
            await subject.generateDPoPProof({ url: "http://example.com" });
            const proof = await subject.generateDPoPProof({ url: "http://example.com", accessToken: "some_access_token" });

            const protectedHeader = decodeProtectedHeader(proof);
            const publicKey = await importJWK(<JWK>protectedHeader.jwk);
            const verifiedResult = await jwtVerify(proof, publicKey);

            expect(verifiedResult.payload).toHaveProperty("htu");
            expect(verifiedResult.payload).toHaveProperty("htm");
            expect(verifiedResult.payload).toHaveProperty("ath");
            expect(verifiedResult.payload["htu"]).toEqual("http://example.com");
        });

        it("should throw an exception if there is an error exporting the public key", async () => {
            const exportKeyMock = jest.spyOn(crypto.subtle, "exportKey").mockRejectedValue(new TypeError("Export key error"));
            await expect(subject.generateDPoPProof({ url: "http://example.com" })).rejects.toThrow("Error exporting dpop public key: Export key error");
            exportKeyMock.mockRestore();
        });

        it("should throw an exception if there is an error generating the signed JWT", async () => {
            const exportKeyMock = jest.spyOn(crypto.subtle, "exportKey").mockResolvedValue({} as JsonWebKey);
            const generateSignedJwtMock = jest.spyOn(crypto.subtle, "sign").mockRejectedValue(new Error("Generate signed JWT error"));
            await expect(subject.generateDPoPProof({ url: "http://example.com" })).rejects.toThrow("Generate signed JWT error");
            exportKeyMock.mockRestore();
            generateSignedJwtMock.mockRestore();
        });
    });

    describe("dpopJkt", () => {
        it("should generate crypto keys when generating a dpop thumbprint if no keys exists in the store", async () => {
            const setMock = jest.spyOn(idb, "set");
            await subject.generateDPoPJkt();
            expect(setMock).toHaveBeenCalled();
        });

        it("should throw a TypeError exception if the keys cannot be retrieved from the store", async () => {
            const getMock = jest.spyOn(idb, "get").mockRejectedValue(new TypeError("Export key error"));
            await subject.generateDPoPProof({ url: "http://example.com" });
            await expect(subject.generateDPoPJkt()).rejects.toThrow("Could not retrieve dpop keys from storage: Export key error");
            getMock.mockRestore();
        });

        it("should throw an exception for any other reason", async () => {
            const exportKeyMock = jest.spyOn(crypto.subtle, "exportKey").mockRejectedValue(new Error("Export key error"));
            await expect(subject.generateDPoPJkt()).rejects.toThrow("Export key error");
            exportKeyMock.mockRestore();
        });
    });

    describe("loadKeyPair", () => {
        it("should throw an exception if the keys cannot be retrieved from the store", async () => {
            const getMock = jest.spyOn(idb, "get").mockRejectedValue(new TypeError("Export key error"));
            await subject.generateDPoPProof({ url: "http://example.com" });
            await expect(subject["loadKeyPair"]()).rejects.toThrow("Could not retrieve dpop keys from storage: Export key error");
            getMock.mockRestore();
        });

        it("should throw an exception for any other reason", async () => {
            const setMock = jest.spyOn(idb, "set").mockRejectedValue(new Error("Set error"));
            await expect(subject["loadKeyPair"]()).rejects.toThrow("Set error");
            setMock.mockRestore();
        });
    });
});
