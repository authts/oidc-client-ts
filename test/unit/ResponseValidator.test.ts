// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, JoseUtil } from '../../src/utils';
import { ResponseValidator } from '../../src/ResponseValidator';
import { MetadataService } from '../../src/MetadataService';
import { UserInfoService } from '../../src/UserInfoService';

// TODO: port-ts - replace with jest.mock
class MockResponseValidator extends ResponseValidator {
    private _getSigningKeyForJwtSignedCalledCount: any;

    constructor(settings: any) {
        super(settings);
    }

    _mock(name: string, ...args: any[]) {
        Log.debug("mock called", name);

        // @ts-ignore
        this[name + "WasCalled"] = true;

        // @ts-ignore
        const result = this[name + "Result"]
        if (result) {
            Log.debug("mock returning result", result);
            return result;
        }

        Log.debug("mock calling super");
        // @ts-ignore
        return super[name](...args);
    }

    _processSigninParams(...args: any[]) {
        return this._mock("_processSigninParams", ...args);
    }
    _validateTokens(...args: any[]) {
        return this._mock("_validateTokens", ...args);
    }
    _processClaims(...args: any[]) {
        return this._mock("_processClaims", ...args);
    }
    _mergeClaims(...args: any[]) {
        return this._mock("_mergeClaims", ...args);
    }

    _getSigningKeyForJwt(...args: any[]) {
        this._getSigningKeyForJwtSignedCalledCount = (this._getSigningKeyForJwtSignedCalledCount || 0) + 1;
        return this._mock("_getSigningKeyForJwt", ...args);
    }
    _getSigningKeyForJwtWithSingleRetry(...args: any[]) {
        this._getSigningKeyForJwtSignedCalledCount = 0;
        return this._mock("_getSigningKeyForJwtWithSingleRetry", ...args);
    }

    _validateIdTokenAndAccessToken(...args: any[]) {
        return this._mock("_validateIdTokenAndAccessToken", ...args);
    }
    _validateIdToken(...args: any[]) {
        return this._mock("_validateIdToken", ...args);
    }
    validateJwt(...args: any[]) {
        return this._mock("validateJwt", ...args);
    }
    _validateAccessToken(...args: any[]) {
        return this._mock("_validateAccessToken", ...args);
    }

    _filterProtocolClaims(...args: any[]) {
        return this._mock("_filterProtocolClaims", ...args);
    }
}

