// @rule-name: 御书阁
// @rule-source: special
(
// @rule-begin
        { // http://m.yuzhaige.cc/
            siteName: '御书阁',
            url: '://m.yuzhaige.cc/\\d+/\\d+/$',
            chapterUrl: '://m.yuzhaige.cc/\\d+/\\d+/\\d+(_\\d+)?.html',
            infoPage: '.currency_head>h1>a',
            title: '.cataloginfo>h3',
            writer: '.infotype>p>a[href*="/author/"]',
            intro: '.intro>p',
            chapter: '.chapters a',
            chapterTitle: '#chaptertitle',
            content: (doc, res, request) => {
                const doc1 = new window.DOMParser().parseFromString(res.responseText, 'text/html');
                const order = window.atob(doc1.getElementsByTagName('meta')[7].getAttribute('content')).split(/[A-Z]+%/);
                const codeurl = res.responseText.match(/var codeurl="(\d+)";/)[1] * 1;
                const arrRaw = $('#content', doc1).children().toArray();
                const arr = [];
                for (let i = 0; i < order.length; i++) {
                    const truth = order[i] - ((i + 1) % codeurl);
                    arr[truth] = arrRaw[i];
                }
                return arr.map((i) => i.textContent);
            },
            chapterNext: '.chapterPages>a.curr~a,.p3>a',
        }
// @rule-end
)
