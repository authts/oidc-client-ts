// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { JwtUtils } from "./JwtUtils";

describe("JwtUtils", () => {

    let jwt: string;

    beforeEach(() => {
        jwt = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSIsImtpZCI6ImEzck1VZ01Gdjl0UGNsTGE2eUYzekFrZnF1RSJ9.eyJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo0NDMzMy9jb3JlIiwiYXVkIjoianMudG9rZW5tYW5hZ2VyIiwiZXhwIjoxNDU5MTMwMjAxLCJuYmYiOjE0NTkxMjk5MDEsIm5vbmNlIjoiNzIyMTAwNTIwOTk3MjM4MiIsImlhdCI6MTQ1OTEyOTkwMSwiYXRfaGFzaCI6IkpnRFVDeW9hdEp5RW1HaWlXYndPaEEiLCJzaWQiOiIwYzVmMDYxZTYzOThiMWVjNmEwYmNlMmM5NDFlZTRjNSIsInN1YiI6Ijg4NDIxMTEzIiwiYXV0aF90aW1lIjoxNDU5MTI5ODk4LCJpZHAiOiJpZHNydiIsImFtciI6WyJwYXNzd29yZCJdfQ.f6S1Fdd0UQScZAFBzXwRiVsUIPQnWZLSe07kdtjANRZDZXf5A7yDtxOftgCx5W0ONQcDFVpLGPgTdhp7agZkPpCFutzmwr0Rr9G7E7mUN4xcIgAABhmRDfzDayFBEu6VM8wEWTChezSWtx2xG_2zmVJxxmNV0jvkaz0bu7iin-C_UZg6T-aI9FZDoKRGXZP9gF65FQ5pQ4bCYQxhKcvjjUfs0xSHGboL7waN6RfDpO4vvVR1Kz-PQhIRyFAJYRuoH4PdMczHYtFCb-k94r-7TxEU0vp61ww4WntbPvVWwUbCUgsEtmDzAZT-NEJVhWztNk1ip9wDPXzZ2hEhDAPJ7A";
    });

    describe("decode", () => {

        it("should decode a jwt", () => {
            // act
            const result = JwtUtils.decode(jwt);

            // assert
            expect(result).toEqual({
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
                    "password",
                ],
            });
        });

        it("should return undefined for an invalid jwt", () => {
            // act
            try {
                JwtUtils.decode("junk");
                fail("should not come here");
            }
            catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect((err as Error).message).toContain("Invalid token specified");
            }
        });
    });

    describe("createJwt", () => {
        it("should be able to create identical jwts two different ways", async () => {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "ECDSA",
                    namedCurve: "P-256",
                },
                false,
                ["sign", "verify"]);

            const jti = window.crypto.randomUUID();

            const payload: Record<string, string | number> = {
                "jti": jti,
                "htm": "GET",
                "htu": "http://test.com",
            };

            const iat = Date.now();

            const header = {
                "alg": "ES256",
                "typ": "dpop+jwt",
            };
            payload.iat = iat;
            const jwt = await JwtUtils.generateSignedJwt(header, payload, keyPair.privateKey);

            const result = JwtUtils.decode(jwt);

            expect(result).toEqual(
                {
                    "jti": jti,
                    "htm": "GET",
                    "htu": "http://test.com",
                    "iat": iat,
                });
        });
    });
});
