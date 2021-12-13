import { Log, UserManager, settings } from "./sample-settings";
import { log } from "./sample";

Log.logger = console;
Log.level = Log.INFO;

new UserManager(settings).signinCallback().then(function(user) {
    log("signin callback response success", user);
}).catch(function(err) {
    console.error(err);
    log(err);
});
