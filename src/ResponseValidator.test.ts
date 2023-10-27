// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { JwtUtils } from "./utils";
import { ErrorResponse } from "./errors";
import { ResponseValidator } from "./ResponseValidator";
import { MetadataService } from "./MetadataService";
import { ClaimsService } from "./ClaimsService";
import type { SigninState } from "./SigninState";
import type { SigninResponse } from "./SigninResponse";
import type { SignoutResponse } from "./SignoutResponse";
import type { OidcClientSettingsStore } from "./OidcClientSettings";
import { mocked } from "jest-mock";

describe("ResponseValidator", () => {
    let stubState: SigninState;
    let stubResponse: SigninResponse & SignoutResponse;
    let settings: OidcClientSettingsStore;
    let metadataService: MetadataService;
    let claimsService: ClaimsService;
    let subject: ResponseValidator;

    beforeEach(() => {
        stubState = {
            id: "the_id",
            data: { some: "data" },
            client_id: "client",
            authority: "op",
            scope: "openid",
        } as SigninState;
        stubResponse = {
            state: "the_id",
            isOpenId: false,
        } as SigninResponse & SignoutResponse;
        settings = {
            authority: "op",
            client_id: "client",
            loadUserInfo: true,
        } as OidcClientSettingsStore;
        metadataService = new MetadataService(settings);

        claimsService = new ClaimsService(settings);
        subject = new ResponseValidator(settings, metadataService, claimsService);
        jest.spyOn(subject["_tokenClient"], "exchangeCode").mockResolvedValue(
            {},
        );
        jest.spyOn(subject["_userInfoService"], "getClaims").mockResolvedValue({
            nickname: "Nick",
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("validateSignoutResponse", () => {
        it("should validate that the client state matches response state", () => {
            // arrange
            Object.assign(stubResponse, { state: "not_the_id" });

            // act
            expect(() =>
                subject.validateSignoutResponse(stubResponse, stubState),
            )
                // assert
                .toThrow("State does not match");
        });

        it("should fail on error response", () => {
            // arrange
            Object.assign(stubResponse, { error: "some_error" });

            // act
            expect(() =>
                subject.validateSignoutResponse(stubResponse, stubState),
            )
                // assert
                .toThrow(ErrorResponse);
        });

        it("should return data for successful responses", () => {
            // act
            subject.validateSignoutResponse(stubResponse, stubState);

            // assert
            expect(stubResponse.userState).toEqual({ some: "data" });
        });

        it("should return url_state for successful responses", () => {
            // arrange
            Object.assign(stubResponse, { url_state: "url_state" });

            // act
            subject.validateSignoutResponse(stubResponse, stubState);

            // assert
            expect(stubResponse.url_state).toEqual("url_state");
        });
    });

    describe("validateSigninResponse", () => {
        it("should process a valid signin response", async () => {
            // arrange
            Object.assign(stubResponse, { code: "foo" });
            Object.assign(stubState, { code_verifier: "secret" });

            // act
            await subject.validateSigninResponse(stubResponse, stubState);

            // assert
            expect(subject["_tokenClient"].exchangeCode).toHaveBeenCalled();
            expect(stubResponse).toHaveProperty("userState", stubState.data);
            expect(stubResponse).toHaveProperty("scope", stubState.scope);
        });

        it("should not process code if state fails", async () => {
            // arrange
            Object.assign(stubResponse, { code: "code", state: "not_the_id" });
            const exchangeCodeSpy = jest
                .spyOn(subject["_tokenClient"], "exchangeCode")
                .mockRejectedValue(new Error("should not come here"));

            // act
            await expect(
                subject.validateSigninResponse(stubResponse, stubState),
            )
                // assert
                .rejects.toThrow("State does not match");
            expect(exchangeCodeSpy).not.toHaveBeenCalled();
        });

        it("should process valid claims", async () => {
            // arrange
            Object.assign(stubResponse, {
                isOpenId: true,
                access_token: "access_token",
                id_token: "id_token",
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({ sub: "sub" });
            mocked(subject["_userInfoService"].getClaims).mockResolvedValue({
                sub: "sub",
            });

            // act
            await subject.validateSigninResponse(stubResponse, stubState);

            // assert
            expect(subject["_userInfoService"].getClaims).toHaveBeenCalledWith(
                "access_token",
            );
        });

        it("should not process claims if state fails", async () => {
            // arrange
            Object.assign(stubResponse, {
                state: "not_the_id",
                access_token: "access_token",
                isOpenId: true,
            });

            // act
            await expect(
                subject.validateSigninResponse(stubResponse, stubState),
            )
                // assert
                .rejects.toThrow("State does not match");
            expect(
                subject["_userInfoService"].getClaims,
            ).not.toHaveBeenCalled();
        });

        it("should validate that the client state matches response state", async () => {
            // arrange
            Object.assign(stubResponse, { state: "not_the_id" });

            // act
            await expect(
                subject.validateSigninResponse(stubResponse, stubState),
            )
                // assert
                .rejects.toThrow("State does not match");
        });

        it("should fail if no client_id on state", async () => {
            // arrange
            Object.assign(stubState, { client_id: undefined });

            // act
            await expect(
                subject.validateSigninResponse(stubResponse, stubState),
            )
                // assert
                .rejects.toThrow("No client_id on state");
        });

        it("should fail if no authority on state", async () => {
            // arrange
            Object.assign(stubState, { authority: undefined });

            // act
            await expect(
                subject.validateSigninResponse(stubResponse, stubState),
            )
                // assert
                .rejects.toThrow("No authority on state");
        });

        it("should fail if the authority on the state is not the same as the settings", async () => {
            // arrange
            Object.assign(stubState, { authority: "something different" });

            // act
            await expect(
                subject.validateSigninResponse(stubResponse, stubState),
            )
                // assert
                .rejects.toThrow(/authority mismatch/);
        });

        it("should fail if the client_id on the state is not the same as the settings", async () => {
            // arrange
            Object.assign(stubState, { client_id: "something different" });

            // act
            await expect(
                subject.validateSigninResponse(stubResponse, stubState),
            )
                // assert
                .rejects.toThrow(/client_id mismatch/);
        });

        it("should return data for error responses", async () => {
            // arrange
            Object.assign(stubResponse, { error: "some_error" });

            // act
            await expect(
                subject.validateSigninResponse(stubResponse, stubState),
            )
                // assert
                .rejects.toThrow(ErrorResponse);
        });

        it("should fail if request was code flow but no code in response", async () => {
            // arrange
            Object.assign(stubState, { code_verifier: "secret" });
            Object.assign(stubResponse, { code: undefined });

            // act
            await expect(
                subject.validateSigninResponse(stubResponse, stubState),
            )
                // assert
                .rejects.toThrow("Expected code in response");
        });

        it("should return data for successful responses", async () => {
            // arrange
            Object.assign(stubState, { code_verifier: "secret" });
            Object.assign(stubResponse, { code: "code" });

            // act
            await subject.validateSigninResponse(stubResponse, stubState);

            // assert
            expect(stubResponse.userState).toEqual(stubState.data);
        });

        it("should filter protocol claims if OIDC", async () => {
            // arrange
            Object.assign(stubResponse, {
                isOpenId: true,
                id_token: "id_token",
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({
                sub: "sub",
                iss: "iss",
                acr: "acr",
                a: "apple",
                b: "banana",
            });
            Object.assign(settings, { filterProtocolClaims: true });

            // act
            await subject.validateSigninResponse(stubResponse, stubState);

            // assert
            expect(stubResponse.profile).not.toHaveProperty("acr");
        });

        it("should not filter protocol claims if not OIDC", async () => {
            // arrange
            Object.assign(stubResponse, {
                isOpenId: false,
                profile: { a: "apple", b: "banana", iss: "foo" },
            });

            // act
            await subject.validateSigninResponse(stubResponse, stubState);

            // assert
            expect(stubResponse.profile).toHaveProperty("iss", "foo");
        });

        it("should fail if sub from user info endpoint does not match sub in id_token", async () => {
            // arrange
            Object.assign(settings, { loadUserInfo: true });
            Object.assign(stubResponse, {
                isOpenId: true,
                access_token: "access_token",
                id_token: "id_token",
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({
                sub: "sub",
                a: "apple",
                b: "banana",
            });
            mocked(subject["_userInfoService"].getClaims).mockResolvedValue({
                sub: "sub different",
            });

            // act
            await expect(
                subject.validateSigninResponse(stubResponse, stubState),
            )
                // assert
                .rejects.toThrow(
                    "subject from UserInfo response does not match subject in ID Token",
                );
        });

        it("should load and merge user info claims when loadUserInfo configured", async () => {
            // arrange
            Object.assign(settings, { loadUserInfo: true });
            Object.assign(stubResponse, {
                isOpenId: true,
                access_token: "access_token",
                id_token: "id_token",
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({
                sub: "sub",
                a: "apple",
                b: "banana",
            });
            mocked(subject["_userInfoService"].getClaims).mockResolvedValue({
                sub: "sub",
                c: "carrot",
            });

            // act
            await subject.validateSigninResponse(stubResponse, stubState);

            // assert
            expect(subject["_userInfoService"].getClaims).toHaveBeenCalledWith(
                "access_token",
            );
            expect(stubResponse.profile).toEqual({
                sub: "sub",
                a: "apple",
                b: "banana",
                c: "carrot",
            });
        });

        it("should run if request was not openid", async () => {
            // arrange
            Object.assign(settings, { loadUserInfo: true });
            Object.assign(stubResponse, {
                isOpenId: false,
                access_token: "access_token",
            });

            // act
            await subject.validateSigninResponse(stubResponse, stubState);

            // assert
            expect(subject["_userInfoService"].getClaims).toHaveBeenCalled();
        });

        it("should not load and merge user info claims when loadUserInfo not configured", async () => {
            // arrange
            Object.assign(settings, { loadUserInfo: false });
            Object.assign(stubResponse, {
                isOpenId: true,
                access_token: "access_token",
                id_token: "id_token",
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({
                sub: "sub",
                a: "apple",
                b: "banana",
            });

            // act
            await subject.validateSigninResponse(stubResponse, stubState);

            // assert
            expect(
                subject["_userInfoService"].getClaims,
            ).not.toHaveBeenCalled();
        });

        it("should not load user info claims if no access token", async () => {
            // arrange
            Object.assign(settings, { loadUserInfo: true });
            Object.assign(stubResponse, {
                isOpenId: true,
                id_token: "id_token",
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({
                sub: "sub",
                a: "apple",
                b: "banana",
            });

            // act
            await subject.validateSigninResponse(stubResponse, stubState);

            // assert
            expect(
                subject["_userInfoService"].getClaims,
            ).not.toHaveBeenCalled();
        });

        it("should not process code if response has no code", async () => {
            // arrange
            Object.assign(stubResponse, { code: undefined });

            // act
            await subject.validateSigninResponse(stubResponse, stubState);

            // assert
            expect(subject["_tokenClient"].exchangeCode).not.toHaveBeenCalled();
        });

        it("should include the code in the token request", async () => {
            // arrange
            Object.assign(stubResponse, { code: "code" });
            Object.assign(stubState, { code_verifier: "code_verifier" });

            // act
            await subject.validateSigninResponse(stubResponse, stubState);

            // assert
            expect(subject["_tokenClient"].exchangeCode).toHaveBeenCalledWith(
                expect.objectContaining({ code: stubResponse.code }),
            );
        });

        it("should include data from state in the token request", async () => {
            // arrange
            Object.assign(stubResponse, { code: "code" });
            Object.assign(stubState, {
                client_secret: "client_secret",
                redirect_uri: "redirect_uri",
                code_verifier: "code_verifier",
                extraTokenParams: { a: "a" },
            });

            // act
            await subject.validateSigninResponse(stubResponse, stubState);

            // assert
            expect(subject["_tokenClient"].exchangeCode).toHaveBeenCalledWith({
                code: stubResponse.code,
                client_id: stubState.client_id,
                client_secret: stubState.client_secret,
                redirect_uri: stubState.redirect_uri,
                code_verifier: stubState.code_verifier,
                ...stubState.extraTokenParams,
            });
        });

        it("should map token response data to response", async () => {
            // arrange
            Object.assign(stubResponse, { code: "code" });
            Object.assign(stubState, { code_verifier: "code_verifier" });
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
            mocked(subject["_tokenClient"].exchangeCode).mockResolvedValue(
                tokenResponse,
            );
            jest.spyOn(JwtUtils, "decode").mockReturnValue({ sub: "sub" });

            // act
            await subject.validateSigninResponse(stubResponse, stubState);

            // assert
            expect(stubResponse).toMatchObject(tokenResponse);
        });

        it("should map token response expires_in to response", async () => {
            // arrange
            Object.assign(stubResponse, { code: "code" });
            Object.assign(stubState, { code_verifier: "code_verifier" });
            const tokenResponse = { expires_in: 42 };
            mocked(subject["_tokenClient"].exchangeCode).mockResolvedValue(
                tokenResponse,
            );

            // act
            await subject.validateSigninResponse(stubResponse, stubState);

            // assert
            expect(stubResponse).toMatchObject({ expires_in: 42 });
        });

        it("should validate and decode id_token if response has id_token", async () => {
            // arrange
            Object.assign(stubResponse, {
                id_token: "id_token",
                isOpenId: true,
            });
            const profile = { sub: "sub" };
            jest.spyOn(JwtUtils, "decode").mockReturnValue(profile);

            // act
            await subject.validateSigninResponse(stubResponse, stubState);

            // assert
            expect(JwtUtils.decode).toHaveBeenCalledWith("id_token");
            expect(stubResponse.profile).toEqual(profile);
        });

        it("should fail if id_token does not contain sub", async () => {
            // arrange
            Object.assign(stubResponse, {
                id_token: "id_token",
                isOpenId: true,
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({ a: "a" });

            // act
            await expect(
                subject.validateSigninResponse(stubResponse, stubState),
            )
                // assert
                .rejects.toThrow("ID Token is missing a subject claim");
            expect(JwtUtils.decode).toHaveBeenCalledWith("id_token");
            expect(stubResponse).not.toHaveProperty("profile");
        });
    });

    describe("validateCredentialsResponse", () => {
        it("should process a valid openid signin response (skipping userInfo)", async () => {
            // arrange
            Object.assign(stubResponse, {
                id_token: "id_token",
                isOpenId: true,
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({ sub: "subsub" });

            // act
            await subject.validateCredentialsResponse(stubResponse, true);

            // assert
            expect(JwtUtils.decode).toHaveBeenCalledWith("id_token");
            expect(
                subject["_userInfoService"].getClaims,
            ).not.toHaveBeenCalledWith();
            expect(stubResponse).toHaveProperty("profile", { sub: "subsub" });
        });

        it("should not process an invalid openid signin response", async () => {
            // arrange
            Object.assign(stubResponse, {
                id_token: "id_token",
                isOpenId: true,
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({ sub: undefined });

            // act
            await expect(
                subject.validateCredentialsResponse(stubResponse, true),
            )
                // assert
                .rejects.toThrow(Error);
            expect(JwtUtils.decode).toHaveBeenCalledWith("id_token");
            expect(stubResponse).not.toHaveProperty("profile");
        });

        it("should process an openid signin response without an id_token as a non-openid signin response", async () => {
            // this is aimed at Authorization servers that don't support the OIDC spec and don't return an id_token if the
            // openid scope is set in the request scope.
            // arrange
            Object.assign(stubResponse, {
                isOpenId: true,
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({ sub: "subsub" });

            // act
            await subject.validateCredentialsResponse(stubResponse, true);

            // assert
            expect(JwtUtils.decode).not.toHaveBeenCalledWith("id_token");
            expect(
                subject["_userInfoService"].getClaims,
            ).not.toHaveBeenCalledWith();
            expect(stubResponse).toHaveProperty("profile", {});

        });

        it("should process a valid non-openid signin response skipping userInfo", async () => {
            // arrange
            Object.assign(stubResponse, {
                id_token: "id_token",
                isOpenId: false,
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({ sub: "subsub" });

            // act
            await subject.validateCredentialsResponse(stubResponse, true);

            // assert
            expect(JwtUtils.decode).not.toHaveBeenCalledWith("id_token");
            expect(
                subject["_userInfoService"].getClaims,
            ).not.toHaveBeenCalledWith();
            expect(stubResponse).toHaveProperty("profile", {});
        });

        it("should process a valid non-openid signin response (not loading userInfo)", async () => {
            // arrange
            Object.assign(settings, { loadUserInfo: false });
            Object.assign(stubResponse, {
                id_token: "id_token",
                isOpenId: false,
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({ sub: "subsub" });

            // act
            await subject.validateCredentialsResponse(stubResponse, false);

            // assert
            expect(JwtUtils.decode).not.toHaveBeenCalledWith("id_token");
            expect(
                subject["_userInfoService"].getClaims,
            ).not.toHaveBeenCalledWith();
            expect(stubResponse).toHaveProperty("profile", {});
        });

        it("should process a valid non-openid signin response without access_token", async () => {
            // arrange
            Object.assign(stubResponse, {
                id_token: "id_token",
                isOpenId: false,
                access_token: "",
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({ sub: "subsub" });

            // act
            await subject.validateCredentialsResponse(stubResponse, false);

            // assert
            expect(JwtUtils.decode).not.toHaveBeenCalledWith("id_token");
            expect(
                subject["_userInfoService"].getClaims,
            ).not.toHaveBeenCalledWith();
            expect(stubResponse).toHaveProperty("profile", {});
        });

        it("should process a valid non-openid signin response with userInfo", async () => {
            // arrange
            Object.assign(stubResponse, {
                id_token: "id_token",
                isOpenId: false,
                access_token: "access_token",
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({ sub: "subsub" });

            // act
            await subject.validateCredentialsResponse(stubResponse, false);

            // assert
            expect(JwtUtils.decode).not.toHaveBeenCalledWith("id_token");
            expect(subject["_userInfoService"].getClaims).toHaveBeenCalledWith(
                "access_token",
            );
            expect(stubResponse).toHaveProperty("profile", {
                nickname: "Nick",
            });
        });

        it("should not process a valid openid signin response with wrong userInfo", async () => {
            // arrange
            Object.assign(stubResponse, {
                id_token: "id_token",
                isOpenId: true,
                access_token: "access_token",
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({ sub: "subsub" });
            jest.spyOn(
                subject["_userInfoService"],
                "getClaims",
            ).mockResolvedValue({ sub: "anotherSub", nickname: "Nick" });

            // act
            await expect(
                subject.validateCredentialsResponse(stubResponse, false),
            )
                // assert
                .rejects.toThrow(Error);
            expect(JwtUtils.decode).toHaveBeenCalledWith("id_token");
            expect(subject["_userInfoService"].getClaims).toHaveBeenCalledWith(
                "access_token",
            );
            expect(stubResponse).toHaveProperty("profile", { sub: "subsub" });
        });

        it("should process a valid openid signin response with correct userInfo", async () => {
            // arrange
            Object.assign(stubResponse, {
                id_token: "id_token",
                isOpenId: true,
                access_token: "access_token",
            });
            jest.spyOn(JwtUtils, "decode").mockReturnValue({ sub: "subsub" });
            jest.spyOn(
                subject["_userInfoService"],
                "getClaims",
            ).mockResolvedValue({ sub: "subsub", nickname: "Nick" });

            // act
            await subject.validateCredentialsResponse(stubResponse, false);

            // assert
            expect(JwtUtils.decode).toHaveBeenCalledWith("id_token");
            expect(subject["_userInfoService"].getClaims).toHaveBeenCalledWith(
                "access_token",
            );
            expect(stubResponse).toHaveProperty("profile", {
                sub: "subsub",
                nickname: "Nick",
            });
        });
    });
});
