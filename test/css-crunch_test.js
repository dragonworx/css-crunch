'use strict';

var css_crunch = require('../lib/css-crunch.js');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['css-crunch'] = {
  setUp: function(done) {
	css_crunch.build({
		src: "./test/example-site",
		dest: "./test/example-site/css-min/style.min.css",
		exclude: ["*min.css"],
		reporter: 'html|console',
		minify: true,
		optimize: true,
    copy: true
	});
    done();
  },
  'is object': function(test) {
    test.expect(1);
    // tests here
    test.equal(typeof css_crunch, 'object', 'should be an object.');
    test.done();
  },
};



/*crunch.build({
    src: "./mocksite",
    dest: "D:\\helix.theme.netbank\\build\\build.min.css",
    reporter: 'html|console',
    minify: true
});*/