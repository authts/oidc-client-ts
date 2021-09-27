// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { KJUR, KEYUTIL as KeyUtil, X509, hextob64u, b64tohex } from "jsrsasign";

import { Log } from "./Log";
import { Timer } from "./Timer";

const AllowedSigningAlgs = ["RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512"];

export interface ParsedJwt {
    header: {
        alg: string;
        typ: string;
    };
    payload?: JwtPayload;
}

export interface JwtPayload {
    iss?: string;
    aud?: string;
    azp?: string;
    iat?: number;
    nbf?: number;
    exp?: number;
    sub?: string;
    nonce?: string;
    auth_time?: any;
}

export class JoseUtil {
    public static parseJwt(jwt: string): ParsedJwt | null {
        Log.debug("JoseUtil.parseJwt");
        try {
            const token = KJUR.jws.JWS.parse(jwt);
            return {
                header: token.headerObj,
                payload: token.payloadObj
            };
        }
        catch (err) {
            Log.error(err instanceof Error ? err.message : err);
            return null;
        }
    }

    public static validateJwt(jwt: string, key: any, issuer: string, audience: string, clockSkew: number, now?: number, timeInsensitive = false): void {
        Log.debug("JoseUtil.validateJwt");

        try {
            if (key.kty === "RSA") {
                if (key.e && key.n) {
                    key = KeyUtil.getKey(key);
                } else if (key.x5c && key.x5c.length) {
                    const hex = b64tohex(key.x5c[0]);
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
                throw new Error("Unsupported key type: " + (key ? String(key.kty) : "undefined"));
            }

            JoseUtil._validateJwt(jwt, key, issuer, audience, clockSkew, now, timeInsensitive);
        }
        catch (err) {
            Log.error(err instanceof Error ? err.message : err);
            throw err;
        }
    }

    public static validateJwtAttributes(jwt: string, issuer: string, audience: string, clockSkew: number, now?: number, timeInsensitive=false): JwtPayload {
        if (!now) {
            now = Timer.getEpochTime();
        }

        const parsedJwt = JoseUtil.parseJwt(jwt);
        if (!parsedJwt || !parsedJwt.payload) {
            throw new Error("Failed to parse token");
        }

        const payload = parsedJwt.payload;
        if (!payload.iss) {
            Log.error("JoseUtil.validateJwtAttributes: issuer was not provided");
            throw new Error("issuer was not provided");
        }
        if (payload.iss !== issuer) {
            Log.error("JoseUtil.validateJwtAttributes: Invalid issuer in token", payload.iss);
            throw new Error("Invalid issuer in token: " + String(payload.iss));
        }

        if (!payload.aud) {
            Log.error("JoseUtil.validateJwtAttributes: aud was not provided");
            throw new Error("aud was not provided");
        }
        const validAudience = payload.aud === audience || (Array.isArray(payload.aud) && payload.aud.indexOf(audience) >= 0);
        if (!validAudience) {
            Log.error("JoseUtil.validateJwtAttributes: Invalid audience in token", payload.aud);
            throw new Error("Invalid audience in token: " + payload.aud);
        }
        if (payload.azp && payload.azp !== audience) {
            Log.error("JoseUtil.validateJwtAttributes: Invalid azp in token", payload.azp);
            throw new Error("Invalid azp in token: " + payload.azp);
        }

        if (!timeInsensitive) {
            const lowerNow = now + clockSkew;
            const upperNow = now - clockSkew;

            if (!payload.iat) {
                Log.error("JoseUtil.validateJwtAttributes: iat was not provided");
                throw new Error("iat was not provided");
            }
            if (lowerNow < payload.iat) {
                Log.error("JoseUtil.validateJwtAttributes: iat is in the future", payload.iat);
                throw new Error("iat is in the future: " + String(payload.iat));
            }

            if (payload.nbf && lowerNow < payload.nbf) {
                Log.error("JoseUtil.validateJwtAttributes: nbf is in the future", payload.nbf);
                throw new Error("nbf is in the future: " + String(payload.nbf));
            }

            if (!payload.exp) {
                Log.error("JoseUtil.validateJwtAttributes: exp was not provided");
                throw new Error("exp was not provided");
            }
            if (payload.exp < upperNow) {
                Log.error("JoseUtil.validateJwtAttributes: exp is in the past", payload.exp);
                throw new Error("exp is in the past: " + String(payload.exp));
            }
        }

        return payload;
    }

    private static _validateJwt(jwt: string, key: any, issuer: string, audience: string, clockSkew: number, now?: number, timeInsensitive = false) {
        JoseUtil.validateJwtAttributes(jwt, issuer, audience, clockSkew, now, timeInsensitive);

        let isValid: boolean;
        try {
            isValid = KJUR.jws.JWS.verify(jwt, key, AllowedSigningAlgs);
        }
        catch (err) {
            Log.error(err instanceof Error ? err.message : err);
            throw new Error("signature validation failed");
        }

        if (!isValid) {
            Log.error("JoseUtil._validateJwt: signature validation failed");
            throw new Error("signature validation failed");
        }
    }

    public static hashString(value: string, alg: string): string {
        try {
            return KJUR.crypto.Util.hashString(value, alg);
        }
        catch (err) {
            Log.error(err);
            throw err;
        }
    }

    public static hexToBase64Url(value: string): string {
        try {
            return hextob64u(value);
        }
        catch (err) {
            Log.error(err);
            throw err;
        }
    }
}
