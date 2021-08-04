// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

export interface Logger {
    error(...args: any[]): void;
    info(...args: any[]): void;
    debug(...args: any[]): void;
    warn(...args: any[]): void;
}

const nopLogger: Logger = {
    debug() {},
    info() {},
    warn() {},
    error() {}
};

const NONE = 0;
const ERROR = 1;
const WARN = 2;
const INFO = 3;
const DEBUG = 4;

let logger: Logger;
let level: number;

export class Log {
    static get NONE() {return NONE;}
    static get ERROR() {return ERROR;}
    static get WARN() {return WARN;}
    static get INFO() {return INFO;}
    static get DEBUG() {return DEBUG;}

    static reset() {
        level = INFO;
        logger = nopLogger;
    }

    static get level() {
        return level;
    }
    static set level(value: number) {
        if (NONE <= value && value <= DEBUG) {
            level = value;
        }
        else {
            throw new Error("Invalid log level");
        }
    }

    static get logger() {
        return logger;
    }
    static set logger(value) {
        logger = value;
    }

    static debug(...args: any[]) {
        if (level >= DEBUG) {
            logger.debug.apply(logger, Array.from(args));
        }
    }
    static info(...args: any[]) {
        if (level >= INFO) {
            logger.info.apply(logger, Array.from(args));
        }
    }
    static warn(...args: any[]) {
        if (level >= WARN) {
            logger.warn.apply(logger, Array.from(args));
        }
    }
    static error(...args: any[]) {
        if (level >= ERROR) {
            logger.error.apply(logger, Array.from(args));
        }
    }
}

Log.reset();
