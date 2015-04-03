//require what we need
var through = require('through2')
, gutil = require('gulp-util')
, fs = require('fs')
, cheerio = require('cheerio')
, SVGO = require('svgo')
, svgo = new SVGO();;



const PLUGIN_NAME = 'gulp-sassvg';

const DATA_PREFIX = "data:image/svg+xml;charset=US-ASCII,";




function fileNameFromPath(filePath){
    return filePath.split('\\').pop().split('/').pop().replace(/\.[^/.]+$/, "");
}

function folderNameFromPath(filePath){
    var firstSplit = filePath.split('\\');
    if(firstSplit.length > 1){
        return firstSplit[firstSplit.length - 2];
    }
    
    var secondSplit = filePath.split('/');
    if(secondSplit.length > 1){
        return secondSplit[secondSplit.length - 2];
    }
    return "";
}

function sassVarRegex(variableName){
    return new RegExp(encodeURIComponent("#{$") + variableName + encodeURIComponent("}"), "gm"); // #{$variableName}
}



function addVariables(fileContent){
        var $ = cheerio.load(fileContent, {
            normalizeWhitespace: true,
            xmlMode: true
        });
        $('[fill]').not('[fill=none]').attr('fill', '#{$fillcolor}');
		$('[style]').css("fill", "red");
        $('[stroke]').not('[stroke=none]').attr('stroke', '#{$strokecolor}');
        return $.html('svg'); //return only the svg    
}

function encodeSVG(dynamicContent){
    return encodeURIComponent(dynamicContent.replace(/[\t\n\r]/gmi, " ")) //replace tab, linefeed and carriage return
        .replace(/\(/g, "%28") // opening brackets
        .replace(/\)/g, "%29") // closing brackets
        .replace(/["']/g, "%22"); // double quotes 
  
}

function decodeVariables(encodedContent){
    return encodedContent.replace(sassVarRegex("fillcolor"), "#{$fillcolor}")
        .replace(sassVarRegex("strokecolor"), "#{$strokecolor}")
        .replace(sassVarRegex("extrastyles"), "#{$extrastyles}");
}

function assembleDataString(fileName, folderName, finalContent){
    return "\n\t'" + fileName + "': ( \n\t\t'folder': '" + folderName + "',\n\t\t'data': '" +  DATA_PREFIX + finalContent + "'\n\t),";
}

function optimizeSvg(writeStream, cb, filePath, svgString){
    svgo.optimize(svgString, function(result) {
		var optimizedSvg;
		if(result.error){
			throw new gutil.PluginError(PLUGIN_NAME, "SVG couldn't be optimized: '" + file.path +  "', will try to SASSVG it without optimizing.");
			optimizedSvg = String(file.contents);
		}else{
			optimizedSvg = result.data;	
		}
		sassvgIt(writeStream, cb, filePath, svgString);
    });
}

function sassvgIt(writeStream, cb, filePath, svgString){
	writeStream.write(
		assembleDataString(
			fileNameFromPath(filePath),
			folderNameFromPath(filePath),
			decodeVariables(
				encodeSVG(
					addVariables(
						svgString
					)
				)
			)
		)
	);
	cb();
}

var options                           
var gulpSassvg = function(optionsGiven){
    options = optionsGiven || {};
    options.tmpDir = optionsGiven.tmpDir || "./.tmp-sassvg/"; //TODO still necessary?
    options.outputFile = optionsGiven.outputFile || "./scss/_icons.scss"; //TODO add some options
	options.optimizeSvg = (optionsGiven.optimizeSvg !== undefined) ? optionsGiven.optimizeSvg : true; //true = 25% less filesize, but 3 times as long to create the sass file
	
    var template = fs.readFileSync(__dirname + "/mixin.template", "utf8").split("#####REPLACED#####");
    header = template[0];
    footer = template[1];
    
    var writeStream = fs.createWriteStream(options.outputFile);
    writeStream.write(header);
    
    function listStream(file, enc, cb){
		
		if(options.optimizeSvg){
			optimizeSvg(writeStream, cb, file.path, String(file.contents))
		}else{
			sassvgIt(writeStream, cb, file.path, String(file.contents));
		}

    }
    
    function endStream(cb){
        writeStream.write(footer);
        writeStream.end();
        cb();
    }
    return through.obj(listStream, endStream);
}
module.exports = gulpSassvg;



