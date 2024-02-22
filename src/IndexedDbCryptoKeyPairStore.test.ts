import { IndexedDbCryptoKeyPairStore as subject } from "./IndexedDbCryptoKeyPairStore";

describe("IndexedDBCryptoKeyPairStore", () => {
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
        it("should return a promise", async () => {
            // act
            const p = subject.set("key", data);

            // assert
            expect(p).toBeInstanceOf(Promise);
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

        it("should store a key in IndexedDB", async () => {
            await subject.set("foo", data);
            const result = await subject.get("foo");

            expect(result).toEqual(data);
        });
    });

    describe("remove", () => {
        it("should return a promise", async () => {
            // act
            const p = subject.remove("key");

            // assert
            expect(p).toBeInstanceOf(Promise);
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

        it("should remove a key from IndexedDB", async () => {
            await subject.set("foo", data);
            let result = await subject.get("foo");

            expect(result).toEqual(data);

            await subject.remove("foo");
            result = await subject.get("foo");
            expect(result).toBeUndefined();
        });

        it("should return a value if key exists", async () => {
            await subject.set("foo", data);
            const result = await subject.remove("foo");

            expect(result).toEqual(data);
        });
    });

    describe("getAllKeys", () => {
        it("should return a promise", async () => {
            // act
            const p = subject.getAllKeys();

            // assert
            expect(p).toBeInstanceOf(Promise);
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

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
