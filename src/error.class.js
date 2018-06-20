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
const events = require("events");

// Require third-party dependencies
const ajv = new (require("ajv"))({ useDefaults: "shared" });
const is = require("@sindresorhus/is");

// Require Error JSON File schema
const errorSchema = require("./error.schema.json");

// Create AJV validator
const errorValidator = ajv.compile(errorSchema);

/**
 * @class ErrorManager
 * @extends events
 * @classdesc Opinionated Error(s) handler/generator
 *
 * @property {Map<String, ErrorManager.Error>} errors
 * @property {String} errorFile
 * @readonly
 * @property {Boolean} isInitialized
 */
class ErrorManager extends events {

    /**
     * @constructor
     * @param {!String} filePath JSON files to load
     *
     * @throws {TypeError}
     * @throws {Error}
     */
    constructor(filePath) {
        super();
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
     * @param {ErrorManager.Error[]} payload payload
     * @returns {Map<String, ErrorManager.Error>}
     *
     * @throws {TypeError}
     *
     * @example
     * const payload = [
     *     {
     *         title: "errorTitle",
     *         message: "hello ${name}"
     *     }
     * ];
     * const ret = ErrorManager.mapFromPayload(payload);
     *
     * assert.equal(ret.has("errorTitle"), true);
     * const log = ret.get("errorTitle").handler({ name: "test" });
     * assert.equal(log, "hello test");
     */
    static mapFromPayload(payload) {
        if (payload instanceof Array === false) {
            throw new TypeError("Payload should be an instanceof Array!");
        }

        const ret = new Map();
        for (const err of payload) {
            err.handler = (args) => {
                let msg = err.message;
                msg = msg.replace(ErrorManager.expr, (...fArg) => {
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
     * @desc Know if the manager has been initialized with some errors
     * @example
     *
     * const eM = new ErrorManager("./errors.json");
     * assert.equal(eM.isInitialized, false);
     * eM.loadSync();
     * assert.equal(eM.isInitialized, true);
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
     *
     * @throws {Error}
     * @fires ErrorManager#initialized
     *
     * @example
     * const eM = new ErrorManager("./errors.json");
     * eM.load();
     * // code execution will continue without awaiting load achievement
     */
    async load() {
        if (this.isInitialized) {
            return void 0;
        }

        await access(this.errorFile, R_OK);
        const buf = await readFile(this.errorFile);
        const payload = JSON.parse(buf.toString());
        if (!errorValidator(payload)) {
            throw new Error("Failed to validate JSON Payload!");
        }
        this.errors = ErrorManager.mapFromPayload(payload);
        this.emit("initialized");

        return void 0;
    }

    /**
     * @method loadSync
     * @desc Load error class Synchronously!
     * @memberof ErrorManager#
     * @returns {void}
     *
     * @throws {Error}
     * @fires ErrorManager#initialized
     *
     * @example
     * const eM = new ErrorManager("./errors.json");
     * eM.loadSync(); // Block Node.JS event-loop
     */
    loadSync() {
        if (this.isInitialized) {
            return void 0;
        }

        accessSync(this.errorFile, R_OK);
        const buf = readFileSync(this.errorFile);
        const payload = JSON.parse(buf.toString());
        if (!errorValidator(payload)) {
            throw new Error("Failed to validate JSON Payload!");
        }
        this.errors = ErrorManager.mapFromPayload(payload);
        this.emit("initialized");

        return void 0;
    }

    /**
     * @method throw
     * @memberof ErrorManager#
     * @param {!String} errorTitle error to throw
     * @param {Array | Object} args error arguments
     * @returns {String}
     *
     * @throws {TypeError}
     * @throws {RangeError}
     * @fires ErrorManager#message
     *
     * @example
     * const eM = new ErrorManager("./errors.json");
     * await eM.load();
     *
     * throw new Error(eM.throw("title", ["data"]));
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

        // Get message and send it as event before returning
        const ret = this.errors.get(errorTitle).handler(args);
        this.emit("message", { title: errorTitle, body: ret });

        return ret;
    }

}

// Error expr
ErrorManager.expr = /(\${([A-Za-z]+|[0-9])})/igm;

// Export Error
module.exports = ErrorManager;
