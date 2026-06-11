// @rule-name: 完本神站
// @rule-source: special
(
// @rule-begin
        { // https://www.wanbengo.com
            siteName: '完本神站',
            url: '://www\\.wanbengo\\.com/\\d+/$',
            chapterUrl: '://www\\.wanbengo\\.com/\\d+/\\d+(_\\d+)?\\.html',
            filter: () => {
                if (window.location.host !== 'www.wanbengo.com') return 0;
                if (document.querySelector('.chapter li > a')) return 1;
                if (document.querySelector('.readerCon')) return 2;
                return 0;
            },
            title: '.detailTitle > h1',
            writer: '.writer > a',
            intro: '.detailTopMid > table:nth-child(3) tr:nth-child(3) > td:nth-child(2)',
            cover: '.detailTopLeft > img',
            chapter: '.chapter li > a',
            chapterTitle: '.readerTitle h1, .readerTitle h2, h1',
            deal: async (chapter) => {
                const helpers = Rule.helpers;
                const visited = new Set();
                const parts = [];
                let title = chapter.title || '';
                let pageUrl = chapter.url;
                for (let i = 0; pageUrl && !visited.has(pageUrl) && i < 10; i++) {
                    visited.add(pageUrl);
                    const doc = await helpers.requestDoc(pageUrl);
                    const $doc = $(doc);
                    if (!title) title = $doc.find('.readerTitle h1, .readerTitle h2, h1').first().text().trim();
                    const content = $doc.find('.readerCon').first().clone();
                    content.find('script, style, div[style], a').remove();
                    let html = content.html() || '';
                    html = html
                        .replace(/^\s*(?:<p>)?\s*【提示】：.*?<\/p>/im, '')
                        .replace(/^\s*(?:<p>)?\s*【看书助手】.*?<\/p>/im, '')
                        .replace(/百万热门书籍终身无广告免费阅读/g, '')
                        .replace(/【完本神站】/g, '')
                        .replace(/一秒记住、永不丢失！/g, '')
                        .replace(/--&gt;&gt;本章未完，点击下一页继续阅读/g, '')
                        .replace(/\s+$/g, '');
                    if (html.trim()) parts.push(html);
                    const nextHref = $doc.find('.readPage a').filter((idx, el) => $(el).text().includes('下一页')).first().attr('href');
                    const nextUrl = nextHref ? helpers.absoluteUrl(nextHref, pageUrl) : '';
                    pageUrl = /_\d+\.html(?:$|[?#])/.test(nextUrl) ? nextUrl : '';
                }
                return {
                    title,
                    content: parts.join('<br />'),
                };
            },
            contentReplace: [
                [/^\s*(&nbsp;)+谨记我们的网址.*。/m],
                [/^\s*(&nbsp;)+一秒记住.*/m],
                [/^<br>(&nbsp;)+【提示】：.*?。/m],
                [/^<br>(&nbsp;)+看更多好文请搜.*/m],
                [/^<br>(&nbsp;)+《[完本神站]》.*/m],
                [/^<br>(&nbsp;)+喜欢神站记得收藏.*/m],
                [/^<br>(&nbsp;)+支持.*把本站分享那些需要的小伙伴.*/m],
                [/--&gt;&gt;本章未完，点击下一页继续阅读/g, ''],
            ],
            thread: 1,
        }
// @rule-end
)
