// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { WebStorageStateStore } from '../../src/WebStorageStateStore';
import { InMemoryWebStorage } from '../../src/InMemoryWebStorage';

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
            let p = subject.set("key", "value");

            // assert
            expect(p).toBeInstanceOf(Promise);
            await p;
        });

        it("should store item", async () => {
            // act
            await subject.set("key", "value");
            let result = await store.getItem("key");

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
            let result = await store.getItem(prefix + "key");
            expect(result).toEqual("value");
        });
    });

    describe("remove", () => {

        it("should return a promise", () => {
            // act
            let p = subject.remove("key");

            // assert
            expect(p).toBeInstanceOf(Promise);
        });

        it("should remove item", async () => {
            // arrange
            await store.setItem("key", "value");

            // act
            await subject.remove("key");
            let result = await store.getItem("key");

            // assert
            expect(result).toBeUndefined();
        });

        it("should return value if exists", async () => {
            // arrange
            await store.setItem("key", "test");

            // act
            let result = await subject.remove("key");

            // assert
            expect(result).toEqual("test");
        });

        it("should return undefined if doesn't exist", async () => {
            // act
            let result = await subject.remove("key");

            // assert
            expect(result).toBeUndefined();
        });

        it("should use prefix if specified", async () => {
            // arrange
            prefix = "foo.";
            subject = new WebStorageStateStore({ prefix: prefix, store: store });
            await subject.set("key", "value");

            // act
            let result = await subject.remove("key");

            // assert
            expect(result).toEqual("value");
        });

    });

    describe("get", () => {

        it("should return a promise", () => {
            // act
            var p = subject.get("key");

            // assert
            expect(p).toBeInstanceOf(Promise);
        });

        it("should return value if exists", async () => {
            // arrange
            await store.setItem("key", "test");

            // act
            let result = await subject.get("key");

            // assert
            expect(result).toEqual("test");
        });

        it("should return undefined if doesn't exist", async () => {
            // act
            let result = await subject.get("key");

            // assert
            expect(result).toBeUndefined();
        });

        it("should use prefix if specified", async () => {
            // arrange
            prefix = "foo.";
            subject = new WebStorageStateStore({ prefix: prefix, store: store });
            store.setItem("foo.key", "value");

            // act
            let result = await subject.get("key");

            // assert
            expect(result).toEqual("value");
        });

    });

    describe("getAllKeys", () => {

        it("should return a promise", () => {
            // act
            var p = subject.getAllKeys();

            // assert
            expect(p).toBeInstanceOf(Promise);
        });

        it("should return keys", async () => {
            // arrange
            await store.setItem("key1", "test");
            await store.setItem("key2", "test");

            // act
            let result = await subject.getAllKeys();

            // assert
            expect(result).toStrictEqual(["key1", "key2"]);
        });

        it("should return keys without prefix", async () => {
            // arrange
            prefix = "foo.";
            subject = new WebStorageStateStore({ prefix: prefix, store: store });
            await store.setItem("foo.key1", "test");
            await store.setItem("foo.key2", "test");

            // act
            let result = await subject.getAllKeys();

            // assert
            expect(result).toStrictEqual(["key1", "key2"]);
        });

        it("should return empty keys when empty", async () => {
            // act
            let result = await subject.getAllKeys();

            // assert
            expect(result).toStrictEqual([]);
        });
    });
});
