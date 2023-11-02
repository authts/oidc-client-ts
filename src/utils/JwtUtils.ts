import { jwtDecode } from "jwt-decode";

import { Logger } from "./Logger";
import type { JwtClaims } from "../Claims";

/**
 * @internal
 */
export class JwtUtils {
    // IMPORTANT: doesn't validate the token
    public static decode(token: string): JwtClaims {
        try {
            return jwtDecode<JwtClaims>(token);
        }
        catch (err) {
            Logger.error("JwtUtils.decode", err);
            throw err;
        }
    }
}
