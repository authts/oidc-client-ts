// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "./utils";
import { IFrameNavigator, NavigateResponse, PopupNavigator, RedirectNavigator, PopupWindowParams, IWindow, IFrameWindowParams, RedirectParams } from "./navigators";
import { OidcClient, CreateSigninRequestArgs, CreateSignoutRequestArgs } from "./OidcClient";
import { UserManagerSettings, UserManagerSettingsStore } from "./UserManagerSettings";
import { User } from "./User";
import { UserManagerEvents } from "./UserManagerEvents";
import { SilentRenewService } from "./SilentRenewService";
import { SessionMonitor } from "./SessionMonitor";
import { SigninRequest } from "./SigninRequest";
import { TokenRevocationClient } from "./TokenRevocationClient";
import { TokenClient } from "./TokenClient";
import type { SessionStatus } from "./SessionStatus";
import type { SignoutResponse } from "./SignoutResponse";
import { ErrorResponse } from "./ErrorResponse";
import type { MetadataService } from "./MetadataService";

type ExtraSigninRequestArgs = Pick<CreateSigninRequestArgs, "extraQueryParams" | "extraTokenParams">
type ExtraSignoutRequestArgs = Pick<CreateSignoutRequestArgs, "extraQueryParams">

/**
 * @public
 */
export type SigninRedirectArgs = RedirectParams & ExtraSigninRequestArgs;

/**
 * @public
 */
export type SigninPopupArgs = PopupWindowParams & ExtraSigninRequestArgs;

/**
 * @public
 */
export type SigninSilentArgs = IFrameWindowParams & ExtraSigninRequestArgs;

/**
 * @public
 */
export type QuerySessionStatusArgs = IFrameWindowParams & ExtraSigninRequestArgs;

/**
 * @public
 */
export type SignoutRedirectArgs = RedirectParams & ExtraSignoutRequestArgs;

/**
 * @public
 */
export type SignoutPopupArgs = PopupWindowParams & ExtraSignoutRequestArgs;

/**
 * @public
 */
export class UserManager {
    public readonly settings: UserManagerSettingsStore;

    protected readonly _client: OidcClient;
    protected readonly _redirectNavigator: RedirectNavigator;
    protected readonly _popupNavigator: PopupNavigator;
    protected readonly _iframeNavigator: IFrameNavigator;
    protected readonly _events: UserManagerEvents;
    protected readonly _silentRenewService: SilentRenewService;
    protected readonly _sessionMonitor: SessionMonitor | null;
    protected readonly _tokenRevocationClient: TokenRevocationClient;
    protected readonly _tokenClient: TokenClient;

    public constructor(settings: UserManagerSettings) {
        this.settings = new UserManagerSettingsStore(settings);

        this._client = new OidcClient(settings);

        this._redirectNavigator = new RedirectNavigator(this.settings);
        this._popupNavigator = new PopupNavigator(this.settings);
        this._iframeNavigator = new IFrameNavigator(this.settings);

        this._events = new UserManagerEvents(this.settings);
        this._silentRenewService = new SilentRenewService(this);

        // order is important for the following properties; these services depend upon the events.
        if (this.settings.automaticSilentRenew) {
            Log.debug("UserManager.ctor: automaticSilentRenew is configured, setting up silent renew");
            this.startSilentRenew();
        }

        this._sessionMonitor = null;
        if (this.settings.monitorSession) {
            Log.debug("UserManager.ctor: monitorSession is configured, setting up session monitor");
            this._sessionMonitor = new SessionMonitor(this);
        }

        this._tokenRevocationClient = new TokenRevocationClient(this.settings, this.metadataService);
        this._tokenClient = new TokenClient(this.settings, this.metadataService);
    }

    public get events(): UserManagerEvents {
        return this._events;
    }

    public get metadataService(): MetadataService {
        return this._client.metadataService;
    }

    public async getUser(): Promise<User | null> {
        const user = await this._loadUser();
        if (user) {
            Log.info("UserManager.getUser: user loaded");
            this._events.load(user, false);
            return user;
        }

        Log.info("UserManager.getUser: user not found in storage");
        return null;
    }

    public async removeUser(): Promise<void> {
        await this.storeUser(null);
        Log.info("UserManager.removeUser: user removed from storage");
        this._events.unload();
    }

    public async signinRedirect(args: SigninRedirectArgs = {}): Promise<void> {
        const {
            redirectMethod,
            ...requestArgs
        } = args;
        const handle = await this._redirectNavigator.prepare({ redirectMethod });
        await this._signinStart({
            request_type: "si:r",
            ...requestArgs,
        }, handle);
        Log.info("UserManager.signinRedirect: successful");
    }

