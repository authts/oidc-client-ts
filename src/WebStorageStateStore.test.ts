// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { WebStorageStateStore } from "./WebStorageStateStore";
import { InMemoryWebStorage } from "./InMemoryWebStorage";

describe("WebStorageStateStore", () => {
    let prefix: string;
    let store: Storage;
    let subject: WebStorageStateStore;

    beforeEach(() => {
        prefix = "";
        store = new InMemoryWebStorage();
        subject = new WebStorageStateStore({ prefix: prefix, store: store });
    });

    describe("set", () => {

        it("should return a promise", async () => {
            // act
            const p = subject.set("key", "value");

            // assert
            expect(p).toBeInstanceOf(Promise);
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

        it("should store item", async () => {
            // act
            await subject.set("key", "value");
            const result = store.getItem("key");

            // assert
            expect(result).toEqual("value");
        });

        it("should use prefix if specified", async () => {
            // arrange
            prefix = "foo.";
            subject = new WebStorageStateStore({ prefix: prefix, store: store });

            // act
            await subject.set("key", "value");

            // assert
            const result = store.getItem(prefix + "key");
            expect(result).toEqual("value");
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

        it("should remove item", async () => {
            // arrange
            store.setItem("key", "value");

            // act
            await subject.remove("key");
            const result = store.getItem("key");

            // assert
            expect(result).toBeUndefined();
        });

        it("should return value if exists", async () => {
            // arrange
            store.setItem("key", "test");

            // act
            const result = await subject.remove("key");

            // assert
            expect(result).toEqual("test");
        });

        it("should return undefined if doesn't exist", async () => {
            // act
            const result = await subject.remove("key");

            // assert
            expect(result).toBeUndefined();
        });

        it("should use prefix if specified", async () => {
            // arrange
            prefix = "foo.";
            subject = new WebStorageStateStore({ prefix: prefix, store: store });
            await subject.set("key", "value");

            // act
            const result = await subject.remove("key");

            // assert
            expect(result).toEqual("value");
        });

    });

    describe("get", () => {

        it("should return a promise", async () => {
            // act
            const p = subject.get("key");

            // assert
            expect(p).toBeInstanceOf(Promise);
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

        it("should return value if exists", async () => {
            // arrange
            store.setItem("key", "test");

            // act
            const result = await subject.get("key");

            // assert
            expect(result).toEqual("test");
        });

        it("should return undefined if doesn't exist", async () => {
            // act
            const result = await subject.get("key");

            // assert
            expect(result).toBeUndefined();
        });

        it("should use prefix if specified", async () => {
            // arrange
            prefix = "foo.";
            subject = new WebStorageStateStore({ prefix: prefix, store: store });
            store.setItem("foo.key", "value");

            // act
            const result = await subject.get("key");

            // assert
            expect(result).toEqual("value");
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

        it("should return keys", async () => {
            // arrange
            store.setItem("key1", "test");
            store.setItem("key2", "test");

            // act
            const result = await subject.getAllKeys();

            // assert
            expect(result).toStrictEqual(["key1", "key2"]);
        });

        it("should return keys without prefix", async () => {
            // arrange
            prefix = "foo.";
            subject = new WebStorageStateStore({ prefix: prefix, store: store });
            store.setItem("foo.key1", "test");
            store.setItem("foo.key2", "test");

            // act
            const result = await subject.getAllKeys();

            // assert
            expect(result).toStrictEqual(["key1", "key2"]);
        });

        it("should return empty keys when empty", async () => {
            // act
            const result = await subject.getAllKeys();

            // assert
            expect(result).toStrictEqual([]);
        });
    });
});
