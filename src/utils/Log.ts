// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

export interface Logger {
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
}

const nopLogger: Logger = {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
};

const NONE = 0;
const ERROR = 1;
const WARN = 2;
const INFO = 3;
const DEBUG = 4;

let logger: Logger;
let level: number;

export class Log {
    public static get NONE() {return NONE;}
    public static get ERROR() {return ERROR;}
    public static get WARN() {return WARN;}
    public static get INFO() {return INFO;}
    public static get DEBUG() {return DEBUG;}

    public static reset() {
        level = INFO;
        logger = nopLogger;
    }

    public static get level() {
        return level;
    }
    public static set level(value: number) {
        if (NONE <= value && value <= DEBUG) {
            level = value;
        }
        else {
            throw new Error("Invalid log level");
        }
    }

    public static get logger() {
        return logger;
    }
    public static set logger(value) {
        logger = value;
    }

    public static debug(...args: any[]) {
        if (level >= DEBUG) {
            logger.debug(...args);
        }
    }
    public static info(...args: any[]) {
        if (level >= INFO) {
            logger.info(...args);
        }
    }
    public static warn(...args: any[]) {
        if (level >= WARN) {
            logger.warn(...args);
        }
    }
    public static error(...args: any[]) {
        if (level >= ERROR) {
            logger.error(...args);
        }
    }
}

Log.reset();
