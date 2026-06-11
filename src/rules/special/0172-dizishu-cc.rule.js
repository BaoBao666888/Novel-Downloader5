// @rule-name: 弟子小说网
// @rule-source: special
(
// @rule-begin
        { // https://www.dizishu.cc/*/*/ ; https://www.qu-la.com/*/*/
            siteName: '弟子小说网',
            filter: () => {
                if (!/^(www\.)?(dizishu\.cc|qu-la\.com)$/.test(window.location.host)) return 0;
                if (document.querySelector('#list > .book-chapter-list .cf li > a')) return 1;
                if (document.querySelector('div#txt') || Array.from(document.scripts).some((script) => script.textContent.includes('chapterid='))) return 2;
                return 0;
            },
            title: '.book-text > h1',
            writer: (doc) => $('.book-text > span', doc).first().text().replace('著', '').trim(),
            intro: '.intro',
            cover: '#fengmian img',
            getChapters: () => {
                const helpers = Rule.helpers;
                let volume = '';
                const chapters = [];
                Array.from(document.querySelectorAll('#list > .book-chapter-list > h3, #list > .book-chapter-list .cf li > a[href]')).forEach((node) => {
                    if (node.matches('h3')) {
                        volume = node.textContent.trim();
                        return;
                    }
                    chapters.push({
                        title: node.textContent.trim(),
                        url: helpers.absoluteUrl(node.getAttribute('href'), location.href),
                        volume,
                    });
                });
                return helpers.uniqueBy(chapters, (chapter) => chapter.url);
            },
            chapterTitle: 'h1, .content h1',
            deal: async (chapter) => {
                const helpers = Rule.helpers;
                const doc = await helpers.requestDoc(chapter.url);
                const title = $('h1, .content h1', doc).first().text().trim() || chapter.title;
                if (chapter.url.includes('dizishu')) {
                    const scripts = Array.from(doc.querySelectorAll('script')).map((script) => script.textContent || '');
                    const script1 = (scripts.find((script) => script.includes('chapterid=')) || '')
                        .split('\n')
                        .filter((line) => !(line.includes('cpstr=') || line.includes('get_content()') || line.includes('xid=')))
                        .join('\n');
                    const script2 = (scripts.find((script) => script.includes('ssid')) || '')
                        .split('\n')
                        .filter((line) => line.includes('var ssid') || line.includes('var hou'))
                        .join('\n');
                    if (script1 && script2) {
                        const origin = new URL(chapter.url).origin;
                        const contentUrl = new Function('origin', `${script2};${script1};
                            const xid = Math.floor(bookid / 1000);
                            return origin + \`/files/article/html\${ssid}/\${xid}/\${bookid}/\${chapterid}\${hou}\`;
                        `)(origin);
                        const text = await helpers.requestText(contentUrl, {
                            headers: {
                                accept: 'text/plain, */*; q=0.01',
                                'x-requested-with': 'XMLHttpRequest',
                            },
                        });
                        const cctxt = new Function(`${text};return cctxt;`)();
                        if (cctxt) {
                            return {
                                title,
                                content: cctxt,
                            };
                        }
                    }
                    return {
                        title,
                        content: '',
                    };
                }
                const content = $('div#txt', doc).first().clone();
                content.find('a').remove();
                return {
                    title,
                    content: content.html() || '',
                };
            },
            thread: 1,
        }
// @rule-end
)
