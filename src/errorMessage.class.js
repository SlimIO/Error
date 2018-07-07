// Require Third-party Dependencies
const is = require("@sindresorhus/is");

// Private Symbol
const ErrorSym = Symbol("error");

/**
 * @class ErrorMessage
 * @classdesc Error Message!
 */
class ErrorMessage {

    /**
     * @constructor
     * @param {ErrorManager.Error} error error Object
     */
    constructor(error) {
        this[ErrorSym] = error;
        this.methodName = null;
        this.argName = null;
    }

    /**
     * @method method
     * @memberof ErrorMessage#
     * @param {!String} name method name
     * @returns {void}
     */
    method(name) {
        if (!is.string(name)) {
            throw new TypeError("name should be typeof string");
        }
        this.methodName = name;
    }

    /**
     * @method arg
     * @memberof ErrorMessage#
     * @param {!String} name arg name
     * @returns {void}
     */
    arg(name) {
        if (!is.string(name)) {
            throw new TypeError("name should be typeof string");
        }
        this.argName = name;
    }

    /**
     * @method throw
     * @memberof ErrorMessage#
     * @param {String[] | Object} args error arguments
     * @returns {String}
     */
    throw(args) {

        /** @type {ErrorManager.Error} */
        const error = this[ErrorSym];
        const ret = error.handler(args);

        // TODO: Compose method.argName?

        return `${error.code} - ${ret}`;
    }

}

// Export ErrorMessage
module.exports = ErrorMessage;
