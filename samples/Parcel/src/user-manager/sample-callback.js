import { UserManager, settings } from "./sample-settings";

new UserManager(settings).signinRedirectCallback().then(function(user) {
    console.log("signin response success", user);
}).catch(function(err) {
    console.log(err);
});
