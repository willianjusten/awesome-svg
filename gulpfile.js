var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
    $.ghPages = require('gulp-gh-pages');
var del = require('del');
var fs = require('fs');

var config = {
  path: {
    markdown: 'topics/**/*.md',
    html: 'topics/**/*.md',
    site: 'site/**/*.html',
    dest: 'dist'
  },
  server: {
    host: '0.0.0.0',
    port: '1234'
  }
}

function getTopics() {
  var topics = fs.readdirSync('topics'),
      menuList = [],
      menuItem = {};
  for (var i = 0; i < topics.length; i++) {
    menuItem = {
      label: topics[i].replace('.md', '').replace('-', ' '),
      url: normalizeName(topics[i].replace('.md', '')) + '.html'
    };
    menuList.push(menuItem);
  };
  return menuList;
}

function normalizeName(filename){
  var addSvg = filename.indexOf('svg') == -1 ? '-svg' : '';
  filename = filename.toLowerCase() + addSvg;
  return filename;
}

gulp.task('default', function() {
});

gulp.task('build-menu', function() {
  return gulp.src(config.path.markdown)
});

gulp.task('build-topics', function() {
  var menuList = getTopics()
  return gulp.src(config.path.markdown)
        .pipe($.markdown())
        .pipe($.wrap({ src: 'site/page.html'}))
        .pipe($.cheerio(function ($, file) {
          var $content = $('.content'),
              $header = $('.header');

          // ugly alfa version ok?

          // title
          var title = $content.find('h2').text();
          $content.find('h2').remove();
          $header.find('h1').text(title);
          $('title').text(title);

          // subtitle
          var subtitle = $content.find('blockquote').text();
          $content.find('blockquote').remove();
          $header.find('h2').text(subtitle);
          $('meta[name="description"]').attr('content', subtitle);

          // menu
          var htmlMenu = '';
          for (var i = 0; i < menuList.length; i++) {
            htmlMenu += '<li class="pure-menu-item"><a href="' + menuList[i].url + '" class="pure-menu-link">' + menuList[i].label + '</a></li>';
          };
          $('#mainMenu').html(htmlMenu);

          // list links
          $content.find('ul')
            .addClass('pure-menu-list');
          $content.find('li')
            .addClass('pure-menu-item');
          $content.find('a')
            .attr('target', '_blank')
            .addClass('pure-menu-link')

          // remove bottom of markdown
          $content.find('hr + p').remove();
          $content.find('hr').remove();

        }))
        .pipe($.rename(function (path) {
          path.basename = normalizeName(path.basename);
        }))
        .pipe(gulp.dest(config.path.dest));
});

gulp.task('watch', function() {
  gulp.watch(config.path.markdown, ['build-topics']);
  gulp.watch(config.path.site, ['build-topics']);
});

gulp.task('server', ['build-topics', 'watch'], function() {
  gulp.src(config.path.dest)
    .pipe($.webserver({
        host: config.server.host,
        port: config.server.port,
        livereload: true,
        directoryListing: false,
        open: true,
        fallback: 'accessibility-svg.html'
      }));
});

gulp.task('clear', function(cb) {
  del(config.path.dest, cb);
});


gulp.task('deploy', function () {
  return gulp.src('./dist/**/*')
    .pipe(deploy());
});
