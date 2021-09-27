// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, JoseUtil } from "../../../src/utils";

describe("JoseUtil", () => {

    let jwt: string;
    let jwtFromRsa: string;
    let rsaKey: any;
    let ecKey: any;

    const expectedIssuer = "https://localhost:44333/core";
    const expectedAudience = "js.tokenmanager";
    const notBefore = 1459129901;
    const issuedAt = notBefore;
    const expires = 1459130201;

    const expectedNow = notBefore;

    beforeEach(() => {
        Log.logger = console;
        Log.level = Log.NONE;

        jwt = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSIsImtpZCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSJ9.eyJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo0NDMzMy9jb3JlIiwiYXVkIjoianMudG9rZW5tYW5hZ2VyIiwiZXhwIjoxNDU5MTMwMjAxLCJuYmYiOjE0NTkxMjk5MDEsIm5vbmNlIjoiNzIyMTAwNTIwOTk3MjM4MiIsImlhdCI6MTQ1OTEyOTkwMSwiYXRfaGFzaCI6IkpnRFVDeW9hdEp5RW1HaWlXYndPaEEiLCJzaWQiOiIwYzVmMDYxZTYzOThiMWVjNmEwYmNlMmM5NDFlZTRjNSIsInN1YiI6Ijg4NDIxMTEzIiwiYXV0aF90aW1lIjoxNDU5MTI5ODk4LCJpZHAiOiJpZHNydiIsImFtciI6WyJwYXNzd29yZCJdfQ.f6S1Fdd0UQScZAFBzXwRiVsUIPQnWZLSe07kdtjANRZDZXf5A7yDtxOftgCx5W0ONQcDFVpLGPgTdhp7agZkPpCFutzmwr0Rr9G7E7mUN4xcIgAABhmRDfzDayFBEu6VM8wEWTChezSWtx2xG_2zmVJxxmNV0jvkaz0bu7iin-C_UZg6T-aI9FZDoKRGXZP9gF65FQ5pQ4bCYQxhKcvjjUfs0xSHGboL7waN6RfDpO4vvVR1Kz-PQhIRyFAJYRuoH4PdMczHYtFCb-k94r-7TxEU0vp61ww4WntbPvVWwUbCUgsEtmDzAZT-NEJVhWztNk1ip9wDPXzZ2hEhDAPJ7A";

        jwtFromRsa = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSIsImtpZCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSJ9.eyJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo0NDMzMy9jb3JlIiwiYXVkIjoianMudG9rZW5tYW5hZ2VyIiwiZXhwIjoxNDU5MTMwMjAxLCJuYmYiOjE0NTkxMjk5MDEsIm5vbmNlIjoiNzIyMTAwNTIwOTk3MjM4MiIsImlhdCI6MTQ1OTEyOTkwMSwiYXRfaGFzaCI6IkpnRFVDeW9hdEp5RW1HaWlXYndPaEEiLCJzaWQiOiIwYzVmMDYxZTYzOThiMWVjNmEwYmNlMmM5NDFlZTRjNSIsInN1YiI6Ijg4NDIxMTEzIiwiYXV0aF90aW1lIjoxNDU5MTI5ODk4LCJpZHAiOiJpZHNydiIsImFtciI6WyJwYXNzd29yZCJdfQ.f6S1Fdd0UQScZAFBzXwRiVsUIPQnWZLSe07kdtjANRZDZXf5A7yDtxOftgCx5W0ONQcDFVpLGPgTdhp7agZkPpCFutzmwr0Rr9G7E7mUN4xcIgAABhmRDfzDayFBEu6VM8wEWTChezSWtx2xG_2zmVJxxmNV0jvkaz0bu7iin-C_UZg6T-aI9FZDoKRGXZP9gF65FQ5pQ4bCYQxhKcvjjUfs0xSHGboL7waN6RfDpO4vvVR1Kz-PQhIRyFAJYRuoH4PdMczHYtFCb-k94r-7TxEU0vp61ww4WntbPvVWwUbCUgsEtmDzAZT-NEJVhWztNk1ip9wDPXzZ2hEhDAPJ7A";

        rsaKey = {
            kty: "RSA",
            use: "sig",
            kid: "a3rMUgMFv9tPclLa6yF3zAkfquE",
            x5t: "a3rMUgMFv9tPclLa6yF3zAkfquE",
            e: "AQAB",
            n: "qnTksBdxOiOlsmRNd-mMS2M3o1IDpK4uAr0T4_YqO3zYHAGAWTwsq4ms-NWynqY5HaB4EThNxuq2GWC5JKpO1YirOrwS97B5x9LJyHXPsdJcSikEI9BxOkl6WLQ0UzPxHdYTLpR4_O-0ILAlXw8NU4-jB4AP8Sn9YGYJ5w0fLw5YmWioXeWvocz1wHrZdJPxS8XnqHXwMUozVzQj-x6daOv5FmrHU1r9_bbp0a1GLv4BbTtSh4kMyz1hXylho0EvPg5p9YIKStbNAW9eNWvv5R8HN7PPei21AsUqxekK0oW9jnEdHewckToX7x5zULWKwwZIksll0XnVczVgy7fCFw",
            x5c: [
                "MIIDBTCCAfGgAwIBAgIQNQb+T2ncIrNA6cKvUA1GWTAJBgUrDgMCHQUAMBIxEDAOBgNVBAMTB0RldlJvb3QwHhcNMTAwMTIwMjIwMDAwWhcNMjAwMTIwMjIwMDAwWjAVMRMwEQYDVQQDEwppZHNydjN0ZXN0MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqnTksBdxOiOlsmRNd+mMS2M3o1IDpK4uAr0T4/YqO3zYHAGAWTwsq4ms+NWynqY5HaB4EThNxuq2GWC5JKpO1YirOrwS97B5x9LJyHXPsdJcSikEI9BxOkl6WLQ0UzPxHdYTLpR4/O+0ILAlXw8NU4+jB4AP8Sn9YGYJ5w0fLw5YmWioXeWvocz1wHrZdJPxS8XnqHXwMUozVzQj+x6daOv5FmrHU1r9/bbp0a1GLv4BbTtSh4kMyz1hXylho0EvPg5p9YIKStbNAW9eNWvv5R8HN7PPei21AsUqxekK0oW9jnEdHewckToX7x5zULWKwwZIksll0XnVczVgy7fCFwIDAQABo1wwWjATBgNVHSUEDDAKBggrBgEFBQcDATBDBgNVHQEEPDA6gBDSFgDaV+Q2d2191r6A38tBoRQwEjEQMA4GA1UEAxMHRGV2Um9vdIIQLFk7exPNg41NRNaeNu0I9jAJBgUrDgMCHQUAA4IBAQBUnMSZxY5xosMEW6Mz4WEAjNoNv2QvqNmk23RMZGMgr516ROeWS5D3RlTNyU8FkstNCC4maDM3E0Bi4bbzW3AwrpbluqtcyMN3Pivqdxx+zKWKiORJqqLIvN8CT1fVPxxXb/e9GOdaR8eXSmB0PgNUhM4IjgNkwBbvWC9F/lzvwjlQgciR7d4GfXPYsE1vf8tmdQaY8/PtdAkExmbrb9MihdggSoGXlELrPA91Yce+fiRcKY3rQlNWVd4DOoJ/cPXsXwry8pWjNCo5JD8Q+RQ5yZEy7YPoifwemLhTdsBz3hlZr28oCGJ3kbnpW0xGvQb3VHSTVVbeei0CfXoW6iz1"
            ]
        };

        ecKey = {
            kty: "EC",
            kid: "4",
            use: "sig",
            alg: "EC",
            crv: "P-256",
            x: "eZXWiRe0I3TvHPXiGnvO944gjF1o4UmitH2CVwYIrPg",
            y: "AKFNss7S35tOsp5iY7-YuLGs2cLrTKFk80JvgVzMPHQ3",
            x5c: [
                "MIIBpDCCAUoCgYBCs6x21IvwVHFgJxiRegyHdSiEHFur9Wj2qM5oNkv6sFbbC75L849qCgMEzdtqIhCiCnFg6PaQdswHkcclXix+y0sycyIM6l429faY3jz5eQs5SYwXYkENStzTZBsWK6u7bPiV3HvjnIv+r1af8nvO5F0tiH0TC+auDj9FgRmYljAKBggqhkjOPQQDAjAeMRwwGgYDVQQDExNUZXN0IENBIENlcnRpZmljYXRlMB4XDTEzMDIxMTIxMjQxMVoXDTE0MDIxMTIxMjQxMVowHjEcMBoGA1UEAxMTVGVzdCBDQSBDZXJ0aWZpY2F0ZTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABHmV1okXtCN07xz14hp7zveOIIxdaOFJorR9glcGCKz4oU2yztLfm06ynmJjv5i4sazZwutMoWTzQm+BXMw8dDcwCgYIKoZIzj0EAwIDSAAwRQIhAI4aRAoTVm3was6UimA1lFL2RId+t/fExaviosXNKg/IAiBpZB4XXcnQISwauSJ1hXNnSEcONXdqvO5gDHu+X7QHLg=="
            ]
        };
    });

    describe("parseJwt", () => {

        it("should parse a jwt", () => {
            // act
            const result = JoseUtil.parseJwt(jwt);

            // assert
            expect(result).toBeDefined();
            expect(result?.header).toBeDefined();
            expect(result?.payload).toBeDefined();
            expect(result?.header).toEqual({
                "typ": "JWT",
                "alg": "RS256",
                "x5t": "a3rMUgMFv9tPclLa6yF3zAkfquE",
                "kid": "a3rMUgMFv9tPclLa6yF3zAkfquE"
            });
            expect(result?.payload).toEqual({
                "iss": "https://localhost:44333/core",
                "aud": "js.tokenmanager",
                "exp": 1459130201,
                "nbf": 1459129901,
                "nonce": "7221005209972382",
                "iat": 1459129901,
                "at_hash": "JgDUCyoatJyEmGiiWbwOhA",
                "sid": "0c5f061e6398b1ec6a0bce2c941ee4c5",
                "sub": "88421113",
                "auth_time": 1459129898,
                "idp": "idsrv",
                "amr": [
                    "password"
                ]
            });
        });

        it("should return undefined for an invalid jwt", () => {
            // act
            const result = JoseUtil.parseJwt("junk");

            // assert
            expect(result).toBeNull();
        });
    });

    describe("validateJwt", () => {

        it("should validate from RSA X509 key", () => {
            // arrange
            delete rsaKey.n;
            delete rsaKey.e;

            // act
            JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, expectedAudience, 0, expectedNow);
        });

        it("should validate from RSA exponent and modulus", () => {
            // arrange
            delete rsaKey.x5c;

            // act
            JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, expectedAudience, 0, expectedNow);
        });

        it("should fail for unsupported key types", () => {
            // arrange
            rsaKey.kty = "foo";

            // act
            try {
                JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, expectedAudience, 0, expectedNow);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("foo");
            }
        });

        it("should fail for mismatched keys", () => {
            // act
            try {
                JoseUtil.validateJwt(jwtFromRsa, ecKey, expectedIssuer, expectedAudience, 0, expectedNow);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("signature");
            }
        });

        it("should not validate before nbf", () => {
            // act
            try {
                JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, expectedAudience, 0, notBefore - 1);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("iat");
            }
        });

        it("should allow nbf within clock skew", () => {
            // act
            JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, expectedAudience, 10, notBefore - 1);
            JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, expectedAudience, 10, notBefore - 10);
        });

        it("should not allow nbf outside clock skew", () => {
            // act
            try {
                JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, expectedAudience, 10, notBefore - 11);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("iat");
            }
        });

        it("should not validate before iat", () => {
            // act
            try {
                JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, expectedAudience, 0, issuedAt - 1);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("iat");
            }
        });

        it("should allow iat within clock skew", () => {
            // act
            JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, expectedAudience, 10, issuedAt - 1);
            JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, expectedAudience, 10, issuedAt - 10);
        });

        it("should now allow iat outside clock skew", () => {
            // act
            try {
                JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, expectedAudience, 10, issuedAt - 11);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("iat");
            }
        });

        it("should not validate after exp", () => {
            // act
            try {
                JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, expectedAudience, 0, expires + 1);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("exp");
            }
        });

        it("should allow exp within clock skew", () => {
            // act
            JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, expectedAudience, 10, expires + 1);
            JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, expectedAudience, 10, expires + 10);
        });

        it("should now allow exp outside clock skew", () => {
            // act
            try {
                JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, expectedAudience, 10, expires + 11);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("exp");
            }
        });

        it("should not validate for invalid audience", () => {
            // act
            try {
                JoseUtil.validateJwt(jwtFromRsa, rsaKey, expectedIssuer, "invalid aud", 0, expectedNow);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("aud");
            }
        });

        it("should not validate for invalid issuer", () => {
            // act
            try {
                JoseUtil.validateJwt(jwtFromRsa, rsaKey, "invalid issuer", expectedAudience, 0, expectedNow);
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("issuer");
            }
        });
    });
});
