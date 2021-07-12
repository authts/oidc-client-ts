// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

const timer = {
    setInterval: function (cb: (...args: any[]) => void, duration?: number): number {
        // @ts-ignore
        return setInterval(cb, duration);
    },
    clearInterval: function (handle: number): void {
        return clearInterval(handle);
    }
};

/*TODO: port-TS
let testing = false;
let request: XMLHttpRequest | null = null;
*/

export class Global {

    /*TODO: port-TS static _testing() {
        testing = true;
    }*/

    static get location() {
        /*TODO: port-TS if (!testing) {
            return location;
        }*/
        return location;
    }

    static get localStorage() {
        /*TODO: port-TS if (!testing && typeof window !== 'undefined') {
            return localStorage;
        }*/
        return localStorage;
    }

    static get sessionStorage() {
        /*TODO: port-TS if (!testing && typeof window !== 'undefined') {
            return sessionStorage;
        }*/
        return sessionStorage;
    }

    /*TODO: port-TS
    static setXMLHttpRequest(newRequest: XMLHttpRequest) {
        request = newRequest;
    }
    */

    static get XMLHttpRequest(): typeof XMLHttpRequest {
        /*TODO: port-TS if (!testing && typeof window !== 'undefined') {
            return request || XMLHttpRequest;
        }*/
        return XMLHttpRequest;
    }

    static get timer() {
        /*TODO: port-TS if (!testing) {
            return timer;
        }*/
        return timer;
    }
}
