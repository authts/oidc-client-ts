// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { State } from "./State";

import { InMemoryWebStorage } from "./InMemoryWebStorage";
import { WebStorageStateStore } from "./WebStorageStateStore";

describe("State", () => {
    describe("constructor", () => {

        it("should generate id", () => {
            // act
            const subject = new State({
                request_type: "type",
            });

            // assert
            expect(subject.id).toBeDefined();
        });

        it("should accept id", () => {
            // act
            const subject = new State({
                request_type: "type",
                id: "5",
            });

            // assert
            expect(subject.id).toEqual("5");
        });

        it("should accept data", () => {
            // act
            const subject = new State({
                request_type: "type",
                data: "test",
            });

            // assert
            expect(subject.data).toEqual("test");
        });

        it("should accept data as objects", () => {
            // act
            const subject = new State({
                request_type: "type",
                data: { foo: "test" },
            });

            // assert
            expect(subject.data).toEqual({ foo: "test" });
        });

        it("should accept created", () => {
            // act
            const subject = new State({
                request_type: "type",
                created: 1000,
            });

            // assert
            expect(subject.created).toEqual(1000);
        });

        it("should use date.now for created", () => {
            // arrange
            const oldNow = Date.now;
            Date.now = () => {
                return 123 * 1000; // ms
            };

            // act
            const subject = new State({
                request_type: "type",
            });

            // assert
            expect(subject.created).toEqual(123);
            Date.now = oldNow;
        });

        it("should accept request_type", () => {
            // act
            const subject = new State({
                request_type: "xoxo",
            });

            // assert
            expect(subject.request_type).toEqual("xoxo");
        });

        it("should accept url_state", () => {
            // act
            const subject = new State({
                url_state: "foo",
            });

            // assert
            expect(subject.url_state).toEqual("foo");
        });
    });

    it("can serialize and then deserialize", async () => {
        // arrange
        const subject1 = new State({
            data: { foo: "test" }, created: 1000, request_type:"type", url_state: "foo",
        });

        // act
        const storage = subject1.toStorageString();
        const subject2 = await State.fromStorageString(storage);

        // assert
        expect(subject2).toEqual(subject1);
    });

    describe("clearStaleState", () => {

        it("should remove old state entries", async () => {
            // arrange
            const oldNow = Date.now;
            Date.now = () => {
                return 200 * 1000; // ms
            };

            const prefix = "prefix.";
            const inMemStore = new InMemoryWebStorage();
            const store = new WebStorageStateStore({ prefix: prefix, store: inMemStore });

            const s1 = new State({ id: "s1", created: 5, request_type:"type" });
            const s2 = new State({ id: "s2", created: 99, request_type:"type" });
            const s3 = new State({ id: "s3", created: 100, request_type:"type" });
            const s4 = new State({ id: "s4", created: 101, request_type:"type" });
            const s5 = new State({ id: "s5", created: 150, request_type:"type" });

            inMemStore.setItem("junk0", "junk");
            inMemStore.setItem(prefix + s1.id, s1.toStorageString());
            inMemStore.setItem("junk1", "junk");
            inMemStore.setItem(prefix + s2.id, s2.toStorageString());
            inMemStore.setItem("junk2", "junk");
            inMemStore.setItem(prefix + s3.id, s3.toStorageString());
            inMemStore.setItem("junk3", "junk");
            inMemStore.setItem(prefix + s4.id, s4.toStorageString());
            inMemStore.setItem("junk4", "junk");
            inMemStore.setItem(prefix + s5.id, s5.toStorageString());
            inMemStore.setItem("junk5", "junk");

            // act
            await State.clearStaleState(store, 100);

            // assert
            expect(inMemStore.length).toEqual(8);
            expect(inMemStore.getItem(prefix + "s4")).toBeDefined();
            expect(inMemStore.getItem(prefix + "s5")).toBeDefined();
            Date.now = oldNow;
        });
    });
});
