const { join } = require("path");
const ErrorManager = require("../index");

const TError = new ErrorManager(join(__dirname, "errors.json"));
TError.loadSync();
console.log(TError.throw("test", {
    name: "fraxken"
}));
