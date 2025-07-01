import gulp from "gulp";
import { deleteAsync } from "del";
import concat from "gulp-concat";
import htmlMin from "gulp-htmlmin";
import autoprefixes from "gulp-autoprefixer";
import cleanCSS from "gulp-clean-css";
import svgSprite from "gulp-svg-sprite";
import image from "gulp-image";
import uglify from "gulp-uglify-es";
import babel from "gulp-babel";
import notify from "gulp-notify";
import sourcemaps from "gulp-sourcemaps";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import webp from "gulp-webp";
import favicon from "gulp-favicons";
import filter from "gulp-filter";
import browserSync from "browser-sync";
import gulpIf from "gulp-if";
import fileinclude from "gulp-file-include";

let prod = false;

const isProd = (done) => {
  prod = true;
  done();
};

const { src, dest, series, watch } = gulp;
const uglifyDef = uglify.default;
const browserSyncInstance = browserSync.create();
const sass = gulpSass(dartSass);

export const clean = async () => {
  await deleteAsync(["dist"]);
};

const resources = () => {
  return src("src/resources/**").pipe(dest("dist/libs"));
};

const styles = () => {
  return src([
    // "src/styles/components/**/*.scss",
    // "src/styles/elements/**/*.scss",
    // "src/styles/media/**/*.scss",
    // "src/styles/lib/**/*.scss",
    // "src/styles/scss/**/*.scss",
    // "src/styles/settings/**/*.scss",
    "src/styles/**/*.scss",
    "src/styles/*.css",
  ])
    .pipe(gulpIf(!prod, sourcemaps.init()))
    .pipe(sass().on("error", sass.logError))
    .pipe(
      autoprefixes({
        cascade: false,
      })
    )
    .pipe(
      cleanCSS({
        format: gulpIf(!prod, "beautify"),
        level: 2,
      })
    )
    .pipe(gulpIf(!prod, sourcemaps.write()))
    .pipe(dest("dist/css"))
    .pipe(gulpIf(!prod, browserSyncInstance.stream()));
};

const htmlMinify = () => {
  return src("src/*.html")
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(gulpIf(prod, htmlMin({ collapseWhitespace: true })))
    .pipe(dest("dist"))
    .pipe(gulpIf(!prod, browserSyncInstance.stream()));
};

const watchFiles = () => {
  browserSyncInstance.init({
    server: {
      baseDir: "dist",
    },
  });

  watch("src/**/*.html", htmlMinify);
  watch(["src/styles/**/*.scss", "src/styles/**/*.css"], styles);
  watch("src/images/svg/**/*.svg", svgSprites);
  watch(
    ["src/images/**/*.jpg", "src/images/**/*.png", "src/images/**/*.jpeg"],
    images
  );
  watch("src/js/**/*.js", scripts);
  watch("src/resources/**", resources);
};

const svgSprites = () => {
  return src("src/images/svg/**/*.svg")
    .pipe(image())
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: "../sprite.svg",
          },
        },
      })
    )
    .pipe(dest("dist/img"));
};

const scripts = () => {
  return src("src/js/**/*.js")
    .pipe(gulpIf(!prod, sourcemaps.init()))
    .pipe(gulpIf(prod, babel({ presets: ["@babel/env"] })))
    .pipe(concat("app.js"))
    .pipe(
      gulpIf(prod, uglifyDef({ toplevel: true }).on("error", notify.onError()))
    )
    .pipe(gulpIf(!prod, sourcemaps.write()))
    .pipe(dest("dist/js"))
    .pipe(gulpIf(!prod, browserSyncInstance.stream()));
};

const images = () => {
  return src([
    "src/images/**/*.jpg",
    "src/images/**/*.png",
    "src/images/**/*.jpeg",
  ])
    .pipe(webp())
    .pipe(dest("dist/img"));
};

const svgResize = () => {
  return src("src/images/*.svg").pipe(image()).pipe(dest("dist/img"));
};

const fonts = () => {
  return src(["src/fonts/*.woff", "src/fonts/*.woff2"]).pipe(
    dest("dist/fonts")
  );
};

const createFavicon = () => {
  return src("src/images/favicon.svg", { allowEmpty: true })
    .pipe(
      favicon({
        icons: {
          favicons: true,
          android: false,
          appleIcon: false,
          appleStartup: false,
          windows: false,
          yandex: false,
        },
      })
    )
    .pipe(filter("favicon.ico"))
    .pipe(dest("dist"));
};

export default series(
  clean,
  resources,
  htmlMinify,
  styles,
  scripts,
  images,
  svgResize,
  svgSprites,
  fonts,
  createFavicon,
  watchFiles
);

// build
export const build = series(
  isProd,
  clean,
  resources,
  htmlMinify,
  styles,
  scripts,
  images,
  svgResize,
  svgSprites,
  fonts,
  createFavicon
);
