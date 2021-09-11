import gulp from 'gulp';
import del from 'del';
import rename from 'gulp-rename';
import sourcemap from 'gulp-sourcemaps';
import browserSync from 'browser-sync';
import twig from 'gulp-twig';
import htmlmin from 'gulp-htmlmin';
import svgsprite from 'gulp-svg-sprite';
import inject from 'gulp-inject';
import plumber from 'gulp-plumber';
import sassGlob from 'gulp-sass-glob';
import sass from 'gulp-dart-sass';
import postcss from 'gulp-postcss';
import postcssPresetEnv from 'postcss-preset-env';
import cssnano from 'cssnano';
import imagemin from 'gulp-imagemin';
import gifsicle from 'imagemin-gifsicle';
import mozjpeg from 'imagemin-mozjpeg';
import optipng from 'imagemin-optipng';
import svgo from 'imagemin-svgo';
import gulpWebp from 'gulp-webp';
import webpack from 'webpack-stream';
import webpackConfig from './webpack.config.js';

const sync = browserSync.create();

/* clear */
const clear = () => {
  return del('./build/');
};

/* inline svg */
const inlineSvg = () => {
  return gulp.src('./src/img/sprite/*.svg')
    .pipe(imagemin([
      svgo({
        plugins: [
          { name: 'removeViewBox',
            active: false,
          },
          { name: 'removeXMLNS',
            active: true,
          },
          {
            name: 'removeDimensions',
            active: true,
          },
        ],
      }),
    ]))
    .pipe(svgsprite({
      mode: {
        inline: true,
        symbol:{
          dest: '.',
          example: false,
          sprite: 'sprite.svg',
        },
      },
      shape: {
        id: {
          separator: '--',
          generator: (name, source) => {
            return `sprite-${name}`;
          },
        },
        dimension: {
          precision: 2,
          attributes: true,
        },
      },
      svg: {
        xmlDeclaration: false,
        doctypeDeclaration: false,
        namespaceIDs: false,
        dimensionAttributes: true,
      },
     }));
};

/* html */
const html = () => {
  const svgs = inlineSvg();
  const fileContents = (filePath, file) => {
    return file.contents.toString();
  };
  return gulp.src('./src/*.twig')
    .pipe(twig())
    .pipe(inject(svgs, { transform: fileContents }))
    .pipe(htmlmin({
      collapseWhitespace: process.env.NODE_ENV === 'production' ? true : false,
      removeComments: process.env.NODE_ENV === 'production' ? true : false,
    }))
    .pipe(gulp.dest('./build/'))
    .pipe(sync.stream());
};

/* styles */
const styles = () => {
  return gulp.src('./src/styles/main.scss')
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sassGlob())
    .pipe(sass())
    .pipe(postcss([
      postcssPresetEnv(),
      cssnano(),
    ]))
    .pipe(rename('main.min.css'))
    .pipe(sourcemap.write('.'))
    .pipe(gulp.dest('build/styles'))
    .pipe(sync.stream());
};

/* scripts */
const js = () => {
  return gulp.src('./src/js/**/*.js')
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest('./build/js/'))
    .pipe(sync.stream());
};

/* copy */
const copyAssets = () => {
  return gulp.src('./src/assets/*')
    .pipe(gulp.dest('./build/assets/'))
    .pipe(sync.stream());
}
const copyFonts = () => {
  return gulp.src('./src/fonts/*')
    .pipe(gulp.dest('./build/fonts/'))
    .pipe(sync.stream());
};
const copyImages = () => {
  return gulp.src('./src/img/**/*', {ignore: './src/img/sprite/'})
    .pipe(gulp.dest('./build/img/'))
    .pipe(sync.stream());
};

const copy = gulp.parallel(copyAssets, copyFonts, copyImages);

/* images */
const webp = () => {
  return gulp.src('./src/img/**/*.{png,jpg}', {ignore: './src/img/favicon/*'})
  .pipe(gulpWebp())
  .pipe(gulp.dest('./build/img/'));
};

const optimizeImages = () => {
  return gulp.src('./src/img/**/*', {ignore: './src/img/sprite/'})
  .pipe(imagemin([
    gifsicle(),
    mozjpeg({ quality: 75, progressive: true }),
    optipng({ optimizationLevel: 3 }),
    svgo({
      plugins: [
        { name: 'removeViewBox',
          active: false,
        },
        { name: 'removeXMLNS',
          active: false,
        },
        {
          name: 'removeDimensions',
          active: false,
        },
      ],
    }),
  ]))
  .pipe(gulp.dest('./build/img/'));
};

/* server */
const server = (done) => {
  sync.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
};

/* watcher */
const watcher = () => {
  gulp.watch('./src/**/*.twig', html);
  gulp.watch('./src/styles/**/*.scss', styles);
  gulp.watch('./src/**/*.js', js);
  gulp.watch('./src/fonts/*', copyFonts);
  gulp.watch('./src/img/**/*', {ignore: './src/img/sprite/'}, gulp.parallel(copyImages, webp));
  gulp.watch('./src/img/sprite/*.svg', html);
}

/* export */
export default gulp.series(
  clear,
  gulp.parallel(html, styles, copy, webp, js),
  server,
  watcher,
);

export const build = gulp.series(
  clear,
  gulp.parallel(html, styles, copyAssets, copyFonts, optimizeImages, webp, js),
);
