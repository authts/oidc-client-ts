// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

/**
 * Native interface
 *
 * @public
 */
export interface ILogger {
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
}

const nopLogger: ILogger = {
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

/**
 * Log manager
 *
 * @public
 */
export class Log {
    public static get NONE(): number {return NONE;}
    public static get ERROR(): number {return ERROR;}
    public static get WARN(): number {return WARN;}
    public static get INFO(): number {return INFO;}
    public static get DEBUG(): number {return DEBUG;}

    private static _level: number;
    private static _logger: ILogger;

    public static reset(): void {
        this._level = INFO;
        this._logger = nopLogger;
    }

    public static get level(): number {
        return this._level;
    }
    public static set level(value: number) {
        if (NONE > value || value > DEBUG) {
            throw new Error("Invalid log level");
        }

        this._level = value;
    }

    // native logger
    public static get logger(): ILogger {
        return this._logger;
    }
    public static set logger(value: ILogger) {
        this._logger = value;
    }
}

/**
 * @public
 * Internal logger instance
 */
export class Logger {
    private readonly _name: string;
    public constructor(name: string) {
        this._name = name;
    }

    public debug(...args: unknown[]): void {
        Logger.debug(this._name, ...args);
    }
    public info(...args: unknown[]): void {
        Logger.info(this._name, ...args);
    }
    public warn(...args: unknown[]): void {
        Logger.warn(this._name, ...args);
    }
    public error(...args: unknown[]): void {
        Logger.error(this._name, ...args);
    }

    // helpers for static class methods
    public static debug(name: string, ...args: unknown[]): void {
        if (Log.level >= DEBUG) {
            Log.logger.debug(`[${name}]`, ...args);
        }
    }
    public static info(name: string, ...args: unknown[]): void {
        if (Log.level >= INFO) {
            Log.logger.info(`[${name}]`, ...args);
        }
    }
    public static warn(name: string, ...args: unknown[]): void {
        if (Log.level >= WARN) {
            Log.logger.warn(`[${name}]`, ...args);
        }
    }
    public static error(name: string, ...args: unknown[]): void {
        if (Log.level >= ERROR) {
            Log.logger.error(`[${name}]`, ...args);
        }
    }
}

Log.reset();
