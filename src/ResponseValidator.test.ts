// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { JwtUtils, Log } from "./utils";
import { ResponseValidator } from "./ResponseValidator";
import { MetadataService } from "./MetadataService";
import type { UserInfoService } from "./UserInfoService";
import { SigninState } from "./SigninState";
import type { SigninResponse } from "./SigninResponse";
import { ErrorResponse } from "./ErrorResponse";
import type { UserProfile } from "./User";
import type { TokenClient } from "./TokenClient";
import type { OidcClientSettingsStore } from "./OidcClientSettings";

// access private methods
class ResponseValidatorWrapper extends ResponseValidator {
    public _processSigninParams(state: SigninState, response: SigninResponse) {
        return super._processSigninParams(state, response);
    }
    public async _processClaims(state: SigninState, response: SigninResponse) {
        return await super._processClaims(state, response);
    }
    public _mergeClaims(claims1: UserProfile, claims2: Record<string, unknown>) {
        return super._mergeClaims(claims1, claims2);
    }
    public _filterProtocolClaims(claims: UserProfile) {
        return super._filterProtocolClaims(claims);
    }
    public _validateTokens(state: SigninState, response: SigninResponse) {
        return super._validateTokens(state, response);
    }
    public async _processCode(state: SigninState, response: SigninResponse) {
        return await super._processCode(state, response);
    }
    public _validateIdTokenAttributes(response: SigninResponse, id_token: string) {
        return super._validateIdTokenAttributes(response, id_token);
    }
}

