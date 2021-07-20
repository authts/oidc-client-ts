// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from '../../src/Log';
import { JoseUtil } from '../../src/JoseUtil';
import { ResponseValidator } from '../../src/ResponseValidator';

import { StubMetadataService } from './StubMetadataService';

// workaround jest parse error
jest.mock('../../jsrsasign/dist/jsrsasign.js', () => {
    return {
        jws: jest.fn(),
        KEYUTIL: jest.fn(),
        X509: jest.fn(),
        crypto: jest.fn(),
        hextob64u: jest.fn(),
        b64tohex: jest.fn()
    };
});

class MockJoseUtility {
    parseJwtWasCalled: any;
    parseJwtResult: any;
    validateJwtWasCalled: any;
    validateJwtResult: any;
    hashStringWasCalled: any;
    hashStringResult: any;
    hexToBase64UrlCalled: any;
    hexToBase64UrlResult: any;

    parseJwt(jwt: any) {
        this.parseJwtWasCalled = true;
        if (this.parseJwtResult) {
            Log.debug("MockJoseUtility.parseJwt", this.parseJwtResult)
            return this.parseJwtResult;
        }
        return JoseUtil.parseJwt(jwt);
    }

    validateJwt(jwt: any, key: string, issuer: string, audience: string, clockSkew: number, now?: number, timeInsensitive = false) {
        this.validateJwtWasCalled = true;
        if (this.validateJwtResult) {
            Log.debug("MockJoseUtility.validateJwt", this.validateJwtResult)
            return this.validateJwtResult;
        }
        return JoseUtil.validateJwt(jwt, key, issuer, audience, clockSkew, now, timeInsensitive);
    }

    hashString(value: any, alg: string) {
        this.hashStringWasCalled = true;
        if (this.hashStringResult) {
            Log.debug("MockJoseUtility.hashString", this.hashStringResult)
            return this.hashStringResult;
        }
        return JoseUtil.hashString(value, alg);
    }

    hexToBase64Url(value: any) {
        this.hexToBase64UrlCalled = true;
        if (this.hexToBase64UrlResult) {
            Log.debug("MockJoseUtility.hexToBase64Url", this.hexToBase64UrlResult)
            return this.hexToBase64UrlResult;
        }
        return JoseUtil.hexToBase64Url(value);
    }
}

class StubUserInfoService {
    getClaimsWasCalled: boolean;
    getClaimsResult: any;

    constructor() {
        this.getClaimsWasCalled = false;
    }

    getClaims() {
        this.getClaimsWasCalled = true;
        return this.getClaimsResult;
    }
}

// TODO: port-ts - replace with jest.mock
class MockResponseValidator extends ResponseValidator {
    private _getSigningKeyForJwtSignedCalledCount: any;

