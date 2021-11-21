// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "./utils";
import { ResponseValidator } from "./ResponseValidator";
import { MetadataService } from "./MetadataService";
import type { UserInfoService } from "./UserInfoService";
import { SigninState } from "./SigninState";
import type { SigninResponse } from "./SigninResponse";
import type { ErrorResponse } from "./ErrorResponse";
import type { UserProfile } from "./User";

// access private methods
class ResponseValidatorWrapper extends ResponseValidator {
    public _processSigninParams(state: SigninState, response: SigninResponse) {
        return super._processSigninParams(state, response);
    }
    public async _processClaims(state: SigninState, response: SigninResponse) {
        return super._processClaims(state, response);
    }
    public _mergeClaims(claims1: UserProfile, claims2: any) {
        return super._mergeClaims(claims1, claims2);
    }
    public _filterProtocolClaims(claims: UserProfile) {
        return super._filterProtocolClaims(claims);
    }
    public _validateTokens(state: SigninState, response: SigninResponse) {
        return super._validateTokens(state, response);
    }
    public async _processCode(state: SigninState, response: SigninResponse) {
        return super._processCode(state, response);
    }
    public async _validateIdTokenAttributes(state: SigninState, response: SigninResponse, id_token: string) {
        return super._validateIdTokenAttributes(state, response, id_token);
    }
}

describe("ResponseValidator", () => {
    let stubState: any;
    let stubResponse: any;
    let settings: any;
    let subject: ResponseValidatorWrapper;

    let metadataService: MetadataService;
    let userInfoService: UserInfoService;

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
            state_id: "the_id",
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

        // access private members
        userInfoService = subject["_userInfoService"];
    });

    describe("validateSignoutResponse", () => {

        it("should validate that the client state matches response state", () => {
            // arrange
            stubResponse.state_id = "not_the_id";

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
            stubResponse.state_id = "not_the_id";

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

        it("should load and merge user info claims when loadUserInfo configured", async () => {
            // arrange
            const state = new SigninState({
                authority: "authority",
                client_id: "client",
                redirect_uri: "http://cb",
                scope: "scope",
                request_type: "type"
            });
            settings.loadUserInfo = true;
            stubResponse.isOpenIdConnect = true;
            stubResponse.profile = { a: "apple", b: "banana" };
            stubResponse.access_token = "access_token";
            const getClaimMock = jest.spyOn(userInfoService, "getClaims")
                .mockImplementation(() => Promise.resolve({ c: "carrot" } as any));
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
                request_type: "type"
            });
            settings.loadUserInfo = true;
            stubResponse.isOpenIdConnect = false;
            stubResponse.profile = { a: "apple", b: "banana" };
            stubResponse.access_token = "access_token";
            const getClaimMock = jest.spyOn(userInfoService, "getClaims")
                .mockImplementation(() => Promise.resolve({ c: "carrot" } as any));

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
                request_type: "type"
            });
            settings.loadUserInfo = false;
            stubResponse.isOpenIdConnect = true;
            stubResponse.profile = { a: "apple", b: "banana" };
            stubResponse.access_token = "access_token";
            const getClaimMock = jest.spyOn(userInfoService, "getClaims")
                .mockImplementation(() => Promise.resolve({ c: "carrot" } as any));

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
                request_type: "type"
            });
            settings.loadUserInfo = true;
            stubResponse.isOpenIdConnect = true;
            stubResponse.profile = { a: "apple", b: "banana" };
            const getClaimMock = jest.spyOn(userInfoService, "getClaims")
                .mockImplementation(() => Promise.resolve({ c: "carrot" } as any));

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
            settings.mergeClaims = true;

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
