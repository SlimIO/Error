"use strict";

// Require Third-party Dependencies
const cleanStack = require("clean-stack");

// CONSTANTS
const kError = Symbol.for("SlimIOError");

class SlimIOError extends Error {
    constructor(message) {
        super(message);
        Object.defineProperty(this, kError, { value: true });
        this.stack = cleanStack(this.stack);
    }

    toJSON() {
        return {
            name: `${kError.description}::${this.name}`,
            message: this.message,
            stack: this.stack
        };
    }
}

class CallbackArgumentType extends SlimIOError {
    constructor(message) {
        super(message);
        this.name = "InvalidCallbackArgument";
    }
}

class CallbackNotFound extends SlimIOError {
    constructor(callbackName) {
        super(`Unable to found callback with name '${callbackName}'`);
        this.name = "CallbackNotFound";
    }
}

class RequiredArgument extends SlimIOError {
    constructor(argName) {
        super(`Argument ${argName} is required`);
        this.name = "RequiredArgument";
    }
}

/**
 * @function isSlimIOError
 * @description check and tell if a given object is a SlimIO Error or not!
 * @param {*} obj
 * @returns {boolean}
 */
function isSlimIOError(obj) {
    if (typeof obj !== "object" || obj === null) {
        return false;
    }
    if (obj[kError]) {
        return true;
    }

    return "name" in obj && typeof obj.name === "string" && obj.name.startsWith(kError.description);
}

module.exports = {
    isSlimIOError,
    SlimIOError,
    CallbackArgumentType,
    CallbackNotFound,
    RequiredArgument
};
