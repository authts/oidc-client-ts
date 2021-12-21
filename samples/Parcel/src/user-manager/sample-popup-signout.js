import { Log, UserManager, settings } from "./sample-settings";
import { log } from "./sample";

Log.setLogger(console);
Log.setLevel(Log.INFO);

new UserManager(settings).signoutPopupCallback(undefined, true).then(function() {
    log("signout popup callback response success");
}).catch(function(err) {
    console.error(err);
    log(err);
});
