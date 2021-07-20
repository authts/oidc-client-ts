// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { SigninResponse } from "../../src/SigninResponse";
import { SignoutResponse } from "../../src/SignoutResponse";
import { SigninState } from "../../src/SigninState";
import { State } from "../../src/State";

export class StubResponseValidator {
    signinState: any;
    signinResponse: any;

    signoutState: any;
    signoutResponse: any;

    validateSigninResponse(state: SigninState, response: SigninResponse) {
        this.signinState = state;
        this.signinResponse = response;
        return Promise.resolve(response);
    }

    validateSignoutResponse(state: State, response: SignoutResponse) {
        this.signoutState = state;
        this.signoutResponse = response;
        return Promise.resolve(response);
    }
}
