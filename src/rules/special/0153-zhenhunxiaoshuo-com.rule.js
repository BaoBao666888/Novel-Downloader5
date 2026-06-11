// @rule-name: 镇魂小说网
// @rule-source: special
(
// @rule-begin
        { // https://www.zhenhunxiaoshuo.com
            siteName: '镇魂小说网',
            url: '://www\\.zhenhunxiaoshuo\\.com/[^/]+/$',
            chapterUrl: '://www\\.zhenhunxiaoshuo\\.com/\\d+\\.html',
            filter: () => {
                if (window.location.host !== 'www.zhenhunxiaoshuo.com') return 0;
                if (document.querySelector('.focusbox-title') && document.querySelector('article.excerpt > a')) return 1;
                if (document.querySelector('article.article-content')) return 2;
                return 0;
            },
            title: '.focusbox-title, h1',
            writer: (doc) => {
                const html = $('div.focusbox-text > p', doc).first().html() || '';
                const firstLine = html.split(/<br\s*\/?>/i)[0] || '';
                return firstLine.replace(/<[^>]+>/g, '').replace(/^作者：?/, '').trim();
            },
            intro: (doc) => {
                const html = $('div.focusbox-text > p', doc).first().html() || '';
                return html
                    .split(/<br\s*\/?>/i)
                    .slice(1)
                    .map((line) => line.replace(/<[^>]+>/g, '').trim())
                    .filter(Boolean)
                    .join('\n');
            },
            chapter: 'article.excerpt > a',
            chapterTitle: '.article-title, h1',
            content: 'article.article-content',
            elementRemove: 'script, style, iframe, ins, .adsbygoogle',
        }
// @rule-end
)
