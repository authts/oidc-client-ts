// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { ClaimsService } from "./ClaimsService";
import { OidcClientSettingsStore } from "./OidcClientSettings";
import type { UserProfile } from "./User";

describe("ClaimsService", () => {
    let settings: OidcClientSettingsStore;
    let subject: ClaimsService;

    beforeEach(() => {
        settings = new OidcClientSettingsStore({
            authority: "authority",
            client_id: "client_id",
            redirect_uri: "redirect_uri",
        });

        subject = new ClaimsService(settings);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("filterProtocolClaims", () => {
        it("should filter protocol claims if enabled on settings", () => {
            // arrange
            Object.assign(settings, { filterProtocolClaims: true });
            const claims = {
                foo: 1,
                bar: "test",
                aud: "some_aud",
                iss: "issuer",
                sub: "123",
                email: "foo@gmail.com",
                role: ["admin", "dev"],
                iat: 5,
                exp: 20,
                nbf: 10,
                at_hash: "athash",
            };

            // act
            const result = subject.filterProtocolClaims(claims);

            // assert
            expect(result).toEqual({
                foo: 1,
                bar: "test",
                aud: "some_aud",
                iss: "issuer",
                sub: "123",
                email: "foo@gmail.com",
                role: ["admin", "dev"],
                iat: 5,
                exp: 20,
            });
        });

        it("should not filter protocol claims if not enabled on settings", () => {
            // arrange
            Object.assign(settings, { filterProtocolClaims: false });
            const claims = {
                foo: 1,
                bar: "test",
                aud: "some_aud",
                iss: "issuer",
                sub: "123",
                email: "foo@gmail.com",
                role: ["admin", "dev"],
                at_hash: "athash",
                iat: 5,
                nbf: 10,
                exp: 20,
            };

            // act
            const result = subject.filterProtocolClaims(claims);

            // assert
            expect(result).toEqual({
                foo: 1,
                bar: "test",
                aud: "some_aud",
                iss: "issuer",
                sub: "123",
                email: "foo@gmail.com",
                role: ["admin", "dev"],
                at_hash: "athash",
                iat: 5,
                nbf: 10,
                exp: 20,
            });
        });

        it("should filter protocol claims if specified in settings", () => {
            // arrange
            Object.assign(settings, {
                filterProtocolClaims: ["foo", "bar", "role", "nbf", "email"],
            });
            const claims = {
                foo: 1,
                bar: "test",
                aud: "some_aud",
                iss: "issuer",
                sub: "123",
                email: "foo@gmail.com",
                role: ["admin", "dev"],
                iat: 5,
                exp: 20,
                nbf: 10,
                at_hash: "athash",
            };

            // act
            const result = subject.filterProtocolClaims(claims);

            // assert
            expect(result).toEqual({
                aud: "some_aud",
                iss: "issuer",
                sub: "123",
                iat: 5,
                exp: 20,
                at_hash: "athash",
            });
        });

        it("should filter only protocol claims defined by default by the library", () => {
            // arrange
            Object.assign(settings, { filterProtocolClaims: true });
            const defaultProtocolClaims = {
                nbf: 3,
                jti: "jti",
                auth_time: 123,
                nonce: "nonce",
                acr: "acr",
                amr: "amr",
                azp: "azp",
                at_hash: "athash",
            };
            const claims = {
                foo: 1,
                bar: "test",
                aud: "some_aud",
                iss: "issuer",
                sub: "123",
                email: "foo@gmail.com",
                role: ["admin", "dev"],
                iat: 5,
                exp: 20,
            };

            // act
            const result = subject.filterProtocolClaims({
                ...defaultProtocolClaims,
                ...claims,
            });

            // assert
            expect(result).toEqual(claims);
        });

        it("should not filter protocol claims that are required by the library", () => {
            // arrange
            Object.assign(settings, { filterProtocolClaims: true });
            const internalRequiredProtocolClaims = {
                sub: "sub",
                iss: "issuer",
                aud: "some_aud",
                exp: 20,
                iat: 5,
            };
            const claims = {
                foo: 1,
                bar: "test",
                email: "foo@gmail.com",
                role: ["admin", "dev"],
                nbf: 10,
            };

            // act
            let items = { ...internalRequiredProtocolClaims, ...claims };
            let result = subject.filterProtocolClaims(items);

            // assert
            // nbf is part of the claims that should be filtered by the library by default, so we need to remove it
            delete (items as Partial<typeof items>).nbf;
            expect(result).toEqual(items);

            // ... even if specified in settings

            // arrange
            Object.assign(settings, {
                filterProtocolClaims: ["sub", "iss", "aud", "exp", "iat"],
            });

            // act
            items = { ...internalRequiredProtocolClaims, ...claims };
            result = subject.filterProtocolClaims(items);

            // assert
            expect(result).toEqual(items);
        });
    });

    describe("mergeClaims", () => {
        it("should merge claims", () => {
            // arrange
            const c1 = { a: "apple", b: "banana" } as unknown as UserProfile;
            const c2 = { c: "carrot" };

            // act
            const result = subject.mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: "apple", c: "carrot", b: "banana" });
        });

        it("should merge claims when claim types are objects", () => {
            // arrange
            const c1 = {
                custom: { apple: "foo", pear: "bar" },
            } as unknown as UserProfile;
            const c2 = {
                custom: { apple: "foo", orange: "peel" },
                b: "banana",
            };

            // act
            const result = subject.mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({
                custom: { apple: "foo", pear: "bar", orange: "peel" },
                b: "banana",
            });
        });

        it("should replace same claim types", () => {
            // arrange
            const c1 = { a: "apple", b: "banana" } as unknown as UserProfile;
            const c2 = { a: "carrot" };

            // act
            const result = subject.mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: "carrot", b: "banana" });
        });

        it("should remove duplicates when producing arrays", () => {
            // arrange
            const c1 = { a: "apple", b: "banana" } as unknown as UserProfile;
            const c2 = { a: ["apple", "durian"] };

            // act
            const result = subject.mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: ["apple", "durian"], b: "banana" });
        });

        it("should merge arrays of same claim types into array (string vs. array) when mergeClaimsStrategy is 'merge'", () => {
            // arrange
            Object.assign(settings, { mergeClaimsStrategy: "merge" });
            const c1 = {
                a: "apple",
                b: "banana",
            } as unknown as UserProfile;
            const c2 = {
                a: ["carrot", "durian"],
            };

            // act
            const result = subject.mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({
                a: ["apple", "carrot", "durian"],
                b: "banana",
            });
        });

        it("should merge arrays of same claim types into array (array vs. array) when mergeClaimsStrategy is 'merge'", () => {
            // arrange
            Object.assign(settings, { mergeClaimsStrategy: "merge" });
            const d1 = {
                a: ["apple", "carrot"],
                b: "banana",
            } as unknown as UserProfile;
            const d2 = { a: ["durian"] };

            // act
            const result = subject.mergeClaims(d1, d2);

            // assert
            expect(result).toEqual({
                a: ["apple", "carrot", "durian"],
                b: "banana",
            });
        });

        it("should merge arrays of same claim types into array (array vs. string) when mergeClaimsStrategy is 'merge'", () => {
            // arrange
            Object.assign(settings, { mergeClaimsStrategy: "merge" });
            const e1 = {
                a: ["apple", "carrot"],
                b: "banana",
            } as unknown as UserProfile;
            const e2 = { a: "durian" };

            // act
            const result = subject.mergeClaims(e1, e2);

            // assert
            expect(result).toEqual({
                a: ["apple", "carrot", "durian"],
                b: "banana",
            });
        });

        it("should replace if type is different (array vs. string)", () => {
        // arrange
            const c1 = {
                a: ["apple", "durian"],
                b: "banana",
            } as unknown as UserProfile;
            const c2 = { a: "apple" };

            // act
            const result = subject.mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ a: "apple", b: "banana" });
        });

        it("should replace if type is different (object vs. string)", () => {
        // arrange
            const c1 = {
                custom: { a: "apple" },
                b: "banana",
            } as unknown as UserProfile;
            const c2 = { custom: "apple" };

            // act
            const result = subject.mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ custom: "apple", b: "banana" });
        });

        it("should replace if type is different (array vs. object)", () => {
        // arrange
            const c1 = {
                custom: ["apple", "durian"],
                b: "banana",
            } as unknown as UserProfile;
            const c2 = {
                custom: { a: "apple" },
            } as unknown as UserProfile;

            // act
            const result = subject.mergeClaims(c1, c2);

            // assert
            expect(result).toEqual({ custom: { a: "apple" }, b: "banana" });
        });
    });
});