    public async signinRedirectCallback(url = window.location.href): Promise<User> {
        const user = await this._signinEnd(url);
        if (user.profile && user.profile.sub) {
            Log.info("UserManager.signinRedirectCallback: successful, signed in sub: ", user.profile.sub);
        }
        else {
            Log.info("UserManager.signinRedirectCallback: no sub");
        }

        return user;
    }

    public async signinPopup(args: SigninPopupArgs = {}): Promise<User> {
        const {
            popupWindowFeatures,
            popupWindowTarget,
            ...requestArgs
        } = args;
        const url = this.settings.popup_redirect_uri || this.settings.redirect_uri;
        if (!url) {
            Log.error("UserManager.signinPopup: No popup_redirect_uri or redirect_uri configured");
            throw new Error("No popup_redirect_uri or redirect_uri configured");
        }

        const handle = await this._popupNavigator.prepare({ popupWindowFeatures, popupWindowTarget });
        const user = await this._signin({
            request_type: "si:p",
            redirect_uri: url,
            display: "popup",
            ...requestArgs,
        }, handle);
        if (user) {
            if (user.profile && user.profile.sub) {
                Log.info("UserManager.signinPopup: signinPopup successful, signed in sub: ", user.profile.sub);
            }
            else {
                Log.info("UserManager.signinPopup: no sub");
            }
        }

        return user;
    }
    public async signinPopupCallback(url?: string): Promise<void> {
        try {
            await this._signinCallback(url, this._popupNavigator);
            Log.info("UserManager.signinPopupCallback: successful");
        }
        catch (err) {
            Log.error("UserManager.signinPopupCallback error", err instanceof Error ? err.message : err);
        }
    }

    public async signinSilent(args: SigninSilentArgs = {}): Promise<User | null> {
        const {
            silentRequestTimeoutInSeconds,
            ...requestArgs
        } = args;
        // first determine if we have a refresh token, or need to use iframe
        let user = await this._loadUser();
        if (user && user.refresh_token) {
            return this._useRefreshToken(user);
        }

        const url = this.settings.silent_redirect_uri || this.settings.redirect_uri;
        if (!url) {
            Log.error("UserManager.signinSilent: No silent_redirect_uri configured");
            throw new Error("No silent_redirect_uri configured");
        }

        let verifySub: string | undefined;
        if (user && this.settings.validateSubOnSilentRenew) {
            Log.debug("UserManager.signinSilent, subject prior to silent renew: ", user.profile.sub);
            verifySub = user.profile.sub;
        }

        const handle = await this._iframeNavigator.prepare({ silentRequestTimeoutInSeconds });
        user = await this._signin({
            request_type: "si:s",
            redirect_uri: url,
            prompt: "none",
            ...requestArgs,
        }, handle, verifySub);
        if (user) {
            if (user.profile && user.profile.sub) {
                Log.info("UserManager.signinSilent: successful, signed in sub: ", user.profile.sub);
            }
            else {
                Log.info("UserManager.signinSilent: no sub");
            }
        }

        return user;
    }

    protected async _useRefreshToken(user: User): Promise<User> {
        const result = await this._tokenClient.exchangeRefreshToken({
            refresh_token: user.refresh_token || ""
        });
        if (!result) {
            Log.error("UserManager._useRefreshToken: No response returned from token endpoint");
            throw new Error("No response returned from token endpoint");
        }

        if (!result.access_token) {
            Log.error("UserManager._useRefreshToken: No access token returned from token endpoint");
            throw new Error("No access token returned from token endpoint");
        }

        Log.debug("UserManager._useRefreshToken: refresh token response success");
        user.access_token = result.access_token || user.access_token;
        user.refresh_token = result.refresh_token || user.refresh_token;
        user.expires_in = result.expires_in;

        await this.storeUser(user);
        this._events.load(user);
        return user;
    }

    public async signinSilentCallback(url?: string): Promise<void> {
        await this._signinCallback(url, this._iframeNavigator);
        Log.info("UserManager.signinSilentCallback: successful");
    }

    public async signinCallback(url?: string): Promise<User | null> {
        const { state } = await this._client.readSigninResponseState(url);
        if (state.request_type === "si:r") {
            return this.signinRedirectCallback(url);
        }
        if (state.request_type === "si:p") {
            await this.signinPopupCallback(url);
            return null;
        }
        if (state.request_type === "si:s") {
            await this.signinSilentCallback(url);
            return null;
        }
        throw new Error("invalid response_type in state");
    }

    public async signoutCallback(url?: string, keepOpen = false): Promise<void> {
        const { state } = await this._client.readSignoutResponseState(url);
        if (state) {
            if (state.request_type === "so:r") {
                await this.signoutRedirectCallback(url);
            }
            if (state.request_type === "so:p") {
                await this.signoutPopupCallback(url, keepOpen);
            }
            throw new Error("invalid response_type in state");
        }
    }

