// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { KJUR, KEYUTIL as KeyUtil, X509, hextob64u, b64tohex } from 'jsrsasign';

import { Log } from './Log';

const AllowedSigningAlgs = ["RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512"];

export class JoseUtil {
    static parseJwt(jwt: any) {
        Log.debug("JoseUtil.parseJwt");
        try {
            var token = KJUR.jws.JWS.parse(jwt);
            return {
                header: token.headerObj,
                payload: token.payloadObj
            }
        } catch (e) {
            Log.error(e);
            return null;
        }
    }

    static validateJwt(jwt: any, key: any, issuer: string, audience: string, clockSkew: number, now?: number, timeInsensitive = false) {
        Log.debug("JoseUtil.validateJwt");

        try {
            if (key.kty === "RSA") {
                if (key.e && key.n) {
                    key = KeyUtil.getKey(key);
                } else if (key.x5c && key.x5c.length) {
                    var hex = b64tohex(key.x5c[0]);
                    key = X509.getPublicKeyFromCertHex(hex);
                } else {
                    Log.error("JoseUtil.validateJwt: RSA key missing key material", key);
                    throw new Error("RSA key missing key material");
                }
            } else if (key.kty === "EC") {
                if (key.crv && key.x && key.y) {
                    key = KeyUtil.getKey(key);
                } else {
                    Log.error("JoseUtil.validateJwt: EC key missing key material", key);
                    throw new Error("EC key missing key material");
                }
            } else {
                Log.error("JoseUtil.validateJwt: Unsupported key type", key && key.kty);
                throw new Error("Unsupported key type: " + key && key.kty);
            }

            return JoseUtil._validateJwt(jwt, key, issuer, audience, clockSkew, now, timeInsensitive);
        } catch (e) {
            Log.error(e && e.message || e);
            throw e;
        }
    }

    static validateJwtAttributes(jwt: any, issuer: string, audience: string, clockSkew: number, now?: number, timeInsensitive=false) {
        if (!clockSkew) {
            clockSkew = 0;
        }

        if (!now) {
            now = Math.floor(Date.now() / 1000);
        }

        const parsedJwt = JoseUtil.parseJwt(jwt);
        if (!parsedJwt || !parsedJwt.payload) {
            throw new Error("Failed to parse token");
        }

        const payload: any = parsedJwt.payload;
        if (!payload.iss) {
            Log.error("JoseUtil._validateJwt: issuer was not provided");
            throw new Error("issuer was not provided");
        }
        if (payload.iss !== issuer) {
            Log.error("JoseUtil._validateJwt: Invalid issuer in token", payload.iss);
            throw new Error("Invalid issuer in token: " + payload.iss);
        }

        if (!payload.aud) {
            Log.error("JoseUtil._validateJwt: aud was not provided");
            throw new Error("aud was not provided");
        }
        var validAudience = payload.aud === audience || (Array.isArray(payload.aud) && payload.aud.indexOf(audience) >= 0);
        if (!validAudience) {
            Log.error("JoseUtil._validateJwt: Invalid audience in token", payload.aud);
            throw new Error("Invalid audience in token: " + payload.aud);
        }
        if (payload.azp && payload.azp !== audience) {
            Log.error("JoseUtil._validateJwt: Invalid azp in token", payload.azp);
            throw new Error("Invalid azp in token: " + payload.azp);
        }

        if (!timeInsensitive) {
            var lowerNow = now + clockSkew;
            var upperNow = now - clockSkew;

            if (!payload.iat) {
                Log.error("JoseUtil._validateJwt: iat was not provided");
                throw new Error("iat was not provided");
            }
            if (lowerNow < payload.iat) {
                Log.error("JoseUtil._validateJwt: iat is in the future", payload.iat);
                throw new Error("iat is in the future: " + payload.iat);
            }

            if (payload.nbf && lowerNow < payload.nbf) {
                Log.error("JoseUtil._validateJwt: nbf is in the future", payload.nbf);
                throw new Error("nbf is in the future: " + payload.nbf);
            }

            if (!payload.exp) {
                Log.error("JoseUtil._validateJwt: exp was not provided");
                throw new Error("exp was not provided");
            }
            if (payload.exp < upperNow) {
                Log.error("JoseUtil._validateJwt: exp is in the past", payload.exp);
                throw new Error("exp is in the past:" + payload.exp);
            }
        }

        return payload;
    }

    static _validateJwt(jwt: any, key: string, issuer: string, audience: string, clockSkew: number, now?: number, timeInsensitive = false) {
        const payload = JoseUtil.validateJwtAttributes(jwt, issuer, audience, clockSkew, now, timeInsensitive);

        let isValid: boolean;
        try {
            isValid = KJUR.jws.JWS.verify(jwt, key, AllowedSigningAlgs);
        } catch (e) {
            Log.error(e && e.message || e);
            throw new Error("signature validation failed");
        }

        if (!isValid) {
            Log.error("JoseUtil._validateJwt: signature validation failed");
            throw new Error("signature validation failed");
        }

        return payload;
    }

    static hashString(value: any, alg: string) {
        try {
            return KJUR.crypto.Util.hashString(value, alg);
        } catch (e) {
            Log.error(e);
            throw e;
        }
    }

    static hexToBase64Url(value: string) {
        try {
            return hextob64u(value);
        } catch (e) {
            Log.error(e);
            throw e;
        }
    }
}
