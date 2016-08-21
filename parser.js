"use strict";

let util = require('./util');
let sprintf = require('util').format;
let lexer = require('./lexer');
let equalKeywords = ['object', 'array', 'string', 'number', 'boolean', 'true', 'false'];

function ParserException(message) {
	this.name = 'ParserException';
	this.message = message;
}
ParserException.prototype = Object.create(Error.prototype);
ParserException.prototype.constructor = ParserException;

module.exports = (input) => {
	// Pass the input to the lexer to get all the tokens. Lexer errors will get thrown from within.
	let tokens = lexer(input);

	// Call the starting production. The return value will be the final AST.
	// Productions sort of recursively call other productions and returning
	// their final trees which get added up to the final result.
	// We have to pass around the iterator interface tho.
	let ast = Z({
		next: () => {
			return tokens.next().value;
		},
		backup: tokens.backup,
	});

	return ast;
};

function throwException(token, message) {
	throw new ParserException(sprintf('%s (line: %d, char: %d)', message, token.line, token.char));
}

// Z => S
// Entry point to any program
function Z(tokens) {
	let node = {
		type: 'program',
		children: [],
	};

	// Loop over all valid S productions.
	do {
		node.children.push(S(tokens));
		
		// Need to check for EOF here so we don't try to keep going.
		let token = tokens.next();
		if (util.isEOF(token)) {
			break;
		}

		// If the last token was not the EOF, then we need to
		// backup because it is the start of another S production.
		tokens.backup();
	} while (true);

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

	// Found the start of a test block.
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

	// Loop over all valid T productions.
	do {
		node.right.children.push(T(tokens));
		
		// Check if we have a closing brace to end the test block.
		if (util.isClosingBrace(tokens.next())) {
			break;
		}

		// If the last token was not a closing brace, then we need to
		// backup because it is the start of another T production.
		tokens.backup();
	} while (true);

	return node;
}

// T => fields F { T }
// T => each F { T }
// T => A should BCE
function T(tokens) {
	let token = tokens.next();

	// Check if we are starting a 'fields' or 'each' block.
	// We have a separate function for these.
	if (util.isKeyword(token, 'fields')) {
		return TBlock('fields', tokens);
	} else if (util.isKeyword(token, 'each')) {
		return TBlock('each', tokens);
	}

	// Found the start of a should statement
	let node = {
		type: 'shouldStmt',
		left: null,
		right: null,
	};
	
	// See if we have an optional identifier before our 'should' keyword.
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

	// Check if we have an optional 'not' operator.
	let b = B(tokens);
	if (b) {
		shouldArgsNode.children.push(b);
	}
	
	// Get the last bits of the should statement.
	shouldArgsNode.children.push(C(tokens));
	shouldArgsNode.children.push(E(tokens));

	node.right = shouldArgsNode;
	node.line = token.line;
	return node;
}

// T => fields F { T }
// T => each F { T }
function TBlock(blockType, tokens) {
	let node = {
		type: blockType + 'Stmt',
		left: F(tokens), // Check if we have an optional identifier
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

	// Loop over all valid T productions.
	// We recursively check for more T productions here as there can be
	// multiple nested fields and each blocks containing should statements.
	do {
		node.right.children.push(T(tokens));
		
		// Check if we have a closing brace to end the test block.
		if (util.isClosingBrace(tokens.next())) {
			break;
		}
		
		// If the last token was not a closing brace, then we need to
		// backup because it is the start of another T production.
		tokens.backup();
	} while (true);

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

	// If we did not find the optional not operator, then we need to
	// backup, because it is the next piece of the should statement.
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
		// If we did not find an optional identifier here, then we need to
		// backup, because it is the next piece of the T production.
		tokens.backup();
		return null;
	}
}