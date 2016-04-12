"use strict";

let util = require('./util');
let sprintf = require('util').format;
let lexer = require('./lexer');
let equalKeywords = [ 'object', 'array', 'string', 'number', 'boolean', 'true', 'false' ];

function ParserException(message) {
  this.name = 'ParserException';
  this.message = message;
}
ParserException.prototype = Object.create(Error.prototype);
ParserException.prototype.constructor = ParserException;

module.exports = function(input) {
    let tokens = lexer(input);

    let ast = Z({
        next: () => {
            try {
                let token = tokens.next().value;
                return token;
            } catch (e) {
                throw new ParserException('Unexpected end of file.');
            }
        },
        backup: tokens.backup,
    });

    return ast;
};

function throwException(token, message) {
    throw new ParserException(sprintf(message + ' (line: %d, char: %d)', token.line, token.char));
}

// Z => S
function Z(tokens) {
    let node = {
        type: 'program',
        children: [],
    };

    do {
        let sNode = S(tokens);
        if (!sNode) {
            break;
        }
        
        node.children.push(sNode);
        let token = tokens.next();
        if (util.isEOF(token)) {
            break;
        }
        tokens.backup();
    } while(true);

    return node;
}

// S => test t { T }
function S(tokens) {
    let token = tokens.next();

    if (!util.isKeyword(token, 'test')) {
        throwException(token, 'Expected keyword `test`');
    }

    token = tokens.next();
    if (!util.isStr(token)) {
        throwException(token, 'Expected string');
    }
    
    let node = {
        type: 'testStmt',
        left: {
            type: 'strlit',
            literal: token.literal,
        },
        right: null,
    };
    
    token = tokens.next();
    if (!util.isOpeningBrace(token)) {
        throwException(token, 'Expected token `{`');
    }

    node.right = {
        type: 'blockStmt',
        children: [],
    }
    
    do {
        let tNode = T(tokens);
        if (!tNode) {
            break;
        }
        
        node.right.children.push(tNode);
        if (util.isClosingBrace(tokens.next())) {
            break;
        }
        tokens.backup();
    } while(true);
    
    return node;
}

// T => fields F { T }
// T => each F { T }
// T => A should BCE
function T(tokens) {
    let token = tokens.next();
    
    if (util.isKeyword(token, 'fields')) {
        return TBlock('fields', tokens);
    } else if (util.isKeyword(token, 'each')) {
        return TBlock('each', tokens);
    }
    
    let node = {
        type: 'shouldStmt',
        left: null,
        right: null,
    };
    let a = A(token);
    if (a) {
        node.left = a;
        token = tokens.next();
    }
    
    let shouldArgsNode = {
        type: 'args',
        children: [],
    };
    if (!util.isKeyword(token, 'should')) {
        if (a) {
            throwException(token, 'Expected to find keyword `should` after a field name. If field name is more than one word, try enclosing in quotes.');
        }
        throwException(token, 'Expected keyword `should` or closing `}`');
    }

    let b = B(tokens);
    if (b) {
        shouldArgsNode.children.push(b);
    }
    shouldArgsNode.children.push(C(tokens));
    shouldArgsNode.children.push(E(tokens));
    
    node.right = shouldArgsNode;
    return node;
}

// T => fields F { T }
// T => each F { T }
function TBlock(blockType, tokens) {
    let node = {
        type: blockType + 'Stmt',
        left: F(tokens),
        right: null,
    };
    let token = tokens.next();
    
    if (!util.isOpeningBrace(token)) {
        throwException(token, 'Expected token `{`');
    }

    node.right = {
        type: 'blockStmt',
        children: [],
    }
    
    do {
        let tNode = T(tokens);
        if (!tNode) {
            break;
        }
        
        node.right.children.push(tNode);
        if (util.isClosingBrace(tokens.next())) {
            break;
        }
        tokens.backup();
    } while(true);
    
    return node;
}

// A => size | i | t | e
function A(token) {
    if (util.isKeyword(token, 'size')) {
        return {
            type: "kwd",
            literal: "size",
        };
    } else if (util.isIdentifier(token)) {
        return {
            type: "id",
            literal: token.literal,
        };
    } else if (util.isStr(token)) {
        return {
            type: "strlit",
            literal: token.literal,
        };
    } else {
        return null;
    }
}

// B => not | e
function B(tokens) {
    let token = tokens.next();
    
    if (util.isKeyword(token, 'not')) {
        return {
            type: "kwd",
            literal: "not",
        };
    }
    
    tokens.backup();
    return null;
}

// C => be | equal
function C(tokens) {
    let token = tokens.next();
    
    if (util.isKeyword(token, 'be')) {
        return {
            type: "kwd",
            literal: "be",
        };
    }
    
    if (util.isKeyword(token, 'equal')) {
        return {
            type: "kwd",
            literal: "equal",
        };
    }
    
    throwException(token, 'Expected either keyword `be` or `equal` to follow a `should` or a `not`.');
}

// E => object | array | string | number | boolean | true | false | t
function E(tokens) {
    let token = tokens.next();
    
    if (util.isStr(token)) {
        return {
            type: 'strlit',
            literal: token.literal,
        }
    }
    if (util.isNumber(token)) {
        return {
            type: 'numlit',
            literal: token.literal,
        }
    }
    
    if (token.type === 'kwd' && equalKeywords.indexOf(token.literal) !== -1) {
        return {
            type: "kwd",
            literal: token.literal,
        }
    }

    throwException(token, 'Expected to find either a string literal, a number literal, or a value type at the end of a should statement. If the comparison value is more than one word, try enclosing it in quotes.');
}

// F => i | t | e
function F(tokens) {
    let token = tokens.next();
    
    if (util.isStr(token)) {
        return {
            type: "strlit",
            literal: token.literal,
        };
    } else if (util.isIdentifier(token)) {
        return {
            type: "id",
            literal: token.literal,
        };
    } else {
        tokens.backup();
        return null;
    }
}