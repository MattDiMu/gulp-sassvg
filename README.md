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

#FAQ
**Why does this plugin create so many sassvg-*iconname* functions?**
Due to performance reasons. I've tested all possibilities to create dynamic SVGs with SASS (one huge map in a mixin, assembling the SVG from single strings, str_replace the dynamic parts) and this solution scales (by far) best! Adding some hundred icons is no problem :-)


**Does sassvg work with libSass**
LibSass is even encouraged for best performance, but it works with RubySass as well.