    public async querySessionStatus(args: QuerySessionStatusArgs = {}): Promise<SessionStatus | null> {
        const {
            silentRequestTimeoutInSeconds,
            ...requestArgs
        } = args;
        const url = this.settings.silent_redirect_uri || this.settings.redirect_uri;
        if (!url) {
            Log.error("UserManager.querySessionStatus: No silent_redirect_uri configured");
            throw new Error("No silent_redirect_uri configured");
        }

        const handle = await this._iframeNavigator.prepare({ silentRequestTimeoutInSeconds });
        const navResponse = await this._signinStart({
            request_type: "si:s", // this acts like a signin silent
            redirect_uri: url,
            prompt: "none",
            response_type: this.settings.query_status_response_type,
            scope: "openid",
            skipUserInfo: true,
            ...requestArgs,
        }, handle);
        try {
            const signinResponse = await this._client.processSigninResponse(navResponse.url);
            Log.debug("UserManager.querySessionStatus: got signin response");

            if (signinResponse.session_state && signinResponse.profile.sub) {
                Log.info("UserManager.querySessionStatus: querySessionStatus success for sub: ",  signinResponse.profile.sub);
                return {
                    session_state: signinResponse.session_state,
                    sub: signinResponse.profile.sub,
                    sid: signinResponse.profile.sid
                };
            }

            Log.info("querySessionStatus successful, user not authenticated");
            return null;
        }
        catch (err) {
            if (this.settings.monitorAnonymousSession &&
                err instanceof ErrorResponse && err.session_state) {
                if (err.message == "login_required" ||
                    err.message == "consent_required" ||
                    err.message == "interaction_required" ||
                    err.message == "account_selection_required"
                ) {
                    Log.info("UserManager.querySessionStatus: querySessionStatus success for anonymous user");
                    return {
                        session_state: err.session_state
                    };
                }
            }

            throw err;
        }
    }

    protected async _signin(args: CreateSigninRequestArgs, handle: IWindow, verifySub?: string): Promise<User> {
        const navResponse = await this._signinStart(args, handle);
        return this._signinEnd(navResponse.url, verifySub);
    }
    protected async _signinStart(args: CreateSigninRequestArgs, handle: IWindow): Promise<NavigateResponse> {
        Log.debug("UserManager._signinStart: got navigator window handle");

        try {
            const signinRequest = await this._client.createSigninRequest(args);
            Log.debug("UserManager._signinStart: got signin request");

            return handle.navigate({
                url: signinRequest.url,
                id: signinRequest.state.id,
            });
        }
        catch (err) {
            Log.debug("UserManager._signinStart: Error after preparing navigator, closing navigator window");
            handle.close();
            throw err;
        }
    }
    protected async _signinEnd(url: string, verifySub?: string): Promise<User> {
        const signinResponse = await this._client.processSigninResponse(url);
        Log.debug("UserManager._signinEnd: got signin response");

        const user = new User(signinResponse);
        if (verifySub) {
            if (verifySub !== user.profile.sub) {
                Log.debug("UserManager._signinEnd: current user does not match user returned from signin. sub from signin: ", user.profile.sub);
                throw new Error("login_required");
            }
            else {
                Log.debug("UserManager._signinEnd: current user matches user returned from signin");
            }
        }

        await this.storeUser(user);
        Log.debug("UserManager._signinEnd: user stored");
        this._events.load(user);

        return user;
    }
    protected async _signinCallback(url: string | undefined, navigator: IFrameNavigator | PopupNavigator): Promise<void> {
        Log.debug("UserManager._signinCallback");
        const useQuery = this.settings.response_mode === "query" ||
            (!this.settings.response_mode && this.settings.response_type === "code");
        const delimiter = useQuery ? "?" : "#";
        await navigator.callback(url, false, delimiter);
    }

    public async signoutRedirect(args: SignoutRedirectArgs = {}): Promise<void> {
        const {
            redirectMethod,
            ...requestArgs
        } = args;
        const handle = await this._redirectNavigator.prepare({ redirectMethod });
        await this._signoutStart({
            request_type: "so:r",
            post_logout_redirect_uri: this.settings.post_logout_redirect_uri,
            ...requestArgs,
        }, handle);
        Log.info("UserManager.signoutRedirect: successful");
    }
    public async signoutRedirectCallback(url = window.location.href): Promise<SignoutResponse> {
        const response = await this._signoutEnd(url);
        Log.info("UserManager.signoutRedirectCallback: successful");
        return response;
    }

