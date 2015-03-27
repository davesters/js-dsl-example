var lexer = require('./../lexer')();
var should = require('should');

describe('Lexer', function() {

  it('returns correct tokens for (Z => test t {)', function() {
    var tokens = lexer('test http://test.api {', 1);

    tokens[0].type.should.equal('kwd');
    tokens[0].literal.should.equal('test');

    tokens[1].type.should.equal('id');
    tokens[1].literal.should.equal('http://test.api');

    tokens[2].type.should.equal('op');
    tokens[2].literal.should.equal('{');
  });

  it('returns correct tokens for (S => fields {)', function() {
    var tokens = lexer('fields {', 1);

    tokens[0].type.should.equal('kwd');
    tokens[0].literal.should.equal('fields');

    tokens[1].type.should.equal('op');
    tokens[1].literal.should.equal('{');
  });

  it('returns correct tokens for (S => each {)', function() {
    var tokens = lexer('each {', 1);

    tokens[0].type.should.equal('kwd');
    tokens[0].literal.should.equal('each');

    tokens[1].type.should.equal('op');
    tokens[1].literal.should.equal('{');
  });

  it('returns correct tokens for (S => })', function() {
    var tokens = lexer('}', 1);

    tokens[0].type.should.equal('cl');
    tokens[0].literal.should.equal('}');
  });

  it('returns correct tokens for (S => A should BCE)', function() {
    var tokens = lexer('count should equal 10', 1);

    tokens[0].type.should.equal('id');
    tokens[0].literal.should.equal('count');

    tokens[1].type.should.equal('kwd');
    tokens[1].literal.should.equal('should');

    tokens[2].type.should.equal('kwd');
    tokens[2].literal.should.equal('equal');

    tokens[3].type.should.equal('num');
    tokens[3].literal.should.equal(10);
  });

  it('returns correct tokens for (S => A should BCE) with null A', function() {
    var tokens = lexer('should be object', 1);

    tokens[0].type.should.equal('kwd');
    tokens[0].literal.should.equal('should');

    tokens[1].type.should.equal('kwd');
    tokens[1].literal.should.equal('be');

    tokens[2].type.should.equal('kwd');
    tokens[2].literal.should.equal('object');
  });

  it('returns token with negative number', function() {
    var tokens = lexer('-10', 1);

    tokens[0].type.should.equal('num');
    tokens[0].literal.should.equal(-10);
  });

  it('returns token with decimal number', function() {
    var tokens = lexer('99.9', 1);

    tokens[0].type.should.equal('num');
    tokens[0].literal.should.equal(99.9);
  });

  it('returns empty array on empty input', function() {
    var tokens = lexer('', 1);

    tokens.length.should.equal(0);
  });

  it('throws unidentified character error on first char', function() {
    (function() {
      lexer('$', 1);
    }).should.throw('Unidentified character "$" on line: 1, char: 1');
  });

  it('throws unidentified character error on fifth char', function() {
    (function() {
      lexer('test $', 1);
    }).should.throw('Unidentified character "$" on line: 1, char: 6');
  });

  it('throws unexpected character error on third char', function() {
    (function() {
      lexer('10.0.', 1);
    }).should.throw('Unexpected character "." on line: 1, char: 5');
  });

});