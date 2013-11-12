# css-crunch

Crunches, optimizes and resolves/copies assets of css files

## Getting Started
Install the module with: `npm install css-crunch`

You can specify a folder to walk and collect all css files using the `src` option.

```javascript
var css_crunch = require('css-crunch');
css_crunch.build({...})
```

## Options
Use the following options to control the processing and output of your css.

At minimum you should pass either `src` or `files, plus `dest`. Other options will revert to defaults.

* `src` {String} Top level css folder to walk and collect css files (not excluded with `exclude`). Files are processed as they are sorted in the file system.
* `files` {Array} Order specific list of files to process for explicit compilation order (no need to use `exclude`)
* `dest` {String} Full path and file name of the build output file.css (the concatinated/inlined/minified/optimised single file). Assets folder is created local to this file.
* `exclude` {Array=[]} List of file patterns to exclude from the `src` css file traversal. Place an asterix at the begining or end of each pattern to wildcard.
* `copy` {Boolean=true} Whether or not to copy resolved assets (images/fonts, any url defined in any of the stylesheets)
* `minify` {Boolean=true} Whether or not to minify the combined/inlined output file (uses css-min)
* `optimize` {Boolean=false} Whether or not to optimize the combined/inlined output file (uses csso)
* `sanitize` {Boolean=true} Whether or not to clean the files of unwanted UTF-8 characters
* `reporter` {String='console'} Pipe `|` delimited list of reporters. Default available are `console`, `html`.

You should use `src` or `files` exclusively, one or the other. If you are happy with just pointing css-crunch to a top level folder and having it find any css file within, use `src. If you would prefer to specify the exact set of files and therefore their processing order, use `files`.

## Custom Reporter
You can add your own reporting function before calling `build(...)` by accessing the `reporters` object. Your function will be passed the options, and an array of log messages.

```javascript
var css_crunch = require('css-crunch');
css_crunch.reporters['my_reporter'] = function(options, logMessages) {
	logMessages.forEach(function(logMsg) {
		// logMsg = {type:'log|error|warn|step|complete', message:<string>, depth:<number>}
	});
};
css_crunch.build({
	src: '...',
	dest: '...'
})
```

## Release History
12/11/2013 0.1.1 - fixed html reporter file path bug
11/11/2013 0.1.0 - initial release

## License
Copyright (c) 2013 Ali Chamas  
Licensed under the MIT license.
=======
css-crunch
==========

Crunches, optimizes and resolves/copies assets of css files