    constructor(settings: any, MetadataServiceCtor: any, UserInfoServiceCtor: any, joseUtil: any) {
        super(settings, MetadataServiceCtor, UserInfoServiceCtor, joseUtil);
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

    let settings: any;
    let subject: MockResponseValidator;
    let stubMetadataService: any;
    let stubUserInfoService: any;
    let mockJoseUtility: any;

    let stubState: any;
    let stubResponse: any;

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
        stubMetadataService = new StubMetadataService();
        stubUserInfoService = new StubUserInfoService();
        mockJoseUtility = new MockJoseUtility();

        subject = new MockResponseValidator(settings, () => stubMetadataService, () => stubUserInfoService, mockJoseUtility);
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
            subject = new MockResponseValidator(settings, () => stubMetadataService, () => stubUserInfoService, mockJoseUtility);

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
            subject = new MockResponseValidator(settings, () => stubMetadataService, () => stubUserInfoService, mockJoseUtility);

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
            stubUserInfoService.getClaimsResult = Promise.resolve({ c: 'carrot' });

            // act
            await subject._processClaims({}, stubResponse);

            // assert
            expect(stubUserInfoService.getClaimsWasCalled).toEqual(true);
            // @ts-ignore
            expect(subject._mergeClaimsWasCalled).toEqual(true);
        });

        it("should not run if reqest was not openid", async () => {
            // arrange
            settings.loadUserInfo = true;

            stubResponse.isOpenIdConnect = false;
            stubResponse.profile = { a: 'apple', b: 'banana' };
            stubResponse.access_token = "access_token";
            stubUserInfoService.getClaimsResult = Promise.resolve({ c: 'carrot' });

            // act
            await subject._processClaims({}, stubResponse);

            // assert
            expect(stubUserInfoService.getClaimsWasCalled).toEqual(false);
        });

        it("should not load and merge user info claims when loadUserInfo not configured", async () => {
            // arrange
            settings.loadUserInfo = false;

            stubResponse.isOpenIdConnect = true;
            stubResponse.profile = { a: 'apple', b: 'banana' };
            stubResponse.access_token = "access_token";
            stubUserInfoService.getClaimsResult = Promise.resolve({ c: 'carrot' });

            // act
            await subject._processClaims({}, stubResponse);

            // assert
            expect(stubUserInfoService.getClaimsWasCalled).toEqual(false);
        });

        it("should not load user info claims if no access token", async () => {
            // arrange
            settings.loadUserInfo = true;

            stubResponse.isOpenIdConnect = true;
            stubResponse.profile = { a: 'apple', b: 'banana' };
            stubUserInfoService.getClaimsResult = Promise.resolve({ c: 'carrot' });

            // act
            await subject._processClaims({}, stubResponse);

            // assert
            expect(stubUserInfoService.getClaimsWasCalled).toEqual(false);
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
            stubMetadataService.getSigningKeysResult = Promise.reject(new Error("keys"));

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
            stubMetadataService.getSigningKeysResult = Promise.resolve([{ kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE' }, { kid: 'other_key' } ])

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
            stubMetadataService.getSigningKeysResult = Promise.resolve([ { kid: 'other_key' } ])

            // act
            await subject._getSigningKeyForJwtWithSingleRetry(jwt);

            // assert
            // @ts-ignore
            expect(subject._getSigningKeyForJwtSignedCalledCount).toEqual(2);
        })

        it("should not retry if suitable signing key is found.", async () => {
            // arrange
            const jwt = { header: { kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE' }};
            stubMetadataService.getSigningKeysResult = Promise.resolve([ { kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE' } ])

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
            stubMetadataService.getIssuerResult = Promise.resolve("test");
            stubMetadataService.getSigningKeysResult = Promise.resolve([{ kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE' }]);

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
            mockJoseUtility.parseJwtResult = { header: { alg: "HS123" }, payload: "payload" };

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
            stubMetadataService.getIssuerResult = Promise.reject(new Error("issuer"));
            mockJoseUtility.parseJwtResult = { header: { alg: "HS123" }, payload: { nonce: stubState.nonce } };

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
            stubMetadataService.getIssuerResult = Promise.resolve("test");
            stubMetadataService.getSigningKeysResult = Promise.reject(new Error("keys"));
            mockJoseUtility.parseJwtResult = { header: { alg: "HS123" }, payload: { nonce: stubState.nonce } };

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
            stubMetadataService.getIssuerResult = Promise.resolve("test");
            stubMetadataService.getSigningKeysResult = Promise.resolve([]);
            mockJoseUtility.parseJwtResult = { header: { alg: "HS123" }, payload: { nonce: stubState.nonce } };

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
            stubMetadataService.getIssuerResult = Promise.resolve("test");
            stubMetadataService.getSigningKeysResult = Promise.resolve([{ kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE', kty: "EC" }]);
            mockJoseUtility.validateJwtResult = Promise.resolve();
            mockJoseUtility.parseJwtResult = { header: { alg: "ES123" }, payload: { nonce: stubState.nonce, sub: "sub" } };

            // act
            await subject._validateIdToken(stubState, stubResponse);

            // assert
            expect(mockJoseUtility.validateJwtWasCalled).toEqual(true);
        });

        it("should set profile on result if successful", async () => {
            // arrange
            stubState.nonce = "nonce";
            stubResponse.id_token = id_token;
            stubMetadataService.getIssuerResult = Promise.resolve("test");
            stubMetadataService.getSigningKeysResult = Promise.resolve([{ kid: 'a3rMUgMFv9tPclLa6yF3zAkfquE', kty: "EC" }]);
            mockJoseUtility.validateJwtResult = Promise.resolve();
            mockJoseUtility.parseJwtResult = { header: { alg: "ES123" }, payload: { nonce: stubState.nonce, sub: "sub" } };

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
            mockJoseUtility.parseJwtResult = { header: { alg: "bad" } };

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

            mockJoseUtility.parseJwtResult = { header: { alg: "HS123" } };

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

            mockJoseUtility.parseJwtResult = { header: { alg: "abc" } };

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
            mockJoseUtility.parseJwtResult = { header: { alg: "RS256" } };
            mockJoseUtility.hashStringResult = "hash";
            mockJoseUtility.hexToBase64UrlResult = "wrong";

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

            // TODO: port-ts - once jsrsasign is avaiable from jest this lines can be removed
            mockJoseUtility.parseJwtResult = { header: { alg: "ES512" } };
            mockJoseUtility.hashStringResult = "bla";
            mockJoseUtility.hexToBase64UrlResult = stubResponse.profile.at_hash;

            // act
            const response = await subject._validateAccessToken(stubResponse);

            // assert
            expect(response).toEqual(stubResponse);
        });
    });
});
