var fs = require("node:fs");
console.log(JSON.parse(fs.readFileSync("./dist/module.json", "utf8")).version);
