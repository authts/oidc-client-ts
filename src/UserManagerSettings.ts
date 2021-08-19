// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { OidcClientSettings, OidcClientSettingsStore } from "./OidcClientSettings";
import { RedirectNavigator, PopupNavigator, IFrameNavigator } from "./navigators";
import { WebStorageStateStore } from "./WebStorageStateStore";
import { SigninRequest } from "./SigninRequest";

const DefaultAccessTokenExpiringNotificationTime = 60;
const DefaultCheckSessionInterval = 2000;

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

    /** The URL for the page containing the code handling the silent renew */
    silent_redirect_uri?: string;
    /** Number of milliseconds to wait for the silent renew to return before assuming it has failed or timed out (default: 10000) */
    silentRequestTimeout?: number;
    /** Flag to indicate if there should be an automatic attempt to renew the access token prior to its expiration (default: false) */
    automaticSilentRenew?: boolean;
    validateSubOnSilentRenew?: boolean;
    /** Flag to control if id_token is included as id_token_hint in silent renew calls (default: true) */
    includeIdTokenInSilentRenew?: boolean;

    /** Will raise events for when user has performed a signout at the OP (default: true) */
    monitorSession?: boolean;
    monitorAnonymousSession?: boolean;
    /** Interval, in ms, to check the user's session (default: 2000) */
    checkSessionInterval?: number;
    query_status_response_type?: string;
    stopCheckSessionOnError?: boolean;

    /** Will invoke the revocation endpoint on signout if there is an access token for the user (default: false) */
    revokeAccessTokenOnSignout?: boolean;
    /** The number of seconds before an access token is to expire to raise the accessTokenExpiring event (default: 60) */
    accessTokenExpiringNotificationTime?: number;

    redirectNavigator?: any;
    popupNavigator?: any;
    iframeNavigator?: any;

    /** Storage object used to persist User for currently authenticated user (default: session storage) */
    userStore?: WebStorageStateStore;
}

export class UserManagerSettingsStore extends OidcClientSettingsStore {
    public readonly popup_redirect_uri?: string;
    public readonly popup_post_logout_redirect_uri?: string;
    public readonly popupWindowFeatures?: string;
    public readonly popupWindowTarget?: string;

    public readonly silent_redirect_uri?: string;
    public readonly silentRequestTimeout?: number;
    public readonly automaticSilentRenew: boolean;
    public readonly validateSubOnSilentRenew: boolean;
    public readonly includeIdTokenInSilentRenew: boolean;

    public readonly monitorSession: boolean;
    public readonly monitorAnonymousSession: boolean;
    public readonly checkSessionInterval: number;
    public readonly query_status_response_type?: string;
    public readonly stopCheckSessionOnError?: boolean;

    public readonly revokeAccessTokenOnSignout: boolean;
    public readonly accessTokenExpiringNotificationTime: number;

    public readonly redirectNavigator: RedirectNavigator;
    public readonly popupNavigator: PopupNavigator;
    public readonly iframeNavigator: IFrameNavigator;

    public readonly userStore: WebStorageStateStore;

    public constructor(args: UserManagerSettings) {
        const {
            popup_redirect_uri,
            popup_post_logout_redirect_uri,
            popupWindowFeatures,
            popupWindowTarget,
            silent_redirect_uri,
            silentRequestTimeout,
            automaticSilentRenew = false,
            validateSubOnSilentRenew = false,
            includeIdTokenInSilentRenew = true,
            monitorSession = true,
            monitorAnonymousSession = false,
            checkSessionInterval = DefaultCheckSessionInterval,
            stopCheckSessionOnError = true,
            query_status_response_type,
            revokeAccessTokenOnSignout = false,
            accessTokenExpiringNotificationTime = DefaultAccessTokenExpiringNotificationTime,
            redirectNavigator = new RedirectNavigator(),
            popupNavigator = new PopupNavigator(),
            iframeNavigator = new IFrameNavigator(),
            userStore = new WebStorageStateStore({ store: sessionStorage })
        } = args;

        super(args);

        this.popup_redirect_uri = popup_redirect_uri;
        this.popup_post_logout_redirect_uri = popup_post_logout_redirect_uri;
        this.popupWindowFeatures = popupWindowFeatures;
        this.popupWindowTarget = popupWindowTarget;

        this.silent_redirect_uri = silent_redirect_uri;
        this.silentRequestTimeout = silentRequestTimeout;
        this.automaticSilentRenew = automaticSilentRenew;
        this.validateSubOnSilentRenew = validateSubOnSilentRenew;
        this.includeIdTokenInSilentRenew = includeIdTokenInSilentRenew;

        this.monitorSession = monitorSession;
        this.monitorAnonymousSession = monitorAnonymousSession;
        this.checkSessionInterval = checkSessionInterval;
        this.stopCheckSessionOnError = stopCheckSessionOnError;
        if (query_status_response_type) {
            this.query_status_response_type = query_status_response_type;
        }
        else if (args && args.response_type) {
            this.query_status_response_type = SigninRequest.isOidc(args.response_type) ? "id_token" : "code";
        }
        else {
            this.query_status_response_type = "id_token";
        }

        this.revokeAccessTokenOnSignout = revokeAccessTokenOnSignout;
        this.accessTokenExpiringNotificationTime = accessTokenExpiringNotificationTime;

        this.redirectNavigator = redirectNavigator;
        this.popupNavigator = popupNavigator;
        this.iframeNavigator = iframeNavigator;

        this.userStore = userStore;
    }
}
