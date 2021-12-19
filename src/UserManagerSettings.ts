// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { OidcClientSettings, OidcClientSettingsStore } from "./OidcClientSettings";
import type { PopupWindowFeatures } from "./utils";
import { WebStorageStateStore } from "./WebStorageStateStore";
import { InMemoryWebStorage } from "./InMemoryWebStorage";

const DefaultAccessTokenExpiringNotificationTimeInSeconds = 60;
const DefaultCheckSessionIntervalInSeconds = 2;

/**
 * The settings used to configure the {@link UserManager}.
 *
 * @public
 */
export interface UserManagerSettings extends OidcClientSettings {
    /** The URL for the page containing the call to signinPopupCallback to handle the callback from the OIDC/OAuth2 */
    popup_redirect_uri?: string;
    popup_post_logout_redirect_uri?: string;
    /**
     * The features parameter to window.open for the popup signin window. By default, the popup is
     * placed centered in front of the window opener.
     * (default: \{ location: false, menubar: false, height: 640 \})
     */
    popupWindowFeatures?: PopupWindowFeatures;
    /** The target parameter to window.open for the popup signin window (default: "_blank") */
    popupWindowTarget?: string;
    /** The methods window.location method used to redirect (default: "assign") */
    redirectMethod?: "replace" | "assign";

    /** The URL for the page containing the code handling the silent renew */
    silent_redirect_uri?: string;
    /** Number of seconds to wait for the silent renew to return before assuming it has failed or timed out (default: 10) */
    silentRequestTimeoutInSeconds?: number;
    /** Flag to indicate if there should be an automatic attempt to renew the access token prior to its expiration (default: true) */
    automaticSilentRenew?: boolean;
    /** Flag to validate user.profile.sub in silent renew calls (default: true) */
    validateSubOnSilentRenew?: boolean;
    /** Flag to control if id_token is included as id_token_hint in silent renew calls (default: false) */
    includeIdTokenInSilentRenew?: boolean;

    /** Will raise events for when user has performed a signout at the OP (default: false) */
    monitorSession?: boolean;
    monitorAnonymousSession?: boolean;
    /** Interval in seconds to check the user's session (default: 2) */
    checkSessionIntervalInSeconds?: number;
    query_status_response_type?: string;
    stopCheckSessionOnError?: boolean;

    /**
     * The `token_type_hint`s to pass to the authority server by default (default: ["access_token", "refresh_token"])
     *
     * Token types will be revoked in the same order as they are given here.
     */
    revokeTokenTypes?: ("access_token" | "refresh_token")[];
    /** Will invoke the revocation endpoint on signout if there is an access token for the user (default: false) */
    revokeTokensOnSignout?: boolean;
    /** The number of seconds before an access token is to expire to raise the accessTokenExpiring event (default: 60) */
    accessTokenExpiringNotificationTimeInSeconds?: number;

    /**
     * Storage object used to persist User for currently authenticated user (default: window.sessionStorage, InMemoryWebStorage iff no window).
     *  E.g. `userStore: new WebStorageStateStore({ store: window.localStorage })`
     */
    userStore?: WebStorageStateStore;
}

/**
 * The settings with defaults applied of the {@link UserManager}.
 * @see {@link UserManagerSettings}
 *
 * @public
 */
export class UserManagerSettingsStore extends OidcClientSettingsStore {
    public readonly popup_redirect_uri: string | undefined;
    public readonly popup_post_logout_redirect_uri: string | undefined;
    public readonly popupWindowFeatures: PopupWindowFeatures | undefined;
    public readonly popupWindowTarget: string | undefined;
    public readonly redirectMethod: "replace" | "assign";

    public readonly silent_redirect_uri: string | undefined;
    public readonly silentRequestTimeoutInSeconds: number | undefined;
    public readonly automaticSilentRenew: boolean;
    public readonly validateSubOnSilentRenew: boolean;
    public readonly includeIdTokenInSilentRenew: boolean;

    public readonly monitorSession: boolean;
    public readonly monitorAnonymousSession: boolean;
    public readonly checkSessionIntervalInSeconds: number;
    public readonly query_status_response_type: string | undefined;
    public readonly stopCheckSessionOnError: boolean;

    public readonly revokeTokenTypes: ("access_token" | "refresh_token")[];
    public readonly revokeTokensOnSignout: boolean;
    public readonly accessTokenExpiringNotificationTimeInSeconds: number;

    public readonly userStore: WebStorageStateStore;

    public constructor(args: UserManagerSettings) {
        const {
            popup_redirect_uri,
            popup_post_logout_redirect_uri,
            popupWindowFeatures,
            popupWindowTarget,
            redirectMethod = "assign",

            silent_redirect_uri,
            silentRequestTimeoutInSeconds,
            automaticSilentRenew = true,
            validateSubOnSilentRenew = true,
            includeIdTokenInSilentRenew = false,

            monitorSession = false,
            monitorAnonymousSession = false,
            checkSessionIntervalInSeconds = DefaultCheckSessionIntervalInSeconds,
            query_status_response_type,
            stopCheckSessionOnError = true,

            revokeTokenTypes = ["access_token", "refresh_token"],
            revokeTokensOnSignout = false,
            accessTokenExpiringNotificationTimeInSeconds = DefaultAccessTokenExpiringNotificationTimeInSeconds,

            userStore,
        } = args;

        super(args);

        this.popup_redirect_uri = popup_redirect_uri;
        this.popup_post_logout_redirect_uri = popup_post_logout_redirect_uri;
        this.popupWindowFeatures = popupWindowFeatures;
        this.popupWindowTarget = popupWindowTarget;
        this.redirectMethod = redirectMethod;

        this.silent_redirect_uri = silent_redirect_uri;
        this.silentRequestTimeoutInSeconds = silentRequestTimeoutInSeconds;
        this.automaticSilentRenew = automaticSilentRenew;
        this.validateSubOnSilentRenew = validateSubOnSilentRenew;
        this.includeIdTokenInSilentRenew = includeIdTokenInSilentRenew;

        this.monitorSession = monitorSession;
        this.monitorAnonymousSession = monitorAnonymousSession;
        this.checkSessionIntervalInSeconds = checkSessionIntervalInSeconds;
        this.stopCheckSessionOnError = stopCheckSessionOnError;
        if (query_status_response_type) {
            this.query_status_response_type = query_status_response_type;
        }
        else {
            this.query_status_response_type = "code";
        }

        this.revokeTokenTypes = revokeTokenTypes;
        this.revokeTokensOnSignout = revokeTokensOnSignout;
        this.accessTokenExpiringNotificationTimeInSeconds = accessTokenExpiringNotificationTimeInSeconds;

        if (userStore) {
            this.userStore = userStore;
        }
        else {
            const store = typeof window !== "undefined" ? window.sessionStorage : new InMemoryWebStorage();
            this.userStore = new WebStorageStateStore({ store });
        }
    }
}
