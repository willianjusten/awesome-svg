var gulp = require('gulp');
var del = require('del');
var fs = require('fs');
var screenshot = require('node-webkit-screenshot');
var imageResize = require('gulp-image-resize');
var $ = require('gulp-load-plugins')();
$.ghPages = require('gulp-gh-pages');

var config = {
    path: {
        markdown: 'topics/**/*.md',
        html: 'topics/**/*.md',
        site: 'site/**/*.html',
        dest: 'dest'
    },
    server: {
        host: '0.0.0.0',
        port: '1234'
    }
}

// Links
var urls = [];
var count = 0;

function stringToSlug(str) {
    return str
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

function getScreenshots() {
    var site = urls[count];
    count++
    if (count >= urls.length) {
        screenshot.close();
        console.log('Fim');
        return
    }
    if(count == 32){
      count++
    }
    screenshot({
        url: site.url,
        width: 1024,
        height: 768
    })
        .then(function(buffer) {
            var imagePath = 'dest/screenshots/' + site.filename;
            fs.writeFile(imagePath, buffer, function() {
                console.log('Site', count + 1, ' de ', urls.length)
                getScreenshots();
            });
        });
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

function normalizeName(filename) {
    var addSvg = filename.indexOf('svg') == -1 ? '-svg' : '';
    filename = filename.toLowerCase() + addSvg;
    return filename;
}

gulp.task('default', function() {});

gulp.task('screenshots', ['get-urls'], function() {
    getScreenshots();
});

gulp.task('get-urls', function() {
    var ord = 0;
    return gulp.src(config.path.markdown)
        .pipe($.markdown())
        .pipe($.cheerio(function($, file) {
            $('ul a').each(function(i) {
                ord++
                urls.push({
                    ord: ord,
                    url: $(this).attr('href'),
                    label: $(this).text(),
                    filename: stringToSlug($(this).text()) + '.png'
                });
            });
        }));
});

gulp.task('resize', function() {
    gulp.src('dest/screenshots/**/*.png')
        .pipe(imageResize({
            width: 300,
            height: 225
        }))
        .pipe(gulp.dest('dest/screenshots'));
});


gulp.task('build-topics', function() {
    var menuList = getTopics();
    return gulp.src(config.path.markdown)
        .pipe($.markdown())
        .pipe($.wrap({
            src: 'site/page.html'
        }))
        .pipe($.cheerio(function($, file) {
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
                .addClass('pure-menu-link');

            $content.find('a').each(function(i) {
                var url = $(this).attr('href')
                var label = $(this).text();
                $(this).append('<img src="screenshots/' + stringToSlug(label) + '.png">')
            });

            // remove bottom of markdown
            $content.find('hr + p').remove();
            $content.find('hr').remove();

        }))
        .pipe($.rename(function(path) {
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


gulp.task('deploy', function() {
    return gulp.src('./dest/**/*')
        .pipe($.ghPages());
});
