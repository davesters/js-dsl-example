"use strict";

let fs = require('fs');
let interpreter = require('./interpreter');

let sample = fs.readFileSync(__dirname + '/sample.txt', {
	encoding: 'utf8',
});

interpreter(sample);