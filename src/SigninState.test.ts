// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { SigninState } from "./SigninState";

describe("SigninState", () => {
    describe("constructor", () => {

        it("should call base ctor", async () => {
            // act
            const subject = await SigninState.create({
                id: "5",
                created: 6,
                data: 7,

                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                request_type: "type",
                scope: "scope",
                url_state: "foo",
            });

            // assert
            expect(subject.id).toEqual("5");
            expect(subject.created).toEqual(6);
            expect(subject.data).toEqual(7);
            expect(subject.url_state).toEqual("foo");
        });

        it("should accept redirect_uri", async () => {
            // act
            const subject = await SigninState.create({
                authority: "authority",
                client_id: "client",
                scope: "scope",
                request_type: "type",
                redirect_uri: "http://cb",
            });

            // assert
            expect(subject.redirect_uri).toEqual("http://cb");
        });

        it("should accept code_verifier", async () => {
            // act
            const subject = await SigninState.create({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
                code_verifier: "5",
            });

            // assert
            expect(subject.code_verifier).toEqual("5");
        });

        it("should generate code_verifier", async () => {
            // act
            const subject = await SigninState.create({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
                code_verifier: true,
            });

            // assert
            expect(subject.code_verifier).toBeDefined();
        });

        it("should generate code_challenge", async () => {
            // arrange

            // act
            const subject = await SigninState.create({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
                code_verifier: true,
            });

            // assert
            expect(subject.code_challenge).toBeDefined();
        });

        it("should accept client_id", async () => {
            // act
            const subject = await SigninState.create({
                authority: "authority",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
                client_id: "client",
            });

            // assert
            expect(subject.client_id).toEqual("client");
        });

        it("should accept authority", async () => {
            // act
            const subject = await SigninState.create({
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
                authority: "test",
            });

            // assert
            expect(subject.authority).toEqual("test");
        });

        it("should accept request_type", async () => {
            // act
            const subject = await SigninState.create({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "xoxo",
            });

            // assert
            expect(subject.request_type).toEqual("xoxo");
        });

        it("should accept extraTokenParams", async () => {
            // act
            const subject = await SigninState.create({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
                extraTokenParams: {
                    "resourceServer" : "abc",
                },
            });

            // assert
            expect(subject.extraTokenParams).toEqual({ "resourceServer" : "abc" });
        });
    });

    it("can serialize and then deserialize", async () => {
        // arrange
        const subject1 = await SigninState.create({
            data: { foo: "test" },
            created: 1000,
            code_verifier: true,
            authority: "authority",
            client_id: "client",
            redirect_uri: "http://cb",
            scope: "scope",
            request_type: "type",
        });

        // act
        const storage = subject1.toStorageString();
        const subject2 = await SigninState.fromStorageString(storage);

        // assert
        expect(subject2).toEqual(subject1);
    });
});
