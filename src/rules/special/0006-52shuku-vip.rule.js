// @rule-name: 52书库
// @rule-source: special
(
// @rule-begin
        { // https://www.52shuku.vip/  và https://www.52shuku.net/
            siteName: '52书库',
            filter: () => (/^www\.52shuku\.(vip|net)$/.test(window.location.host) ? ($('.list.clearfix').length ? 1 : $('.book_con, #nr1').length ? 2 : 0) : 0),
            infoPage: () => {
                const breadcrumbs = $('.content-wrap .breadcrumbs, .breadcrumbs');
                return breadcrumbs.first().find('a:last').attr('href') || '';
            },
            intro: (doc) => {
                const ps = $(doc).find('article.article-content > p').filter((i, el) => {
                    return !el.hasAttribute('id') && !el.hasAttribute('class')
                        && !/^\s*(?:小说简介|所属专题|Tips)[：:]/i.test(el.textContent);
                });
                return ps.map((i, el) => $(el).text().trim()).get().join('\n\n');
            },
            title: (doc) => {
                return $(doc).find('.article-title, #nr_title').first().text()
                    .replace(/\(\d+\)$/, '').replace(/_[^_]+$/, '').trim();
            },
            writer: (doc) => {
                const heading = $(doc).find('.article-title, #nr_title').first().text().replace(/\(\d+\)$/, '');
                return (heading.match(/_([^_【]+)(?:【.*】)?$/) || [])[1]?.trim() || '';
            },
            chapter: '.list.clearfix > li > a',
            chapterTitle: (doc, res, request) => request?.raw?.title?.trim()
                || $(doc).find('#nr_title, .article-title').first().text().trim(),
            content: '#text.book_con, #nr1:not(ul)',
            contentCheck: '#text.book_con, #nr1:not(ul)',
            elementRemove: '.related_top, .article-header, .article-nav, script, style, iframe, .chapterNum, .pagination2, #lineCorrect, hr + p, #go-top',
            chapterPrev: '.pagination2 a:contains("上一页")',
            chapterNext: '.pagination2 a:contains("下一页")',
            getChapters: async () => {
                let doc = document;
                if (!doc.querySelector('.list.clearfix > li > a')) {
                    const href = $('.breadcrumbs').first().find('a:last').attr('href');
                    if (!href) throw new Error('52书库: Không tìm thấy liên kết mục lục.');
                    doc = await Rule.helpers.requestDoc(new URL(href, location.href).href, { cache: false });
                }
                const seen = new Set();
                const chapters = Array.from(doc.querySelectorAll('.list.clearfix > li > a')).map((a) => ({
                    title: a.textContent.trim(),
                    url: new URL(a.getAttribute('href'), location.href).href,
                })).filter((chapter) => {
                    if (seen.has(chapter.url)) return false;
                    seen.add(chapter.url);
                    return true;
                });
                if (!chapters.length) throw new Error('52书库: Không tìm thấy danh sách chương. Hãy kiểm tra trang hoặc xác minh rồi thử lại.');
                return chapters;
            },
        }
// @rule-end
)
