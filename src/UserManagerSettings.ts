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
    /** The target parameter to window.open for the popup signin window (default: '_blank') */
    popupWindowTarget?: any;
    /** The URL for the page containing the code handling the silent renew */
    silent_redirect_uri?: any;
    /** Number of milliseconds to wait for the silent renew to return before assuming it has failed or timed out (default: 10000) */
    silentRequestTimeout?: any;
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
    private readonly _popup_redirect_uri?: string;
    private readonly _popup_post_logout_redirect_uri?: string;
    private readonly _popupWindowFeatures?: string;
    private readonly _popupWindowTarget?: any;

    private readonly _silent_redirect_uri?: any;
    private readonly _silentRequestTimeout?: any;
    private readonly _automaticSilentRenew: boolean;
    private readonly _validateSubOnSilentRenew: boolean;
    private readonly _includeIdTokenInSilentRenew: boolean;

    private readonly _monitorSession: boolean;
    private readonly _monitorAnonymousSession: boolean;
    private readonly _checkSessionInterval: number;
    private readonly _query_status_response_type?: string;
    private readonly _stopCheckSessionOnError?: boolean;
    private readonly _revokeAccessTokenOnSignout: boolean;
    private readonly _accessTokenExpiringNotificationTime: number;

    private readonly _redirectNavigator: RedirectNavigator;
    private readonly _popupNavigator: PopupNavigator;
    private readonly _iframeNavigator: IFrameNavigator;

    private readonly _userStore: WebStorageStateStore;

    constructor(args: UserManagerSettings = {}) {
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

        this._popup_redirect_uri = popup_redirect_uri;
        this._popup_post_logout_redirect_uri = popup_post_logout_redirect_uri;
        this._popupWindowFeatures = popupWindowFeatures;
        this._popupWindowTarget = popupWindowTarget;

        this._silent_redirect_uri = silent_redirect_uri;
        this._silentRequestTimeout = silentRequestTimeout;
        this._automaticSilentRenew = automaticSilentRenew;
        this._validateSubOnSilentRenew = validateSubOnSilentRenew;
        this._includeIdTokenInSilentRenew = includeIdTokenInSilentRenew;
        this._accessTokenExpiringNotificationTime = accessTokenExpiringNotificationTime;

        this._monitorSession = monitorSession;
        this._monitorAnonymousSession = monitorAnonymousSession;
        this._checkSessionInterval = checkSessionInterval;
        this._stopCheckSessionOnError = stopCheckSessionOnError;
        if (query_status_response_type) {
            this._query_status_response_type = query_status_response_type;
        }
        else if (args && args.response_type) {
            this._query_status_response_type = SigninRequest.isOidc(args.response_type) ? "id_token" : "code";
        }
        else {
            this._query_status_response_type = "id_token";
        }
        this._revokeAccessTokenOnSignout = revokeAccessTokenOnSignout;

        this._redirectNavigator = redirectNavigator;
        this._popupNavigator = popupNavigator;
        this._iframeNavigator = iframeNavigator;

        this._userStore = userStore;
    }

    get popup_redirect_uri() {
        return this._popup_redirect_uri;
    }
    get popup_post_logout_redirect_uri() {
        return this._popup_post_logout_redirect_uri;
    }
    get popupWindowFeatures() {
        return this._popupWindowFeatures;
    }
    get popupWindowTarget() {
        return this._popupWindowTarget;
    }

    get silent_redirect_uri() {
        return this._silent_redirect_uri;
    }
    get silentRequestTimeout() {
        return this._silentRequestTimeout;
    }
    get automaticSilentRenew() {
        return this._automaticSilentRenew;
    }
    get validateSubOnSilentRenew() {
        return this._validateSubOnSilentRenew;
    }
    get includeIdTokenInSilentRenew() {
        return this._includeIdTokenInSilentRenew;
    }
    get accessTokenExpiringNotificationTime() {
        return this._accessTokenExpiringNotificationTime;
    }

    get monitorSession() {
        return this._monitorSession;
    }
    get monitorAnonymousSession() {
        return this._monitorAnonymousSession;
    }
    get checkSessionInterval() {
        return this._checkSessionInterval;
    }
    get stopCheckSessionOnError() {
        return this._stopCheckSessionOnError;
    }
    get query_status_response_type() {
        return this._query_status_response_type;
    }
    get revokeAccessTokenOnSignout() {
        return this._revokeAccessTokenOnSignout;
    }

    get redirectNavigator() {
        return this._redirectNavigator;
    }
    get popupNavigator() {
        return this._popupNavigator;
    }
    get iframeNavigator() {
        return this._iframeNavigator;
    }

    get userStore() {
        return this._userStore;
    }
}
