"use strict";

const { TextEncoder, TextDecoder } = require("util");
const { default: $JSDOMEnvironment, TestEnvironment } = require("jest-environment-jsdom");
const crypto = require("crypto");

Object.defineProperty(exports, "__esModule", {
    value: true,
});

class JSDOMEnvironment extends $JSDOMEnvironment {
    constructor(...args) {
        const { global } = super(...args);
        // see https://github.com/jsdom/jsdom/issues/2524
        global.TextEncoder = TextEncoder;
        global.TextDecoder = TextDecoder;
        // see https://github.com/jestjs/jest/issues/9983
        global.Uint8Array = Uint8Array;
        global.crypto.subtle = crypto.subtle;
        global.crypto.randomUUID = crypto.randomUUID;
        // see https://github.com/dumbmatter/fakeIndexedDB#jsdom-often-used-with-jest
        global.structuredClone = structuredClone;
    }
}

exports.default = JSDOMEnvironment;
exports.TestEnvironment = TestEnvironment === $JSDOMEnvironment ?
    JSDOMEnvironment : TestEnvironment;
