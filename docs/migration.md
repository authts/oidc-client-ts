
## oidc-client v1.11.5 to oidc-client-ts v2.0.0

Ported library from JavaScript to TypeScript.

**OidcClientSettings:**
- required is now authority
- required is now client_id
- required is now redirect_uri
- renamed clockSkew to clockSkewInSeconds
- renamed staleStateAge to staleStateAgeInSeconds
- removed ResponseValidatorCtor and MetadataServiceCtor, if needed OidcClient/UserManager class must be extended
- default of response_type changed from "id_token" to "code"

**UserManagerSettings:**
- renamed accessTokenExpiringNotificationTime to accessTokenExpiringNotificationTimeInSeconds
- changed silentRequestTimeout (milliseconds) to silentRequestTimeoutInSeconds
- changed checkSessionInterval (milliseconds) to checkSessionIntervalInSeconds
- default of automaticSilentRenew changed from false to true
- default of validateSubOnSilentRenew changed from false to true
- default of includeIdTokenInSilentRenew changed from true to false
- default of monitorSession changed from true to false

**UserManager:**
- signoutPopupCallback to pass optionaly keepOpen as true, second argument must be used
