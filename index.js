//require what we need
var through = require('through2')
, gutil = require('gulp-util')
, fs = require('fs')
, cheerio = require('cheerio')
, SVGO = require('svgo')
, svgo = new SVGO();


// TODO rework with js classes/prototypes and promises, much less functions
const PLUGIN_NAME = 'gulp-sassvg';

const DATA_PREFIX = "data:image/svg+xml;charset=UTF-8,";




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
		var $fill = $('[fill]').not('[fill=none]');
		if($fill.length > 0){
			var fillValue = $fill.attr('fill');
			$fill.attr('fill', '#{if($fillcolor, $fillcolor, ' + fillValue + ')}');
		}else{
			var $svg = $('svg');
			var fillValue = $svg.attr('fill');
			$svg.attr('fill', '#{if($fillcolor, $fillcolor, #000)}');
		}
		$('[style]').each(function(){
			var fillValue = $(this).css("fill");
			if(fillValue !== undefined && fillValue !== 'none'){
				$(this).css("fill", '#{if($fillcolor, $fillcolor, ' + fillValue + ')}');
			}
			var strokeValue = $(this).css("stroke");
			if(strokeValue !== undefined && strokeValue !== 'none'){
				$(this).css("stroke", '#{if($strokecolor, $strokecolor, ' + strokeValue + ')}');
			}
		});
		var $style = $('style'); //adobe photoshop sometimes didn't add type="text/css"
		if($style.length){
			var newStyle  = $style.html();
			var regex = /(fill|stroke)(:).*?(.*?)(;|})/gm;
			var replacer = function(item, type, notUsed, val) {
				var out = null;
				val = val ? val.trim() : "#000";
				if(type == 'fill'){
					out = 'fill: #{if($fillcolor, $fillcolor, ' + val + ')}';
				}else if(type == 'stroke'){
					out = 'stroke: #{if($strokecolor, $strokecolor, ' + val + ')}';
				}
				return out;
			}
			newStyle = newStyle.replace(regex, replacer);
			$style.html(newStyle);
		}
		$('svg').each(function(){
			var styles = $(this).attr("style");
			$(this).css("empty", "empty;#{$extrastyles}"); //not the very best solution, but makes it valid and works everytime - empty props will be regexed out again
		});
		var $stroke = $('[stroke]').not('[stroke=none]');
		var strokeValue = $(this).attr('stroke');
		$stroke.attr('stroke', '#{if($strokecolor, $strokecolor, ' + strokeValue + ')}');
        return $.html('svg'); //return only the svg 
}

function encodeSVG(dynamicContent){
    return encodeURIComponent(dynamicContent.replace(/[\t\n\r]/gmi, " ")) //replace tab, linefeed and carriage return
        .replace(/\(/g, "%28") // opening brackets
        .replace(/\)/g, "%29") // closing brackets
        .replace(/["']/g, "%22"); // double quotes 
  
}

function decodeVariables(encodedContent){
	var regex = /(%23%7Bif).*?(%7D)/gm; // (#{if).*?(})/gm; in URI
	var replacer = function(str) {
		str = decodeURIComponent(str);
		/*repair firefox bug
		 hash sign (#) in the content needs to be escaped as %23 then for sass need to put variable into quotes
		-----start FF hack----- */
		var regexForFF = /((#[^#{]).*?)(?=\)})/gm; // searching for a color, skipping #{
		str = str.replace(regexForFF, function(str) {
			return '"' + encodeURIComponent(str) + '"';
		});
		/* -----finish FF hack----- */
	  return str;
	}
	encodedContent = encodedContent.replace(regex, replacer);
    return encodedContent
		.replace(sassVarRegex("extrastyles", ";"), "#{$extrastyles}")
		.replace(/empty%3A%20empty%3B/gm, "");//correct the empty styles props
}

function assembleDataString(fileName, finalContent){
    return "@function sassvg-" + fileName + "($fillcolor, $strokecolor, $extrastyles){ @return '" + DATA_PREFIX + finalContent + "'; }\n";
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
    options.outputFolder = optionsGiven.outputFolder || "./scss/"; //TODO add some options
  if( options.outputFolder.indexOf("/", options.outputFolder.length - 1) === -1 ){
    options.outputFolder = options.outputFolder + "/";
  }
		options.outputMainFile = options.outputFolder + "_sassvg.scss";
		options.outputDataFile = options.outputFolder + "_sassvg-data.scss";
		options.optimizeSvg = (optionsGiven.optimizeSvg !== undefined) ? optionsGiven.optimizeSvg : true; //true = 25% less filesize, but 3 times as long to create the sass file
	
		var writeStreamMain = fs.createWriteStream(options.outputMainFile);
		writeStreamMain.write(fs.readFileSync(__dirname + "/_sassvg.scss", "utf8"));
		writeStreamMain.end();
	
    var writeStream = fs.createWriteStream(options.outputDataFile);

    var sassvgMap = "\n\n$sassvg-map: (";
	
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
				sassvgMap += ");";
				writeStream.write(sassvgMap);
        writeStream.end();
        cb();
    }
    return through.obj(listStream, endStream);
}
module.exports = gulpSassvg;