    public async signoutPopup(args: SignoutPopupArgs = {}): Promise<void> {
        const {
            popupWindowFeatures,
            popupWindowTarget,
            ...requestArgs
        } = args;
        const url = this.settings.popup_post_logout_redirect_uri || this.settings.post_logout_redirect_uri;

        const handle = await this._popupNavigator.prepare({ popupWindowFeatures, popupWindowTarget });
        await this._signout({
            request_type: "so:p",
            post_logout_redirect_uri: url,
            // we're putting a dummy entry in here because we
            // need a unique id from the state for notification
            // to the parent window, which is necessary if we
            // plan to return back to the client after signout
            // and so we can close the popup after signout
            state: url == null ? undefined : {},
            ...requestArgs,
        }, handle);
        Log.info("UserManager.signoutPopup: successful");
    }
    public async signoutPopupCallback(url?: string, keepOpen = false): Promise<void> {
        const delimiter = "?";
        await this._popupNavigator.callback(url, keepOpen, delimiter);
        Log.info("UserManager.signoutPopupCallback: successful");
    }

    protected async _signout(args: CreateSignoutRequestArgs, handle: IWindow): Promise<SignoutResponse> {
        const navResponse = await this._signoutStart(args, handle);
        return this._signoutEnd(navResponse.url);
    }
    protected async _signoutStart(args: CreateSignoutRequestArgs = {}, handle: IWindow): Promise<NavigateResponse> {
        Log.debug("UserManager._signoutStart: got navigator window handle");

        try {
            const user = await this._loadUser();
            Log.debug("UserManager._signoutStart: loaded current user from storage");

            if (this.settings.revokeAccessTokenOnSignout) {
                await this._revokeInternal(user);
            }

            await this.removeUser();
            Log.debug("UserManager._signoutStart: user removed, creating signout request");

            const signoutRequest = await this._client.createSignoutRequest(args);
            Log.debug("UserManager._signoutStart: got signout request");

            return handle.navigate({
                url: signoutRequest.url,
                id: signoutRequest.state?.id,
            });
        }
        catch (err) {
            Log.debug("UserManager._signoutStart: Error after preparing navigator, closing navigator window");
            handle.close();
            throw err;
        }
    }
    protected async _signoutEnd(url: string): Promise<SignoutResponse> {
        const signoutResponse = await this._client.processSignoutResponse(url);
        Log.debug("UserManager._signoutEnd: got signout response");

        return signoutResponse;
    }

    public async revokeAccessToken(): Promise<void> {
        const user = await this._loadUser();
        const success = await this._revokeInternal(user, true);
        if (success && user) {
            Log.debug("UserManager.revokeAccessToken: removing token properties from user and re-storing");

            user.access_token = "";
            user.refresh_token = "";
            user.expires_at = 0;
            user.token_type = "";

            await this.storeUser(user);
            Log.debug("UserManager.revokeAccessToken: user stored");
            this._events.load(user);
        }

        Log.info("UserManager.revokeAccessToken: access token revoked successfully");
    }

    protected async _revokeInternal(user: User | null, required = false): Promise<boolean> {
        if (user) {
            const access_token = user.access_token;
            const refresh_token = user.refresh_token;

            const atSuccess = await this._revokeAccessTokenInternal(access_token, required);
            const rtSuccess = await this._revokeRefreshTokenInternal(refresh_token, required);
            if (!atSuccess && !rtSuccess) {
                Log.debug("UserManager.revokeAccessToken: no need to revoke due to no token(s), or JWT format");
            }

            return atSuccess || rtSuccess;
        }

        return false;
    }

    protected async _revokeAccessTokenInternal(access_token: string, required: boolean): Promise<boolean> {
        // check for JWT vs. reference token
        if (!access_token || access_token.includes(".")) {
            return false;
        }

        await this._tokenRevocationClient.revoke(access_token, required);
        return true;
    }

    protected async _revokeRefreshTokenInternal(refresh_token: string | undefined, required: boolean): Promise<boolean> {
        if (!refresh_token) {
            return false;
        }

        await this._tokenRevocationClient.revoke(refresh_token, required, "refresh_token");
        return true;
    }

    public startSilentRenew(): void {
        void this._silentRenewService.start();
    }

    public stopSilentRenew(): void {
        this._silentRenewService.stop();
    }

    protected get _userStoreKey(): string {
        return `user:${this.settings.authority}:${this.settings.client_id}`;
    }

    protected async _loadUser(): Promise<User | null> {
        const storageString = await this.settings.userStore.get(this._userStoreKey);
        if (storageString) {
            Log.debug("UserManager._loadUser: user storageString loaded");
            return User.fromStorageString(storageString);
        }

        Log.debug("UserManager._loadUser: no user storageString");
        return null;
    }

    public async storeUser(user: User | null): Promise<void> {
        if (user) {
            Log.debug("UserManager.storeUser: storing user");
            const storageString = user.toStorageString();
            await this.settings.userStore.set(this._userStoreKey, storageString);
        }
        else {
            Log.debug("storeUser.storeUser: removing user");
            await this.settings.userStore.remove(this._userStoreKey);
        }
    }

    public async clearStaleState(): Promise<void> {
        await this._client.clearStaleState();
    }
}
