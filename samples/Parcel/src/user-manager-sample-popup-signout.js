import { UserManager } from "../../../src";
import { settings } from "./user-manager-sample-settings";

void new UserManager(settings).signoutPopupCallback(true);
