import { UserManager, settings } from "./sample-settings";
import { log } from "./sample";

// can pass true param and will keep popup window open
new UserManager(settings).signoutCallback().then(function() {
    log("signout callback response success");
}).catch(function(err) {
    console.error(err);
    log(err);
});
