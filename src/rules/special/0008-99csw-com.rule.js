// @rule-name: 九九藏书网
// @rule-source: special
(
// @rule-begin
        { // https://www.99csw.com
            siteName: '九九藏书网',
            url: /99csw.com\/book\/\d+\/(index\.htm)?$/,
            chapterUrl: /99csw.com\/book\/\d+\/\d+.htm/,
            title: '#book_info>h2',
            writer: 'h4:contains("作者")>a',
            intro: '.intro',
            cover: '#book_info>img',
            chapter: '#dir a',
            volume: '#dir>dt:nochild',
            iframe: async (win) => {
                while (win.content.showNext() !== false) {
                    await waitInMs(200);
                }
            },
            content: '#content>div:visible',
            // content: function (doc, res, request) {
            //   const content = [];
            //   const box = $('#content', doc).get(0);
            //   const star = 0; // ? 可能根本没用
            //   var e = CryptoJS.enc.Base64.parse($('meta[name="client"]', doc).attr('content')).toString(CryptoJS.enc.Utf8).split(/[A-Z]+%/);
            //   var j = 0;
            //   function r (a) {
            //     return a;
            //   }
            //   for (var i = 0; i < e.length; i++) {
            //     if (e[i] < 3) {
            //       content[e[i]] = r(box.childNodes[i + star]);
            //       j++;
            //     } else {
            //       content[e[i] - j] = r(box.childNodes[i + star]);
            //       j = j + 2;
            //     }
            //   }
            //   return content.map(i => i.outerHTML).join('<br>');
            // }
        }
// @rule-end
)