describe("ResponseValidator", () => {
    let id_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSIsImtpZCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSJ9.eyJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo0NDMzMy9jb3JlIiwiYXVkIjoianMudG9rZW5tYW5hZ2VyIiwiZXhwIjoxNDU5MTMwMjAxLCJuYmYiOjE0NTkxMjk5MDEsIm5vbmNlIjoiNzIyMTAwNTIwOTk3MjM4MiIsImlhdCI6MTQ1OTEyOTkwMSwiYXRfaGFzaCI6IkpnRFVDeW9hdEp5RW1HaWlXYndPaEEiLCJzaWQiOiIwYzVmMDYxZTYzOThiMWVjNmEwYmNlMmM5NDFlZTRjNSIsInN1YiI6Ijg4NDIxMTEzIiwiYXV0aF90aW1lIjoxNDU5MTI5ODk4LCJpZHAiOiJpZHNydiIsImFtciI6WyJwYXNzd29yZCJdfQ.f6S1Fdd0UQScZAFBzXwRiVsUIPQnWZLSe07kdtjANRZDZXf5A7yDtxOftgCx5W0ONQcDFVpLGPgTdhp7agZkPpCFutzmwr0Rr9G7E7mUN4xcIgAABhmRDfzDayFBEu6VM8wEWTChezSWtx2xG_2zmVJxxmNV0jvkaz0bu7iin-C_UZg6T-aI9FZDoKRGXZP9gF65FQ5pQ4bCYQxhKcvjjUfs0xSHGboL7waN6RfDpO4vvVR1Kz-PQhIRyFAJYRuoH4PdMczHYtFCb-k94r-7TxEU0vp61ww4WntbPvVWwUbCUgsEtmDzAZT-NEJVhWztNk1ip9wDPXzZ2hEhDAPJ7A";
    let access_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSIsImtpZCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSJ9.eyJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo0NDMzMy9jb3JlIiwiYXVkIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NDQzMzMvY29yZS9yZXNvdXJjZXMiLCJleHAiOjE0NTkxMzM1MDEsIm5iZiI6MTQ1OTEyOTkwMSwiY2xpZW50X2lkIjoianMudG9rZW5tYW5hZ2VyIiwic2NvcGUiOlsib3BlbmlkIiwicHJvZmlsZSIsImVtYWlsIiwicmVhZCIsIndyaXRlIl0sInN1YiI6Ijg4NDIxMTEzIiwiYXV0aF90aW1lIjoxNDU5MTI5ODk4LCJpZHAiOiJpZHNydiIsImFtciI6WyJwYXNzd29yZCJdfQ.ldCBx4xF_WIj6S9unppYAzXFKMs5ce7sKuse-nleFbzwRbZ-VNubLOlnpsFzquJIyTlGLekqLWnsfpAmaORQBtv5ZoaUHxC_s5APLWGC9Io19tF8NxWVmX2OK3cwHWQ5HtFkILQdYR9l3Bf5RIQK4ixbrKJN7OyzoLAen0FgEXDn-dXMAhFJDl123G7pBaayQb8ic44y808cfKlu3wwP2QkDEzgW-L0avvjN95zji5528c32L2LBMveRklcOXO6Gb0alcFw6PysfJotsNo9WahJWu404mSl3Afc-4jCWjoTL7PBL-xciPmq9iCNAgqVS7GN1s1WsnBW2R4kGLy-kcQ";
    let at_hash = "JgDUCyoatJyEmGiiWbwOhA";

    let stubState: any;
    let stubResponse: any;
    let settings: any;
    let subject: MockResponseValidator;

    let metadataService: MetadataService;
    let userInfoService: UserInfoService;



    beforeEach(() => {
        Log.logger = console;
        Log.level = Log.NONE;

        stubState = {
            id: "the_id",
            nonce: "7221005209972382",
            data: { some: 'data' },
            client_id: "client",
            authority: "op"
        };
        stubResponse = {
            state: 'the_id',
            isOpenIdConnect: false
        };

        settings = {
            authority: "op",
            client_id: 'client'
        };

        // restore spyOn
        jest.restoreAllMocks();

        subject = new MockResponseValidator(settings);

        // access private members
        metadataService = subject["_metadataService"];
        userInfoService = subject["_userInfoService"];
    });

    describe("validateSignoutResponse", () => {

        it("should validate that the client state matches response state", async () => {
            // arrange
            stubResponse.state = "not_the_id";

            // act
            try {
                await subject.validateSignoutResponse(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('match');
            }
        });

        it("should fail on error response", async () => {
            // arrange
            stubResponse.error = "some_error";

            // act
            try {
                await subject.validateSignoutResponse(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.error).toEqual('some_error');
            }
        });

        it("should return data for error responses", async () => {
            // arrange
            stubResponse.error = "some_error";

            // act
            try {
                await subject.validateSignoutResponse(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.state).toEqual({ some: 'data' });
            }
        });

        it("should return data for successful responses", async () => {
            // act
            const response = await subject.validateSignoutResponse(stubState, stubResponse);

            // assert
            expect(response.state).toEqual({ some: 'data' });
        });
    });

    describe("validateSigninResponse", () => {

        it("should process signin params", async () => {
            // arrange
            // @ts-ignore
            subject._processSigninParamsResult = Promise.resolve(stubResponse);
            // @ts-ignore
            subject._validateTokensResult = Promise.resolve(stubResponse);

            // act
            await subject.validateSigninResponse(stubState, stubResponse);

            // assert
            // @ts-ignore
            expect(subject._processSigninParamsWasCalled).toEqual(true);
        });

        it("should validate tokens", async () => {
            // arrange
            // @ts-ignore
            subject._processSigninParamsResult = Promise.resolve(stubResponse);
            // @ts-ignore
            subject._validateTokensResult = Promise.resolve(stubResponse);

            // act
            await subject.validateSigninResponse(stubState, stubResponse);

            // assert
            // @ts-ignore
            expect(subject._validateTokensWasCalled).toEqual(true);
        });

        it("should not validate tokens if state fails", async () => {
            // arrange
            // @ts-ignore
            subject._processSigninParamsResult = Promise.reject("error");
            // @ts-ignore
            subject._validateTokensResult = Promise.resolve(stubResponse);

            // act
            try {
                await subject.validateSigninResponse(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                // @ts-ignore
                expect(subject._validateTokensWasCalled).toBeUndefined();
            }
        });

        it("should process claims", async () => {
            // arrange
            // @ts-ignore
            subject._processSigninParamsResult = Promise.resolve(stubResponse);
            // @ts-ignore
            subject._validateTokensResult = Promise.resolve(stubResponse);

            // act
            await subject.validateSigninResponse(stubState, stubResponse);

            // assert
            // @ts-ignore
            expect(subject._processClaimsWasCalled).toEqual(true);
        });

        it("should not process claims if state fails", async () => {
            // arrange
            // @ts-ignore
            subject._processSigninParamsResult = Promise.resolve(stubResponse);
            // @ts-ignore
            subject._validateTokensResult = Promise.reject("error");

            // act
            try {
                await subject.validateSigninResponse(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                // @ts-ignore
                expect(subject._processClaimsWasCalled).toBeUndefined();
            }
        });
    });

    describe("_processSigninParams", () => {

        it("should fail if no authority on state", async () => {
            // arrange
            delete stubState.authority;

            // act
            try {
                await subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('authority');
            }
        });

        it("should fail if no client_id on state", async () => {
            // arrange
            delete stubState.client_id;

            // act
            try {
                await subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('client_id');
            }
        });

        it("should fail if the authority on the state is not the same as the settings", async () => {
            // arrange
            stubState.authority = "something different";

            // act
            try {
                await subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('authority mismatch');
            }
        });

        it("should fail if the client_id on the state is not the same as the settings", async () => {
            // arrange
            stubState.client_id = "something different";

            // act
            try {
                await subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('client_id mismatch');
            }
        });

        it("should assign the authority on the settings if not already assigned", async () => {
            // arrange
            delete settings.authority;
            stubState.authority = "something different";
            stubResponse.id_token = id_token;
            subject = new MockResponseValidator(settings);

            // act
            await subject._processSigninParams(stubState, stubResponse);

            // assert
            expect(settings.authority).toEqual("something different");
        });

        it("should assign the client_id on the settings if not already assigned", async () => {
            // arrange
            delete settings.client_id;
            stubState.client_id = "something different";
            stubResponse.id_token = id_token;
            subject = new MockResponseValidator(settings);

            // act
            await subject._processSigninParams(stubState, stubResponse);

            // assert
            expect(settings.client_id).toEqual("something different");
        });

        it("should validate that the client state matches response state", async () => {
            // arrange
            stubResponse.state = "not_the_id";

            // act
            try {
                await subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('match');
            }
        });

        it("should fail on error response", async () => {
            // arrange
            stubResponse.error = "some_error";

            // act
            try {
                await subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.error).toEqual("some_error");
            }
        });

        it("should return data for error responses", async () => {
            // arrange
            stubResponse.error = "some_error";

            // act
            try {
                await subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.state).toEqual({ some: 'data' });
            }
        });

        it("should fail if request was OIDC but no id_token in response", async () => {
            // arrange
            delete stubResponse.id_token;
            stubResponse.isOpenIdConnect = true;

            // act
            try {
                await subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("id_token");
            }
        });

        it("should fail if request was not OIDC but id_token in response", async () => {
            // arrange
            delete stubState.nonce;
            stubResponse.id_token = id_token;

            // act
            try {
                await subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("id_token");
            }
        });

        it("should fail if request was code flow but no code in response", async () => {
            // arrange
            stubResponse.id_token = id_token;
            stubState.code_verifier = "secret";
            delete stubResponse.code;

            // act
            try {
                await subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("code");
            }
        });

        it("should fail if request was not code flow no code in response", async () => {
            // arrange
            stubResponse.id_token = id_token;
            stubResponse.code = "code";

            // act
            try {
                await subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("code");
            }
        });

        it("should return data for successful responses", async () => {
            // arrange
            stubResponse.id_token = id_token;

            // act
            const response = await subject._processSigninParams(stubState, stubResponse);

            // assert
            expect(response.state).toEqual({ some: 'data' });
        });
    });

    describe("_processClaims", () => {

        it("should filter protocol claims if OIDC", async () => {
            // arrange
            stubResponse.isOpenIdConnect = true;
            stubResponse.profile = { a: 'apple', b: 'banana' };

            // act
            await subject._processClaims({}, stubResponse);

            // assert
            // @ts-ignore
            expect(subject._filterProtocolClaimsWasCalled).toEqual(true);
        });

        it("should not filter protocol claims if not OIDC", async () => {
            // arrange
            stubResponse.isOpenIdConnect = false;

            // act
            await subject._processClaims({}, stubResponse);

            // assert
            // @ts-ignore
            expect(subject._filterProtocolClaimsWasCalled).toBeUndefined();
        });

        it("should load and merge user info claims when loadUserInfo configured", async () => {
            // arrange
            settings.loadUserInfo = true;

            stubResponse.isOpenIdConnect = true;
            stubResponse.profile = { a: 'apple', b: 'banana' };
            stubResponse.access_token = "access_token";
            const getClaimMock = jest.spyOn(userInfoService, "getClaims").mockImplementation(() => Promise.resolve({ c: 'carrot' }));

            // act
            await subject._processClaims({}, stubResponse);

            // assert
            expect(getClaimMock).toBeCalled();
            // @ts-ignore
            expect(subject._mergeClaimsWasCalled).toEqual(true);
        });

        it("should not run if reqest was not openid", async () => {
            // arrange
            settings.loadUserInfo = true;

            stubResponse.isOpenIdConnect = false;
            stubResponse.profile = { a: 'apple', b: 'banana' };
            stubResponse.access_token = "access_token";
            const getClaimMock = jest.spyOn(userInfoService, "getClaims").mockImplementation(() => Promise.resolve({ c: 'carrot' }));

            // act
            await subject._processClaims({}, stubResponse);

            // assert
            expect(getClaimMock).not.toBeCalled();
        });

        it("should not load and merge user info claims when loadUserInfo not configured", async () => {
            // arrange
            settings.loadUserInfo = false;

            stubResponse.isOpenIdConnect = true;
            stubResponse.profile = { a: 'apple', b: 'banana' };
            stubResponse.access_token = "access_token";
            const getClaimMock = jest.spyOn(userInfoService, "getClaims").mockImplementation(() => Promise.resolve({ c: 'carrot' }));

            // act
            await subject._processClaims({}, stubResponse);

            // assert
            expect(getClaimMock).not.toBeCalled();
        });

        it("should not load user info claims if no access token", async () => {
            // arrange
            settings.loadUserInfo = true;

            stubResponse.isOpenIdConnect = true;
            stubResponse.profile = { a: 'apple', b: 'banana' };
            const getClaimMock = jest.spyOn(userInfoService, "getClaims").mockImplementation(() => Promise.resolve({ c: 'carrot' }));

            // act
            await subject._processClaims({}, stubResponse);

            // assert
            expect(getClaimMock).not.toBeCalled();
        });
    });

    describe("_mergeClaims", () => {

        it("should merge claims", () => {
            // arrange
            var c1 = { a: 'apple', b: 'banana' };
            var c2 = { c: 'carrot' };

            // act
            var result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: 'apple', c: 'carrot', b: 'banana' });
        });

        it("should not merge claims when claim types are objects", () => {
            // arrange
            var c1 = { custom: {'apple': 'foo', 'pear': 'bar'} };
            var c2 = { custom: {'apple': 'foo', 'orange': 'peel'}, b: 'banana' };

            // act
            var result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ custom: [{'apple': 'foo', 'pear': 'bar'}, {'apple': 'foo', 'orange': 'peel'}], b: 'banana' });
        });

        it("should merge claims when claim types are objects when mergeClaims settings is true", () => {
            // arrange
            settings.mergeClaims = true;

            var c1 = { custom: {'apple': 'foo', 'pear': 'bar'} };
            var c2 = { custom: {'apple': 'foo', 'orange': 'peel'}, b: 'banana' };

            // act
            var result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ custom: {'apple': 'foo', 'pear': 'bar', 'orange': 'peel'}, b: 'banana' });
        });

        it("should merge same claim types into array", () => {
            // arrange
            var c1 = { a: 'apple', b: 'banana' };
            var c2 = { a: 'carrot' };

            // act
            var result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: ['apple', 'carrot'], b: 'banana' });
        });

        it("should merge arrays of same claim types into array", () => {
            // arrange
            const c1 = { a: 'apple', b: 'banana' };
            const c2 = { a: ['carrot', 'durian'] };

            // act
            var result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: ['apple', 'carrot', 'durian'], b: 'banana' });

            // arrange
            const d1 = { a: ['apple', 'carrot'], b: 'banana' };
            const d2 = { a: ['durian'] };

            // act
            var result = subject._mergeClaims(d1, d2);

            // assert
            expect(result).toEqual({ a: ['apple', 'carrot', 'durian'], b: 'banana' });

            // arrange
            const e1 = { a: ['apple', 'carrot'], b: 'banana' };
            const e2 = { a: 'durian' };

            // act
            var result = subject._mergeClaims(e1, e2);

            // assert
            expect(result).toEqual({ a: ['apple', 'carrot', 'durian'], b: 'banana' });
        });

        it("should remove duplicates when producing arrays", () => {
            // arrange
            var c1 = { a: 'apple', b: 'banana' };
            var c2 = { a: ['apple', 'durian'] };

            // act
            var result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: ['apple', 'durian'], b: 'banana' });
        });

        it("should not add if already present in array", () => {
            // arrange
            var c1 = { a: ['apple', 'durian'], b: 'banana' };
            var c2 = { a: 'apple' };

            // act
            var result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: ['apple', 'durian'], b: 'banana' });
        });
    });

    describe("_filterProtocolClaims", () => {

        it("should filter protocol claims if enabled on settings", () => {
            // arrange
            settings.filterProtocolClaims = true;
            let claims = {
                foo: 1, bar: 'test',
                aud: 'some_aud', iss: 'issuer',
                sub: '123', email: 'foo@gmail.com',
                role: ['admin', 'dev'],
                nonce: 'nonce', at_hash: "athash",
                iat: 5, nbf: 10, exp: 20
            };

            // act
            var result = subject._filterProtocolClaims(claims);

            // assert
            expect(result).toEqual({
                foo: 1, bar: 'test',
                sub: '123', email: 'foo@gmail.com',
                role: ['admin', 'dev']
            });
        });

        it("should not filter protocol claims if not enabled on settings", () => {
            // arrange
            settings.filterProtocolClaims = false;
            let claims = {
                foo: 1, bar: 'test',
                aud: 'some_aud', iss: 'issuer',
                sub: '123', email: 'foo@gmail.com',
                role: ['admin', 'dev'],
                nonce: 'nonce', at_hash: "athash",
                iat: 5, nbf: 10, exp: 20
            };

            // act
            var result = subject._filterProtocolClaims(claims);

            // assert
            expect(result).toEqual({
                foo: 1, bar: 'test',
                aud: 'some_aud', iss: 'issuer',
                sub: '123', email: 'foo@gmail.com',
                role: ['admin', 'dev'],
                nonce: 'nonce', at_hash: "athash",
                iat: 5, nbf: 10, exp: 20
            });
        });
    });

    describe("_validateTokens", () => {

        it("should validate id_token and access_token", async () => {
            // arrange
            stubResponse.id_token = "id_token";
            stubResponse.access_token = "access_token";
            // @ts-ignore
            subject._validateIdTokenAndAccessTokenResult = Promise.resolve(stubResponse);

            // act
            subject._validateTokens(stubState, stubResponse);

            // assert
            // @ts-ignore
            expect(subject._validateIdTokenAndAccessTokenWasCalled).toEqual(true);
            // @ts-ignore
            expect(subject._validateIdTokenWasCalled).toBeUndefined();
        });

        it("should validate just id_token", async () => {
            // arrange
            stubResponse.id_token = "id_token";
            // @ts-ignore
            subject._validateIdTokenResult = Promise.resolve(stubResponse);

            // act
            subject._validateTokens(stubState, stubResponse);

            // assert
            // @ts-ignore
            expect(subject._validateIdTokenWasCalled).toEqual(true);
            // @ts-ignore
            expect(subject._validateIdTokenAndAccessTokenWasCalled).toBeUndefined();
        });

        it("should not validate if only access_token", async () => {
            // arrange
            stubResponse.access_token = "access_token";

            // act
            subject._validateTokens(stubState, stubResponse);

            // assert
            // @ts-ignore
            expect(subject._validateIdTokenWasCalled).toBeUndefined();
            // @ts-ignore
            expect(subject._validateIdTokenAndAccessTokenWasCalled).toBeUndefined();
        });
    });

    describe("_validateIdTokenAndAccessToken", () => {

        it("should validate id_token and access_token", async () => {
            // arrange
            stubResponse.id_token = id_token;
            stubResponse.access_token = access_token;
            stubResponse.profile = {
                at_hash: at_hash
            };
            // @ts-ignore
            subject._validateIdTokenResult = Promise.resolve(stubResponse);
            // @ts-ignore
            subject._validateAccessTokenResult = Promise.resolve(stubResponse);

            // act
            await subject._validateIdTokenAndAccessToken(stubState, stubResponse);

            // assert
            // @ts-ignore
            expect(subject._validateIdTokenWasCalled).toEqual(true);
            // @ts-ignore
            expect(subject._validateAccessTokenWasCalled).toEqual(true);
        });

        it("should not access_token if id_token validation fails", async () => {
            // arrange
            stubResponse.id_token = "id_token";
            stubResponse.access_token = "access_token";
            // @ts-ignore
            subject._validateIdTokenResult = Promise.reject(new Error("error"));

            // act
            try {
                await subject._validateIdTokenAndAccessToken(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                // @ts-ignore
                expect(subject._validateIdTokenWasCalled).toEqual(true);
                // @ts-ignore
                expect(subject._validateAccessTokenWasCalled).toBeUndefined();
            }
        });
    });

    describe("_getSigningKeyForJwt", () => {

        it("should fail if loading keys fails.", async () => {
            // arrange
            const jwt = { header: { kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE' }};
            jest.spyOn(metadataService, "getSigningKeys").mockRejectedValue(new Error("keys"));

            // act
            try {
                await subject._getSigningKeyForJwt(jwt);
                fail("should not come here")
            } catch (err) {
                expect(err.message).toContain('keys');
            }
        })

        it("should fetch suitable signing key for the jwt.", async () => {
            // arrange
            const jwt = { header: { kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE' }};
            const keys = [{ kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE' }, { kid: 'other_key' } ];
            jest.spyOn(metadataService, "getSigningKeys").mockImplementation(() => Promise.resolve(keys));

            // act
            const result = await subject._getSigningKeyForJwt(jwt);

            // assert
            expect(result).toEqual({ kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE' });
        })
    })

    describe("_getSigningKeyForJwtWithSingleRetry", () => {

        it("should retry once if suitable signing key is not found.", async () => {
            // arrange
            const jwt = { header: { kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE' }};
            const keys = [{ kid: 'other_key' }];
            jest.spyOn(metadataService, "getSigningKeys").mockImplementation(() => Promise.resolve(keys));

            // act
            await subject._getSigningKeyForJwtWithSingleRetry(jwt);

            // assert
            // @ts-ignore
            expect(subject._getSigningKeyForJwtSignedCalledCount).toEqual(2);
        })

        it("should not retry if suitable signing key is found.", async () => {
            // arrange
            const jwt = { header: { kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE' }};
            const keys = [{ kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE' }];
            jest.spyOn(metadataService, "getSigningKeys").mockImplementation(() => Promise.resolve(keys));

            // act
            await subject._getSigningKeyForJwtWithSingleRetry(jwt);

            // assert
            // @ts-ignore
            expect(subject._getSigningKeyForJwtSignedCalledCount).toEqual(1);
        })
    })

    describe("_validateIdToken", () => {

        it("should fail if no nonce on state", async () => {
            // arrange
            delete stubState.nonce;
            stubResponse.id_token = id_token;

            // act
            try {
                await subject._validateIdToken(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('nonce');
            }
        });

        it("should fail if invalid id_token", async () => {
            // act
            try {
                await subject._validateIdToken(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('id_token');
            }
        });

        it("should fail if audience doesn't match id_token", async () => {
            // arrange
            stubState.client_id = "invalid client_id";
            stubResponse.id_token = id_token;
            jest.spyOn(metadataService, "getIssuer").mockRejectedValue(new Error("test"));
            const keys = [{ kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE' }];
            jest.spyOn(metadataService, "getSigningKeys").mockImplementation(() => Promise.resolve(keys));

            // act
            try {
                await subject._validateIdToken(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
            }
        });

        it("should fail if nonce doesn't match id_token", async () => {
            // arrange
            stubState.nonce = "invalid nonce";
            stubResponse.id_token = id_token;
            jest.spyOn(JoseUtil, "parseJwt").mockImplementation(() => {
                return { header: { alg: "HS123", typ: "JWT" }, payload: { } };
            });

            // act
            try {
                await subject._validateIdToken(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('nonce');
            }
        });

        it("should fail if issuer fails", async () => {
            // arrange
            stubState.nonce = "nonce";
            stubResponse.id_token = id_token;
            jest.spyOn(metadataService, "getIssuer").mockRejectedValue(new Error("issuer"));
            jest.spyOn(JoseUtil, "parseJwt").mockImplementation(() => {
                return { header: { alg: "HS123", typ: "JWT" }, payload: { nonce: stubState.nonce } };
            });

            // act
            try {
                await subject._validateIdToken(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('issuer');
            }
        });

        it("should fail if loading keys fails", async () => {
            // arrange
            stubState.nonce = "nonce";
            stubResponse.id_token = id_token;
            jest.spyOn(metadataService, "getIssuer").mockImplementation(() => Promise.resolve("test"));
            jest.spyOn(metadataService, "getSigningKeys").mockRejectedValue(new Error("keys"));
            jest.spyOn(JoseUtil, "parseJwt").mockImplementation(() => {
                return { header: { alg: "HS123", typ: "JWT" }, payload: { nonce: stubState.nonce } };
            });

            // act
            try {
                await subject._validateIdToken(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('keys');
            }
        });

        it("should fail if no matching key found in signing keys", async () => {
            // arrange
            stubState.nonce = "nonce";
            stubResponse.id_token = id_token;
            jest.spyOn(metadataService, "getIssuer").mockImplementation(() => Promise.resolve("test"));
            jest.spyOn(metadataService, "getSigningKeys").mockImplementation(() => Promise.resolve([]));
            jest.spyOn(JoseUtil, "parseJwt").mockImplementation(() => {
                return { header: { alg: "HS123", typ: "JWT" }, payload: { nonce: stubState.nonce } };
            });

            // act
            try {
                await subject._validateIdToken(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain('kid');
            }
        });

        it("should validate JWT", async () => {
            // arrange
            stubState.nonce = "nonce";
            stubResponse.id_token = id_token;
            jest.spyOn(metadataService, "getIssuer").mockImplementation(() => Promise.resolve("test"));
            const keys = [{ kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE', kty: "EC" }];
            jest.spyOn(metadataService, "getSigningKeys").mockImplementation(() => Promise.resolve(keys));
            const validateJwtMock = jest.spyOn(JoseUtil, "validateJwt").mockImplementation(() => {
                return Promise.resolve();
            });
            jest.spyOn(JoseUtil, "parseJwt").mockImplementation(() => {
                return { header: { alg: "ES123", typ: "JWT" }, payload: { nonce: stubState.nonce, sub: "sub" } };
            });

            // act
            await subject._validateIdToken(stubState, stubResponse);

            // assert
            expect(validateJwtMock).toHaveBeenCalled();
        });

        it("should set profile on result if successful", async () => {
            // arrange
            stubState.nonce = "nonce";
            stubResponse.id_token = id_token;
            jest.spyOn(metadataService, "getIssuer").mockImplementation(() => Promise.resolve("test"));
            const keys = [{ kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE', kty: "EC" }];
            jest.spyOn(metadataService, "getSigningKeys").mockImplementation(() => Promise.resolve(keys));
            jest.spyOn(JoseUtil, "validateJwt").mockImplementation(() => {
                return Promise.resolve();
            });
            jest.spyOn(JoseUtil, "parseJwt").mockImplementation(() => {
                return { header: { alg: "ES123", typ: "JWT" }, payload: { nonce: stubState.nonce, sub: "sub" } };
            });

            // act
            const response =  await subject._validateIdToken(stubState, stubResponse);

            // assert
            expect(response.profile).toBeDefined();
        });
    });

    describe("_validateAccessToken", () => {

        it("should require id_token", async () => {
            // arrange
            stubResponse.id_token = null;
            stubResponse.profile = {
                at_hash: at_hash
            };

            // act
            try {
                await subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("id_token");
            }
        });

        it("should require profile", async () => {
            // arrange
            stubResponse.id_token = id_token;
            stubResponse.profile = null;

            // act
            try {
                await subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("profile");
            }
        });

        it("should require at_hash on profile", async () => {
            // arrange
            stubResponse.id_token = id_token;
            stubResponse.profile = {
            };

            // act
            try {
                await subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("at_hash");
            }
        });

        it("should fail for invalid id_token", async () => {
            // arrange
            stubResponse.id_token = "bad";
            stubResponse.profile = {
                at_hash: at_hash
            };

            // act
            try {
                await subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("id_token");
            }
        });

        it("should require proper alg on id_token", async () => {
            // arrange
            stubResponse.id_token = "bad";
            stubResponse.profile = {
                at_hash: at_hash
            };
            jest.spyOn(JoseUtil, "parseJwt").mockImplementation(() => {
                return { header: { alg: "bad", typ: "JWT" }, payload: {} };
            });

            // act
            try {
                await subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("alg");
            }
        });

        it("should fail for invalid algs of incorrect bit lengths", async () => {
            // arrange
            stubResponse.id_token = id_token;
            stubResponse.access_token = access_token;
            stubResponse.profile = {
                at_hash: at_hash
            };
            jest.spyOn(JoseUtil, "parseJwt").mockImplementation(() => {
                return { header: { alg: "HS123", typ: "JWT" }, payload: {} };
            });

            // act
            try {
                await subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("alg");
            }
        });

        it("should fail for algs of not correct string length", async () => {
            // arrange
            stubResponse.id_token = id_token;
            stubResponse.access_token = access_token;
            stubResponse.profile = {
                at_hash: at_hash
            };
            jest.spyOn(JoseUtil, "parseJwt").mockImplementation(() => {
                return { header: { alg: "abc", typ: "JWT" }, payload: {} };
            });

            // act
            try {
                await subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("alg");
            }
        });

        it("should fail if at_hash does not match", async () => {
            // arrange
            stubResponse.id_token = id_token;
            stubResponse.access_token = access_token;
            stubResponse.profile = {
                at_hash: at_hash
            };
            jest.spyOn(JoseUtil, "parseJwt").mockImplementation(() => {
                return { header: { alg: "RS256", typ: "JWT" }, payload: {} };
            });
            jest.spyOn(JoseUtil, "hashString").mockImplementation(() => {
                return "hash";
            })
            jest.spyOn(JoseUtil, "hexToBase64Url").mockImplementation(() => {
                return "wrong";
            });

            // act
            try {
                await subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("at_hash");
            }
        });

        it("should validate at_hash", async () => {
            // arrange
            stubResponse.id_token = id_token;
            stubResponse.access_token = access_token;
            stubResponse.profile = {
                at_hash: at_hash
            };

            // act
            const response = await subject._validateAccessToken(stubResponse);

            // assert
            expect(response).toEqual(stubResponse);
        });
    });
});
