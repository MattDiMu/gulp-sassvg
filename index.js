//require what we need
var through = require('through2')
, gutil = require('gulp-util')
, fs = require('fs');

const PLUGIN_NAME = 'gulp-sassvg:';

const DATA_PREFIX = "data:image/svg+xml;charset=US-ASCII,";

function encodeSvg(content){
    return DATA_PREFIX + encodeURIComponent( content.toString('utf-8')
                .replace(/[\t\n\r]/gmi, " ") //replace tab, linefeed and carrriage return
                .replace(/<\!\-\-(.*(?=\-\->))\-\->/gmi, "") //remove comments
            )
            .replace(/\(/g, "%28") // opening brackets
            .replace(/\)/g, "%29") // closing brackets
            .replace(/"/g, "%22"); // double quotes 
}

function cleanSvg(content){
    return content.toString().replace(/'/gm, "\"");   
}


function decodeSassVariables(content){
    return content.replace(/%24fillcolor/gm, "#{$fillcolor}")
            .replace(/%24strokecolor/gm, "#{$strokecolor}")
            .replace(/%24extrastyles/gm, "#{$extrastyles}   ");
}

function addSassVariables(content){
    content = content.replace(/(fill=")((?!none).*)(")/gmi, "$1$fillcolor$3") //add $fillcolor
        .replace(/(style *= *"[^"]*)(fill *: *)([^;"]*)/gmi, "$1$2$fillcolor") //add $fillcolor to styles
        .replace(/(stroke=")((?!none).*)(")/gmi, "$1$strokecolor$3") //add $strokecolor
        .replace(/(style *= *"[^"]*)(stroke *: *)([^;"]*)/gmi, "$1$2$strokecolor"); //add $strokecolor to styles
    if(content.match(/(<svg[^>]*style="[^>"]*)(")([^>]*>)/) != null){
        return content.replace(/(<svg[^>]*style=")([^>"]*")([^>]*>)/gmi, "$1$extrastyles$2$3");
    }else{
        return content.replace(/(<svg[^>]*)(>)/gmi, '$1 style="$extrastyles"$2');
    }
}
                           
var gulpSassvg = function(options){
    this.options = options || {};
    this.options.tmpDir = this.options.tmpDir || "./.tmp-sassvg/"; //TODO add some options
    this.options.outputFile = this.options.outputFile || "./scss/_icons.scss"; //TODO add some options
    
    var template = fs.readFileSync(__dirname + "/mixin.template", "utf8").split("#####REPLACED#####");
    this.header = template[0];
    this.footer = template[1];
    
    var writeStream = fs.createWriteStream(this.options.outputFile);
    writeStream.write(header);
    
    function listStream(file, enc, cb){
        var filePath = file.path;
        var fileName = filePath.split('\\').pop().split('/').pop().replace(/\.[^/.]+$/, ""); 
        writeStream.write("\n\t'" + fileName + "': '" + decodeSassVariables(encodeSvg(addSassVariables(cleanSvg(file.contents)))) + "',");
        cb();
    }
    
    function endStream(cb){
        writeStream.write(footer);
        writeStream.end();
        cb();
    }
    return through.obj(listStream, endStream);
}
module.exports = gulpSassvg;



