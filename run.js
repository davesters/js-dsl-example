"use strict";

let fs = require('fs');
let parser = require('./parser');

let sample = fs.readFileSync(__dirname + '/sample.txt', {
	encoding: 'utf8',
});

let tokens = parser(sample);
// console.log(JSON.stringify(tokens, null, 2));