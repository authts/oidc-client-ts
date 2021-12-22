// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "./utils";
import { IFrameNavigator, NavigateResponse, PopupNavigator, RedirectNavigator, PopupWindowParams, IWindow, IFrameWindowParams, RedirectParams } from "./navigators";
import { OidcClient, CreateSigninRequestArgs, CreateSignoutRequestArgs } from "./OidcClient";
import { UserManagerSettings, UserManagerSettingsStore } from "./UserManagerSettings";
import { User } from "./User";
import { UserManagerEvents } from "./UserManagerEvents";
import { SilentRenewService } from "./SilentRenewService";
import { SessionMonitor } from "./SessionMonitor";
import type { SessionStatus } from "./SessionStatus";
import type { SignoutResponse } from "./SignoutResponse";
import { ErrorResponse } from "./ErrorResponse";
import type { MetadataService } from "./MetadataService";
import { RefreshState } from "./RefreshState";

/**
 * @public
 */
export type ExtraSigninRequestArgs = Pick<CreateSigninRequestArgs, "extraQueryParams" | "extraTokenParams" | "state">;
/**
 * @public
 */
export type ExtraSignoutRequestArgs = Pick<CreateSignoutRequestArgs, "extraQueryParams" | "state">;

/**
 * @public
 */
export type RevokeTokensTypes = UserManagerSettings["revokeTokenTypes"];

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
 * Provides a higher level API for signing a user in, signing out, managing the user's claims returned from the OIDC provider,
 * and managing an access token returned from the OIDC/OAuth2 provider.
 *
 * @public
 */
export class UserManager {
    /** Returns the settings used to configure the `UserManager`. */
    public readonly settings: UserManagerSettingsStore;
    protected readonly _logger = new Logger("UserManager");

