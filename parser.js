"use strict";

let _ = require('lodash');
let os = require('os');
let util = require('./util');
let lineNumber = 1;

function ParserException(message) {
  this.name = 'ParserException';
  this.message = message;
}
ParserException.prototype = Object.create(Error.prototype);
ParserException.prototype.constructor = ParserException;

module.exports = function(getToken) {
  return function(input) {
    let lines = input.split(os.EOL);

    lines.map(function(line) {
      let tokens = lexer(line, lineNumber);


    });
  };
};

function Z(getToken) {
  
}