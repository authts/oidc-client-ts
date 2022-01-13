import jwt_decode from "jwt-decode";

import { Logger } from "./Logger";
import type { JwtClaims } from "../Claims";

/**
 * @internal
 */
export class JwtUtils {
    // IMPORTANT: doesn't validate the token
    public static decode(token: string): JwtClaims {
        try {
            return jwt_decode<JwtClaims>(token);
        }
        catch (err) {
            Logger.error("JwtUtils.decode", err);
            throw err;
        }
    }
}
