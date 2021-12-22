// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, Timer } from "./utils";

/**
 * Holds claims represented by a combination of the `id_token` and the user info endpoint.
 * @see https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims
 *
 * @public
 */
export interface UserProfile {
    /** Identifier for the End-User at the Issuer */
    sub?: string;
    sid?: string;
    azp?: string;
    at_hash?: string;
    auth_time?: number;

    /** End-User's full name in displayable form including all name parts, possibly including titles and suffixes, ordered according to the End-User's locale and preferences */
    name?: string;
    /** Given name(s) or first name(s) of the End-User. Note that in some cultures, people can have multiple given names; all can be present, with the names being separated by space characters. */
    given_name?: string;
    /** Surname(s) or last name(s) of the End-User. Note that in some cultures, people can have multiple family names or no family name; all can be present, with the names being separated by space characters. */
    family_name?: string;
    /** Middle name(s) of the End-User. Note that in some cultures, people can have multiple middle names; all can be present, with the names being separated by space characters. Also note that in some cultures, middle names are not used. */
    middle_name?: string;
    /** Casual name of the End-User that may or may not be the same as the given_name. For instance, a nickname value of Mike might be returned alongside a given_name value of Michael. */
    nickname?: string;
    /** Shorthand name by which the End-User wishes to be referred to at the RP, such as janedoe or j.doe */
    preferred_username?: string;
    /** URL of the End-User's profile page. The contents of this Web page SHOULD be about the End-User. */
    profile?: string;
    /** URL of the End-User's profile picture. This URL MUST refer to an image file (for example, a PNG, JPEG, or GIF image file), rather than to a Web page containing an image. Note that this URL SHOULD specifically reference a profile photo of the End-User suitable for displaying when describing the End-User, rather than an arbitrary photo taken by the End-User. */
    picture?: string;
    /** URL of the End-User's Web page or blog. This Web page SHOULD contain information published by the End-User or an organization that the End-User is affiliated with. */
    website?: string;
    /** End-User's preferred e-mail address. Its value MUST conform to the RFC 5322 addr-spec syntax. */
    email?: string;
    /** True if the End-User's e-mail address has been verified; otherwise false. When this Claim Value is true, this means that the OP took affirmative steps to ensure that this e-mail address was controlled by the End-User at the time the verification was performed. The means by which an e-mail address is verified is context-specific, and dependent upon the trust framework or contractual agreements within which the parties are operating. */
    email_verified?: boolean;
    /** End-User's gender. Values defined by this specification are female and male. Other values MAY be used when neither of the defined values are applicable. */
    gender?: string;
    /** End-User's birthday, represented as an ISO 8601:2004 [ISO8601‑2004] YYYY-MM-DD format. The year MAY be 0000, indicating that it is omitted. To represent only the year, YYYY format is allowed. Note that depending on the underlying platform's date related function, providing just year can result in varying month and day, so the implementers need to take this factor into account to correctly process the dates. */
    birthdate?: string;
    /** String from zoneinfo [zoneinfo] time zone database representing the End-User's time zone. For example, Europe/Paris or America/Los_Angeles. */
    zoneinfo?: string;
    /** End-User's locale, represented as a BCP47 [RFC5646] language tag. This is typically an ISO 639-1 Alpha-2 [ISO639‑1] language code in lowercase and an ISO 3166-1 Alpha-2 [ISO3166‑1] country code in uppercase, separated by a dash. For example, en-US or fr-CA. As a compatibility note, some implementations have used an underscore as the separator rather than a dash, for example, en_US; */
    locale?: string;
    /** End-User's preferred telephone number. E.164 [E.164] is RECOMMENDED as the format of this Claim, for example, +1 (425) 555-1212 or +56 (2) 687 2400. If the phone number contains an extension, it is RECOMMENDED that the extension be represented using the RFC 3966 [RFC3966] extension syntax, for example, +1 (604) 555-1234;ext=5678. */
    phone_number?: string;
    /** True if the End-User's phone number has been verified; otherwise false. When this Claim Value is true, this means that the OP took affirmative steps to ensure that this phone number was controlled by the End-User at the time the verification was performed. The means by which a phone number is verified is context-specific, and dependent upon the trust framework or contractual agreements within which the parties are operating. When true, the phone_number Claim MUST be in E.164 format and any extensions MUST be represented in RFC 3966 format. */
    phone_number_verified?: boolean;
    /** End-User's preferred postal address. The value of the address member is a JSON structure containing some or all of the members defined in the standard.
     *
     * @see https://openid.net/specs/openid-connect-core-1_0.html#AddressClaim
     */
    address?: Record<string, unknown>;
    /** Time the End-User's information was last updated. Its value is a JSON number representing the number of seconds from 1970-01-01T0:0:0Z as measured in UTC until the date/time. */
    updated_at?: number;

