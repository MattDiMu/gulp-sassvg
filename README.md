# gulp-sassvg

### placeholder for a short gif/video

# How to use

## Install
> npm install gulp-sassvg --save-dev

## In your gulpfile.js
> var sassvg = require('gulp-sassvg');
>
> gulp.task('sassvg', function(){
>     return gulp.src('./path/to/images/folder/**/*.svg') 
>         .pipe(sassvg({
>           outputFile: './scss/_icons.scss',
> 			optimizeSvg: true // true (default) means about 25% reduction of generated file size, but 3x time for generating the _icons.scss file
>         }));
> });
