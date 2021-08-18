// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, JoseUtil } from "../../src/utils";
import { ResponseValidator } from "../../src/ResponseValidator";
import { MetadataService } from "../../src/MetadataService";
import { UserInfoService } from "../../src/UserInfoService";
import { SigninState } from "../../src/SigninState";
import { SigninResponse } from "../../src/SigninResponse";

// access private methods
class ResponseValidatorWrapper extends ResponseValidator {
    public _processSigninParams(state: SigninState, response: SigninResponse) {
        return super._processSigninParams(state, response);
    }
    public async _processClaims(state: SigninState, response: SigninResponse) {
        return super._processClaims(state, response);
    }
    public _mergeClaims(claims1: any, claims2: any) {
        return super._mergeClaims(claims1, claims2);
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
    public async _validateIdTokenAttributes(state: SigninState, response: SigninResponse) {
        return super._validateIdTokenAttributes(state, response);
    }
    public async _validateIdTokenAndAccessToken(state: SigninState, response: SigninResponse) {
        return super._validateIdTokenAndAccessToken(state, response);
    }
    public async _getSigningKeyForJwt(jwt: any) {
        return super._getSigningKeyForJwt(jwt);
    }
    public async _getSigningKeyForJwtWithSingleRetry(jwt: any) {
        return super._getSigningKeyForJwtWithSingleRetry(jwt);
    }
    public async _validateIdToken(state: SigninState, response: SigninResponse) {
        return super._validateIdToken(state, response);
    }
    public _filterByAlg(keys: any[], alg: string) {
        return super._filterByAlg(keys, alg);
    }
    public _validateAccessToken(response: SigninResponse) {
        return super._validateAccessToken(response);
    }
}

describe("ResponseValidator", () => {
    const id_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSIsImtpZCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSJ9.eyJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo0NDMzMy9jb3JlIiwiYXVkIjoianMudG9rZW5tYW5hZ2VyIiwiZXhwIjoxNDU5MTMwMjAxLCJuYmYiOjE0NTkxMjk5MDEsIm5vbmNlIjoiNzIyMTAwNTIwOTk3MjM4MiIsImlhdCI6MTQ1OTEyOTkwMSwiYXRfaGFzaCI6IkpnRFVDeW9hdEp5RW1HaWlXYndPaEEiLCJzaWQiOiIwYzVmMDYxZTYzOThiMWVjNmEwYmNlMmM5NDFlZTRjNSIsInN1YiI6Ijg4NDIxMTEzIiwiYXV0aF90aW1lIjoxNDU5MTI5ODk4LCJpZHAiOiJpZHNydiIsImFtciI6WyJwYXNzd29yZCJdfQ.f6S1Fdd0UQScZAFBzXwRiVsUIPQnWZLSe07kdtjANRZDZXf5A7yDtxOftgCx5W0ONQcDFVpLGPgTdhp7agZkPpCFutzmwr0Rr9G7E7mUN4xcIgAABhmRDfzDayFBEu6VM8wEWTChezSWtx2xG_2zmVJxxmNV0jvkaz0bu7iin-C_UZg6T-aI9FZDoKRGXZP9gF65FQ5pQ4bCYQxhKcvjjUfs0xSHGboL7waN6RfDpO4vvVR1Kz-PQhIRyFAJYRuoH4PdMczHYtFCb-k94r-7TxEU0vp61ww4WntbPvVWwUbCUgsEtmDzAZT-NEJVhWztNk1ip9wDPXzZ2hEhDAPJ7A";
    const access_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSIsImtpZCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSJ9.eyJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo0NDMzMy9jb3JlIiwiYXVkIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NDQzMzMvY29yZS9yZXNvdXJjZXMiLCJleHAiOjE0NTkxMzM1MDEsIm5iZiI6MTQ1OTEyOTkwMSwiY2xpZW50X2lkIjoianMudG9rZW5tYW5hZ2VyIiwic2NvcGUiOlsib3BlbmlkIiwicHJvZmlsZSIsImVtYWlsIiwicmVhZCIsIndyaXRlIl0sInN1YiI6Ijg4NDIxMTEzIiwiYXV0aF90aW1lIjoxNDU5MTI5ODk4LCJpZHAiOiJpZHNydiIsImFtciI6WyJwYXNzd29yZCJdfQ.ldCBx4xF_WIj6S9unppYAzXFKMs5ce7sKuse-nleFbzwRbZ-VNubLOlnpsFzquJIyTlGLekqLWnsfpAmaORQBtv5ZoaUHxC_s5APLWGC9Io19tF8NxWVmX2OK3cwHWQ5HtFkILQdYR9l3Bf5RIQK4ixbrKJN7OyzoLAen0FgEXDn-dXMAhFJDl123G7pBaayQb8ic44y808cfKlu3wwP2QkDEzgW-L0avvjN95zji5528c32L2LBMveRklcOXO6Gb0alcFw6PysfJotsNo9WahJWu404mSl3Afc-4jCWjoTL7PBL-xciPmq9iCNAgqVS7GN1s1WsnBW2R4kGLy-kcQ";
    const at_hash = "JgDUCyoatJyEmGiiWbwOhA";

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
            nonce: "7221005209972382",
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

        // access private members
        userInfoService = subject["_userInfoService"];
    });

