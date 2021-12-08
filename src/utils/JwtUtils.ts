import jwt_decode from "jwt-decode";

import { Logger } from "./Log";

/**
 * @internal
 */
export interface JwtPayload {
    iss?: string;
    aud?: string | string[];
    azp?: string;
    iat?: number;
    nbf?: number;
    exp?: number;
    sub?: string;
    auth_time?: number;

    [claim: string]: unknown;
}

/**
 * @internal
 */
export class JwtUtils {

    // IMPORTANT: doesn't validate the token
    public static decode(token: string): JwtPayload {
        try {
            const payload = jwt_decode<JwtPayload>(token);
            return payload;
        }
        catch (err) {
            Logger.error("JwtUtils", err);
            throw err;
        }
    }
}
