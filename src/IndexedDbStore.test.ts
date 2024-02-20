import { IndexedDbCryptoKeyPairStore as subject } from "./IndexedDbCryptoKeyPairStore";

describe("IndexedDBStateStore", () => {
    let data: CryptoKeyPair;
    const createCryptoKeyPair = async () => {
        return await window.crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-256",
            },
            false,
            ["sign", "verify"],
        );
    };

    beforeEach(async () => {
        data = await createCryptoKeyPair();
    });

    describe("set", () => {
        it("should store a key in IndexedDB", async () => {
            await subject.set("foo", data);
            const result = await subject.get("foo");

            expect(result).toEqual(data);
        });
    });

    describe("remove", () => {
        it("should remove a key from IndexedDB", async () => {
            await subject.set("foo", data);
            let result = await subject.get("foo");

            expect(result).toEqual(data);

            await subject.remove("foo");
            result = await subject.get("foo");
            expect(result).toBeUndefined();
        });
    });

    describe("getAllKeys", () => {
        it("should get all keys in IndexedDB", async () => {
            await subject.set("foo", data);
            const dataTwo = await createCryptoKeyPair();
            await subject.set("boo", dataTwo);

            const result = await subject.getAllKeys();
            expect(result.length).toEqual(2);
            expect(result).toContain("foo");
            expect(result).toContain("boo");
        });
    });
});