    protected readonly _client: OidcClient;
    protected readonly _redirectNavigator: RedirectNavigator;
    protected readonly _popupNavigator: PopupNavigator;
    protected readonly _iframeNavigator: IFrameNavigator;
    protected readonly _events: UserManagerEvents;
    protected readonly _silentRenewService: SilentRenewService;
    protected readonly _sessionMonitor: SessionMonitor | null;

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
            this._logger.debug("ctor: automaticSilentRenew is configured, setting up silent renew");
            this.startSilentRenew();
        }

        this._sessionMonitor = null;
        if (this.settings.monitorSession) {
            this._logger.debug("ctor: monitorSession is configured, setting up session monitor");
            this._sessionMonitor = new SessionMonitor(this);
        }

    }

    /** Returns an object used to register for events raised by the `UserManager`. */
    public get events(): UserManagerEvents {
        return this._events;
    }

    /** Returns an object used to access the metadata configuration of the OIDC provider. */
    public get metadataService(): MetadataService {
        return this._client.metadataService;
    }

    /**
     * Returns promise to load the `User` object for the currently authenticated user.
     */
    public async getUser(): Promise<User | null> {
        const user = await this._loadUser();
        if (user) {
            this._logger.info("getUser: user loaded");
            this._events.load(user, false);
            return user;
        }

        this._logger.info("getUser: user not found in storage");
        return null;
    }

    /**
     * Returns promise to remove from any storage the currently authenticated user.
     */
    public async removeUser(): Promise<void> {
        await this.storeUser(null);
        this._logger.info("removeUser: user removed from storage");
        this._events.unload();
    }

    /**
     * Returns promise to trigger a redirect of the current window to the authorization endpoint.
     */
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
        this._logger.info("signinRedirect: successful");
    }

    /**
     * Returns promise to process response from the authorization endpoint. The result of the promise is the authenticated `User`.
     */
    public async signinRedirectCallback(url = window.location.href): Promise<User> {
        const user = await this._signinEnd(url);
        if (user.profile && user.profile.sub) {
            this._logger.info("signinRedirectCallback: successful, signed in sub: ", user.profile.sub);
        }
        else {
            this._logger.info("signinRedirectCallback: no sub");
        }

        return user;
    }

    /**
     * Returns promise to trigger a request (via a popup window) to the authorization endpoint. The result of the promise is the authenticated `User`.
     */
    public async signinPopup(args: SigninPopupArgs = {}): Promise<User> {
        const {
            popupWindowFeatures,
            popupWindowTarget,
            ...requestArgs
        } = args;
        const url = this.settings.popup_redirect_uri || this.settings.redirect_uri;
        if (!url) {
            this._logger.error("signinPopup: No popup_redirect_uri or redirect_uri configured");
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
                this._logger.info("signinPopup: signinPopup successful, signed in sub: ", user.profile.sub);
            }
            else {
                this._logger.info("signinPopup: no sub");
            }
        }

        return user;
    }
    /**
     * Returns promise to notify the opening window of response from the authorization endpoint.
     */
    public async signinPopupCallback(url = window.location.href, keepOpen = false): Promise<void> {
        try {
            await this._popupNavigator.callback(url, keepOpen);
            this._logger.info("signinPopupCallback: successful");
        }
        catch (err) {
            this._logger.error("signinPopupCallback error", err instanceof Error ? err.message : err);
        }
    }

    /**
     * Returns promise to trigger a silent request (via an iframe) to the authorization endpoint.
     * The result of the promise is the authenticated `User`.
     */
    public async signinSilent(args: SigninSilentArgs = {}): Promise<User | null> {
        const {
            silentRequestTimeoutInSeconds,
            ...requestArgs
        } = args;
        // first determine if we have a refresh token, or need to use iframe
        let user = await this._loadUser();
        if (user?.refresh_token) {
            this._logger.debug("signinSilent: using refresh token");
            const state = new RefreshState(user as Required<User>);
            return await this._useRefreshToken(state);
        }

        const url = this.settings.silent_redirect_uri || this.settings.redirect_uri;
        if (!url) {
            this._logger.error("signinSilent: No silent_redirect_uri configured");
            throw new Error("No silent_redirect_uri configured");
        }

        let verifySub: string | undefined;
        if (user && this.settings.validateSubOnSilentRenew) {
            this._logger.debug("signinSilent: subject prior to silent renew: ", user.profile.sub);
            verifySub = user.profile.sub;
        }

        const handle = await this._iframeNavigator.prepare({ silentRequestTimeoutInSeconds });
        user = await this._signin({
            request_type: "si:s",
            redirect_uri: url,
            prompt: "none",
            id_token_hint: this.settings.includeIdTokenInSilentRenew ? user?.id_token : undefined,
            ...requestArgs,
        }, handle, verifySub);
        if (user) {
            if (user.profile && user.profile.sub) {
                this._logger.info("signinSilent: successful, signed in sub: ", user.profile.sub);
            }
            else {
                this._logger.info("signinSilent: no sub");
            }
        }

        return user;
    }

    protected async _useRefreshToken(state: RefreshState): Promise<User> {
        const response = await this._client.useRefreshToken(state);
        const user = new User({ ...state, ...response });

        await this.storeUser(user);
        this._events.load(user);
        return user;
    }

    /**
     * Returns promise to notify the parent window of response from the authorization endpoint.
     */
    public async signinSilentCallback(url = window.location.href): Promise<void> {
        await this._iframeNavigator.callback(url);
        this._logger.info("signinSilentCallback: successful");
    }

    public async signinCallback(url = window.location.href): Promise<User | void> {
        const { state } = await this._client.readSigninResponseState(url);
        switch (state.request_type) {
            case "si:r":
                return await this.signinRedirectCallback(url);
            case "si:p":
                return await this.signinPopupCallback(url);
            case "si:s":
                return await this.signinSilentCallback(url);
            default:
                throw new Error("invalid response_type in state");
        }
    }

    public async signoutCallback(url = window.location.href, keepOpen = false): Promise<void> {
        const { state } = await this._client.readSignoutResponseState(url);
        if (!state) {
            return;
        }

        switch (state.request_type) {
            case "so:r":
                await this.signoutRedirectCallback(url);
                break;
            case "so:p":
                await this.signoutPopupCallback(url, keepOpen);
                break;
            default:
                throw new Error("invalid response_type in state");
        }
    }

    /**
     * Returns promise to query OP for user's current signin status. Returns object with session_state and subject identifier.
     */
    public async querySessionStatus(args: QuerySessionStatusArgs = {}): Promise<SessionStatus | null> {
        const {
            silentRequestTimeoutInSeconds,
            ...requestArgs
        } = args;
        const url = this.settings.silent_redirect_uri || this.settings.redirect_uri;
        if (!url) {
            this._logger.error("querySessionStatus: No silent_redirect_uri configured");
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
            this._logger.debug("querySessionStatus: got signin response");

            if (signinResponse.session_state && signinResponse.profile.sub) {
                this._logger.info("querySessionStatus: querySessionStatus success for sub: ", signinResponse.profile.sub);
                return {
                    session_state: signinResponse.session_state,
                    sub: signinResponse.profile.sub,
                    sid: signinResponse.profile.sid,
                };
            }

            this._logger.info("querySessionStatus: successful, user not authenticated");
            return null;
        }
        catch (err) {
            if (this.settings.monitorAnonymousSession && err instanceof ErrorResponse) {
                switch (err.error) {
                    case "login_required":
                    case "consent_required":
                    case "interaction_required":
                    case "account_selection_required":
                        this._logger.info("querySessionStatus: querySessionStatus success for anonymous user");
                        return {
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            session_state: err.session_state!,
                        };
                }
            }
            throw err;
        }
    }

    protected async _signin(args: CreateSigninRequestArgs, handle: IWindow, verifySub?: string): Promise<User> {
        const navResponse = await this._signinStart(args, handle);
        return await this._signinEnd(navResponse.url, verifySub);
    }
    protected async _signinStart(args: CreateSigninRequestArgs, handle: IWindow): Promise<NavigateResponse> {
        this._logger.debug("_signinStart: got navigator window handle");

        try {
            const signinRequest = await this._client.createSigninRequest(args);
            this._logger.debug("_signinStart: got signin request");

            return await handle.navigate({
                url: signinRequest.url,
                state: signinRequest.state.id,
                response_mode: signinRequest.state.response_mode,
            });
        }
        catch (err) {
            this._logger.debug("_signinStart: Error after preparing navigator, closing navigator window");
            handle.close();
            throw err;
        }
    }
    protected async _signinEnd(url: string, verifySub?: string): Promise<User> {
        const signinResponse = await this._client.processSigninResponse(url);
        this._logger.debug("_signinEnd: got signin response");

        const user = new User(signinResponse);
        if (verifySub) {
            if (verifySub !== user.profile.sub) {
                this._logger.debug("_signinEnd: current user does not match user returned from signin. sub from signin: ", user.profile.sub);
                throw new Error("login_required");
            }
            this._logger.debug("_signinEnd: current user matches user returned from signin");
        }

        await this.storeUser(user);
        this._logger.debug("_signinEnd: user stored");
        this._events.load(user);

        return user;
    }

    /**
     * Returns promise to trigger a redirect of the current window to the end session endpoint.
     */
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
        this._logger.info("signoutRedirect: successful");
    }

    /**
     * Returns promise to process response from the end session endpoint.
     */
    public async signoutRedirectCallback(url = window.location.href): Promise<SignoutResponse> {
        const response = await this._signoutEnd(url);
        this._logger.info("signoutRedirectCallback: successful");
        return response;
    }

    /**
     * Returns promise to trigger a redirect of a popup window window to the end session endpoint.
     */
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
        this._logger.info("signoutPopup: successful");
    }

    /**
     * Returns promise to process response from the end session endpoint from a popup window.
     */
    public async signoutPopupCallback(url = window.location.href, keepOpen = false): Promise<void> {
        await this._popupNavigator.callback(url, keepOpen);
        this._logger.info("signoutPopupCallback: successful");
    }

    protected async _signout(args: CreateSignoutRequestArgs, handle: IWindow): Promise<SignoutResponse> {
        const navResponse = await this._signoutStart(args, handle);
        return await this._signoutEnd(navResponse.url);
    }
    protected async _signoutStart(args: CreateSignoutRequestArgs = {}, handle: IWindow): Promise<NavigateResponse> {
        this._logger.debug("_signoutStart: got navigator window handle");

        try {
            const user = await this._loadUser();
            this._logger.debug("_signoutStart: loaded current user from storage");

            if (this.settings.revokeTokensOnSignout) {
                await this._revokeInternal(user);
            }

            const id_token = args.id_token_hint || user && user.id_token;
            if (id_token) {
                this._logger.debug("_signoutStart: Setting id_token into signout request");
                args.id_token_hint = id_token;
            }

            await this.removeUser();
            this._logger.debug("_signoutStart: user removed, creating signout request");

            const signoutRequest = await this._client.createSignoutRequest(args);
            this._logger.debug("_signoutStart: got signout request");

            return await handle.navigate({
                url: signoutRequest.url,
                state: signoutRequest.state?.id,
            });
        }
        catch (err) {
            this._logger.debug("_signoutStart: Error after preparing navigator, closing navigator window");
            handle.close();
            throw err;
        }
    }
    protected async _signoutEnd(url: string): Promise<SignoutResponse> {
        const signoutResponse = await this._client.processSignoutResponse(url);
        this._logger.debug("_signoutEnd: got signout response");

        return signoutResponse;
    }

    public async revokeTokens(types?: RevokeTokensTypes): Promise<void> {
        const user = await this._loadUser();
        await this._revokeInternal(user, types);
    }

    protected async _revokeInternal(user: User | null, types = this.settings.revokeTokenTypes): Promise<void> {
        if (!user) return;

        const typesPresent = types.filter(type => typeof user[type] === "string");

        if (!typesPresent.length) {
            this._logger.debug("revokeTokens: no need to revoke due to no token(s)");
            return;
        }

        // don't Promise.all, order matters
        for (const type of typesPresent) {
            await this._client.revokeToken(
                user[type]!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
                type,
            );
            this._logger.info(`revokeTokens: ${type} revoked successfully`);
            if (type !== "access_token") {
                user[type] = null as never;
            }
        }

        await this.storeUser(user);
        this._logger.debug("revokeTokens: user stored");
        this._events.load(user);
    }

    /**
     * Enables silent renew for the `UserManager`.
     */
    public startSilentRenew(): void {
        void this._silentRenewService.start();
    }

    /**
     * Disables silent renew for the `UserManager`.
     */
    public stopSilentRenew(): void {
        this._silentRenewService.stop();
    }

    protected get _userStoreKey(): string {
        return `user:${this.settings.authority}:${this.settings.client_id}`;
    }

    protected async _loadUser(): Promise<User | null> {
        const storageString = await this.settings.userStore.get(this._userStoreKey);
        if (storageString) {
            this._logger.debug("_loadUser: user storageString loaded");
            return User.fromStorageString(storageString);
        }

        this._logger.debug("_loadUser: no user storageString");
        return null;
    }

    public async storeUser(user: User | null): Promise<void> {
        if (user) {
            this._logger.debug("storeUser: storing user");
            const storageString = user.toStorageString();
            await this.settings.userStore.set(this._userStoreKey, storageString);
        }
        else {
            this._logger.debug("storeUser: removing user");
            await this.settings.userStore.remove(this._userStoreKey);
        }
    }

    /**
     * Removes stale state entries in storage for incomplete authorize requests.
     */
    public async clearStaleState(): Promise<void> {
        await this._client.clearStaleState();
    }
}
