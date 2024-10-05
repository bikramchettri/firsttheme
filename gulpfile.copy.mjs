import path from 'path';
import gulp from 'gulp';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import cleanCSS from 'gulp-clean-css';
import gulpif from 'gulp-if';
import sourcemaps from 'gulp-sourcemaps';
import imagemin from 'gulp-imagemin';
import { deleteAsync } from 'del';
import webpack from 'webpack-stream';
import uglify from 'gulp-uglify';

const PRODUCTION = yargs(hideBin(process.argv)).argv.prod;

const sass = gulpSass(dartSass);

const paths = {
  styles: {
    src: ['src/assets/scss/bundle.scss', 'src/assets/scss/admin.scss'],
    dest: 'dist/assets/css',
  },
  images: {
    src: 'src/assets/images/**/*.{jpg,jpeg,png,svg,gif}',
    dest: 'dist/assets/images',
  },
  scripts: {
    src: ['src/assets/js/bundle.js', 'src/assets/js/admin.js'],
    dest: 'dist/assets/js',
  },
  other: {
    src: [
      'src/assets/**/*',
      '!src/assets/images/**',
      '!src/assets/js/**',
      '!src/assets/scss/**',
    ],
    dest: 'dist/assets',
  },
};

export const clean = () => deleteAsync(['dist']);

// Styles task
export const styles = () => {
  return gulp
    .src(paths.styles.src)
    .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpif(PRODUCTION, cleanCSS({ compatibility: 'ie8' })))
    .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
    .pipe(gulp.dest(paths.styles.dest));
};

// Images task
export const images = () => {
  return gulp
    .src(paths.images.src, { encoding: false })
    .pipe(gulpif(PRODUCTION, imagemin({ verbose: true })))
    .pipe(gulp.dest(paths.images.dest));
};

// Copy task
export const copy = () => {
  return gulp.src(paths.other.src).pipe(gulp.dest(paths.other.dest));
};

// Scripts task
export const scripts = () => {
  return gulp
    .src(paths.scripts.src, { allowEmpty: true })
    .pipe(
      webpack({
        mode: PRODUCTION ? 'production' : 'development',
        entry: {
          main: './src/assets/js/bundle.js',
          admin: './src/assets/js/admin.js',
        },
        output: {
          filename: '[name].js', // Output separate files for each entry
          path: path.resolve(__dirname, 'dist/assets/js'),
          clean: true, // Clean output directory before emit
        },
        module: {
          rules: [
            {
              test: /\.js$/,
              exclude: /node_modules/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env'],
                },
              },
            },
          ],
        },
        devtool: !PRODUCTION ? 'inline-source-map' : false,
      })
    )
    .pipe(gulpif(PRODUCTION, uglify())) // Optional, as mode already minimizes
    .pipe(gulp.dest(paths.scripts.dest));
};

// Watch task
export const watch = () => {
  gulp.watch(paths.styles.src, styles);
  gulp.watch(paths.images.src, images);
  gulp.watch(paths.other.src, copy);
  gulp.watch(paths.scripts.src, scripts);
};

// Development and build tasks
export const dev = gulp.series(
  clean,
  gulp.parallel(styles, images, copy, scripts),
  watch
);
export const build = gulp.series(
  clean,
  gulp.parallel(styles, images, copy, scripts)
);

// Default task
export default dev;
