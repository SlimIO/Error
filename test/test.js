// Require Node.JS Dependencies
const { join } = require("path");

// Require Third-party Dependencies
const avaTest = require("ava");
const is = require("@sindresorhus/is");

// Require Internal Dependencies
const ErrorManager = require("../src/error.class");

// JSON Files path
const errorFile = join(__dirname, "data/good.json");
const badErrorFile = join(__dirname, "data/bad.json");

avaTest("ErrorManager (invalid file type)", (test) => {
    const error = test.throws(() => {
        // eslint-disable-next-line no-new
        new ErrorManager(5);
    }, TypeError);
    test.is(error.message, "ErrorManager.constructor->filePath should be typeof <string>");
});

avaTest("ErrorManager (invalid file extension)", (test) => {
    const error = test.throws(() => {
        // eslint-disable-next-line no-new
        new ErrorManager("test.xml");
    }, Error);
    test.is(error.message, "ErrorManager.constructor->filePath - please provide a JSON file");
});

avaTest("ErrorManager - load Async", async(test) => {
    const eM = new ErrorManager(errorFile);
    test.is(is.string(eM.errorFile), true);
    test.is(eM.errors, null);
    test.is(eM.isInitialized, false);
    await eM.load();
    test.is(eM.isInitialized, true);
    test.is(is.map(eM.errors), true);
    test.is(eM.errors.has("test"), true);
    await eM.load();
});

avaTest("ErrorManager - load (bad) Async", async(test) => {
    const eM = new ErrorManager(badErrorFile);
    try {
        await eM.load();
    }
    catch (error) {
        test.is(error.message, "Failed to validate JSON Payload!");
    }
});

avaTest("ErrorManager - load Synchronous", (test) => {
    const eM = new ErrorManager(errorFile);
    test.is(is.string(eM.errorFile), true);
    test.is(eM.errors, null);
    test.is(eM.isInitialized, false);
    // eslint-disable-next-line no-sync
    eM.loadSync();
    test.is(eM.isInitialized, true);
    test.is(is.map(eM.errors), true);
    test.is(eM.errors.has("test"), true);
    // eslint-disable-next-line no-sync
    eM.loadSync();
});

avaTest("ErrorManager - load (bad) Async", (test) => {
    const eM = new ErrorManager(badErrorFile);
    const error = test.throws(() => {
        // eslint-disable-next-line no-sync
        eM.loadSync();
    }, Error);
    test.is(error.message, "Failed to validate JSON Payload!");
});

avaTest("ErrorManager - mapFromPayload type Error", (test) => {
    const error = test.throws(() => {
        ErrorManager.mapFromPayload(10);
    }, TypeError);
    test.is(error.message, "Payload should be an instanceof Array!");
});

avaTest("ErrorManager - mapFromPayload", (test) => {
    /* eslint no-template-curly-in-string: 0 */
    const payload = [
        {
            code: "XXX",
            title: "hello",
            message: "hello ${name}"
        }
    ];
    const ret = ErrorManager.mapFromPayload(payload);
    test.is(ret.has("hello"), true);
    test.is(ret.has("unknow"), false);
    const log = ret.get("hello").handler({ name: "world!" });
    test.is(log, "XXX - hello world!");
});

avaTest("ErrorManager - throw test", async(test) => {
    const eM = new ErrorManager(errorFile);
    {
        const error = test.throws(() => {
            eM.throw(10);
        }, Error);
        test.is(error.message, "ErrorManager not initialized yet!");
    }

    // Load
    await eM.load();
    {
        const error = test.throws(() => {
            eM.throw(10);
        }, TypeError);
        test.is(error.message, "ErrorManager.throw->errorTitle should be a string");
    }

    // RangeError
    {
        const error = test.throws(() => {
            eM.throw("unknowMsg");
        }, RangeError);
        test.is(error.message, "No error(s) has been found with title unknowMsg");
    }

    const msg = eM.throw("test", { name: "fraxken" });
    test.is(msg, "#HPX0478 - hello world fraxken");
});

avaTest("ErrorManager - throw test (no match)", async(test) => {
    const eM = new ErrorManager(errorFile);
    await eM.load();

    const msg = eM.throw("test");
    test.is(msg, "#HPX0478 - hello world name");
});
