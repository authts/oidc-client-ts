// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, CryptoUtils } from "./utils";
import { State } from "./State";

export class SigninState extends State {
    // isCode
    public readonly code_verifier: string | undefined;
    public readonly code_challenge: string | undefined;

    // to ensure state still matches settings
    public readonly authority: string;
    public readonly client_id: string;
    public readonly redirect_uri: string;
    public readonly scope: string;
    public readonly client_secret: string | undefined;
    public readonly extraTokenParams: Record<string, any> | undefined;

    public readonly skipUserInfo: boolean | undefined;

    public constructor(args: {
        id?: string;
        data?: any;
        created?: number;
        request_type?: string;

        code_verifier?: string | boolean;
        authority: string;
        client_id: string;
        redirect_uri: string;
        scope: string;
        client_secret?: string;
        extraTokenParams?: Record<string, any>;
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

        this.skipUserInfo = args.skipUserInfo;
    }

    public toStorageString(): string {
        Log.debug("SigninState.toStorageString");
        return JSON.stringify({
            id: this.id,
            data: this.data,
            created: this.created,
            request_type: this.request_type,

            code_verifier: this.code_verifier,
            authority: this.authority,
            client_id: this.client_id,
            redirect_uri: this.redirect_uri,
            scope: this.scope,
            client_secret: this.client_secret,
            extraTokenParams : this.extraTokenParams,
            skipUserInfo: this.skipUserInfo
        });
    }

    public static fromStorageString(storageString: string): SigninState {
        Log.debug("SigninState.fromStorageString");
        const data = JSON.parse(storageString);
        return new SigninState(data);
    }
}
