// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from './utils';
import { JsonService } from './JsonService';
import { OidcClientSettingsStore } from './OidcClientSettings';
import { OidcMetadata } from './OidcMetadata';

const OidcMetadataUrlPath = '.well-known/openid-configuration';

export class MetadataService {
    private _settings: OidcClientSettingsStore
    private _jsonService: JsonService

    // cache
    private _metadataUrl: string | undefined
    private _signingKeys: any[] | null;
    private _metadata: Partial<OidcMetadata> | null;

    constructor(settings: OidcClientSettingsStore, JsonServiceCtor = JsonService) {
        if (!settings) {
            Log.error("MetadataService: No settings passed to MetadataService");
            throw new Error("settings");
        }

        this._settings = settings;
        this._jsonService = new JsonServiceCtor(['application/jwk-set+json']);

        this._metadataUrl = undefined

        this._signingKeys = null;
        if (this._settings.signingKeys) {
            Log.debug("MetadataService.ctor: Using signingKeys from settings");
            this._signingKeys = this._settings.signingKeys;
        }

        this._metadata = null;
        if (this._settings.metadata) {
            Log.debug("MetadataService.ctor: Using metadata from settings");
            this._metadata = this._settings.metadata;
        }
    }

    get metadataUrl(): string {
        if (!this._metadataUrl) {
            if (this._settings.metadataUrl) {
                this._metadataUrl = this._settings.metadataUrl;
            }
            else {
                this._metadataUrl = this._settings.authority;

                if (this._metadataUrl && this._metadataUrl.indexOf(OidcMetadataUrlPath) < 0) {
                    if (this._metadataUrl[this._metadataUrl.length - 1] !== '/') {
                        this._metadataUrl += '/';
                    }
                    this._metadataUrl += OidcMetadataUrlPath;
                }
            }
        }

        return this._metadataUrl || "";
    }

    resetSigningKeys() {
        this._signingKeys = null
    }

    async getMetadata(): Promise<Partial<OidcMetadata>> {
        if (this._metadata) {
            Log.debug("MetadataService.getMetadata: Returning metadata from cache");
            return this._metadata;
        }

        if (!this.metadataUrl) {
            Log.error("MetadataService.getMetadata: No authority or metadataUrl configured on settings");
            throw new Error("No authority or metadataUrl configured on settings");
        }

        Log.debug("MetadataService.getMetadata: getting metadata from", this.metadataUrl);
        const metadata = await this._jsonService.getJson(this.metadataUrl);

        Log.debug("MetadataService.getMetadata: json received");
        var seed = this._settings.metadataSeed || {};
        this._metadata = Object.assign({}, seed, metadata) as Partial<OidcMetadata>;
        return this._metadata;
    }

    getIssuer() {
        return this._getMetadataProperty("issuer") as Promise<string>;
    }

    getAuthorizationEndpoint() {
        return this._getMetadataProperty("authorization_endpoint") as Promise<string>;
    }

    getUserInfoEndpoint() {
        return this._getMetadataProperty("userinfo_endpoint") as Promise<string>;
    }

    getTokenEndpoint(optional=true) {
        return this._getMetadataProperty("token_endpoint", optional) as Promise<string | undefined>;
    }

    getCheckSessionIframe() {
        return this._getMetadataProperty("check_session_iframe", true) as Promise<string | undefined>;
    }

    getEndSessionEndpoint() {
        return this._getMetadataProperty("end_session_endpoint", true) as Promise<string | undefined>;
    }

    getRevocationEndpoint() {
        return this._getMetadataProperty("revocation_endpoint", true) as Promise<string | undefined>;
    }

    getKeysEndpoint(optional=true) {
        return this._getMetadataProperty("jwks_uri", optional) as Promise<string | undefined>;
    }

    async _getMetadataProperty(name: keyof OidcMetadata, optional=false) {
        Log.debug("MetadataService.getMetadataProperty for: " + name);

        const metadata = await this.getMetadata();
        Log.debug("MetadataService.getMetadataProperty: metadata recieved");

        if (metadata[name] === undefined) {
            if (optional === true) {
                Log.warn("MetadataService.getMetadataProperty: Metadata does not contain optional property " + name);
                return undefined;
            }
            else {
                Log.error("MetadataService.getMetadataProperty: Metadata does not contain property " + name);
                throw new Error("Metadata does not contain property " + name);
            }
        }

        return metadata[name];
    }

    async getSigningKeys() {
        if (this._signingKeys) {
            Log.debug("MetadataService.getSigningKeys: Returning signingKeys from cache");
            return this._signingKeys;
        }

        const jwks_uri = await this.getKeysEndpoint(false);
        Log.debug("MetadataService.getSigningKeys: jwks_uri received", jwks_uri);

        const keySet = await this._jsonService.getJson(jwks_uri as string);
        Log.debug("MetadataService.getSigningKeys: key set received", keySet);

        if (!keySet.keys) {
            Log.error("MetadataService.getSigningKeys: Missing keys on keyset");
            throw new Error("Missing keys on keyset");
        }

        this._signingKeys = keySet.keys;
        return this._signingKeys;
    }
}
