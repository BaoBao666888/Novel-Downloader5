// @rule-name: 52书库
// @rule-source: special
(
// @rule-begin
        { // https://www.52shuku.vip/  và https://www.52shuku.net/
            siteName: '52书库',
            filter: () => (/^www\.52shuku\.(vip|net)$/.test(window.location.host) ? ($('.list.clearfix').length ? 1 : 2) : 0),
            infoPage: () => {
                const breadcrumbs = $('.content-wrap .breadcrumbs, .breadcrumbs');
                return breadcrumbs.length ? breadcrumbs.find('a:last').attr('href') : '';
            },
            intro: (doc) => {
                const ps = $(doc).find('article.article-content > p').filter((i, el) => {
                    return !el.hasAttribute('id') && !el.hasAttribute('class');
                }).slice(0, 3);
                return ps.map((i, el) => $(el).text().trim()).get().join('\n\n');
            },
            title: (doc) => {
                const breadcrumbs = $(doc).find('.content-wrap .breadcrumbs, .breadcrumbs');
                if (breadcrumbs.length > 0) {
                    let text = breadcrumbs.find('a:last').text().replace('丹青手', '').replace('扶子不好吃', '');
                    if (text.endsWith('丹青手')) {
                        text = text.replace('丹青手', '');
                    } else if (text.endsWith('扶子不好吃')) {
                        text = text.replace('扶子不好吃', '');
                    }
                    return text;
                }
                return '';
            },
            chapter: '.list.clearfix > li > a',
            chapterTitle: '#nr_title',
            content: '#nr1',
            elementRemove: '.related_top, .article-header, .article-nav, script, .chapterNum, .pagination2, hr + p, #go-top',
            chapterPrev: '.pagination2 a:contains("上一页")',
            chapterNext: '.pagination2 a:contains("下一页")',
        }
// @rule-end
)
