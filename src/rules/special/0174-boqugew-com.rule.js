// @rule-name: 新笔趣阁
// @rule-source: special
(
// @rule-begin
        { // http://www.boqugew.com/shu/*
            siteName: '新笔趣阁',
            filter: () => {
                if (window.location.host !== 'www.boqugew.com') return 0;
                if (document.querySelector('div#list-chapterAll > dl > dd > a')) return 1;
                if (document.querySelector('div#htmlContent')) return 2;
                return 0;
            },
            title: 'h1.bookTitle',
            writer: (doc) => $('p.booktag > a:first-child', doc).first().text().replace(/作(\s+)?者[：:]/, '').trim(),
            intro: 'p#bookIntro',
            cover: 'img.img-thumbnail',
            chapter: 'div#list-chapterAll > dl > dd > a',
            chapterTitle: 'h1, .bookname h1',
            content: 'div#htmlContent',
            elementRemove: 'br',
            contentReplace: [
                ['记住网址m.ｂｏｑｕgew．ｃｏｍ', ''],
                ['一秒记住ｈｔｔｐ://ｍ．boqugeｗ．ｃｏｍ', ''],
                ['首发网址ｈｔｔp://m.ｂｏｑｕｇｅｗ.com', ''],
            ],
        }
// @rule-end
)
