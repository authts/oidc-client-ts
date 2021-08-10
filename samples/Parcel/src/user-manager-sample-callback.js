import { UserManager } from "../../../src";

new UserManager().signinRedirectCallback().then(function(user) {
    console.log("signin response success", user);
}).catch(function(err) {
    console.log(err);
});
