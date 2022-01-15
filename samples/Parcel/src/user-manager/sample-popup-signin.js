import { Log, UserManager, settings } from "./sample-settings";
import { log } from "./sample";

new UserManager(settings).signinPopupCallback().then(function() {
    log("signin popup callback response success");
}).catch(function(err) {
    console.error(err);
    log(err);
});
