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
            const subject = new SigninState({ id: 5, created:6, data:7 });

            // assert
            expect(subject.id).toEqual(5);
            expect(subject.created).toEqual(6);
            expect(subject.data).toEqual(7);
        });

        it("should accept nonce", () => {
            // act
            const subject = new SigninState({ nonce: 5 });

            // assert
            expect(subject.nonce).toEqual(5);
        });

        it("should generate nonce", () => {
            // act
            const subject = new SigninState({ nonce: true });

            // assert
            expect(subject.nonce).toBeDefined();
        });

        it("should accept redirect_uri", () => {
            // act
            const subject = new SigninState({ redirect_uri: "http://cb" });

            // assert
            expect(subject.redirect_uri).toEqual("http://cb");
        });

        it("should accept code_verifier", () => {
            // act
            const subject = new SigninState({ code_verifier: 5 });

            // assert
            expect(subject.code_verifier).toEqual(5);
        });

        it("should generate code_verifier", () => {
            // act
            const subject = new SigninState({ code_verifier: true });

            // assert
            expect(subject.code_verifier).toBeDefined();
        });

        it("should generate code_challenge", () => {
            // arrange

            // act
            const subject = new SigninState({ code_verifier: true });

            // assert
            expect(subject.code_challenge).toBeDefined();
        });

        it("should accept client_id", () => {
            // act
            const subject = new SigninState({ client_id: "client" });

            // assert
            expect(subject.client_id).toEqual("client");
        });

        it("should accept authority", () => {
            // act
            const subject = new SigninState({ authority: "test" });

            // assert
            expect(subject.authority).toEqual("test");
        });

        it("should accept request_type", () => {
            // act
            const subject = new SigninState({ request_type: "xoxo" });

            // assert
            expect(subject.request_type).toEqual("xoxo");
        });

        it("should accept extraTokenParams", () => {
            // act
            const subject = new SigninState({
                extraTokenParams: { "resourceServer" : "abc" }
            });

            // assert
            expect(subject.extraTokenParams).toEqual({ "resourceServer" : "abc" });
        });
    });

    it("can serialize and then deserialize", () => {
        // arrange
        const subject1 = new SigninState({
            nonce: true,
            data: { foo: "test" },
            created: 1000,
            client_id: "client",
            authority: "authority",
            redirect_uri: "http://cb",
            code_verifier: true,
            request_type: "type"
        });

        // act
        const storage = subject1.toStorageString();
        const subject2 = SigninState.fromStorageString(storage);

        // assert
        expect(subject2).toEqual(subject1);
    });
});
