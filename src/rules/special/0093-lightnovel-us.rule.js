// @rule-name: 轻之国度
// @rule-source: special
(
// @rule-begin
        { // https://www.lightnovel.us/
            siteName: '轻之国度',
            url: '://www.lightnovel.us(/cn)?/search\\?kw=',
            chapterUrl: '://www.lightnovel.us(/cn)?/detail/\\d+',
            title: () => $('.search-input').val() || $('.article-title').text(),
            titleReplace: [[/^\[.*?\]([^[\]])/, '$1'], [/([^[\]])\[.*?\]$/, '$1']],
            cover: () => $('.long-item>a>div.cover').css('background-image').match(/url\("?(.*?)"?\)/)[1],
            chapter: '.long-item>.info>a',
            chapterTitle: '.article-title',
            content: (doc, res, request) => {
                const contentRaw = $('#article-main-contents', res.responseText).html();
                const content = contentRaw.replace(/^(<br>)+/, '').split(/<div.*?>.*?<\/div>|(<br>\s*){3,}/).map((i) => i && i.replace(/^(\s*|<br>)+/, '')).filter((i) => i);
                Storage.book.chapters.splice(Storage.book.chapters.indexOf(request.raw), 1, ...content.map((item, index) => ({
                    title: `${request.raw.title} - 第${String(index + 1)}部分`,
                    url: request.raw.url,
                    content: item,
                    contentRaw: item,
                    document: res.responseText,
                })));
            },
        }
// @rule-end
)
