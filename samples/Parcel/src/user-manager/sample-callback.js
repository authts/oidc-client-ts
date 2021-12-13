import { UserManager, settings } from "./sample-settings";
import { log } from "./sample";

new UserManager(settings).signinRedirectCallback().then(function(user) {
    console.log("signin response success", user);
}).catch(function(err) {
    log(err);
    console.log(err);
});
