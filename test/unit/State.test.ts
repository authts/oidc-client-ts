// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from '../../src/utils';
import { State } from '../../src/State';

import { InMemoryWebStorage } from '../../src/InMemoryWebStorage';
import { WebStorageStateStore } from '../../src/WebStorageStateStore';

describe("State", () => {

    beforeEach(() =>{
        Log.level = Log.NONE;
        Log.logger = console;
    });

    describe("constructor", () => {

        it("should generate id", () => {
            // act
            var subject = new State();

            // assert
            expect(subject.id).toBeDefined();
        });

        it("should accept id", () => {
            // act
            var subject = new State({ id: 5 });

            // assert
            expect(subject.id).toEqual(5);
        });

        it("should accept data", () => {
            // act
            var subject = new State({ data: "test" });

            // assert
            expect(subject.data).toEqual("test");
        });

        it("should accept data as objects", () => {
            // act
            var subject = new State({ data: { foo: "test" } });

            // assert
            expect(subject.data).toEqual({ foo: "test" });
        });

        it("should accept created", () => {
            // act
            var subject = new State({ created: 1000 });

            // assert
            expect(subject.created).toEqual(1000);
        });

        it("should use date.now for created", () => {
            // arrange
            var oldNow = Date.now;
            Date.now = () => {
                return 123 * 1000; // ms
            };

            // act
            var subject = new State();

            // assert
            expect(subject.created).toEqual(123);
            Date.now = oldNow;
        });

        it("should accept request_type", () => {
            // act
            var subject = new State({ request_type: 'xoxo' });

            // assert
            expect(subject.request_type).toEqual('xoxo');
        });
    });

    it("can serialize and then deserialize", () => {
        // arrange
        var subject1 = new State({ data: { foo: "test" }, created: 1000, request_type:'type' });

        // act
        var storage = subject1.toStorageString();
        var subject2 = State.fromStorageString(storage);


        // assert
        expect(subject2).toEqual(subject1);
    });

    describe("clearStaleState", () => {

        it("should remove old state entries", async () => {
            // arrange
            let oldNow = Date.now;
            Date.now = () => {
                return 200 * 1000; // ms
            };

            let prefix = "prefix.";
            let inMemStore = new InMemoryWebStorage();
            let store = new WebStorageStateStore({ prefix: prefix, store: inMemStore });

            let s1 = new State({ id: "s1", created: 50 });
            let s2 = new State({ id: "s2", created: 99 });
            let s3 = new State({ id: "s3", created: 100 });
            let s4 = new State({ id: "s4", created: 101 });
            let s5 = new State({ id: "s5", created: 150 });

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
