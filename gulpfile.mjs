import gulp from "gulp";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import cleanCSS from "gulp-clean-css";
import gulpIf from "gulp-if";

const PRODUCTION = yargs(hideBin(process.argv)).argv.prod;

const sass = gulpSass(dartSass);

export const styles = () => {
  return gulp
    .src("src/assets/scss/bundle.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(gulpIf(PRODUCTION, cleanCSS({ compatibility: "ie8" })))
    .pipe(gulp.dest("dist/assets/css/"));
};

// export default hello;
