"use strict";

exports.keywords = [ 'test', 'fields', 'size', 'each', 'object', 'array', 'string', 'number', 'boolean', 'true', 'false', 'should', 'not', 'be', 'equal' ];

exports.lexTable = [
    [ /[a-zA-Z_:/]/, /[0-9]/, /\{/, /\}/, /"/, /\./, /-/, /\s/ ], // 0:  Regexes
  //[ i   d   {   }   "   .   -   sp  \n ]
    [ 2,  4,  12, 13, 6,  0,  11, 1,  1  ], // 1:  Starting State
    [ 2,  2,  3,  3,  3,  2,  2,  3,  3  ], // 2:  In Identifier
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1  ], // 3:  End Identifier *
    [ 5,  4,  5,  5,  5,  8,  5,  5,  5  ], // 4:  In Number
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1  ], // 5:  End Number *
    [ 6,  6,  6,  6,  7,  6,  6,  6,  6  ], // 6:  In String
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1  ], // 7:  End String *
    [ 0,  9,  0,  0,  0,  0,  0,  0,  0  ], // 8:  Found Decimal Point
    [ 10, 9,  10, 10, 10, 10, 10, 10, 10 ], // 9:  In Decimal
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1  ], // 10: End Decimal *
    [ 0,  4,  0,  0,  0,  0,  0,  0,  0  ], // 11: Found minus sign
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1  ], // 12: Found Start Block *
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1  ], // 13: Found End Block *
];

exports.isStr = (token) => {
    return token.type === 'str';
};

exports.isNumber = (token) => {
    return token.type === 'num';
};

exports.isIdentifier = (token) => {
    return token.type === 'id';
};

exports.isOpeningBrace = (token) => {
    return token.type === 'op';
};

exports.isClosingBrace = (token) => {
    return token.type === 'cl';
};

exports.isEOF = (token) => {
    return token.type === 'eof';
};

exports.isKeyword = (token, kwd) => {
    return token.type === 'kwd' && token.literal === kwd;
};