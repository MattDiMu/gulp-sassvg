//require what we need
var through = require('through2');
var gutil = require('gulp-util');

var DirectoryColorfy = require('directory-colorfy');
var DirectoryEncoder = require('directory-encoder');

const PLUGIN_NAME = 'gulp-prefixer';


var gulpSassvg = function(options){
    
    return through.obj(function(file, enc, cb){
        if(file.isNull){
            cb();
        }
        
            cb();
    
    
    
    });

module.exports = gulpSassvg;


// TODO
if (ERROR-TO-BE-DEFINED){
 throw new gutil.PluginError(PLUGIN_NAME, 'ERROR-MESSSAGE-TO-BE-DEFINED');   
}






// through2 is a thin wrapper around node transform streams
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

// Consts

function prefixStream(prefixText) {
  var stream = through();
  stream.write(prefixText);
  return stream;
}

// Plugin level function(dealing with files)
function gulpPrefixer(prefixText) {

  if (!prefixText) {
    throw new PluginError(PLUGIN_NAME, 'Missing prefix text!');
  }
  prefixText = new Buffer(prefixText); // allocate ahead of time

  // Creating a stream through which each file will pass
  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      // return empty file
      cb(null, file);
    }
    if (file.isBuffer()) {
      file.contents = Buffer.concat([prefixText, file.contents]);
    }
    if (file.isStream()) {
      file.contents = file.contents.pipe(prefixStream(prefixText));
    }

    cb(null, file);

  });

};

// Exporting the plugin main function
module.exports = gulpPrefixer;

