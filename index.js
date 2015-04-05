//require what we need
var through = require('through2')
, gutil = require('gulp-util')
, fs = require('fs')
, cheerio = require('cheerio')
, SVGO = require('svgo')
, svgo = new SVGO();;


// TODO rework with js classes/prototypes and promises, much less functions
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

function sassVarRegex(variableName, optionalSuffix){
	var suffix = (optionalSuffix !== undefined) ? encodeURIComponent(optionalSuffix) : "";
    return new RegExp(encodeURIComponent("#{$") + variableName + encodeURIComponent("}") + suffix, "gm"); // #{$variableName}
}



function addVariables(filePath, fileContent){
        var $ = cheerio.load(fileContent, {
            normalizeWhitespace: true,
            xmlMode: true
        });
		if($('svg').length !== 1){
			throw new gutil.PluginError(PLUGIN_NAME, "Wrong SVG-File at '" + filePath +  "'.");
		}
        $('[fill]').not('[fill=none]').attr('fill', '#{$fillcolor}');
		$('[style]').each(function(){
			var fillValue = $(this).css("fill");
			if(fillValue !== undefined && fillValue !== 'none'){
				$(this).css("fill", "#{$fillcolor}");	
			}
			var strokeValue = $(this).css("stroke");
			if(strokeValue !== undefined && strokeValue !== 'none'){
				$(this).css("stroke", "#{$strokecolor}");	
			}
		});
		$('svg').each(function(){
			var styles = $(this).attr("style");
			$(this).css("empty", "empty;#{$extrastyles}"); //not the very best solution, but makes it valid and works everytime - empty props will be regexed out again
		});
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
        .replace(sassVarRegex("extrastyles", ";"), "#{$extrastyles}")
		.replace(/empty%3A%20empty%3B/gm, "");//correct the empty styles props
}

function assembleDataString(fileName, finalContent){
    return "\n\t'" + fileName + "': '" +  DATA_PREFIX + finalContent + "',";
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
			decodeVariables(
				encodeSVG(
					addVariables(
						filePath,
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
    var sassvgMap = "\n\n$sassvg: (";
	
    function listStream(file, enc, cb){
		var folderName = folderNameFromPath(file.path);
		var fileName = fileNameFromPath(file.path);
		sassvgMap += "'" + fileName + "': ('name': '" + fileName + "', 'folder': '" + folderName + "'),";
		if(options.optimizeSvg){
			optimizeSvg(writeStream, cb, file.path, String(file.contents))
		}else{
			sassvgIt(writeStream, cb, file.path, String(file.contents));
		}

    }
    
    function endStream(cb){
        writeStream.write(footer);
		sassvgMap += ");";
		writeStream.write(sassvgMap);
        writeStream.end();
        cb();
    }
    return through.obj(listStream, endStream);
}
module.exports = gulpSassvg;



