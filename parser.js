"use strict";

let _ = require('lodash');
let os = require('os');
let util = require('./util');

function ParserException(message) {
  this.name = 'ParserException';
  this.message = message;
}
ParserException.prototype = Object.create(Error.prototype);
ParserException.prototype.constructor = ParserException;

module.exports = function(input) {
  let lineNumber = 1;
  let tokens = lexer(input);

  let getToken = function() {
    let token = tokens.next();

    if (token.value === 'eol') {
      lineNumber++;
      token = tokens.next();
    }

    return token.value;
  };

  let tree = Z(getToken);

  function Z(getToken) {
    let token = getToken();

    if (token.type === 'kwd' && token.literal === 'test') {
      if (isStr(getToken())) {
        if (isOpeningBrace(getToken())) {
          return true;
        } else {
          throw new ParserException('Expected token `{` on line: ' + lineNumber);
        }
      } else {
        throw new ParserException('Expected string on line: ' + lineNumber);
      }
    } else {
      throw new ParserException('Expected keyword `test` on line: ' + lineNumber);
    }
  }

  return tokens;
};

function isStr(token) {
  return token.type === 'str';
}

function isOpeningBrace(token) {
  return token.type === 'op';
}