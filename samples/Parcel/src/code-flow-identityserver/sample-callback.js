import { UserManager, settings } from "./sample-settings";
import { log } from "./sample";

new UserManager(settings).signinCallback().then(function(user) {
    log("signin response success", user);
}).catch(function(err) {
    console.error(err);
    log(err);
});
