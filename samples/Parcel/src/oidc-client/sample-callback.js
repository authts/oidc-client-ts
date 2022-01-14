import { settings } from "./sample-settings";
import { log } from "./sample";

new OidcClient(settings).processSigninResponse().then(function(response) {
    log("signin response success", response);
}).catch(function(err) {
    console.error(err);
    log(err);
});
