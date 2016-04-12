"use strict";

let lexer = require('./../lexer');
let should = require('should');

describe('Lexer', function() {

	it('throws error on no input', function() {
		(lexer).should.throw('No input provided');
	});

	it('returns correct tokens for (Z => test t {)', function() {
		var tokens = lexer('test http://test.api {');

		var token = tokens.next().value;
		token.type.should.equal('kwd');
		token.literal.should.equal('test');
		token.line.should.equal(1);
		token.char.should.equal(1);

		token = tokens.next().value;
		token.type.should.equal('id');
		token.literal.should.equal('http://test.api');
		token.line.should.equal(1);
		token.char.should.equal(6);

		token = tokens.next().value;
		token.type.should.equal('op');
		token.literal.should.equal('{');
		token.line.should.equal(1);
		token.char.should.equal(22);

		token = tokens.next().value;
		token.type.should.equal('eof');
	});

	it('returns correct tokens for (Z => test t {) when t is a string', function() {
		var tokens = lexer('test "http://test.api" {');

		var token = tokens.next().value;
		token.type.should.equal('kwd');
		token.literal.should.equal('test');
		token.line.should.equal(1);
		token.char.should.equal(1);

		token = tokens.next().value;
		token.type.should.equal('str');
		token.literal.should.equal('http://test.api');
		token.line.should.equal(1);
		token.char.should.equal(6);

		token = tokens.next().value;
		token.type.should.equal('op');
		token.literal.should.equal('{');
		token.line.should.equal(1);
		token.char.should.equal(24);

		token = tokens.next().value;
		token.type.should.equal('eof');
	});

	it('returns correct tokens for (S => fields {)', function() {
		var tokens = lexer('fields {');

		var token = tokens.next().value;
		token.type.should.equal('kwd');
		token.literal.should.equal('fields');
		token.line.should.equal(1);
		token.char.should.equal(1);

		token = tokens.next().value;
		token.type.should.equal('op');
		token.literal.should.equal('{');
		token.line.should.equal(1);
		token.char.should.equal(8);

		token = tokens.next().value;
		token.type.should.equal('eof');
	});

	it('returns correct tokens for (S => each {)', function() {
		var tokens = lexer('each {');

		var token = tokens.next().value;
		token.type.should.equal('kwd');
		token.literal.should.equal('each');

		token = tokens.next().value;
		token.type.should.equal('op');
		token.literal.should.equal('{');

		token = tokens.next().value;
		token.type.should.equal('eof');
	});

	it('returns correct tokens for (S => })', function() {
		var tokens = lexer('}');

		var token = tokens.next().value;
		token.type.should.equal('cl');
		token.literal.should.equal('}');

		token = tokens.next().value;
		token.type.should.equal('eof');
	});

	it('returns correct tokens for (S => A should BCE)', function() {
		var tokens = lexer('count should equal 10');

		var token = tokens.next().value;
		token.type.should.equal('id');
		token.literal.should.equal('count');

		token = tokens.next().value;
		token.type.should.equal('kwd');
		token.literal.should.equal('should');

		token = tokens.next().value;
		token.type.should.equal('kwd');
		token.literal.should.equal('equal');

		token = tokens.next().value;
		token.type.should.equal('num');
		token.literal.should.equal(10);

		token = tokens.next().value;
		token.type.should.equal('eof');
	});

	it('returns correct tokens for (S => A should BCE) with null A', function() {
		var tokens = lexer('should be object');

		var token = tokens.next().value;
		token.type.should.equal('kwd');
		token.literal.should.equal('should');

		token = tokens.next().value;
		token.type.should.equal('kwd');
		token.literal.should.equal('be');

		token = tokens.next().value;
		token.type.should.equal('kwd');
		token.literal.should.equal('object');

		token = tokens.next().value;
		token.type.should.equal('eof');
	});

	it('returns token with negative number', function() {
		var tokens = lexer('-10');

		var token = tokens.next().value;
		token.type.should.equal('num');
		token.literal.should.equal(-10);

		token = tokens.next().value;
		token.type.should.equal('eof');
	});

	it('returns token with decimal number', function() {
		var tokens = lexer('99.9');

		var token = tokens.next().value;
		token.type.should.equal('num');
		token.literal.should.equal(99.9);

		token = tokens.next().value;
		token.type.should.equal('eof');
	});

	it('returns correct tokens for multiline block', function() {
		var tokens = lexer('test http://test.api {\n\n}');

		var token = tokens.next().value;
		token.type.should.equal('kwd');
		token.literal.should.equal('test');

		token = tokens.next().value;
		token.type.should.equal('id');
		token.literal.should.equal('http://test.api');

		token = tokens.next().value;
		token.type.should.equal('op');
		token.literal.should.equal('{');

		token = tokens.next().value;
		token.type.should.equal('cl');
		token.literal.should.equal('}');

		token = tokens.next().value;
		token.type.should.equal('eof');
	});

	it('throws unidentified character error line 3', function() {
		(function() {
			lexer('test {\n\n $');
		}).should.throw('Unidentified character "$" on line: 3, char: 2');
	});

	it('throws unidentified character error on first char', function() {
		(function() {
			lexer('$');
		}).should.throw('Unidentified character "$" on line: 1, char: 1');
	});

	it('throws unidentified character error on fifth char', function() {
		(function() {
			lexer('test $');
		}).should.throw('Unidentified character "$" on line: 1, char: 6');
	});

	it('throws unexpected character error on third char', function() {
		(function() {
			lexer('10.0.');
		}).should.throw('Unexpected character "." on line: 1, char: 5');
	});

});