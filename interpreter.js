"use strict";

let got = require('got');
let sprintf = require('util').format;
let parser = require('./parser');
let colors = require('colors');

// Keep track of errors so they can be printed at the end
let errors = [];

// Keep track of number of tests to print at the end
let testCount = 0;

// Keep track of how many spaces to indent when printing assertions
let indent = 2;

function addException(message, line) {
	errors.push({
		msg: message,
		line: line,
	});
}

function printAssert(msg, not, failed) {
	let test = sprintf(msg.replace(/%%/g, '%'), (not) ? 'not ' : '');

	if (!failed) {
		testCount++;
		console.log(' '.repeat(indent) + colors.green.bold('  ✔'), colors.white(test));
	} else {
		console.log(' '.repeat(indent) + colors.red.bold('  x', test));
	}
}

module.exports = (input) => {
	// Pass the input to the parser to get the parse tree.
	let tree = parser(input);
	
	// Lets iterate over each test block
	runTests(0, tree.children);

	return tree;
};

function runTests(index, tests) {
	// If there are no more test blocks, then print final messages and exit.
	if (index > tests.length - 1) {
		printSummary();
		process.exit(errors.length > 0 ? 1: 0);
	}

	let url = tests[index].left.literal;
	
	// Make the request to the test URL
	console.log('\n' + colors.cyan.bold(url));
	got(url, { json: true, timeout: 5000 })
		.then(response => {
			handleBlock(tests[index].right, response.body);
			runTests(index + 1, tests);
		})
		.catch(error => {
			console.log(error);
		});
}

// Generic handler for a block of statements
function handleBlock(block, data) {
	block.children.forEach(el => {
		handleBlockChild(el, data);
	});

	return true;
}

function handleBlockChild(child, data) {
	switch (child.type) {
		case 'shouldStmt':
			handleShould(child, data);
			break;
		case 'fieldsStmt':
			indent += 2;
			if (child.left === null) {
				console.log(colors.cyan(' '.repeat(indent) + 'fields'));
				handleBlock(child.right, data);
			} else {
				console.log(colors.cyan(' '.repeat(indent) + 'fields - ' + child.left.literal));
				handleBlock(child.right, data[child.left.literal]);
			}
			indent -= 2;
			break;
		case 'eachStmt':
			let childData = data;
			if (child.left !== null) {
				console.log(colors.cyan(' '.repeat(indent) + 'each - ' + child.left.literal));
				childData = data[child.left.literal];
			} else {
				console.log(colors.cyan(' '.repeat(indent) + 'each'));
			}

			indent += 2;
			// Iterate over each child in the array and run the statements for each
			childData.forEach((c, index) => {
				console.log(colors.cyan(' '.repeat(indent) + 'child ' + (index + 1)));
				indent += 2;
				handleBlock(child.right, c);
				indent -= 2;
			});
			indent -= 2;
			break;
	}
}

function handleShould(should, data) {
	let childNum = 0;
	let el = should.right.children[childNum];
	let not = el.literal === 'not';
	let actual = data;

	if (not) {
		childNum++;
		el = should.right.children[childNum];
	}

	if (should.left !== null) {
		actual = data[should.left.literal];
	}

	if (el.literal === 'be') {
		handleShouldBe(should.right.children[childNum + 1].literal, actual, not, should.line);
	} else if (el.literal === 'equal') {
		handleShouldEqual(should.right.children[childNum + 1].literal, should.left.literal, data, not, should.line);
	}
}

function handleShouldBe(expected, actual, not, line) {
	let failed = false;

	switch (expected) {
		case 'object':
			if (not && actual instanceof Object) {
				addException('Expected not to find Object', line);
				failed = true;
			}
			if (!not && !(actual instanceof Object)) {
				addException('Expected to find Object', line);
				failed = true;
			}
			break;
		case 'array':
			if (not && actual instanceof Array) {
				addException('Expected not to find Array', line);
				failed = true;
			}
			if (!not && !(actual instanceof Array)) {
				addException('Expected to find Array', line);
				failed = true;
			}
			break;
		default:
			if (not && typeof actual === expected) {
				addException('Expected not to find ' + expected, line);
				failed = true;
			}
			if (!not && typeof actual !== expected) {
				addException('Expected to find ' + expected, line);
				failed = true;
			}
			break;
	}

	printAssert(sprintf('%s should %%sbe %s', Object.prototype.toString.call(actual), expected), not, failed);
}

function handleShouldEqual(expected, property, data, not, line) {
	let failed = false;
	let test = '';

	if (property === 'size') {
		var len = Object.keys(data).length;

		if (not && len === expected) {
			addException(sprintf('Expected size not to be %d', expected), line);
			failed = true;
		}
		if (!not && len !== expected) {
			addException(sprintf('Expected size to be %d, but found %d', expected, len), line);
			failed = true;
		}

		test = sprintf('size should %%sbe %s', expected); 
	} else {
		let actualProperty = data[property];
		if (typeof data[property] === 'boolean') {
			actualProperty = data[property].toString();
		}

		if (not && actualProperty === expected) {
			addException(sprintf('Expected %s not to equal %s', property, expected), line);
			failed = true;
		}
		if (!not && actualProperty !== expected) {
			addException(sprintf('Expected %s to equal %s', property, expected), line);
			failed = true;
		}

		test = sprintf('%s should %%sequal %s', property, expected); 
	}

	printAssert(test, not, failed);
}

function printSummary() {
	if (errors.length > 0) {
		printErrors();
	}

	console.log(colors.yellow.bold(sprintf('\n%d of %d Test(s) passed with %d error(s)', testCount, testCount + errors.length, errors.length)));
}

function printErrors() {
	console.log('\n' + colors.red.bold(errors.length, 'error(s)'));
	errors.forEach((err, index) => {
		console.log('   ', colors.white.bold(index + 1) + '.', '\t', colors.red.bold(sprintf('%s (line %d)', err.msg, err.line)))
	});
}