    [claim: string]: unknown;
}

/**
 * @public
 */
export class User {
    /**
     * A JSON Web Token (JWT). Only provided if `openid` scope was requested.
     * The application can access the data decoded by using the `profile` property.
     */
    public id_token?: string;

    /** The session state value returned from the OIDC provider. */
    public session_state: string | null;

    /**
     * The requested access token returned from the OIDC provider. The application can use this token to
     * authenticate itself to the secured resource.
     */
    public access_token: string;

    /**
     * An OAuth 2.0 refresh token. The app can use this token to acquire additional access tokens after the
     * current access token expires. Refresh tokens are long-lived and can be used to maintain access to resources
     * for extended periods of time.
     */
    public refresh_token?: string;

    /** Typically "Bearer" */
    public token_type: string;

    /** The scopes that the requested access token is valid for. */
    public scope?: string;

    /** The claims represented by a combination of the `id_token` and the user info endpoint. */
    public profile: UserProfile;

    /** The expires at returned from the OIDC provider. */
    public expires_at?: number;

    /** custom state data set during the initial signin request */
    public readonly state: unknown;

    public constructor(args: {
        id_token?: string;
        session_state?: string | null;
        access_token: string;
        refresh_token?: string;
        token_type: string;
        scope?: string;
        profile: UserProfile;
        expires_at?: number;
        userState?: unknown;
    }) {
        this.id_token = args.id_token;
        this.session_state = args.session_state ?? null;
        this.access_token = args.access_token;
        this.refresh_token = args.refresh_token;

        this.token_type = args.token_type;
        this.scope = args.scope;
        this.profile = args.profile;
        this.expires_at = args.expires_at;
        this.state = args.userState;
    }

    /** Computed number of seconds the access token has remaining. */
    public get expires_in(): number | undefined {
        if (this.expires_at === undefined) {
            return undefined;
        }
        return this.expires_at - Timer.getEpochTime();
    }

    public set expires_in(value: number | undefined) {
        if (value !== undefined) {
            this.expires_at = Math.floor(value) + Timer.getEpochTime();
        }
    }

    /** Computed value indicating if the access token is expired. */
    public get expired(): boolean | undefined {
        const expires_in = this.expires_in;
        if (expires_in === undefined) {
            return undefined;
        }
        return expires_in <= 0;
    }

    /** Array representing the parsed values from the `scope`. */
    public get scopes(): string[] {
        return this.scope?.split(" ") ?? [];
    }

    public toStorageString(): string {
        Logger.debug("User", "toStorageString");
        return JSON.stringify({
            id_token: this.id_token,
            session_state: this.session_state,
            access_token: this.access_token,
            refresh_token: this.refresh_token,
            token_type: this.token_type,
            scope: this.scope,
            profile: this.profile,
            expires_at: this.expires_at,
        });
    }

    public static fromStorageString(storageString: string): User {
        Logger.debug("User", "fromStorageString");
        return new User(JSON.parse(storageString));
    }
}
