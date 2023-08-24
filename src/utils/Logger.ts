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

let level: number;
let logger: ILogger;

/**
 * Log levels
 *
 * @public
 */
export enum Log {
    NONE,
    ERROR,
    WARN,
    INFO,
    DEBUG
}

/**
 * Log manager
 *
 * @public
 */
export namespace Log { // eslint-disable-line @typescript-eslint/no-namespace
    export function reset(): void {
        level = Log.INFO;
        logger = nopLogger;
    }

    export function setLevel(value: Log): void {
        if (!(Log.NONE <= value && value <= Log.DEBUG)) {
            throw new Error("Invalid log level");
        }
        level = value;
    }

    export function setLogger(value: ILogger): void {
        logger = value;
    }
}

/**
 * Internal logger instance
 *
 * @public
 */
export class Logger {
    private _method?: string;
    public constructor(private _name: string) {}

    /* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
    public debug(...args: unknown[]): void {
        if (level >= Log.DEBUG) {
            logger.debug(Logger._format(this._name, this._method), ...args);
        }
    }
    public info(...args: unknown[]): void {
        if (level >= Log.INFO) {
            logger.info(Logger._format(this._name, this._method), ...args);
        }
    }
    public warn(...args: unknown[]): void {
        if (level >= Log.WARN) {
            logger.warn(Logger._format(this._name, this._method), ...args);
        }
    }
    public error(...args: unknown[]): void {
        if (level >= Log.ERROR) {
            logger.error(Logger._format(this._name, this._method), ...args);
        }
    }
    /* eslint-enable @typescript-eslint/no-unsafe-enum-comparison */

    public throw(err: Error): never {
        this.error(err);
        throw err;
    }

    public create(method: string): Logger {
        const methodLogger: Logger = Object.create(this);
        methodLogger._method = method;
        methodLogger.debug("begin");
        return methodLogger;
    }

    public static createStatic(name: string, staticMethod: string): Logger {
        const staticLogger = new Logger(`${name}.${staticMethod}`);
        staticLogger.debug("begin");
        return staticLogger;
    }

    private static _format(name: string, method?: string) {
        const prefix = `[${name}]`;
        return method ? `${prefix} ${method}:` : prefix;
    }

    /* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
    // helpers for static class methods
    public static debug(name: string, ...args: unknown[]): void {
        if (level >= Log.DEBUG) {
            logger.debug(Logger._format(name), ...args);
        }
    }
    public static info(name: string, ...args: unknown[]): void {
        if (level >= Log.INFO) {
            logger.info(Logger._format(name), ...args);
        }
    }
    public static warn(name: string, ...args: unknown[]): void {
        if (level >= Log.WARN) {
            logger.warn(Logger._format(name), ...args);
        }
    }
    public static error(name: string, ...args: unknown[]): void {
        if (level >= Log.ERROR) {
            logger.error(Logger._format(name), ...args);
        }
    }
    /* eslint-enable @typescript-eslint/no-unsafe-enum-comparison */
}

Log.reset();
