// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "../../src/utils";
import { SigninState } from "../../src/SigninState";

describe("SigninState", () => {

    beforeEach(() =>{
        Log.level = Log.NONE;
        Log.logger = console;
    });

    describe("constructor", () => {

        it("should call base ctor", () => {
            // act
            const subject = new SigninState({
                id: "5",
                created: 6,
                data: 7,

                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                request_type: "type",
                scope: "scope"
            });

            // assert
            expect(subject.id).toEqual("5");
            expect(subject.created).toEqual(6);
            expect(subject.data).toEqual(7);
        });

        it("should accept redirect_uri", () => {
            // act
            const subject = new SigninState({
                authority: "authority",
                client_id: "client",
                scope: "scope",
                request_type: "type",
                redirect_uri: "http://cb"
            });

            // assert
            expect(subject.redirect_uri).toEqual("http://cb");
        });

        it("should accept code_verifier", () => {
            // act
            const subject = new SigninState({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
                code_verifier: "5"
            });

            // assert
            expect(subject.code_verifier).toEqual("5");
        });

        it("should generate code_verifier", () => {
            // act
            const subject = new SigninState({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
                code_verifier: true
            });

            // assert
            expect(subject.code_verifier).toBeDefined();
        });

        it("should generate code_challenge", () => {
            // arrange

            // act
            const subject = new SigninState({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
                code_verifier: true
            });

            // assert
            expect(subject.code_challenge).toBeDefined();
        });

        it("should accept client_id", () => {
            // act
            const subject = new SigninState({
                authority: "authority",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
                client_id: "client"
            });

            // assert
            expect(subject.client_id).toEqual("client");
        });

        it("should accept authority", () => {
            // act
            const subject = new SigninState({
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
                authority: "test"
            });

            // assert
            expect(subject.authority).toEqual("test");
        });

        it("should accept request_type", () => {
            // act
            const subject = new SigninState({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "xoxo"
            });

            // assert
            expect(subject.request_type).toEqual("xoxo");
        });

        it("should accept extraTokenParams", () => {
            // act
            const subject = new SigninState({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
                extraTokenParams: {
                    "resourceServer" : "abc"
                }
            });

            // assert
            expect(subject.extraTokenParams).toEqual({ "resourceServer" : "abc" });
        });
    });

    it("can serialize and then deserialize", () => {
        // arrange
        const subject1 = new SigninState({
            data: { foo: "test" },
            created: 1000,
            code_verifier: true,
            authority: "authority",
            client_id: "client",
            redirect_uri: "http://cb",
            scope: "scope",
            request_type: "type"
        });

        // act
        const storage = subject1.toStorageString();
        const subject2 = SigninState.fromStorageString(storage);

        // assert
        expect(subject2).toEqual(subject1);
    });
});
