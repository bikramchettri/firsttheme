import gulp from "gulp";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import cleanCSS from "gulp-clean-css";
import gulpif from "gulp-if";
import sourcemaps from "gulp-sourcemaps";
import imagemin from "gulp-imagemin";

const PRODUCTION = yargs(hideBin(process.argv)).argv.prod;

const sass = gulpSass(dartSass);

const paths = {
  styles: {
    src: ["src/assets/scss/bundle.scss", "src/assets/scss/admin.scss"],
    dest: "dist/assets/css",
  },
  images: {
    src: "src/assets/images/**/*.{jpg,jpeg,png,svg,gif}",
    dest: "dist/assets/images",
  },
};

export const styles = () => {
  return gulp
    .src(paths.styles.src)
    .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
    .pipe(sass().on("error", sass.logError))
    .pipe(gulpif(PRODUCTION, cleanCSS({ compatibility: "ie8" })))
    .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
    .pipe(gulp.dest(paths.styles.dest));
};

export const images = () => {
  return (
    gulp
      // gulp imagemin breaking images and not optimizing, solve by , { encoding: false }
      .src(paths.images.src, { encoding: false })
      .pipe(gulpif(PRODUCTION, imagemin({ verbose: true })))
      .pipe(gulp.dest(paths.images.dest))
  );
};

export const watch = () => {
  gulp.watch("src/assets/scss/**/**.scss", styles);
};
