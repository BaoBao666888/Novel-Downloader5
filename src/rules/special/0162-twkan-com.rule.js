// @rule-name: 台灣小說網
// @rule-source: special
(
// @rule-begin
        { // https://twkan.com
            siteName: '台灣小說網',
            url: '://twkan\\.com/book/\\d+\\.html',
            chapterUrl: '://twkan\\.com/book/\\d+/\\d+\\.html',
            filter: () => {
                if (window.location.host !== 'twkan.com') return 0;
                if (document.querySelector('a.btn.more-btn[href*="/index.html"], .booknav2, .navtxt')) return 1;
                if (document.querySelector('#txtcontent0')) return 2;
                return 0;
            },
            title: 'h1',
            writer: '.booknav2 > p:nth-child(3) > a',
            intro: '.navtxt',
            cover: '.bookimg2 > img',
            chapterTitle: 'h1, .readtitle',
            getChapters: async (doc) => {
                const helpers = Rule.helpers;
                const menuLink = doc.querySelector('a.btn.more-btn[href*="/index.html"]');
                if (!menuLink) return [];
                const menuUrl = helpers.absoluteUrl(menuLink.getAttribute('href'), location.href);
                const articleId = (menuUrl.match(/\/book\/(\d+)\/index\.html/) || [])[1];
                if (!articleId) return [];
                const listDoc = await helpers.requestDoc(`https://twkan.com/ajax_novels/chapterlist/${articleId}.html`);
                return Array.from(listDoc.querySelectorAll('ul a[href]')).map((link) => ({
                    title: link.textContent.trim(),
                    url: helpers.absoluteUrl(link.getAttribute('href'), location.href),
                }));
            },
            deal: async (chapter) => {
                const doc = await Rule.helpers.requestDoc(chapter.url);
                const content = $('#txtcontent0', doc).first().clone();
                content.find('.hide720, .txtcenter, .bottom-ad, script, style').remove();
                let html = content.html() || '';
                html = html
                    .replace(/【.*台灣小說網.*】/g, '')
                    .replace(/（.*台灣小說網.*）/g, '')
                    .replace(/本書由.*首發/g, '')
                    .replace(/本書首發.*讀體驗/g, '')
                    .replace(/GOOGLE搜索TWKAN/gi, '')
                    .replace(/.*台灣小說網.*(隨時.|超全|超讚|超實用|超順暢|超流暢|超方便|超好用|超貼心|超給力|超省心|超靠譜|輕鬆讀|輕鬆看|任你.|等你尋)/g, '')
                    .replace(/\(本章完\)/g, '');
                const wrapper = $('<div></div>').html(html);
                wrapper.contents().filter((idx, node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()).each((idx, node) => {
                    $(node).replaceWith(`<p>${node.textContent.trim()}</p>`);
                });
                wrapper.find('p').each((idx, p) => {
                    if (!/<br\s*\/?>/i.test(p.innerHTML)) return;
                    const paragraphs = p.innerHTML.split(/<br\s*\/?>/i)
                        .map((part) => part.trim())
                        .filter(Boolean)
                        .map((part) => `<p>${part}</p>`)
                        .join('');
                    $(p).replaceWith(paragraphs);
                });
                return {
                    title: $(doc).find('h1, .readtitle').first().text().trim() || chapter.title,
                    content: wrapper.html(),
                };
            },
            thread: 1,
        }
// @rule-end
)
