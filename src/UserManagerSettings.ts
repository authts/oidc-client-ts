// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { OidcClientSettings, OidcClientSettingsStore } from "./OidcClientSettings";
import { WebStorageStateStore } from "./WebStorageStateStore";
import { SigninRequest } from "./SigninRequest";

const DefaultAccessTokenExpiringNotificationTimeInSeconds = 60;
const DefaultCheckSessionIntervalInSeconds = 2;

/**
 * @public
 */
export interface UserManagerSettings extends OidcClientSettings {
    /** The URL for the page containing the call to signinPopupCallback to handle the callback from the OIDC/OAuth2 */
    popup_redirect_uri?: string;
    popup_post_logout_redirect_uri?: string;
    /** The features parameter to window.open for the popup signin window.
     *  default: 'location=no,toolbar=no,width=500,height=500,left=100,top=100'
     */
    popupWindowFeatures?: string;
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

    /** Will raise events for when user has performed a signout at the OP (default: false) */
    monitorSession?: boolean;
    monitorAnonymousSession?: boolean;
    /** Interval in seconds to check the user's session (default: 2) */
    checkSessionIntervalInSeconds?: number;
    query_status_response_type?: string;
    stopCheckSessionOnError?: boolean;

    /** Will invoke the revocation endpoint on signout if there is an access token for the user (default: false) */
    revokeAccessTokenOnSignout?: boolean;
    /** The number of seconds before an access token is to expire to raise the accessTokenExpiring event (default: 60) */
    accessTokenExpiringNotificationTimeInSeconds?: number;

    /** Storage object used to persist User for currently authenticated user (default: session storage) */
    userStore?: WebStorageStateStore;
}

export class UserManagerSettingsStore extends OidcClientSettingsStore {
    public readonly popup_redirect_uri: string | undefined;
    public readonly popup_post_logout_redirect_uri: string | undefined;
    public readonly popupWindowFeatures: string | undefined;
    public readonly popupWindowTarget: string | undefined;
    public readonly redirectMethod: "replace" | "assign";

    public readonly silent_redirect_uri: string | undefined;
    public readonly silentRequestTimeoutInSeconds: number | undefined;
    public readonly automaticSilentRenew: boolean;
    public readonly validateSubOnSilentRenew: boolean;

    public readonly monitorSession: boolean;
    public readonly monitorAnonymousSession: boolean;
    public readonly checkSessionIntervalInSeconds: number;
    public readonly query_status_response_type: string | undefined;
    public readonly stopCheckSessionOnError: boolean;

    public readonly revokeAccessTokenOnSignout: boolean;
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

            monitorSession = false,
            monitorAnonymousSession = false,
            checkSessionIntervalInSeconds = DefaultCheckSessionIntervalInSeconds,
            query_status_response_type,
            stopCheckSessionOnError = true,

            revokeAccessTokenOnSignout = false,
            accessTokenExpiringNotificationTimeInSeconds = DefaultAccessTokenExpiringNotificationTimeInSeconds,

            userStore = new WebStorageStateStore({ store: sessionStorage })
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

        this.revokeAccessTokenOnSignout = revokeAccessTokenOnSignout;
        this.accessTokenExpiringNotificationTimeInSeconds = accessTokenExpiringNotificationTimeInSeconds;

        this.userStore = userStore;
    }
}
