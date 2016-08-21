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

	// List of valid found tokens to return
	let tokens = [];
	
	// Tracks the current line we are on.
	let line = 0;
	
	// Tracks the current character we are on for a line.
	let pointer = 0;
	
	// Used to build up full tokens before adding to list.
	let token = '';
	
	// Current state in the lex table state machine.
	let state = 1;
	
	// List of lines in the input
	let lines = input.split(os.EOL).map((l) => l + os.EOL + ' ');

	// Function to add a token to the list of found valid tokens
	let addToken = (type, literal, backtrack) => {
		let charPos = pointer;
		
		// Need to adjust char position if token is a curly brace or a string.
		if (literal && literal !== '{' && literal != '}') {
			charPos -= literal.toString().length;
			if (type === 'str') {
				charPos--;
			}
		}
		
		// Add token to the list of found tokens
		tokens.push({
			type: type,
			literal: literal,
			line: line + 1,
			char: charPos,
		});
		token = '';
		state = 1;

		// If this token requires backtracking, then decrement the pointer
		// so we can continue at the right place.
		if (backtrack) {
			pointer--;
		}
	};

	// Loop over every character in the input
	do {
		let currentChar = lines[line][pointer];
		
		// Get the matching column for this char from the lex table
		// Runs regex match over each column. Probably slow, but more concise. 
		let column = _.findIndex(util.lexTable[0], (regex) => {
			return currentChar.match(regex);
		});

		// We did not find any matching states, throw an exception.
		if (column < 0) {
			throw new LexerException('Unidentified character "' + currentChar +
				'" on line: ' + (line + 1) + ', char: ' + (pointer + 1));
		}

		// Change to new state found in the lex table.
		state = util.lexTable[state][column];

		pointer++;
		
		// Check if we have hit a finishing state and act accordingly.
		switch (state) {
			case 0: // This is an invalid finishing state.
				throw new LexerException('Unexpected character "' + currentChar +
					'" on line: ' + (line + 1) + ', char: ' + pointer);
			case 1: // Whitespace. Remain in state 1 
				break;
			case 3: // End Identifier
				// Identifiers are either keywords or arbitrary identifiers.
				// Identifiers require backtrack so we can process the next char correctly.
				if (util.keywords.indexOf(token.toLowerCase()) != -1) {
					addToken('kwd', token.toLowerCase(), true);
				} else {
					addToken('id', token, true);
				}
				break;
			case 5: // End Number
			case 10: // End Decimal
				// Numbers require backtrack so we can process the next char correctly.
				addToken('num', parseFloat(token, 2), true);
				break;
			case 7: // End String
				// Remove the preceding quote before adding.
				// We don't need to keep the quotes in the stored token.
				token = token.substring(1);
				addToken('str', token);
				break;
			case 12: // Found start block
				addToken('op', '{');
				break;
			case 13: // End start block
				addToken('cl', '}');
				break;
			default: // Not a finishing state. Add to the token.
				token += currentChar;
		}

		// EOL reached. Advance line and reset pointer.
		if (pointer >= lines[line].length) {
			line++;
			pointer = 0;
		}

		// EOF reached. Exit the loop.
		if (line >= lines.length) {
			addToken('eof');
			break;
		}
	} while (true)

	let tokenIndex = -1;
	
	// We return an object interface with a 'next' and 'backup' function.
	// This will act as a sort of iterator for the parser to consume tokens with.
	// 'next()' will return the next token.
	// 'backup()' will back up the cursor one position.
	return {

		next: () => {
			if (tokenIndex > tokens.length) {
				throw new LexerException('No more tokens');
			}

			tokenIndex++;
			return {
				value: tokens[tokenIndex],
				done: tokens[tokenIndex].type === 'eof',
			};
		},

		backup: () => {
			tokenIndex--;
		},

	};
};