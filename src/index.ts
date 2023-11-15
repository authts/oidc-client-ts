// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

export { ErrorResponse, ErrorTimeout } from "./errors";
export type { INavigator, IFrameWindowParams, IWindow, NavigateParams, NavigateResponse, PopupWindowParams, RedirectParams } from "./navigators";
export { Log, Logger } from "./utils";
export type { ILogger, PopupWindowFeatures } from "./utils";
export type { OidcAddressClaim, OidcStandardClaims, IdTokenClaims, JwtClaims } from "./Claims";

export { AccessTokenEvents } from "./AccessTokenEvents";
export type { AccessTokenCallback } from "./AccessTokenEvents";
export { CheckSessionIFrame } from "./CheckSessionIFrame";
export { InMemoryWebStorage } from "./InMemoryWebStorage";
export type { AsyncStorage } from "./AsyncStorage";
export { MetadataService } from "./MetadataService";
export * from "./OidcClient";
export { OidcClientSettingsStore } from "./OidcClientSettings";
export type { OidcClientSettings, SigningKey, ExtraHeader } from "./OidcClientSettings";
export type { OidcMetadata } from "./OidcMetadata";
export { SessionMonitor } from "./SessionMonitor";
export type { SessionStatus } from "./SessionStatus";
export type { SigninRequest, SigninRequestCreateArgs } from "./SigninRequest";
export type { RefreshState } from "./RefreshState";
export { SigninResponse } from "./SigninResponse";
export { SigninState } from "./SigninState";
export type { SigninStateArgs, SigninStateCreateArgs } from "./SigninState";
export type { SignoutRequest, SignoutRequestArgs } from "./SignoutRequest";
export { SignoutResponse } from "./SignoutResponse";
export { State } from "./State";
export type { StateStore } from "./StateStore";
export { User } from "./User";
export type { UserProfile } from "./User";
export * from "./UserManager";
export type {
    UserManagerEvents,
    SilentRenewErrorCallback,
    UserLoadedCallback,
    UserSessionChangedCallback,
    UserSignedInCallback,
    UserSignedOutCallback,
    UserUnloadedCallback,
} from "./UserManagerEvents";
export { UserManagerSettingsStore } from "./UserManagerSettings";
export type { UserManagerSettings } from "./UserManagerSettings";
export { Version } from "./Version";
export { WebStorageStateStore } from "./WebStorageStateStore";
