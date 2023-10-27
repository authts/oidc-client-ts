// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, CryptoUtils } from "./utils";
import { State } from "./State";

/**
 * @public
 */
export class SigninState extends State {
    // isCode
    /** The same code_verifier that was used to obtain the authorization_code via PKCE. */
    public readonly code_verifier: string | undefined;
    /** Used to secure authorization code grants via Proof Key for Code Exchange (PKCE). */
    public readonly code_challenge: string | undefined;

    // to ensure state still matches settings
    /** @see {@link OidcClientSettings.authority} */
    public readonly authority: string;
    /** @see {@link OidcClientSettings.client_id} */
    public readonly client_id: string;
    /** @see {@link OidcClientSettings.redirect_uri} */
    public readonly redirect_uri: string;
    /** @see {@link OidcClientSettings.scope} */
    public readonly scope: string;
    /** @see {@link OidcClientSettings.client_secret} */
    public readonly client_secret: string | undefined;
    /** @see {@link OidcClientSettings.extraTokenParams} */
    public readonly extraTokenParams: Record<string, unknown> | undefined;
    /** @see {@link OidcClientSettings.response_mode} */
    public readonly response_mode: "query" | "fragment" | undefined;

    public readonly skipUserInfo: boolean | undefined;

    public constructor(args: {
        id?: string;
        data?: unknown;
        created?: number;
        request_type?: string;
        url_state?: string;

        code_verifier?: string | boolean;
        authority: string;
        client_id: string;
        redirect_uri: string;
        scope: string;
        client_secret?: string;
        extraTokenParams?: Record<string, unknown>;
        response_mode?: "query" | "fragment";
        skipUserInfo?: boolean;
    }) {
        super(args);

        if (args.code_verifier === true) {
            this.code_verifier = CryptoUtils.generateCodeVerifier();
        }
        else if (args.code_verifier) {
            this.code_verifier = args.code_verifier;
        }

        if (this.code_verifier) {
            this.code_challenge = CryptoUtils.generateCodeChallenge(this.code_verifier);
        }

        this.authority = args.authority;
        this.client_id = args.client_id;
        this.redirect_uri = args.redirect_uri;
        this.scope = args.scope;
        this.client_secret = args.client_secret;
        this.extraTokenParams = args.extraTokenParams;

        this.response_mode = args.response_mode;
        this.skipUserInfo = args.skipUserInfo;
    }

    public toStorageString(): string {
        new Logger("SigninState").create("toStorageString");
        return JSON.stringify({
            id: this.id,
            data: this.data,
            created: this.created,
            request_type: this.request_type,
            url_state: this.url_state,

            code_verifier: this.code_verifier,
            authority: this.authority,
            client_id: this.client_id,
            redirect_uri: this.redirect_uri,
            scope: this.scope,
            client_secret: this.client_secret,
            extraTokenParams : this.extraTokenParams,
            response_mode: this.response_mode,
            skipUserInfo: this.skipUserInfo,
        });
    }

    public static fromStorageString(storageString: string): SigninState {
        Logger.createStatic("SigninState", "fromStorageString");
        const data = JSON.parse(storageString);
        return new SigninState(data);
    }
}
