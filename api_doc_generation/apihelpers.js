/* eslint-disable unicorn/prefer-module */
const Handlebars = require("handlebars");

Handlebars.registerHelper("stringify", function (objectToStringify) {
  return new Handlebars.SafeString(JSON.stringify(objectToStringify));
});

module.exports = Handlebars.helpers;
