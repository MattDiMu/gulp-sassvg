[![npm version](https://badge.fury.io/js/gulp-sassvg.svg)](http://badge.fury.io/js/gulp-sassvg)

# gulp-sassvg

This plugin is currently under development. Feel free to [file issues/ask questions](https://github.com/MattDiMu/gulp-sassvg/issues), but I wouldn't recommend the production use....yet :)

# How to use

## Install
```
npm install gulp-sassvg --save-dev
```

## In your gulpfile.js
```
var sassvg = require('gulp-sassvg');

gulp.task('sassvg', function(){
    return gulp.src('./path/to/images/folder/**/*.svg') 
        .pipe(sassvg({
          outputFile: './scss/_icons.scss',
			optimizeSvg: true // true (default) means about 25% reduction of generated file size, but 3x time for generating the _icons.scss file
        }));
});
```

## 
````scss
@import "_sassvg.scss;

.selector {
  background-image: url( sassvg('filename') );
}
````

#Documentation
Documentation may be generated using sassdoc. Otherwise, just read the _sassvg.scss file, should be clear how to use the provided sassvg() and the sassvg-list() functions.



#FAQ
**Browser support
IT works in every browser supporting SVGs (basically IE9+ and Android 3+), detailled information may be found here: http://caniuse.com/#search=svg

**Performance?
Sassvg is blazingly fast. It's approximately 1ms/icon with libsass. So even if you have 100 different icons, the you will see the result after about 0.08-0.12 seconds. 

**What about the File Size?
Make sure you serve the CSS-File gzipped (which should be standard nowadays on every server). Then your transfered file-size will be even **lower* than if you would serve them "normally" by referencing the background-images via url. How?

We uri-encode the SVGs, instead of base64-encoding them. Therefore the gzip-compression may do its magic when dealing with similar files. E.g. if you have an SVG, which you SASSVG in 2 different colors, the generated CSS will look like:
````css
.selector {
	background-image: url('data:image/svg+xml;utf8,3Csvg%20fill%3D%22FIRSTCOLOR%22...');
}
.selector:hover {
	background-image: url('data:image/svg+xml;utf8,3Csvg%20fill%3D%22SECONDCOLOR%22...');
}
````
As the Strings will be VERY similar (except some color values), the gzip-compression may drastically reduce the file size, even much lower as if you would reference 2 external SVGS.


**Why does this plugin create so many sassvg-*iconname* functions?**
Due to performance reasons. I've tested all possibilities to create dynamic SVGs with SASS (one huge map in a mixin, assembling the SVG from single strings, str_replace the dynamic parts) and this solution scales (by far) best! Adding some hundred icons is no problem :-)


**Does sassvg work with libSass**
LibSass is even encouraged for best performance, but it works with RubySass as well.
