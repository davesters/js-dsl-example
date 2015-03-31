"use strict";

let _ = require('lodash');
let util = require('./util');
let os = require('os');

function LexerException(message) {
  this.name = 'LexerException';
  this.message = message;
}
LexerException.prototype = Object.create(Error.prototype);
LexerException.prototype.constructor = LexerException;

module.exports = (input) => {
  if (!input || input.trim() === '') {
    throw new LexerException('No input provided');
  }

  let tokens = [];
  let line = 0;
  let pointer = 0;
  let token = '';
  let state = 1;
  let lines = input.split(os.EOL).map((l) => l + os.EOL + ' ');

  let addToken = (type, literal, backtrack) => {
    tokens.push({ type: type, literal: literal });
    token = '';
    state = 1;

    if (backtrack) {
      pointer--;
    }
  };

  let done = false;
  do {
    let currentChar = lines[line][pointer];
    let column = _.findIndex(util.lexTable[0], (regex) => {
      return currentChar.match(regex);
    });

    if (column < 0) {
      throw new LexerException('Unidentified character "' + currentChar + '" on line: ' + (line + 1) + ', char: ' + (pointer + 1));
    }

    state = util.lexTable[state][column];

    pointer++;
    switch (state) {
      case 0:
        throw new LexerException('Unexpected character "' + currentChar + '" on line: ' + (line + 1) + ', char: ' + pointer);
      case 1:
        break;
      case 3: // End Identifier
        if (util.keywords.indexOf(token.toLowerCase()) != -1) {
          addToken('kwd', token.toLowerCase(), true);
        } else {
          addToken('id', token, true);
        }
        break;
      case 5: // End Number
      case 10: // End Decimal
        addToken('num', Number(token), true);
        break;
      case 7: // End String
        addToken('str', token, true);
        break;
      case 12: // Found start block
        addToken('op', '{');
        break;
      case 13: // End start block
        addToken('cl', '}');
        break;
      default:
        token += currentChar;
    }

    if (pointer >= lines[line].length) {
      line++;
      pointer = 0;
    }
    if (line >= lines.length) {
      addToken('eof');
      done = true;
    }
  } while(!done)

  let tokenIndex = -1;
  return {

    next: () => {
      if (tokenIndex > tokens.length) {
        throw Exception();
      }

      tokenIndex++;
      return {
        value: tokens[tokenIndex],
        done: (tokenIndex >= tokens.length)
      };
    }

  };
};