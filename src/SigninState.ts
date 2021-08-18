// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, JoseUtil, random } from "./utils";
import { State } from "./State";

export class SigninState extends State {
    public readonly nonce: any;
    public readonly code_verifier: any;
    public readonly code_challenge: any;
    public readonly redirect_uri: any;
    public readonly authority: any;
    public readonly client_id: any;
    public readonly response_mode: any;
    public readonly client_secret: any;
    public readonly scope: any;
    public readonly extraTokenParams: any;
    public readonly skipUserInfo: any;

    constructor(args: any = {}) {
        const {
            nonce, authority, client_id,
            redirect_uri, code_verifier, response_mode, client_secret,
            scope, extraTokenParams, skipUserInfo
        } = args;
        super(args);

        if (nonce === true) {
            this.nonce = random();
        }
        else if (nonce) {
            this.nonce = nonce;
        }

        if (code_verifier === true) {
            // random() produces 32 length
            this.code_verifier = random() + random() + random();
        }
        else if (code_verifier) {
            this.code_verifier = code_verifier;
        }

        if (this.code_verifier) {
            const hash = JoseUtil.hashString(this.code_verifier, "SHA256");
            this.code_challenge = JoseUtil.hexToBase64Url(hash);
        }

        this.redirect_uri = redirect_uri;
        this.authority = authority;
        this.client_id = client_id;
        this.response_mode = response_mode;
        this.client_secret = client_secret;
        this.scope = scope;
        this.extraTokenParams = extraTokenParams;
        this.skipUserInfo = skipUserInfo;
    }

    toStorageString() {
        Log.debug("SigninState.toStorageString");
        return JSON.stringify({
            id: this.id,
            data: this.data,
            created: this.created,
            request_type: this.request_type,
            nonce: this.nonce,
            code_verifier: this.code_verifier,
            redirect_uri: this.redirect_uri,
            authority: this.authority,
            client_id: this.client_id,
            response_mode: this.response_mode,
            client_secret: this.client_secret,
            scope: this.scope,
            extraTokenParams : this.extraTokenParams,
            skipUserInfo: this.skipUserInfo
        });
    }

    static fromStorageString(storageString: string) {
        Log.debug("SigninState.fromStorageString");
        const data = JSON.parse(storageString);
        return new SigninState(data);
    }
}