    describe("validateSignoutResponse", () => {

        it("should validate that the client state matches response state", () => {
            // arrange
            stubResponse.state = "not_the_id";

            // act
            try {
                subject.validateSignoutResponse(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("match");
            }
        });

        it("should fail on error response", () => {
            // arrange
            stubResponse.error = "some_error";

            // act
            try {
                subject.validateSignoutResponse(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.error).toEqual("some_error");
            }
        });

        it("should return data for error responses", () => {
            // arrange
            stubResponse.error = "some_error";

            // act
            try {
                subject.validateSignoutResponse(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.state).toEqual({ some: "data" });
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
            } catch (err) {
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
                .mockImplementation(() => Promise.reject("error"));
            const _processClaimsMock = jest.spyOn(subject, "_processClaims")
                .mockImplementation(() => Promise.resolve(stubResponse));

            // act
            try {
                await subject.validateSigninResponse(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
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
            } catch (err) {
                expect(err.message).toContain("authority");
            }
        });

        it("should fail if no client_id on state", () => {
            // arrange
            delete stubState.client_id;

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("client_id");
            }
        });

        it("should fail if the authority on the state is not the same as the settings", () => {
            // arrange
            stubState.authority = "something different";

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("authority mismatch");
            }
        });

        it("should fail if the client_id on the state is not the same as the settings", () => {
            // arrange
            stubState.client_id = "something different";

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("client_id mismatch");
            }
        });

        it("should validate that the client state matches response state", () => {
            // arrange
            stubResponse.state = "not_the_id";

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("match");
            }
        });

        it("should fail on error response", () => {
            // arrange
            stubResponse.error = "some_error";

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.error).toEqual("some_error");
            }
        });

        it("should return data for error responses", () => {
            // arrange
            stubResponse.error = "some_error";

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.state).toEqual({ some: "data" });
            }
        });

        it("should fail if request was OIDC but no id_token in response", () => {
            // arrange
            delete stubResponse.id_token;
            stubResponse.isOpenIdConnect = true;

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("id_token");
            }
        });

        it("should fail if request was not OIDC but id_token in response", () => {
            // arrange
            delete stubState.nonce;
            stubResponse.id_token = id_token;

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("id_token");
            }
        });

        it("should fail if request was code flow but no code in response", () => {
            // arrange
            stubResponse.id_token = id_token;
            stubState.code_verifier = "secret";
            delete stubResponse.code;

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("code");
            }
        });

        it("should fail if request was not code flow no code in response", () => {
            // arrange
            stubResponse.id_token = id_token;
            stubResponse.code = "code";

            // act
            try {
                subject._processSigninParams(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("code");
            }
        });

        it("should return data for successful responses", () => {
            // arrange
            stubResponse.id_token = id_token;

            // act
            const response = subject._processSigninParams(stubState, stubResponse);

            // assert
            expect(response.state).toEqual({ some: "data" });
        });
    });

    describe("_processClaims", () => {

        it("should filter protocol claims if OIDC", async () => {
            // arrange
            const state = new SigninState();
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
            const state = new SigninState();
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
            const state = new SigninState();
            settings.loadUserInfo = true;
            stubResponse.isOpenIdConnect = true;
            stubResponse.profile = { a: "apple", b: "banana" };
            stubResponse.access_token = "access_token";
            const getClaimMock = jest.spyOn(userInfoService, "getClaims").mockImplementation(() => Promise.resolve({ c: "carrot" }));
            const _mergeClaimsMock = jest.spyOn(subject, "_mergeClaims")
                .mockImplementation((profile) => profile);

            // act
            await subject._processClaims(state, stubResponse);

            // assert
            expect(getClaimMock).toBeCalled();
            expect(_mergeClaimsMock).toBeCalled();
        });

        it("should not run if reqest was not openid", async () => {
            // arrange
            const state = new SigninState();
            settings.loadUserInfo = true;
            stubResponse.isOpenIdConnect = false;
            stubResponse.profile = { a: "apple", b: "banana" };
            stubResponse.access_token = "access_token";
            const getClaimMock = jest.spyOn(userInfoService, "getClaims").mockImplementation(() => Promise.resolve({ c: "carrot" }));

            // act
            await subject._processClaims(state, stubResponse);

            // assert
            expect(getClaimMock).not.toBeCalled();
        });

        it("should not load and merge user info claims when loadUserInfo not configured", async () => {
            // arrange
            const state = new SigninState();
            settings.loadUserInfo = false;
            stubResponse.isOpenIdConnect = true;
            stubResponse.profile = { a: "apple", b: "banana" };
            stubResponse.access_token = "access_token";
            const getClaimMock = jest.spyOn(userInfoService, "getClaims").mockImplementation(() => Promise.resolve({ c: "carrot" }));

            // act
            await subject._processClaims(state, stubResponse);

            // assert
            expect(getClaimMock).not.toBeCalled();
        });

        it("should not load user info claims if no access token", async () => {
            // arrange
            const state = new SigninState();
            settings.loadUserInfo = true;
            stubResponse.isOpenIdConnect = true;
            stubResponse.profile = { a: "apple", b: "banana" };
            const getClaimMock = jest.spyOn(userInfoService, "getClaims").mockImplementation(() => Promise.resolve({ c: "carrot" }));

            // act
            await subject._processClaims(state, stubResponse);

            // assert
            expect(getClaimMock).not.toBeCalled();
        });
    });

    describe("_mergeClaims", () => {

        it("should merge claims", () => {
            // arrange
            const c1 = { a: "apple", b: "banana" };
            const c2 = { c: "carrot" };

            // act
            const result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: "apple", c: "carrot", b: "banana" });
        });

        it("should not merge claims when claim types are objects", () => {
            // arrange
            const c1 = { custom: {"apple": "foo", "pear": "bar"} };
            const c2 = { custom: {"apple": "foo", "orange": "peel"}, b: "banana" };

            // act
            const result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ custom: [{"apple": "foo", "pear": "bar"}, {"apple": "foo", "orange": "peel"}], b: "banana" });
        });

        it("should merge claims when claim types are objects when mergeClaims settings is true", () => {
            // arrange
            settings.mergeClaims = true;

            const c1 = { custom: {"apple": "foo", "pear": "bar"} };
            const c2 = { custom: {"apple": "foo", "orange": "peel"}, b: "banana" };

            // act
            const result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ custom: {"apple": "foo", "pear": "bar", "orange": "peel"}, b: "banana" });
        });

        it("should merge same claim types into array", () => {
            // arrange
            const c1 = { a: "apple", b: "banana" };
            const c2 = { a: "carrot" };

            // act
            const result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: ["apple", "carrot"], b: "banana" });
        });

        it("should merge arrays of same claim types into array", () => {
            // arrange
            const c1 = { a: "apple", b: "banana" };
            const c2 = { a: ["carrot", "durian"] };

            // act
            let result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: ["apple", "carrot", "durian"], b: "banana" });

            // arrange
            const d1 = { a: ["apple", "carrot"], b: "banana" };
            const d2 = { a: ["durian"] };

            // act
            result = subject._mergeClaims(d1, d2);

            // assert
            expect(result).toEqual({ a: ["apple", "carrot", "durian"], b: "banana" });

            // arrange
            const e1 = { a: ["apple", "carrot"], b: "banana" };
            const e2 = { a: "durian" };

            // act
            result = subject._mergeClaims(e1, e2);

            // assert
            expect(result).toEqual({ a: ["apple", "carrot", "durian"], b: "banana" });
        });

        it("should remove duplicates when producing arrays", () => {
            // arrange
            const c1 = { a: "apple", b: "banana" };
            const c2 = { a: ["apple", "durian"] };

            // act
            const result = subject._mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: ["apple", "durian"], b: "banana" });
        });

        it("should not add if already present in array", () => {
            // arrange
            const c1 = { a: ["apple", "durian"], b: "banana" };
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
                nonce: "nonce", at_hash: "athash",
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
                nonce: "nonce", at_hash: "athash",
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
                nonce: "nonce", at_hash: "athash",
                iat: 5, nbf: 10, exp: 20
            });
        });
    });

    describe("_validateTokens", () => {

        it("should validate id_token and access_token", async () => {
            // arrange
            stubResponse.id_token = "id_token";
            stubResponse.access_token = "access_token";
            const _validateIdTokenAndAccessTokenMock = jest.spyOn(subject, "_validateIdTokenAndAccessToken")
                .mockImplementation(() => Promise.resolve(stubResponse));
            const _validateIdTokenMock = jest.spyOn(subject, "_validateIdToken")
                .mockImplementation(() => Promise.resolve(stubResponse));

            // act
            await subject._validateTokens(stubState, stubResponse);

            // assert
            expect(_validateIdTokenAndAccessTokenMock).toBeCalled();
            expect(_validateIdTokenMock).not.toBeCalled();
        });

        it("should validate just id_token", async () => {
            // arrange
            stubResponse.id_token = "id_token";
            const _validateIdTokenAndAccessTokenMock = jest.spyOn(subject, "_validateIdTokenAndAccessToken")
                .mockImplementation(() => Promise.resolve(stubResponse));
            const _validateIdTokenMock = jest.spyOn(subject, "_validateIdToken")
                .mockImplementation(() => Promise.resolve(stubResponse));

            // act
            await subject._validateTokens(stubState, stubResponse);

            // assert
            expect(_validateIdTokenAndAccessTokenMock).not.toBeCalled();
            expect(_validateIdTokenMock).toBeCalled();
        });

        it("should not validate if only access_token", async () => {
            // arrange
            stubResponse.access_token = "access_token";
            const _validateIdTokenAndAccessTokenMock = jest.spyOn(subject, "_validateIdTokenAndAccessToken")
                .mockImplementation(() => Promise.resolve(stubResponse));
            const _validateIdTokenMock = jest.spyOn(subject, "_validateIdToken")
                .mockImplementation(() => Promise.resolve(stubResponse));

            // act
            await subject._validateTokens(stubState, stubResponse);

            // assert
            expect(_validateIdTokenAndAccessTokenMock).not.toBeCalled();
            expect(_validateIdTokenMock).not.toBeCalled();
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
            const _validateIdTokenMock = jest.spyOn(subject, "_validateIdToken")
                .mockImplementation(() => Promise.resolve(stubResponse));
            const _validateAccessTokenMock = jest.spyOn(subject, "_validateAccessToken")
                .mockImplementation(() => stubResponse);

            // act
            await subject._validateIdTokenAndAccessToken(stubState, stubResponse);

            // assert
            expect(_validateIdTokenMock).toBeCalled();
            expect(_validateAccessTokenMock).toBeCalled();
        });

        it("should not access_token if id_token validation fails", async () => {
            // arrange
            stubResponse.id_token = "id_token";
            stubResponse.access_token = "access_token";
            const _validateIdTokenMock = jest.spyOn(subject, "_validateIdToken")
                .mockImplementation(() => Promise.reject(new Error("error")));
            const _validateAccessTokenMock = jest.spyOn(subject, "_validateAccessToken")
                .mockImplementation(() => stubResponse);

            // act
            try {
                await subject._validateIdTokenAndAccessToken(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(_validateIdTokenMock).toBeCalled();
                expect(_validateAccessTokenMock).not.toBeCalled();
            }
        });
    });

    describe("_getSigningKeyForJwt", () => {

        it("should fail if loading keys fails.", async () => {
            // arrange
            const jwt = { header: { kid: "a3rMUgMFv9tPclLa6yF3zAkfquE" }};
            jest.spyOn(metadataService, "getSigningKeys").mockRejectedValue(new Error("keys"));

            // act
            try {
                await subject._getSigningKeyForJwt(jwt);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("keys");
            }
        });

        it("should fetch suitable signing key for the jwt.", async () => {
            // arrange
            const jwt = { header: { kid: "a3rMUgMFv9tPclLa6yF3zAkfquE" }};
            const keys = [{ kid: "a3rMUgMFv9tPclLa6yF3zAkfquE" }, { kid: "other_key" } ];
            jest.spyOn(metadataService, "getSigningKeys").mockImplementation(() => Promise.resolve(keys));

            // act
            const result = await subject._getSigningKeyForJwt(jwt);

            // assert
            expect(result).toEqual({ kid: "a3rMUgMFv9tPclLa6yF3zAkfquE" });
        });
    });

    describe("_getSigningKeyForJwtWithSingleRetry", () => {

        it("should retry once if suitable signing key is not found.", async () => {
            // arrange
            const jwt = { header: { kid: "a3rMUgMFv9tPclLa6yF3zAkfquE" }};
            const keys = [{ kid: "other_key" }];
            jest.spyOn(metadataService, "getSigningKeys")
                .mockImplementation(() => Promise.resolve(keys));
            const _getSigningKeyForJwtMock = jest.spyOn(subject, "_getSigningKeyForJwt")
                .mockImplementation(() => Promise.resolve(undefined));

            // act
            await subject._getSigningKeyForJwtWithSingleRetry(jwt);

            // assert
            expect(_getSigningKeyForJwtMock).toBeCalledTimes(2);
        });

        it("should not retry if suitable signing key is found.", async () => {
            // arrange
            const jwt = { header: { kid: "a3rMUgMFv9tPclLa6yF3zAkfquE" }};
            const keys = [{ kid: "a3rMUgMFv9tPclLa6yF3zAkfquE" }];
            jest.spyOn(metadataService, "getSigningKeys")
                .mockImplementation(() => Promise.resolve(keys));
            const _getSigningKeyForJwtMock = jest.spyOn(subject, "_getSigningKeyForJwt")
                .mockImplementation((jwt) => Promise.resolve(jwt));

            // act
            await subject._getSigningKeyForJwtWithSingleRetry(jwt);

            // assert
            expect(_getSigningKeyForJwtMock).toBeCalledTimes(1);
        });
    });

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
                expect(err.message).toContain("nonce");
            }
        });

        it("should fail if invalid id_token", async () => {
            // act
            try {
                await subject._validateIdToken(stubState, stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("id_token");
            }
        });

        it("should fail if audience doesn't match id_token", async () => {
            // arrange
            stubState.client_id = "invalid client_id";
            stubResponse.id_token = id_token;
            jest.spyOn(metadataService, "getIssuer").mockRejectedValue(new Error("test"));
            const keys = [{ kid: "a3rMUgMFv9tPclLa6yF3zAkfquE" }];
            jest.spyOn(metadataService, "getSigningKeys").mockImplementation(() => Promise.resolve(keys));

            // act
            try {
                await subject._validateIdToken(stubState, stubResponse);
                fail("should not come here");
            // eslint-disable-next-line no-empty
            } catch (err) {}
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
                expect(err.message).toContain("nonce");
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
                expect(err.message).toContain("issuer");
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
                expect(err.message).toContain("keys");
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
                expect(err.message).toContain("kid");
            }
        });

        it("should validate JWT", async () => {
            // arrange
            stubState.nonce = "nonce";
            stubResponse.id_token = id_token;
            jest.spyOn(metadataService, "getIssuer").mockImplementation(() => Promise.resolve("test"));
            const keys = [{ kid: "a3rMUgMFv9tPclLa6yF3zAkfquE", kty: "EC" }];
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
            const keys = [{ kid: "a3rMUgMFv9tPclLa6yF3zAkfquE", kty: "EC" }];
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

        it("should require id_token", () => {
            // arrange
            stubResponse.id_token = null;
            stubResponse.profile = {
                at_hash: at_hash
            };

            // act
            try {
                subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("id_token");
            }
        });

        it("should require profile", () => {
            // arrange
            stubResponse.id_token = id_token;
            stubResponse.profile = null;

            // act
            try {
                subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("profile");
            }
        });

        it("should require at_hash on profile", () => {
            // arrange
            stubResponse.id_token = id_token;
            stubResponse.profile = {
            };

            // act
            try {
                subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("at_hash");
            }
        });

        it("should fail for invalid id_token", () => {
            // arrange
            stubResponse.id_token = "bad";
            stubResponse.profile = {
                at_hash: at_hash
            };

            // act
            try {
                subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("id_token");
            }
        });

        it("should require proper alg on id_token", () => {
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
                subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("alg");
            }
        });

        it("should fail for invalid algs of incorrect bit lengths", () => {
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
                subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("alg");
            }
        });

        it("should fail for algs of not correct string length", () => {
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
                subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("alg");
            }
        });

        it("should fail if at_hash does not match", () => {
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
            });
            jest.spyOn(JoseUtil, "hexToBase64Url").mockImplementation(() => {
                return "wrong";
            });

            // act
            try {
                subject._validateAccessToken(stubResponse);
                fail("should not come here");
            } catch (err) {
                expect(err.message).toContain("at_hash");
            }
        });

        it("should validate at_hash", () => {
            // arrange
            stubResponse.id_token = id_token;
            stubResponse.access_token = access_token;
            stubResponse.profile = {
                at_hash: at_hash
            };

            // act
            const response = subject._validateAccessToken(stubResponse);

            // assert
            expect(response).toEqual(stubResponse);
        });
    });
});
