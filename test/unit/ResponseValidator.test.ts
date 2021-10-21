// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "../../src/utils";
import { ResponseValidator } from "../../src/ResponseValidator";
import { MetadataService } from "../../src/MetadataService";
import { SigninState } from "../../src/SigninState";
import type { SigninResponse } from "../../src/SigninResponse";
import type { ErrorResponse } from "../../src/ErrorResponse";

// access private methods
class ResponseValidatorWrapper extends ResponseValidator {
    public _processSigninParams(state: SigninState, response: SigninResponse) {
        return super._processSigninParams(state, response);
    }
    public async _processClaims(state: SigninState, response: SigninResponse) {
        return super._processClaims(state, response);
    }
    public _filterProtocolClaims(claims: any) {
        return super._filterProtocolClaims(claims);
    }
    public _validateTokens(state: SigninState, response: SigninResponse) {
        return super._validateTokens(state, response);
    }
    public async _processCode(state: SigninState, response: SigninResponse) {
        return super._processCode(state, response);
    }
}

describe("ResponseValidator", () => {
    let stubState: any;
    let stubResponse: any;
    let settings: any;
    let subject: ResponseValidatorWrapper;

    let metadataService: MetadataService;

    beforeEach(() => {
        Log.logger = console;
        Log.level = Log.NONE;

        stubState = {
            id: "the_id",
            data: { some: "data" },
            client_id: "client",
            authority: "op"
        };
        stubResponse = {
            state: "the_id",
            isOpenIdConnect: false
        };
        settings = {
            authority: "op",
            client_id: "client"
        };
        metadataService = new MetadataService(settings);

        // restore spyOn
        jest.restoreAllMocks();

        subject = new ResponseValidatorWrapper(settings, metadataService);
    });

    describe("validateSignoutResponse", () => {

        it("should validate that the client state matches response state", () => {
            // arrange
            stubResponse.state = "not_the_id";

            // act
            try {
                subject.validateSignoutResponse(stubState, stubResponse);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("match");
            }
        });

        it("should fail on error response", () => {
            // arrange
            stubResponse.error = "some_error";

            // act
            try {
                subject.validateSignoutResponse(stubState, stubResponse);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as ErrorResponse).error).toEqual("some_error");
            }
        });

        it("should return data for error responses", () => {
            // arrange
            stubResponse.error = "some_error";

            // act
            try {
                subject.validateSignoutResponse(stubState, stubResponse);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as ErrorResponse).state).toEqual({ some: "data" });
            }
        });

        it("should return data for successful responses", () => {
            // act
            const response = subject.validateSignoutResponse(stubState, stubResponse);

            // assert
            expect(response.state).toEqual({ some: "data" });
        });
    });

    describe("validateSigninResponse", () => {

        it("should process signin params", async () => {
            // arrange
            const _processSigninParamsMock = jest.spyOn(subject, "_processSigninParams")
                .mockImplementation(() => stubResponse);
            jest.spyOn(subject, "_validateTokens")
                .mockImplementation(() => Promise.resolve(stubResponse));

            // act
            await subject.validateSigninResponse(stubState, stubResponse);

            // assert
            expect(_processSigninParamsMock).toBeCalled();
        });

        it("should validate tokens", async () => {
            // arrange
            jest.spyOn(subject, "_processSigninParams")
                .mockImplementation(() => stubResponse);
            const _validateTokensMock = jest.spyOn(subject, "_validateTokens")
                .mockImplementation(() => Promise.resolve(stubResponse));

            // act
            await subject.validateSigninResponse(stubState, stubResponse);

            // assert
            expect(_validateTokensMock).toBeCalled();
        });

        it("should not validate tokens if state fails", async () => {
            // arrange
            jest.spyOn(subject, "_processSigninParams")
                .mockImplementation(() => { throw new Error("error"); });
            const _validateTokensMock = jest.spyOn(subject, "_validateTokens")
                .mockImplementation(() => Promise.resolve(stubResponse));

            // act
            try {
                await subject.validateSigninResponse(stubState, stubResponse);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(_validateTokensMock).not.toBeCalled();
            }
        });

        it("should process claims", async () => {
            // arrange
            jest.spyOn(subject, "_processSigninParams")
                .mockImplementation(() => stubResponse);
            jest.spyOn(subject, "_validateTokens")
                .mockImplementation(() => Promise.resolve(stubResponse));
            const _processClaimsMock = jest.spyOn(subject, "_processClaims")
                .mockImplementation(() => Promise.resolve(stubResponse));

            // act
            await subject.validateSigninResponse(stubState, stubResponse);

            // assert
            expect(_processClaimsMock).toBeCalled();
        });

        it("should not process claims if state fails", async () => {
            // arrange
            jest.spyOn(subject, "_processSigninParams")
                .mockImplementation(() => stubResponse);
            jest.spyOn(subject, "_validateTokens")
                .mockImplementation(() => Promise.reject(new Error("error")));
            const _processClaimsMock = jest.spyOn(subject, "_processClaims")
                .mockImplementation(() => Promise.resolve(stubResponse));

            // act
            try {
                await subject.validateSigninResponse(stubState, stubResponse);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(_processClaimsMock).not.toBeCalled();
            }
        });
    });

    describe("_processSigninParams", () => {

        it("should fail if no authority on state", () => {
            // arrange
            delete stubState.authority;

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("authority");
            }
        });

        it("should fail if no client_id on state", () => {
            // arrange
            delete stubState.client_id;

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("client_id");
            }
        });

        it("should fail if the authority on the state is not the same as the settings", () => {
            // arrange
            stubState.authority = "something different";

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("authority mismatch");
            }
        });

        it("should fail if the client_id on the state is not the same as the settings", () => {
            // arrange
            stubState.client_id = "something different";

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("client_id mismatch");
            }
        });

        it("should validate that the client state matches response state", () => {
            // arrange
            stubResponse.state = "not_the_id";

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("match");
            }
        });

        it("should fail on error response", () => {
            // arrange
            stubResponse.error = "some_error";

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as ErrorResponse).error).toEqual("some_error");
            }
        });

        it("should return data for error responses", () => {
            // arrange
            stubResponse.error = "some_error";

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as ErrorResponse).state).toEqual({ some: "data" });
            }
        });

        it("should fail if request was code flow but no code in response", () => {
            // arrange
            stubState.code_verifier = "secret";
            delete stubResponse.code;

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("code");
            }
        });

        it("should return data for successful responses", () => {
            // arrange
            stubState.code_verifier = "secret";
            stubResponse.code = "code";

            // act
            const response = subject._processSigninParams(stubState, stubResponse);

            // assert
            expect(response.state).toEqual({ some: "data" });
        });
    });

    describe("_processClaims", () => {

        it("should filter protocol claims if OIDC", async () => {
            // arrange
            const state = new SigninState({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type"
            });
            stubResponse.isOpenIdConnect = true;
            stubResponse.profile = { a: "apple", b: "banana" };
            const _filterProtocolClaimsMock = jest.spyOn(subject, "_filterProtocolClaims")
                .mockImplementation((profile) => profile);

            // act
            await subject._processClaims(state, stubResponse);

            // assert
            expect(_filterProtocolClaimsMock).toBeCalled();
        });

        it("should not filter protocol claims if not OIDC", async () => {
            // arrange
            const state = new SigninState({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type"
            });
            stubResponse.isOpenIdConnect = false;
            const _filterProtocolClaimsMock = jest.spyOn(subject, "_filterProtocolClaims")
                .mockImplementation((profile) => profile);

            // act
            await subject._processClaims(state, stubResponse);

            // assert
            expect(_filterProtocolClaimsMock).not.toBeCalled();
        });
    });

    describe("_filterProtocolClaims", () => {

        it("should filter protocol claims if enabled on settings", () => {
            // arrange
            settings.filterProtocolClaims = true;
            const claims = {
                foo: 1, bar: "test",
                aud: "some_aud", iss: "issuer",
                sub: "123", email: "foo@gmail.com",
                role: ["admin", "dev"],
                at_hash: "athash",
                iat: 5, nbf: 10, exp: 20
            };

            // act
            const result = subject._filterProtocolClaims(claims);

            // assert
            expect(result).toEqual({
                foo: 1, bar: "test",
                sub: "123", email: "foo@gmail.com",
                role: ["admin", "dev"]
            });
        });

        it("should not filter protocol claims if not enabled on settings", () => {
            // arrange
            settings.filterProtocolClaims = false;
            const claims = {
                foo: 1, bar: "test",
                aud: "some_aud", iss: "issuer",
                sub: "123", email: "foo@gmail.com",
                role: ["admin", "dev"],
                at_hash: "athash",
                iat: 5, nbf: 10, exp: 20
            };

            // act
            const result = subject._filterProtocolClaims(claims);

            // assert
            expect(result).toEqual({
                foo: 1, bar: "test",
                aud: "some_aud", iss: "issuer",
                sub: "123", email: "foo@gmail.com",
                role: ["admin", "dev"],
                at_hash: "athash",
                iat: 5, nbf: 10, exp: 20
            });
        });
    });
});