describe("ResponseValidator", () => {
    let stubState: SigninState;
    let stubResponse: SigninResponse;
    let settings: OidcClientSettingsStore;
    let subject: ResponseValidatorWrapper;

    let metadataService: MetadataService;
    let userInfoService: UserInfoService;
    let tokenClient: TokenClient;

    beforeEach(() => {
        Log.logger = console;
        Log.level = Log.NONE;

        stubState = {
            id: "the_id",
            data: { some: "data" },
            client_id: "client",
            authority: "op",
        } as SigninState;
        stubResponse = {
            state_id: "the_id",
            isOpenIdConnect: false,
        } as SigninResponse;
        settings = {
            authority: "op",
            client_id: "client",
        } as OidcClientSettingsStore;
        metadataService = new MetadataService(settings);

        // restore spyOn
        jest.restoreAllMocks();

        subject = new ResponseValidatorWrapper(settings, metadataService);

        // access private members
        userInfoService = subject["_userInfoService"];
        tokenClient = subject["_tokenClient"];
    });

    describe("validateSignoutResponse", () => {
        it("should validate that the client state matches response state", () => {
            // arrange
            Object.assign(stubResponse, { state_id: "not_the_id" });

            // act
            expect(() => subject.validateSignoutResponse(stubState, stubResponse))
                // assert
                .toThrow("State does not match");
        });

        it("should fail on error response", () => {
            // arrange
            stubResponse.error = "some_error";

            // act
            expect(() => subject.validateSignoutResponse(stubState, stubResponse))
                // assert
                .toThrow(ErrorResponse);
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
            await expect(subject.validateSigninResponse(stubState, stubResponse))
                // assert
                .rejects.toThrow(Error);
            expect(_validateTokensMock).not.toBeCalled();
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
            await expect(subject.validateSigninResponse(stubState, stubResponse))
                // assert
                .rejects.toThrow(Error);
            expect(_processClaimsMock).not.toBeCalled();
        });
    });

    describe("_processSigninParams", () => {
        it("should validate that the client state matches response state", () => {
            // arrange
            Object.assign(stubResponse, { state_id: "not_the_id" });

            // act
            expect(() => subject._processSigninParams(stubState, stubResponse))
                // assert
                .toThrow("State does not match");
        });

        it("should fail if no client_id on state", () => {
            // arrange
            Object.assign(stubState, { client_id: undefined });

            // act
            expect(() => subject._processSigninParams(stubState, stubResponse))
                // assert
                .toThrow("No client_id on state");
        });

        it("should fail if no authority on state", () => {
            // arrange
            Object.assign(stubState, { authority: undefined });

            // act
            expect(() => subject._processSigninParams(stubState, stubResponse))
                // assert
                .toThrow("No authority on state");
        });

        it("should fail if the authority on the state is not the same as the settings", () => {
            // arrange
            Object.assign(stubState, { authority: "something different" });

            // act
            expect(() => subject._processSigninParams(stubState, stubResponse))
                // assert
                .toThrow(/authority mismatch/);
        });

        it("should fail if the client_id on the state is not the same as the settings", () => {
            // arrange
            Object.assign(stubState, { client_id: "something different" });

            // act
            expect(() => subject._processSigninParams(stubState, stubResponse))
                // assert
                .toThrow(/client_id mismatch/);
        });

        it("should return data for error responses", () => {
            // arrange
            stubResponse.error = "some_error";

            // act
            expect(() => subject._processSigninParams(stubState, stubResponse))
                // assert
                .toThrow(ErrorResponse);
        });

        it("should fail if request was code flow but no code in response", () => {
            // arrange
            Object.assign(stubState, { code_verifier: "secret" });
            Object.assign(stubResponse, { code: undefined });

            // act
            expect(() => subject._processSigninParams(stubState, stubResponse))
                // assert
                .toThrow(/No code/);
        });

        it("should fail if request was not code flow but code in response", () => {
            // arrange
            Object.assign(stubState, { code_verifier: undefined });
            Object.assign(stubResponse, { code: "code" });

            // act
            expect(() => subject._processSigninParams(stubState, stubResponse))
                // assert
                .toThrow(/Unexpected code/);
        });

        it("should return data for successful responses", () => {
            // arrange
            Object.assign(stubState, { code_verifier: "secret" });
            Object.assign(stubResponse, { code: "code" });

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
                request_type: "type",
            });
            Object.assign(stubResponse, {
                isOpenIdConnect: true,
                profile: { a: "apple", b: "banana" },
            });
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
                request_type: "type",
            });
            Object.assign(stubResponse, { isOpenIdConnect: false });
            const _filterProtocolClaimsMock = jest.spyOn(subject, "_filterProtocolClaims")
                .mockImplementation((profile) => profile);

            // act
            await subject._processClaims(state, stubResponse);

            // assert
            expect(_filterProtocolClaimsMock).not.toBeCalled();
        });

        it("should fail if sub from user info endpoint does not match sub in id_token", async () => {
            // arrange
            const state = new SigninState({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
            });
            Object.assign(settings, { loadUserInfo: true });
            Object.assign(stubResponse, {
                isOpenIdConnect: true,
                profile: { sub: "sub" },
                access_token: "access_token",
            });
            jest.spyOn(userInfoService, "getClaims")
                .mockImplementation(() => Promise.resolve({ sub: "sub different" }));

            // act
            await expect(subject._processClaims(state, stubResponse))
                // assert
                .rejects.toThrow(Error);
        });

        it("should load and merge user info claims when loadUserInfo configured", async () => {
            // arrange
            const state = new SigninState({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
            });
            Object.assign(settings, { loadUserInfo: true });
            Object.assign(stubResponse, {
                isOpenIdConnect: true,
                profile: { a: "apple", b: "banana" },
                access_token: "access_token",
            });
            const getClaimMock = jest.spyOn(userInfoService, "getClaims")
                .mockImplementation(() => Promise.resolve({ c: "carrot" }));
            const _mergeClaimsMock = jest.spyOn(subject, "_mergeClaims")
                .mockImplementation((profile) => profile);

            // act
            await subject._processClaims(state, stubResponse);

            // assert
            expect(getClaimMock).toBeCalled();
            expect(_mergeClaimsMock).toBeCalled();
        });

        it("should not run if request was not openid", async () => {
            // arrange
            const state = new SigninState({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
            });
            Object.assign(settings, { loadUserInfo: true });
            Object.assign(stubResponse, {
                isOpenIdConnect: false,
                profile: { a: "apple", b: "banana" },
                access_token: "access_token",
            });
            const getClaimMock = jest.spyOn(userInfoService, "getClaims")
                .mockImplementation(() => Promise.resolve({ c: "carrot" }));

            // act
            await subject._processClaims(state, stubResponse);

            // assert
            expect(getClaimMock).not.toBeCalled();
        });

        it("should not load and merge user info claims when loadUserInfo not configured", async () => {
            // arrange
            const state = new SigninState({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
            });
            Object.assign(settings, { loadUserInfo: false });
            Object.assign(stubResponse, {
                isOpenIdConnect: true,
                profile: { a: "apple", b: "banana" },
                access_token: "access_token",
            });
            const getClaimMock = jest.spyOn(userInfoService, "getClaims")
                .mockImplementation(() => Promise.resolve({ c: "carrot" }));

            // act
            await subject._processClaims(state, stubResponse);

            // assert
            expect(getClaimMock).not.toBeCalled();
        });

        it("should not load user info claims if no access token", async () => {
            // arrange
            const state = new SigninState({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type",
            });
            Object.assign(settings, { loadUserInfo: true });
            Object.assign(stubResponse, {
                isOpenIdConnect: true,
                profile: { a: "apple", b: "banana" },
            });
            const getClaimMock = jest.spyOn(userInfoService, "getClaims")
                .mockImplementation(() => Promise.resolve({ c: "carrot" }));

            // act
            await subject._processClaims(state, stubResponse);

            // assert
            expect(getClaimMock).not.toBeCalled();
        });
    });

    describe("_mergeClaims", () => {
        it("should merge claims", () => {
            // arrange
            const c1 = { a: "apple", b: "banana" } as UserProfile;
            const c2 = { c: "carrot" };

            // act
            const result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: "apple", c: "carrot", b: "banana" });
        });

        it("should not merge claims when claim types are objects", () => {
            // arrange
            const c1 = { custom: { "apple": "foo", "pear": "bar" } } as UserProfile;
            const c2 = { custom: { "apple": "foo", "orange": "peel" }, b: "banana" };

            // act
            const result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ custom: [{ "apple": "foo", "pear": "bar" }, { "apple": "foo", "orange": "peel" }], b: "banana" });
        });

        it("should merge claims when claim types are objects when mergeClaims settings is true", () => {
            // arrange
            Object.assign(settings, { mergeClaims: true });

            const c1 = { custom: { "apple": "foo", "pear": "bar" } } as UserProfile;
            const c2 = { custom: { "apple": "foo", "orange": "peel" }, b: "banana" };

            // act
            const result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ custom: { "apple": "foo", "pear": "bar", "orange": "peel" }, b: "banana" });
        });

        it("should merge same claim types into array", () => {
            // arrange
            const c1 = { a: "apple", b: "banana" } as UserProfile;
            const c2 = { a: "carrot" };

            // act
            const result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: ["apple", "carrot"], b: "banana" });
        });

        it("should merge arrays of same claim types into array", () => {
            // arrange
            const c1 = { a: "apple", b: "banana" } as UserProfile;
            const c2 = { a: ["carrot", "durian"] };

            // act
            let result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: ["apple", "carrot", "durian"], b: "banana" });

            // arrange
            const d1 = { a: ["apple", "carrot"], b: "banana" } as UserProfile;
            const d2 = { a: ["durian"] };

            // act
            result = subject._mergeClaims(d1, d2);

            // assert
            expect(result).toEqual({ a: ["apple", "carrot", "durian"], b: "banana" });

            // arrange
            const e1 = { a: ["apple", "carrot"], b: "banana" } as UserProfile;
            const e2 = { a: "durian" };

            // act
            result = subject._mergeClaims(e1, e2);

            // assert
            expect(result).toEqual({ a: ["apple", "carrot", "durian"], b: "banana" });
        });

        it("should remove duplicates when producing arrays", () => {
            // arrange
            const c1 = { a: "apple", b: "banana" } as UserProfile;
            const c2 = { a: ["apple", "durian"] };

            // act
            const result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: ["apple", "durian"], b: "banana" });
        });

        it("should not add if already present in array", () => {
            // arrange
            const c1 = { a: ["apple", "durian"], b: "banana" } as UserProfile;
            const c2 = { a: "apple" };

            // act
            const result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: ["apple", "durian"], b: "banana" });
        });
    });

    describe("_filterProtocolClaims", () => {
        it("should filter protocol claims if enabled on settings", () => {
            // arrange
            Object.assign(settings, { filterProtocolClaims: true });
            const claims = {
                foo: 1, bar: "test",
                aud: "some_aud", iss: "issuer",
                sub: "123", email: "foo@gmail.com",
                role: ["admin", "dev"],
                at_hash: "athash",
                iat: 5, nbf: 10, exp: 20,
            };

            // act
            const result = subject._filterProtocolClaims(claims);

            // assert
            expect(result).toEqual({
                foo: 1, bar: "test",
                sub: "123", email: "foo@gmail.com",
                role: ["admin", "dev"],
            });
        });

        it("should not filter protocol claims if not enabled on settings", () => {
            // arrange
            Object.assign(settings, { filterProtocolClaims: false });
            const claims = {
                foo: 1, bar: "test",
                aud: "some_aud", iss: "issuer",
                sub: "123", email: "foo@gmail.com",
                role: ["admin", "dev"],
                at_hash: "athash",
                iat: 5, nbf: 10, exp: 20,
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
                iat: 5, nbf: 10, exp: 20,
            });
        });
    });

    describe("_validateTokens", () => {
        it("should process code if response has code", async () => {
            // arrange
            Object.assign(stubResponse, { code: "code" });
            const processCodeMock = jest.spyOn(subject, "_processCode")
                .mockImplementation(() => Promise.resolve(stubResponse));

            // act
            await subject._validateTokens(stubState, stubResponse);

            // assert
            expect(processCodeMock).toBeCalled();
        });

        it("should not process code if response has no code", async () => {
            // arrange
            Object.assign(stubResponse, { code: undefined });
            const processCodeMock = jest.spyOn(subject, "_processCode")
                .mockImplementation(() => Promise.resolve(stubResponse));

            // act
            await subject._validateTokens(stubState, stubResponse);

            // assert
            expect(processCodeMock).not.toBeCalled();
        });
    });

    describe("_processCode", () => {
        it("should date from state to exchange code request", async () => {
            // arrange
            Object.assign(stubState, {
                client_secret: "client_secret",
                redirect_uri: "redirect_uri",
                code_verifier: "code_verifier",
                extraTokenParams: { a: "a" },
            });
            const exchangeCodeMock = jest.spyOn(tokenClient, "exchangeCode")
                .mockImplementation(() => Promise.resolve({}));

            // act
            await subject._processCode(stubState, stubResponse);

            // assert
            expect(exchangeCodeMock).toBeCalledWith(
                expect.objectContaining({
                    client_id: stubState.client_id,
                    client_secret: stubState.client_secret,
                    redirect_uri: stubState.redirect_uri,
                    code_verifier: stubState.code_verifier,
                    ...stubState.extraTokenParams,
                }),
            );
        });

        it("should add code response to exchange code request", async () => {
            // arrange
            Object.assign(stubState, { code: "code" });
            const exchangeCodeMock = jest.spyOn(tokenClient, "exchangeCode")
                .mockImplementation(() => Promise.resolve({}));

            // act
            await subject._processCode(stubState, stubResponse);

            // assert
            expect(exchangeCodeMock).toBeCalledWith(
                expect.objectContaining({
                    code: stubResponse.code,
                }),
            );
        });

        it("should map token response data to response", async () => {
            // arrange
            const tokenResponse = {
                error: "error",
                error_description: "error_description",
                error_uri: "error_uri",
                id_token: "id_token",
                session_state: "session_state",
                access_token: "access_token",
                refresh_token: "refresh_token",
                token_type: "token_type",
                scope: "scope",
                expires_at: "expires_at",
            };
            jest.spyOn(tokenClient, "exchangeCode")
                .mockImplementation(() => Promise.resolve(tokenResponse));
            jest.spyOn(subject, "_validateIdTokenAttributes")
                .mockImplementation((response) => response);

            // act
            const result = await subject._processCode(stubState, stubResponse);

            // assert
            expect(result).toEqual(expect.objectContaining(tokenResponse));
        });

        it("should map token response expires_in to response", async () => {
            // arrange
            const tokenResponse = {
                expires_in: "42",
            };
            jest.spyOn(tokenClient, "exchangeCode")
                .mockImplementation(() => Promise.resolve(tokenResponse));
            jest.spyOn(subject, "_validateIdTokenAttributes")
                .mockImplementation((response) => response);

            // act
            const result = await subject._processCode(stubState, stubResponse);

            // assert
            expect(result).toEqual(expect.objectContaining({ expires_in: 42 }));
        });

        it("should validate id_token if token response has id_token", async () => {
            // arrange
            const tokenResponse = {
                id_token: "id_token",
            };
            jest.spyOn(tokenClient, "exchangeCode")
                .mockImplementation(() => Promise.resolve(tokenResponse));
            const validateIdTokenAttributesMock = jest.spyOn(subject, "_validateIdTokenAttributes")
                .mockImplementation((response) => response);

            // act
            await subject._processCode(stubState, stubResponse);

            // assert
            expect(validateIdTokenAttributesMock).toBeCalled();
        });
    });

    describe("_validateIdTokenAttributes", () => {
        it("should decode id_token and set profile", () => {
            // arrange
            const profile = { sub: "sub" };
            const id_token = "id_token";
            stubResponse.id_token = id_token;
            jest.spyOn(JwtUtils, "decode")
                .mockImplementation(() => profile);

            // act
            const result = subject._validateIdTokenAttributes(stubResponse, id_token);

            // assert
            expect(result.profile).toEqual(profile);
        });

        it("should fail if id_token does not contain sub", () => {
            // arrange
            const profile = { a: "a" };
            const id_token = "id_token";
            stubResponse.id_token = id_token;
            jest.spyOn(JwtUtils, "decode")
                .mockImplementation(() => profile);

            // act
            expect(() => subject._validateIdTokenAttributes(stubResponse, id_token))
                // assert
                .toThrow(Error);
        });
    });
});
