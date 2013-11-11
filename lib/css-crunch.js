/*
 * css-crunch
 * https://github.com/dragonworx/css-crunch
 *
 * Copyright (c) 2013 Ali Chamas
 * Licensed under the MIT license.
 */

'use strict';

var fs = require("fs"),
    path = require("path"),
    depth = -1,
    excludes = [],
    cssFiles = [],
    logMessages = [];

var LOG = {
    INFO: "log",
    ERROR: "error",
    WARN: "warn",
    STEP: "step",
    COMPLETE: "complete"
};

function log(type, message, depth) {
    logMessages.push({
        type: type,
        message: message,
        depth: depth || 0
    });
}

function walk(dirPath, callback) {
    depth++;
    var files = fs.readdirSync(dirPath);
    files.forEach(function(file) {
        var subPath = path.join(dirPath, file);
        var stat = fs.lstatSync(subPath);
        if (stat.isFile()) {
            if (path.extname(subPath) === ".css") {
                if (shouldInclude(file)) {
                    callback({
                        dir: dirPath,
                        file: file,
                        path: subPath,
                        depth: depth
                    });
                } else {
                    log(LOG.WARN, "excluded-file: " + file, 0);
                }
            }
        } else if (stat.isDirectory() && shouldInclude(path.basename(subPath))) {
            walk(subPath, callback);
        } else {
            log(LOG.WARN, "excluded-dir: " + file, 0);
        }
    });
    depth--;
}

function indexFiles(opts) {
    opts.files.forEach(function(file) {
        indexFile({
            dir: path.dirname(path.resolve(opts.src, file)),
            file: path.basename(file),
            path: path.resolve(opts.src, file),
            depth: 0
        });
    });
}

function getContent(filePath) {
    try {
		return fs.readFileSync(filePath).toString();
	} catch (e) {
		return {error:e};
	}
}

function getInfo(opts) {
    log(LOG.STEP, "Indexing...");
    loadExcludes(opts.exclude);
    cssFiles = [];
    logMessages = [];
    depth = -1;
    walk(opts.src, function(stat) {
        indexFile(stat);
    });
    log(LOG.COMPLETE, cssFiles.length + " css files indexed");
    return cssFiles;
}

function indexFile(stat) {
    var content = getContent(stat.path),
        urls = getUrls(content);
    cssFiles.push({
        stat: stat,
        importUrls: getImportUrls(urls),
        nonImportUrls: getNonImportUrls(urls)
    });
}

function getUrls(content) {
    var urls = content.match(/(?:@import\s+)?url\([^)]+\);?/gi);
    return urls ? urls : [];
}

