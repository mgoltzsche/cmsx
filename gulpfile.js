var pkg = require('./package.json');
var gulp = require('gulp');
var rename = require('gulp-rename');
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var stylishReporter = require('jshint-stylish');
var uglify = require('gulp-uglify');
var browserify = require('browserify');
var babelify = require('babelify');
var eslint = require('babel-eslint');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var del = require('del');
var iconfont = require('gulp-iconfont');
var consolidate = require('gulp-consolidate');
var runTimestamp = Math.round(Date.now()/1000);
var fontName = 'cmsx-icons';

gulp.task('default', ['browserify', 'sass'/*, 'iconfont'*/], function() {
	return gulp.src(['./package.json', '${basedir}/src/main/icons/favicon.png', '${basedir}/src/main/icons/favicon.ico'])
		.pipe(gulp.dest('${basedir}/target/classes'));
});

gulp.task('sass', ['clean', 'iconfont'], function() {
	return gulp.src(['css/cmsx.scss'])
		.pipe(sourcemaps.init())
		.pipe(sass({outputStyle: 'compressed'}))
		.pipe(sourcemaps.write())
		.pipe(rename('cmsx-' + pkg.version + '.min.css'))
		.pipe(gulp.dest('${basedir}/target/classes/resources/css'));
});

gulp.task('browserify', ['clean', 'lint'], function() {
	return browserify('js/main.js')
		.transform(babelify, {presets: [/*'es2015',*/ 'react']}) // compile with ECMA Script 6 and react
		.bundle()
		.pipe(source(pkg.name + '-' + pkg.version + '.min.js')) // converts to vinyl src with name
		/*.pipe(buffer())                     // converts to vinyl buffer obj
		.pipe(uglify())*/
		.pipe(gulp.dest('${basedir}/target/classes/resources/js'));
});

gulp.task('iconfont', function(){
	return gulp.src(['${basedir}/src/main/icons/*.svg'])
		.pipe(iconfont({
			fontName: fontName,
			prependUnicode: true,
			formats: ['ttf', 'eot', 'woff'], // default, 'woff2' and 'svg' are available
			timestamp: runTimestamp // recommended to get consistent builds when watching files
		}))
		.on('glyphs', function(glyphs, options) {
			gulp.src('${basedir}/src/main/css-templates/_icons.generated.scss')
			.pipe(consolidate('lodash', {
				glyphs: glyphs,
				fontName: fontName + '-' + pkg.version,
				fontPath: '../fonts/',
				className: 'cmsx'
			}))
			.pipe(gulp.dest('css'));
		})
		.pipe(rename(function(path) {
			path.basename += '-' + pkg.version;
		}))
		.pipe(gulp.dest('${basedir}/target/classes/resources/fonts'));
});

gulp.task('lint', function() {
	return gulp.src('${basedir}/src/main/javascript/**/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter(stylishReporter))
		.pipe(jshint.reporter('fail'));
});

gulp.task('clean', function() {
	return del.sync('./**.js');
});
