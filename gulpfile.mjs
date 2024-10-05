import path from 'path';
import gulp, { dest } from 'gulp';
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
import named from 'vinyl-named';
import browserSync from 'browser-sync';
import zip from 'gulp-zip';
import replace from 'gulp-replace';
import { unlinkSync } from 'fs';
import info from './package.json' with { type: "json" };;

const server = browserSync.create();

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
        // Corrected here
        src: ['src/assets/js/bundle.js', 'src/assets/js/admin.js'],
        dest: 'dist/assets/js',
    },
    other: {
        src: [
            'src/assets/**/*',
            '!src/assets/images/**',
            '!src/assets/js/**',
            '!src/assets/scss/**',
            //   "!src/assets/{images,js,scss}",
            //   "!src/assets/{images,js,scss}/**/*",
        ],
        dest: 'dist/assets',
    },
    package: {
        src: [
            '**/*',
            '!.vscode',
            '!node_modules{,/**}',
            '!packaged{,/**}',
            '!src{,/**}',
            '!.gitignore',
            '!gulpfile.mjs',
            '!package.json',
            '!package-lock.json',
            '!gulp-setup.txt',
            '!webpack.config.js',
            '!note.txt',
            '!gulpfile.copy.mjs',
        ],
        dest: 'packaged',
    },
};

export const serve = (done) => {
    server.init({
        proxy: 'http://ala.test/',
    });
    done();
};

export const reload = (done) => {
    server.reload();
    done();
};

export const clean = () => deleteAsync(['dist']);

export const styles = () => {
    return gulp
        .src(paths.styles.src)
        .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulpif(PRODUCTION, cleanCSS({ compatibility: 'ie8' })))
        .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(server.stream());
};

export const images = () => {
    return (
        gulp
            // gulp imagemin breaking images and not optimizing, solve by , { encoding: false }
            .src(paths.images.src, { encoding: false })
            //   .pipe(gulpif(PRODUCTION, imagemin({ verbose: true })))
            .pipe(imagemin({ verbose: true }))
            .pipe(gulp.dest(paths.images.dest))
    );
};

export const watch = () => {
    //   gulp.watch('src/assets/scss/**/*.scss', gulp.series(styles, reload));
    gulp.watch('src/assets/scss/**/*.scss', styles);
    gulp.watch('src/assets/js/**/*.js', gulp.series(scripts, reload));
    gulp.watch('**/*.php', reload);
    gulp.watch(paths.images.src, gulp.series(images, reload));
    // gulp.watch(paths.other.src, gulp.series(copy, reload));
    gulp.watch(paths.other.src, gulp.series(copy, reload)).on('unlink', (filepath) => {
        const filePathFromSrc = path.relative(path.resolve('src/assets'), filepath);
        const destFilePath = path.resolve(paths.other.dest, filePathFromSrc);
        unlinkSync(destFilePath); // Delete the file from 'dist' when it's deleted from 'src'
    });
};

export const copy = () => {
    return gulp.src(paths.other.src).pipe(gulp.dest(paths.other.dest));
};

export const scripts = () => {
    return gulp
        .src(paths.scripts.src)
        .pipe(named())
        .pipe(
            webpack({
                module: {
                    rules: [
                        {
                            test: /\.js$/,
                            use: {
                                loader: 'babel-loader',
                                options: {
                                    presets: ['@babel/preset-env'], //or ['babel-preset-env']
                                },
                            },
                        },
                    ],
                },
                output: {
                    filename: '[name].js',
                },
                externals: {
                    jquery: 'jQuery',
                },
                devtool: !PRODUCTION ? 'inline-source-map' : false,
                mode: PRODUCTION ? 'production' : 'development', //add this
            })
        )
        .pipe(gulpif(PRODUCTION, uglify())) //you can skip this now since mode will already minify
        .pipe(gulp.dest(paths.scripts.dest));
};

export const compress = () => {
    return gulp
        .src(paths.package.src)
        .pipe(replace('_themename', info.name))
        .pipe(zip(`${info.name}.zip`))
        .pipe(gulp.dest(paths.package.dest));
};

export const dev = gulp.series(
    clean,
    gulp.parallel(styles, scripts, images, copy),
    serve,
    watch
);

export const build = gulp.series(
    clean,
    gulp.parallel(styles, scripts, images, copy)
);

export const bundle = gulp.series(build, compress);

export default dev;
