// @rule-name: 256文学
// @rule-source: special
(
// @rule-begin
        { // https://www.256wenku.com and https://www.256wx.org
            siteName: '256文学',
            filter: () => {
                if (!/^www\.(?:256wenku\.com|256wx\.org)$/.test(window.location.host)) return 0;
                if (document.querySelector('.catalog > li > a, .list > li > a')) return 1;
                if (document.querySelector('.book_con')) return 2;
                return 0;
            },
            title: '.art_tit',
            infoPage: () => /\/read\/\d+\/\d+\.html$/.test(location.pathname)
                ? location.href.replace(/\d+\.html(?:[?#].*)?$/, '') : '',
            writer: (doc) => $('#text > span > a[href*="/writer/"], span.bookinfo:nth-child(1) > a, span.bookinfo:nth-child(1)', doc).first().text().replace(/^作者[：:]/, '').trim(),
            intro: '.infotype > p, #nr_history > p:not(.ztread):not(.txtread):not(:first-child)',
            chapter: '.catalog > li > a, .list > li > a',
            chapterTitle: (doc, res, request) => request?.raw?.title?.trim()
                || $(doc).find('#nr_title, .bookname h1, h1').first().text().trim(),
            content: '.book_con',
            elementRemove: 'script, style, iframe, .page, .pagination, .pagination2',
            contentReplace: [[/【256文学将分享[^】]*】/g, '']],
            chapterPrev: '.page a:contains("上一页")',
            chapterNext: '.page a:contains("下一页")',
            getChapters: async () => {
                let doc = document;
                const infoUrl = /\/read\/\d+\/\d+\.html$/.test(location.pathname)
                    ? location.href.replace(/\d+\.html(?:[?#].*)?$/, '') : location.href;
                if (infoUrl !== location.href) doc = await Rule.helpers.requestDoc(infoUrl, { cache: false });
                const seen = new Set();
                const chapters = Array.from(doc.querySelectorAll('.catalog > li > a, .list > li > a')).map((a) => ({
                    title: a.textContent.trim(),
                    url: new URL(a.getAttribute('href'), infoUrl).href,
                })).filter((chapter) => {
                    if (seen.has(chapter.url)) return false;
                    seen.add(chapter.url);
                    return true;
                });
                if (!chapters.length) throw new Error('256文学: Không tìm thấy danh sách chương. Hãy kiểm tra trang hoặc xác minh rồi thử lại.');
                return chapters;
            },
        }
// @rule-end
)
