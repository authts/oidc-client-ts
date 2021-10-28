import jwt_decode from "jwt-decode";

import { Log } from "./Log";

export interface JwtPayload {
    iss?: string;
    aud?: string;
    azp?: string;
    iat?: number;
    nbf?: number;
    exp?: number;
    sub?: string;
    auth_time?: number;
}

export class JwtUtils {

    // IMPORTANT: doesn't validate the token
    public static decode(token: string): JwtPayload {
        try {
            const payload = jwt_decode<JwtPayload>(token);
            return payload;
        }
        catch (err) {
            Log.error(err);
            throw err;
        }
    }
}
