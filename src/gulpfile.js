var path = require('path');
var gulp = require('gulp');
var start = require('gulp-start-process');
var browserSync = require('browser-sync');
var watch = require('gulp-watch');
//broken?
var shell = require('gulp-shell');

var EP_ROOT = path.normalize(__dirname + '/..');
console.log(EP_ROOT);
//
////process.exit(0);
//
//gulp.task('browser-sync', function () {
//    browserSync({
//        proxy: '127.0.0.1:9999'
////        server: {
////            baseDir: "./"
////        }
//    });
//});
//
//gulp.task('bs-reload', function () {
//    browserSync.reload();
//});
//
//
//gulp.task('epad', function (cb) {
//    shell.task([
//           "pkill -f --signal SIGINT 'etherpad-lite/bin/run.sh'",
//    "pkill -f --signal SIGINT 'etherpad-lite/node/server.js'",
////    "clear",
//    "sleep 1",
////    '././teambutler/etherpad/etherpad-lite/bin/safeRun.sh /tmp/etherpad.log',
//    'cd ' + EP_ROOT + '; node ./node_modules/ep_etherpad-lite/node/server.js',
//    ])
//})
//
//gulp.task('default', ['epad']);

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

function startEpad() {
    ep = start(EP_ROOT + '/bin/run.sh', {
        cwd: EP_ROOT + '/bin'
    }, function() {
        console.log('EPAD started');
    });
}

function restartEpad() {

    if(ep.pid){
        killTree(ep.pid,'SIGTERM', startEpad);
    }

    //start("pkill -f --signal SIGTERM 'etherpad-lite/bin/run.sh'", startEpad);
}

gulp.task('default', function() {
    watch(EP_ROOT + '/node_modules/**/*.{js,css,json,html}', function() {
        //        console.log(arguments);
        console.log(ep);
        restartEpad();

    });
    startEpad();
});
