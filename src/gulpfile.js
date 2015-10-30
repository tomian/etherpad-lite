var spawn = require('child_process').spawn;
var path = require('path');
var gulp = require('gulp');
var browserSync = require('browser-sync');
var watch = require('gulp-watch');

var EP_ROOT = path.normalize(__dirname + '/..');
console.log(EP_ROOT);


var psTree = require('ps-tree');

var killTree = function(pid, signal, callback) {
    signal = signal || 'SIGKILL';
    callback = callback || function() {};
    var killTree = true;
    if (killTree) {
        psTree(pid, function(err, children) {
            [pid].concat(
                children.map(function(p) {
                    return p.PID;
                })
            ).forEach(function(tpid) {
                try {
                    process.kill(tpid, signal);
                } catch (ex) {}
            });
            callback();
        });
    } else {
        try {
            process.kill(pid, signal);
        } catch (ex) {}
        callback();
    }
};

var ep = {};
var startSignature = 'You can access your Etherpad instance';

function startEpad(opts) {
    // ep = start(EP_ROOT + '/bin/run.sh', {
    //     cwd: EP_ROOT + '/bin'
    // }, function() {
    //     console.log('EPAD FINISHED');
    // });

    ep = spawn('node', ['node_modules/ep_etherpad-lite/node/server.js'], {
        cwd: EP_ROOT
    }, function() {
        console.log('EPAD FINISHED');
    });

    ep.stdout.on('data', function(data) {
        var str = data.toString();
        console.log(str);
        if (str.indexOf(startSignature) > -1) {
            console.log('ETHERPAD READY');

            if (opts.cb) {
                opts.cb();
            }
            if (opts.reload) {
                setTimeout(function() {
                    browserSync.reload();
                }, 500);
            }
        }
    });

}

function restartEpad() {

    if (ep.pid) {
        killTree(ep.pid, 'SIGINT', function() {
            startEpad({
                reload: true
            });
        });
    }
}

function startBSync() {
    var contents = require("fs").
    readFileSync(__dirname + "/dev-utils/browser-sync-reloader.js", "utf-8");
    // console.log('inject', contents);
    browserSync.use({
        plugin: function() { /* noop */ },
        hooks: {
            'client:js': contents, // Link to your file
        }
    });

    browserSync({
        logLevel: "debug",
        ws: true,
        // open:false,
        startPath: '/p/test-00',
        injectChanges: false, //these are require() files, so no hot load
        proxy: '127.0.0.1:9999',
        snippetOptions: {

            // Ignore all HTML files within the templates folder
            //ignorePaths: "templates/*.html",

            // Provide a custom Regex for inserting the snippet.
            rule: {
                match: /<\/html>/i,
                fn: function(snippet, match) {
                    return snippet + match;
                }
            }
        }
        //        server: {
        //            baseDir: "./"
        //        }
    });
}
//http://www.browsersync.io/docs/options/
gulp.task('browser-sync', startBSync);

gulp.task('default', function() {
    watch(EP_ROOT + '/node_modules/**/*.{js,css,json,html}', function() {
        //        console.log(arguments);
        // console.log(ep);
        restartEpad();

    });
    startEpad({
        reload: true,
        cb: startBSync
    });
});
