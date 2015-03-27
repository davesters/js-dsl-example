"use strict";

let _ = require('lodash');
let util = require('./util');

function LexerException(message) {
  this.name = 'LexerException';
  this.message = message;
}
LexerException.prototype = Object.create(Error.prototype);
LexerException.prototype.constructor = LexerException;

module.exports = function() {
  return function analyze(input, line) {
    let token = '';
    let tokens = [];
    let state = 1;

    input += ' ';

    for (var pointer = 0; pointer < input.length; pointer++) {
      let currentChar = input[pointer];

      let column = _.findIndex(util.lexTable[0], function(regex) {
        return currentChar.match(regex);
      });

      if (column < 0) {
        throw new LexerException('Unidentified character "' + currentChar + '" on line: ' + line + ', char: ' + (pointer + 1));
      }

      state = util.lexTable[state][column];

      switch (state) {
        case 0:
          throw new LexerException('Unexpected character "' + currentChar + '" on line: ' + line + ', char: ' + (pointer + 1));
        case 1:
          token = '';
          break;
        case 3: // End Identifier
          if (util.keywords.indexOf(token.toLowerCase()) != -1) {
              tokens.push({ type: 'kwd', literal: token.toLowerCase() });
          } else {
              tokens.push({ type: 'id', literal: token });
          }
          state = 1;
          pointer--;
          break;
        case 5: // End Number
        case 10: // End Decimal
          tokens.push({ type: 'num', literal: Number(token) });
          state = 1;
          pointer--;
          break;
        case 7: // End String
          tokens.push({ type: 'str', literal: token });
          state = 1;
          pointer--;
          break;
        case 12: // Found start block
          tokens.push({ type: 'op', literal: '{' });
          state = 1;
          break;
        case 13: // End start block
          tokens.push({ type: 'cl', literal: '}' });
          state = 1;
          break;
        default:
          token += currentChar;
      }
    }

    return tokens;
  }
};