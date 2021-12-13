import { Log, UserManager, settings } from "./sample-settings";
import { log } from "./sample";

Log.logger = console;
Log.level = Log.INFO;

new UserManager(settings).signinPopupCallback().then(function() {
    log("signin popup callback response success");
}).catch(function(err) {
    console.error(err);
    log(err);
});
