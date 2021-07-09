// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from './Log.js';
import { OidcClient } from './OidcClient.js';
import { OidcClientSettings } from './OidcClientSettings.js';
import { WebStorageStateStore } from './WebStorageStateStore.js';
import { InMemoryWebStorage } from './InMemoryWebStorage.js';
import { UserManager } from './UserManager.js';
import { AccessTokenEvents } from './AccessTokenEvents.js';
import { MetadataService } from './MetadataService.js';
import { CordovaPopupNavigator } from './CordovaPopupNavigator.js';
import { CordovaIFrameNavigator } from './CordovaIFrameNavigator.js';
import { CheckSessionIFrame } from './CheckSessionIFrame.js';
import { TokenRevocationClient } from './TokenRevocationClient.js';
import { SessionMonitor } from './SessionMonitor.js';
import { Global } from './Global.js';
import { User } from './User.js';

import { Version } from './version.js';

export default {
    Version,
    Log,
    OidcClient,
    OidcClientSettings,
    WebStorageStateStore,
    InMemoryWebStorage,
    UserManager,
    AccessTokenEvents,
    MetadataService,
    CordovaPopupNavigator,
    CordovaIFrameNavigator,
    CheckSessionIFrame,
    TokenRevocationClient,
    SessionMonitor,
    Global,
    User
};
