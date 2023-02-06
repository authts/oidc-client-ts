// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { UserInfoService } from "./UserInfoService";
import { MetadataService } from "./MetadataService";
import type { JsonService } from "./JsonService";
import { OidcClientSettingsStore } from "./OidcClientSettings";
import { ClaimsService } from "./ClaimsService";
import type { IdTokenClaims } from "./Claims";

describe("UserInfoService", () => {
    let stubProfile: IdTokenClaims;
    let stubToken: string;

    let settings: OidcClientSettingsStore;
    let subject: UserInfoService;
    let metadataService: MetadataService;
    let claimsService: ClaimsService;
    let jsonService: JsonService;

    beforeEach(() => {
        settings = new OidcClientSettingsStore({
            authority: "authority",
            client_id: "client",
            redirect_uri: "redirect",
            fetchRequestCredentials: "include",
        });
        stubProfile = { sub: "subsub", iss: "iss", aud: "aud", exp: 0, iat: 0 };
        stubToken = "access_token";

        metadataService = new MetadataService(settings);
        claimsService = new ClaimsService(settings);

        subject = new UserInfoService(settings, metadataService, claimsService);

        // access private members
        jsonService = subject["_jsonService"];
    });

    describe("getClaims", () => {

        it("should return a promise", async () => {
            // act
            const p = subject.getClaims("", { sub: "sub", iss: "iss", aud: "aud", exp: 0, iat: 0 });

            // assert
            expect(p).toBeInstanceOf(Promise);
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

        it("should require a token", async () => {
            // act
            try {
                await subject.getClaims("", { sub: "sub", iss: "iss", aud: "aud", exp: 0, iat: 0 });
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("token");
            }
        });

        it("should call userinfo endpoint and pass token", async () => {
            // arrange
            jest.spyOn(metadataService, "getUserInfoEndpoint").mockImplementation(() => Promise.resolve("http://sts/userinfo"));
            const getJsonMock = jest.spyOn(jsonService, "getJson")
                .mockResolvedValue({ foo: "bar" });

            // act
            await subject.getClaims("token", { sub: "sub", iss: "iss", aud: "aud", exp: 0, iat: 0 }, false);

            // assert
            expect(getJsonMock).toBeCalledWith(
                "http://sts/userinfo",
                expect.objectContaining({
                    token: "token",
                }),
            );
        });

        it("should fail when dependencies fail", async () => {
            // arrange
            jest.spyOn(metadataService, "getUserInfoEndpoint").mockRejectedValue(new Error("test"));

            // act
            try {
                await subject.getClaims("token", { sub: "sub", iss: "iss", aud: "aud", exp: 0, iat: 0 });
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("test");
            }
        });

        it("should return claims respecting claims filtering rules", async () => {
            // arrange
            jest.spyOn(metadataService, "getUserInfoEndpoint").mockImplementation(() => Promise.resolve("http://sts/userinfo"));
            Object.assign(settings, { filterProtocolClaims: ["a", "b", "c"] });

            const expectedClaims = {
                foo: 1, bar: "test",
                aud:"some_aud", iss:"issuer",
                sub:"123", email:"foo@gmail.com",
                role:["admin", "dev"],
                iat:5, exp:20,
                nonce:"nonce", at_hash:"athash", nbf:10,
            };

            jest.spyOn(jsonService, "getJson").mockImplementation(() => Promise.resolve(
                { ...expectedClaims, a: "apple" },
            ));

            // act
            const claims = await subject.getClaims("token", { sub: "123", aud: "some_aud", iss: "issuer", exp: 0, iat: 0 });

            // assert
            expect(claims).toEqual(expectedClaims);
        });

        it("should return claims removing filtered claims", async () => {
            // arrange
            jest.spyOn(metadataService, "getUserInfoEndpoint").mockImplementation(() => Promise.resolve("http://sts/userinfo"));
            const expectedClaims = {
                foo: 1, bar: "test",
                aud:"some_aud", iss:"issuer",
                sub:"123", email:"foo@gmail.com",
                role:["admin", "dev"],

                iat:5, exp:20,
            };
            jest.spyOn(jsonService, "getJson").mockImplementation(() => Promise.resolve(
                { ...expectedClaims, nonce:"nonce", at_hash:"athash", nbf:10 },
            ));

            // act
            const claims = await subject.getClaims("token", { sub: "123", aud: "some_aud", iss: "issuer", exp: 0, iat: 0 });

            // assert
            expect(claims).toEqual(expectedClaims);
        });

        it("should use settings fetchRequestCredentials to set credentials on user info request", async () => {
            // arrange
            jest.spyOn(metadataService, "getUserInfoEndpoint").mockImplementation(() => Promise.resolve("http://sts/userinfo"));
            const getJsonMock = jest.spyOn(jsonService, "getJson").mockImplementation(() => Promise.resolve({}));

            // act
            await subject.getClaims("token", { sub: "sub", iss: "iss", aud: "aud", exp: 0, iat: 0 }, false);

            // assert
            expect(getJsonMock).toBeCalledWith(
                "http://sts/userinfo",
                expect.objectContaining({
                    credentials: "include",
                }),
            );
        });

        it("should fail if sub from user info endpoint does not match sub in id_token", async () => {
            // arrange
            jest.spyOn(metadataService, "getUserInfoEndpoint").mockImplementation(() => Promise.resolve("http://sts/userinfo"));
            const getJsonMock = jest.spyOn(jsonService, "getJson").mockImplementation(() => Promise.resolve({}));

            // act
            await expect(subject.getClaims(stubToken, stubProfile, true))
                // assert
                .rejects.toThrow("subject from UserInfo response does not match subject in ID Token");
            expect(getJsonMock).toBeCalledWith(
                "http://sts/userinfo",
                expect.objectContaining({
                    credentials: "include",
                }),
            );
            expect(stubProfile).toMatchObject({ sub: "subsub" });
        });

        it("should load and merge user info claims", async () => {
            // arrange
            jest.spyOn(metadataService, "getUserInfoEndpoint").mockImplementation(() => Promise.resolve("http://sts/userinfo"));
            jest.spyOn(jsonService, "getJson").mockImplementation(() => Promise.resolve({ sub: stubProfile.sub, c: "carrot" }));
            Object.assign(stubProfile, { a: "apple", b: "banana" });

            // act
            const claims = await subject.getClaims(stubToken, stubProfile, true);

            // assert
            expect(claims).toEqual({
                ...stubProfile,
                c: "carrot",
            });
        });
    });
});
