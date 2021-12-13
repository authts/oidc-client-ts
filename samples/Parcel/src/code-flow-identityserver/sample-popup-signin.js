import { Log, UserManager, settings } from "./sample-settings";
import { log } from "./sample";

Log.logger = console; // log;
Log.level = Log.DEBUG;

new UserManager(settings).signinCallback().then(function(user) {
    log("signin response success", user);
}).catch(function(err) {
    console.error(err);
    log(err);
});
