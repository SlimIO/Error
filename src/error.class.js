// Require Node.JS dependencies
const {
    accessSync,
    readFileSync,
    constants: { R_OK },
    promises: {
        readFile,
        access
    }
} = require("fs");
const { extname } = require("path");

// Require third-party dependencies
const is = require("@sindresorhus/is");

// Error Regex
const errorExpr = /(\${([A-Za-z]+|[0-9])})/igm;

/**
 * @class ErrorManager
 * @classdesc Opinionated Error(s) handler/generator
 *
 * @property {Map<String, ErrorManager.Error>} errors
 * @property {String} errorFile
 */
class ErrorManager {

    /**
     * @constructor
     * @param {!String} filePath Error file to load
     *
     * @throws {TypeError}
     * @throws {Error}
     */
    constructor(filePath) {
        if (!is.string(filePath)) {
            throw new TypeError("ErrorManager.constructor->filePath should be typeof <string>");
        }
        if (extname(filePath) !== ".json") {
            throw new Error("ErrorManager.constructor->filePath - please provide a JSON file");
        }
        this.errorFile = filePath;
        this.errors = null;
    }

    /**
     * @static
     * @method mapFromPayload
     * @param {Array} payload payload
     * @returns {Map<String, ErrorManager.Error>}
     */
    static mapFromPayload(payload) {
        if (payload instanceof Array === false) {
            throw new TypeError("Payload should be an instanceof Array!");
        }

        const ret = new Map();
        for (const err of payload) {
            err.handler = (args) => {
                let msg = err.message;
                msg = msg.replace(errorExpr, (...fArg) => {
                    const [,, matchName] = fArg;
                    if (!Reflect.has(args, matchName)) {
                        return matchName;
                    }

                    return Reflect.get(args, matchName);
                });

                return `${err.code} - ${msg}`;
            };
            ret.set(err.title, err);
        }

        return ret;
    }

    /**
     * @readonly
     * @property {Boolean} isInitialized
     */
    get isInitialized() {
        return !is.nullOrUndefined(this.errors);
    }

    /**
     * @async
     * @method load
     * @desc Load error class Asynchronously!
     * @memberof ErrorManager#
     * @returns {Promise<void>}
     */
    async load() {
        if (this.isInitialized) {
            return void 0;
        }
        await access(this.errorFile, R_OK);
        const buf = await readFile(this.errorFile);
        const payload = JSON.parse(buf.toString());
        this.errors = ErrorManager.mapFromPayload(payload);

        return void 0;
    }

    /**
     * @method loadSync
     * @desc Load error class Synchronously!
     * @memberof ErrorManager#
     * @returns {void}
     */
    loadSync() {
        if (this.isInitialized) {
            return void 0;
        }
        accessSync(this.errorFile, R_OK);
        const buf = readFileSync(this.errorFile);
        const payload = JSON.parse(buf.toString());
        this.errors = ErrorManager.mapFromPayload(payload);

        return void 0;
    }

    /**
     * @method throw
     * @memberof ErrorManager#
     * @param {!String} errorTitle error to throw
     * @param {any[]} args error arguments
     * @returns {String}
     *
     * @throws {TypeError}
     * @throws {RangeError}
     */
    throw(errorTitle, args = []) {
        if (!this.isInitialized) {
            throw new Error("ErrorManager not initialized yet!");
        }
        if (!is.string(errorTitle)) {
            throw new TypeError("ErrorManager.throw->errorTitle should be a string");
        }
        if (!this.errors.has(errorTitle)) {
            throw new RangeError(`No error(s) has been found with title ${errorTitle}`);
        }

        return this.errors.get(errorTitle).handler(args);
    }

}

// Export Error
module.exports = ErrorManager;
