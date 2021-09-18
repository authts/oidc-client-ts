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

/**
 * @public
 */
export class Log {
    public static get NONE(): number {return NONE;}
    public static get ERROR(): number {return ERROR;}
    public static get WARN(): number {return WARN;}
    public static get INFO(): number {return INFO;}
    public static get DEBUG(): number {return DEBUG;}

    public static reset(): void {
        level = INFO;
        logger = nopLogger;
    }

    public static get level(): number {
        return level;
    }
    public static set level(value: number) {
        if (NONE > value || value > DEBUG) {
            throw new Error("Invalid log level");
        }

        level = value;
    }

    public static get logger(): Logger {
        return logger;
    }
    public static set logger(value: Logger) {
        logger = value;
    }

    public static debug(...args: any[]): void {
        if (level >= DEBUG) {
            logger.debug(...args);
        }
    }
    public static info(...args: any[]): void {
        if (level >= INFO) {
            logger.info(...args);
        }
    }
    public static warn(...args: any[]): void {
        if (level >= WARN) {
            logger.warn(...args);
        }
    }
    public static error(...args: any[]): void {
        if (level >= ERROR) {
            logger.error(...args);
        }
    }
}

Log.reset();
