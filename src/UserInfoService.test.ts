// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { UserInfoService } from "./UserInfoService";
import { MetadataService } from "./MetadataService";
import type { JsonService } from "./JsonService";
import { OidcClientSettingsStore } from "./OidcClientSettings";

describe("UserInfoService", () => {
    let subject: UserInfoService;
    let metadataService: MetadataService;
    let jsonService: JsonService;

    beforeEach(() => {
        const settings = new OidcClientSettingsStore({
            authority: "authority",
            client_id: "client",
            redirect_uri: "redirect",
            fetchRequestCredentials: "include",
        });
        metadataService = new MetadataService(settings);

        subject = new UserInfoService(settings, metadataService);

        // access private members
        jsonService = subject["_jsonService"];
    });

    describe("getClaims", () => {

        it("should return a promise", async () => {
            // act
            const p = subject.getClaims("");

            // assert
            expect(p).toBeInstanceOf(Promise);
            // eslint-disable-next-line no-empty
            try { await p; } catch {}
        });

        it("should require a token", async () => {
            // act
            try {
                await subject.getClaims("");
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
            await subject.getClaims("token");

            // assert
            expect(getJsonMock).toHaveBeenCalledWith(
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
                await subject.getClaims("token");
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("test");
            }
        });

        it("should return claims", async () => {
            // arrange
            jest.spyOn(metadataService, "getUserInfoEndpoint").mockImplementation(() => Promise.resolve("http://sts/userinfo"));
            const expectedClaims = {
                foo: 1, bar: "test",
                aud:"some_aud", iss:"issuer",
                sub:"123", email:"foo@gmail.com",
                role:["admin", "dev"],
                nonce:"nonce", at_hash:"athash",
                iat:5, nbf:10, exp:20,
            };
            jest.spyOn(jsonService, "getJson").mockImplementation(() => Promise.resolve(expectedClaims));

            // act
            const claims = await subject.getClaims("token");

            // assert
            expect(claims).toEqual(expectedClaims);
        });

        it("should use settings fetchRequestCredentials to set credentials on user info request", async () => {
            // arrange
            jest.spyOn(metadataService, "getUserInfoEndpoint").mockImplementation(() => Promise.resolve("http://sts/userinfo"));
            const getJsonMock = jest.spyOn(jsonService, "getJson").mockImplementation(() => Promise.resolve({}));

            // act
            await subject.getClaims("token");

            // assert
            expect(getJsonMock).toHaveBeenCalledWith(
                "http://sts/userinfo",
                expect.objectContaining({
                    credentials: "include",
                }),
            );
        });
    });
});
