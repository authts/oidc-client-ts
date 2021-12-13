import { Log, settings } from "./sample-settings";
import { log } from "./sample";

Log.logger = console;
Log.level = Log.INFO;

new OidcClient(settings).processSigninResponse().then(function(response) {
    log("signin response success", response);
}).catch(function(err) {
    console.error(err);
    log(err);
});