function getUrl(url) {
    url = url
        .replace(/@import\s+/, '')
        .replace(/url\(['"]?/, '')
        .replace(/['"]?\)/, '')
        .replace(/;/, '')
        .replace(/\//g, '\\');
    url = url.split('#')[0];
    url = url.split('?')[0];
    return url;
}

function getImportUrls(urls) {
    var array = [];
    urls.forEach(function(url) {
        if (url.match(/\.css/i)) {
            array.push(url);
        }
    });
    return array;
}

function getNonImportUrls(urls) {
    var array = [];
    urls.forEach(function(url) {
        if (!url.match(/\.css/i)) {
            array.push(url);
        }
    });
    return array;
}

function assertDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
}

function clean(dirPath) {
    log(LOG.STEP, "Cleaning: " + dirPath);
    var files = fs.readdirSync(dirPath), c = 0;
    files.forEach(function(file) {
        var subPath = path.join(dirPath, file);
        var stat = fs.lstatSync(subPath);
        if (stat.isFile()) {
            fs.unlinkSync(subPath);
            c++;
        }
    });
    log(LOG.COMPLETE, c + " file(s) cleaned");
}

function loadExcludes(array) {
    excludes = [];
    array.forEach(function(exclude) {
        exclude = "^" + exclude.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$";
        excludes.push(new RegExp(exclude));
    });
}

function shouldInclude(path) {
    var excluded = false;
    excludes.forEach(function(exclude) {
        if (path.match(exclude)) {
            excluded = true;
        }
    });
    return !excluded;
}

function cleanString(input) {
    // best way to strip unwanted utf8, just hand pick every char within the 127 ascii range
    var output = "";
    for (var i=0; i<input.length; i++) {
        if (input.charCodeAt(i) <= 127) {
            output += input.charAt(i);
        }
    }
    return output;
}

function copyFile(srcFile, destFile) {
    try {
        var BUF_LENGTH, buff, bytesRead, fdr, fdw, pos;
        BUF_LENGTH = 64 * 1024;
        buff = new Buffer(BUF_LENGTH);
        fdr = fs.openSync(srcFile, "r");
        fdw = fs.openSync(destFile, "w");
        bytesRead = 1;
        pos = 0;
        while (bytesRead > 0) {
            bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
            fs.writeSync(fdw, buff, 0, bytesRead);
            pos += bytesRead;
        }
        fs.closeSync(fdr);
        fs.closeSync(fdw);
        return fs.lstatSync(destFile).size;
    } catch (e) {
        return e;
    }
}

function defaults(opts) {
    if (typeof opts["exclude"] === "undefined") {opts["exclude"] = [];}
    if (typeof opts["copy"] === "undefined") {opts["copy"] = true;}
    if (typeof opts["sanitise"] === "undefined") {opts["sanitise"] = true;}
    if (typeof opts["minify"] === "undefined") {opts["minify"] = true;}
    if (typeof opts["optimize"] === "undefined") {opts["optimize"] = false;}
    if (typeof opts["reporter"] === "undefined") {opts["reporter"] = null;}
    if (typeof opts["files"] === "undefined") {opts["files"] = null;}
}

var reporters = {
	"console": function () {
        var terminal = require("color-terminal");
        terminal.colorize('\n');
        logMessages.forEach(function(log) {
            var pad = "", msg;
            for (var i=0; i<log.depth * 3; i++) {pad = " " + pad;}
                msg = pad + log.message + "\n";
            switch (log.type) {
                case LOG.ERROR:
                    terminal.colorize('%N%r' + msg);
                    break;
                case LOG.WARN:
                    terminal.colorize('%N%y' + msg);
                    break;
                case LOG.STEP:
                    terminal.colorize('%N%c' + msg);
                    break;
                case LOG.COMPLETE:
                    terminal.colorize('%N%g' + msg);
                    break;
                default:
                    terminal.colorize('%N%w' + msg);
                    break;
            }
        });
	},
	"html": function (opts) {
		var html = getContent("html-reporter.html"), table = [];
		logMessages.forEach(function(log) {
			table.push("<tr><td class='" + log.type + "'><span style='width:" + (log.depth * 50) + "px'></span>" + log.message + "</td></tr>");
		});
		html = html.replace("$OPTIONS", JSON.stringify(opts, null, 4).replace(/\\\\/g, '\\'));
		html = html.replace("$BODY", table.join("\n"));
		html = html.replace("$TITLE", opts.src);
        var htmlPath = path.join(path.dirname(opts.dest), "report.html");
        try {
            fs.writeFileSync(htmlPath, html);
        } catch (e) {
            console.error("Cannot generate html reporter: " + htmlPath);
        }
	}
};

module.exports = {
	reporters: reporters,
	cssFiles: cssFiles,
	logMessages: logMessages,
    build: function(opts) {
        var buildCss = "",
            imported = {},
            destDir,
            copiedFiles = [];

        defaults(opts);
        destDir = path.dirname(opts.dest);

        if (opts.files instanceof Array) {
            log(LOG.STEP, "Indexing...");
            indexFiles(opts);
        } else {
            getInfo(opts);
        }
        assertDir(destDir);
        if (!!opts.copy) {
            assertDir(path.join(destDir, "assets"));
        }

        // clean previous build files
        clean(destDir);
        clean(path.join(destDir, "assets"));

        // for each css file...
        log(LOG.STEP, "Compiling...");
        cssFiles.forEach(function(cssFile) {
            // process css file
            log(LOG.INFO, "Inline: %_" + cssFile.stat.path, cssFile.stat.depth);
            var content = getContent(cssFile.stat.path);
			if (typeof content === "object") {
				log(LOG.ERROR, "Error reading file content: " + cssFile.stat.path + " - " + content.error, cssFile.stat.depth);
				return;
			} else {
				buildCss += "/* @src " + cssFile.stat.path + " */\n";
			}

            if (opts.sanitise === true) {
                content = cleanString(content);
            }

            // process imports
            cssFile.importUrls.forEach(function(url) {
                var relUrl = getUrl(url);
                if (!imported[relUrl]) {
                    var absImportUrl = path.resolve(cssFile.stat.dir, relUrl);
                    var importContent = getContent(absImportUrl);
					if (typeof importContent === "object") {
						log(LOG.ERROR, "Error @import: " + absImportUrl + " - " + importContent.error, cssFile.stat.depth);
					} else {
						content = content.replace(url, "/* @import " + absImportUrl + " */\n" + importContent);
						imported[relUrl] = true;
						log(LOG.INFO, "Inline @import: %_" + absImportUrl, cssFile.stat.depth);
					}
                }
            });

            // process assets
            cssFile.nonImportUrls.forEach(function(url) {
                var relUrl = getUrl(url);
                if (!imported[relUrl]) {
                    var srcPath = path.resolve(cssFile.stat.dir, relUrl);
                    var destRelPath = "assets/" + path.basename(srcPath);
                    var destAbsPath = path.resolve(destDir, destRelPath);
                    var urlInfo = url + " = " + srcPath + " >> " + destRelPath + " = " + destAbsPath;
                    content = content.replace(url, "url(" + destRelPath + ")" + (url.indexOf(";") > -1 ? ";" : ""));
                    if (opts.copy === true) {

                        if (fs.existsSync(srcPath)) {
							var fileSize = copyFile(srcPath, destAbsPath);
							if (typeof fileSize === "number" && fileSize > 0) {
								copiedFiles.push(destAbsPath);
								log(LOG.INFO, "Copy asset: " + urlInfo + " size: " + fileSize + "b", cssFile.stat.depth + 1);
							} else {
								log(LOG.ERROR, "Copy failed: %_" + urlInfo + " - " + fileSize, cssFile.stat.depth + 1);
							}
                        } else {
                            log(LOG.ERROR, "!Invalid asset: " + urlInfo, cssFile.stat.depth + 1);
                        }
                    } else {
                        if (fs.existsSync(srcPath)) {
                            log(LOG.INFO, "Asset: " + urlInfo, cssFile.stat.depth + 1);
                        } else {
                            log(LOG.WARN, "!Invalid asset: " + urlInfo, cssFile.stat.depth + 1);
                        }
                    }
                }
            });
            buildCss += content + "\r\n";
        });

        // minify
        if (opts.minify === true) {
			try {
				var CleanCSS = require("clean-css");
				var minified = new CleanCSS({keepSpecialComments:0,noAdvanced:true}).minify(buildCss);
				log(LOG.STEP, "Minify (" + ((1.0 - (minified.length / buildCss.length)) * 100).toFixed(1) + "% reduction)");
				buildCss = minified;
			} catch (e) {
				log(LOG.ERROR, "Minify Error (" + e.message + ")");
			}
        }
		
		// optimize
		if (opts.optimize === true) {
			try {
				var csso = require('csso');
				var optimized = csso.justDoIt(buildCss);
				log(LOG.STEP, "Optimize (" + ((1.0 - (optimized.length / buildCss.length)) * 100).toFixed(1) + "% reduction)");
			} catch (e) {
				log(LOG.ERROR, "Optimize Error (" + e.message + ")");
			}
		}

        // final css output
        log(LOG.STEP, "File(s) copied: " + copiedFiles.length + (!!opts.copy ? " to: " + path.join(destDir, "assets") : ""));
		try {
			fs.writeFileSync(opts.dest, buildCss + "\r\n");
			log(LOG.STEP, "Save output: " + opts.dest);
		} catch (e) {
			log(LOG.ERROR, "Save output Error: " + opts.dest + " - " + e.message);
		}

        // call reporters
		if (opts.reporter !== null) {
			var reports = opts.reporter.split('|'), reporter;
			reports.forEach(function(name) {
				reporter = reporters[name];
				if (reporter) {
				} else {
					throw new Error("Reporter not defined: " + name);
				}
				reporter(opts);
			});
		}

        //var src = "C:\\Users\\Ali\\Dev\\css-crunch\\test\\example-site\\css\\subdir\\images\\image.png";
        //var dest = "C:\\Users\\Ali\\Dev\\css-crunch\\test\\example-site\\css-min\\assets\\image.png";
    }
};