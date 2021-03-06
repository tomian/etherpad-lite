'use strict';
var _ = require('underscore');
var fs = require('fs');
var path = require('path');

var pluginUtils = require('ep_etherpad-lite/static/js/pluginfw/shared');

var PACKAGE_ROOT = path.dirname(require.resolve('ep_etherpad-lite/ep.json'));
var SRC_ROOT = path.normalize(PACKAGE_ROOT + '/static');
console.log('SRC_ROOT', SRC_ROOT);
console.log('PACKAGE_ROOT', PACKAGE_ROOT);

// var TMP_ROOT = SRC_ROOT+'/build';


/******* plugin definitions   ************/
var _s = JSON.stringify;
function writePluginsFile(plugins) {

    var filePaths = [];

    var clientParts = _(plugins.parts)
        .filter(function (part) {
            return _(part).has('client_hooks')
        });

    var clientPlugins = {};

    _(clientParts).chain()
        .map(function (part) {
            return part.plugin
        })
        .uniq()
        .each(function (name) {
            clientPlugins[name] = _(plugins.plugins[name]).clone();
            delete clientPlugins[name]['package'];
        });

    _.each(clientPlugins, function (conf, name) {
        console.log('*** MINIFIER-NG: Exposing ' + name);

        _.each(conf.parts, function (part) {
            if (part.client_hooks) {
                _.each(part.client_hooks, function (fnPath, evName) {
                    var pathAndFn = fnPath.split(':');
                    var includePath = pathAndFn[0];
                    var absPath = PACKAGE_ROOT + '/../node_modules/' + includePath;
                    var relPath = path.relative(SRC_ROOT + '/js', absPath);

                    if (filePaths.indexOf(includePath) !== -1) {
                        // debugger;
                        return;
                    }
                    filePaths.push(includePath);
                    // require();

                    var fnName = pathAndFn.length == 2 ? pathAndFn[1] : evName;
//                    console.log('hook: ' + evName, relPath, '@fn: ' + fnName);
                });
            }

        });

    });

    var buf = '/*** AUTO GENERATED CLIENT SIDE INCLUDES ***/\n\n';
    var buf = 'var entries = []; \n\n';
    var lines = _.map(filePaths, function (p) {
        return "require('" + p + "'); entries.push('" + p + "');";
    });
    buf += lines.join('\n') + '\n';
//    buf += 'exports.entries = entries; \n\n';

//    console.log(buf);

    var bootSrc = SRC_ROOT + '/js/boot.js';
    var bootDest = SRC_ROOT + '/js/__boot.js';

    var boot = fs.readFileSync(bootSrc, {
        encoding: 'utf8'
    });

    var replacedBoot = boot.replace('//%%PLUGINS', buf);

    fs.writeFileSync(bootDest, replacedBoot, {
        encoding: 'utf8'
    });
    console.log('wrote ' + bootDest);
    return;


// var definitions = JSON.stringify({
//   "plugins": clientPlugins,
//   "parts": clientParts
// }, 2, 2);
// console.log(definitions);
}

function run() {



    var pluginDefsPath = path.normalize(PACKAGE_ROOT + '/../var/plugin-definitions.json');
    var pluginsDefs = fs.readFileSync(pluginDefsPath, {
        encoding: 'utf8'
    });

    pluginsDefs = JSON.parse(pluginsDefs);
    writePluginsFile(pluginsDefs);




    /*** mangle ace to include CSS and JS ***/

//get abs path by module resolver
    var aceSrc = require.resolve('ep_etherpad-lite/static/js/ace');

// replacement for Minify.js
    var data = fs.readFileSync(aceSrc, {
        encoding: 'utf8'
    });

// Find all includes in ace.js and embed them
    var founds = data.match(/\$\$INCLUDE_[a-zA-Z_]+\("[^"]*"\)/gi);

    data += '\n\n\n\n';
    data += '/*----------- AUTO_GENERATED CODE BELOW -----------*/;\n';
    data += '\n\n\n\n';
    data += 'Ace2Editor.EMBEDED = Ace2Editor.EMBEDED || {};\n';
    data += '\n\n\n\n';

// Always include the require kernel.
// founds.push('$$INCLUDE_JS("../static/js/require-kernel.js")');
    var RequireKernel = require('etherpad-require-kernel');

// data += 'Ace2Editor.EMBEDED[' + JSON.stringify('../static/js/require-kernel.js') + '] = '
//   + JSON.stringify(RequireKernel.kernelSource) + ';\n';
    data += 'Ace2Editor.EMBEDED[' + JSON.stringify('../static/js/require-kernel.js') + '] = '
        + JSON.stringify(' ') + ';\n';


// Request the contents of the included file on the server-side and write
// them into the file.
    _.each(founds, function (item) {
        var filename = item.match(/"([^"]*)"/)[1];
        var filePath = path.normalize(SRC_ROOT + '/' + filename);
        var contents = fs.readFileSync(filePath, {
            encoding: 'utf8'
        });
        // console.log(filePath, contents);

        data += 'Ace2Editor.EMBEDED[' + JSON.stringify(filename) + '] = '
            + JSON.stringify(contents) + ';\n';
    });

//console.log(data);
    var destPath = SRC_ROOT + '/js/__ace_build.js';
    fs.writeFileSync(destPath, data, {
        encoding: 'utf8'
    });
    console.log(aceSrc + ' transformed to ' + destPath);

}

module.exports = run;

//if directly called
if (require.main === module) {
    run();
} 