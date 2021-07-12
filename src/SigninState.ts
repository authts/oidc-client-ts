// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from './Log';
import { State } from './State';
import { JoseUtil } from './JoseUtil';
import random from './random';

export class SigninState extends State {
    private _nonce: any;
    private _code_verifier: any;
    private _code_challenge: any;
    private _redirect_uri: any;
    private _authority: any;
    private _client_id: any;
    private _response_mode: any;
    private _client_secret: any;
    private _scope: any;
    private _extraTokenParams: any;
    private _skipUserInfo: any;

    constructor({
        nonce, authority, client_id,
        redirect_uri, code_verifier, response_mode, client_secret,
        scope, extraTokenParams, skipUserInfo
    }: any = {}) {
        super(arguments[0]);

        if (nonce === true) {
            this._nonce = random();
        }
        else if (nonce) {
            this._nonce = nonce;
        }

        if (code_verifier === true) {
            // random() produces 32 length
            this._code_verifier = random() + random() + random();
        }
        else if (code_verifier) {
            this._code_verifier = code_verifier;
        }

        if (this.code_verifier) {
            let hash = JoseUtil.hashString(this.code_verifier, "SHA256");
            this._code_challenge = JoseUtil.hexToBase64Url(hash);
        }

        this._redirect_uri = redirect_uri;
        this._authority = authority;
        this._client_id = client_id;
        this._response_mode = response_mode;
        this._client_secret = client_secret;
        this._scope = scope;
        this._extraTokenParams = extraTokenParams;
        this._skipUserInfo = skipUserInfo;
    }

    get nonce() {
        return this._nonce;
    }
    get authority() {
        return this._authority;
    }
    get client_id() {
        return this._client_id;
    }
    get redirect_uri() {
        return this._redirect_uri;
    }
    get code_verifier() {
        return this._code_verifier;
    }
    get code_challenge() {
        return this._code_challenge;
    }
    get response_mode() {
        return this._response_mode;
    }
    get client_secret() {
        return this._client_secret;
    }
    get scope() {
        return this._scope;
    }
    get extraTokenParams() {
        return this._extraTokenParams;
    }
    get skipUserInfo() {
        return this._skipUserInfo;
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
        var data = JSON.parse(storageString);
        return new SigninState(data);
    }
}
