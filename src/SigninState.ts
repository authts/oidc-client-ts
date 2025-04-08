// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, CryptoUtils } from "./utils";
import { State } from "./State";

/** @public */
export interface SigninStateArgs {
    id?: string;
    data?: unknown;
    created?: number;
    request_type?: string;

    code_verifier?: string;
    code_challenge?: string;
    authority: string;
    client_id: string;
    redirect_uri: string;
    scope: string;
    client_secret?: string;
    extraTokenParams?: Record<string, unknown>;
    response_mode?: "query" | "fragment";
    skipUserInfo?: boolean;
    url_state?: string;
}

/** @public */
export type SigninStateCreateArgs = Omit<SigninStateArgs, "code_verifier"> & {
    code_verifier?: string | boolean;
};

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

    private constructor(args: SigninStateArgs) {
        super(args);

        this.code_verifier = args.code_verifier;
        this.code_challenge = args.code_challenge;
        this.authority = args.authority;
        this.client_id = args.client_id;
        this.redirect_uri = args.redirect_uri;
        this.scope = args.scope;
        this.client_secret = args.client_secret;
        this.extraTokenParams = args.extraTokenParams;

        this.response_mode = args.response_mode;
        this.skipUserInfo = args.skipUserInfo;
    }

    public static async create(args: SigninStateCreateArgs): Promise<SigninState> {
        const code_verifier = args.code_verifier === true ? CryptoUtils.generateCodeVerifier() : (args.code_verifier || undefined);
        const code_challenge = code_verifier ? (await CryptoUtils.generateCodeChallenge(code_verifier)) : undefined;

        return new SigninState({
            ...args,
            code_verifier,
            code_challenge,
        });
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

    public static fromStorageString(storageString: string): Promise<SigninState> {
        Logger.createStatic("SigninState", "fromStorageString");
        const data = JSON.parse(storageString);
        return SigninState.create(data);
    }
}
