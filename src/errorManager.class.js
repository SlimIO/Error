// Require Node.JS Dependencies
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

// Require third-party Dependencies
const ajv = new (require("ajv"))({ useDefaults: "shared" });
const is = require("@sindresorhus/is");

// Require Internal Dependencies
const ErrorMessage = require("./errorMessage.class");

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
        this._errors = null;
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

                return msg;
            };
            ret.set(err.title, err);
        }

        return ret;
    }

    /**
     * @readonly
     * @property {Boolean} isInitialized
     * @desc Know if the manager has been initialized with some errors
     *
     * @example
     * const eM = new ErrorManager("./errors.json");
     * assert.equal(eM.isInitialized, false);
     * eM.loadSync();
     * assert.equal(eM.isInitialized, true);
     */
    get isInitialized() {
        return !is.nullOrUndefined(this._errors);
    }

    /**
     * @readonly
     * @property {Set<String>} errors
     * @desc Get all errors name
     *
     * @throws {Error}
     *
     * @example
     * // Load errors (with an error namned `errorTitle`)
     * const eM = new ErrorManager("./errors.json");
     * eM.loadSync();
     * assert.equal(eM.errors.has("errorTitle"), true);
     */
    get errors() {
        if (!this.isInitialized) {
            throw new Error("ErrorManager should be initialized before getting errors list!");
        }

        return new Set(...this._errors.keys());
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
        this._errors = ErrorManager.mapFromPayload(payload);
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
        this._errors = ErrorManager.mapFromPayload(payload);
        this.emit("initialized");

        return void 0;
    }

    /**
     * @method get
     * @memberof ErrorManager#
     * @param {!String} errorTitle error to throw
     * @returns {ErrorMessage}
     *
     * @throws {TypeError}
     * @throws {RangeError}
     *
     * @example
     * const eM = new ErrorManager("./errors.json");
     * await eM.load();
     *
     * throw new Error(eM.get("title").throw(["data"]));
     */
    get(errorTitle) {
        if (!this.isInitialized) {
            throw new Error("ErrorManager not initialized yet!");
        }
        if (!is.string(errorTitle)) {
            throw new TypeError("ErrorManager.throw->errorTitle should be a string");
        }
        if (!this._errors.has(errorTitle)) {
            throw new RangeError(`No error(s) has been found with title ${errorTitle}`);
        }

        return new ErrorMessage(this._errors.get(errorTitle));
    }

}

// Error expr
ErrorManager.expr = /(\${([A-Za-z]+|[0-9])})/igm;

// Export Error
module.exports = ErrorManager;
