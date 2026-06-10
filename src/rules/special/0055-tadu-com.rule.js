// @rule-name: 塔读文学
// @rule-source: special
(
// @rule-begin
        { // http://www.tadu.com
            siteName: '塔读文学',
            url: '://www.tadu.com(:\\d+)?/book/catalogue/\\d+',
            chapterUrl: '://www.tadu.com(:\\d+)?/book/\\d+/\\d+/',
            infoPage: () => `${window.location.origin}/book/${window.location.pathname.match(/\d+/)[0]}`,
            title: '.bkNm',
            writer: '.bookNm>a:nth-child(2)',
            intro: '.datum+p',
            cover: (doc) => $('.bookImg>img', doc).attr('data-src').replace(/_a\.jpg$/, '.jpg'),
            chapter: '.chapter>a',
            vipChapter: '.chapter>a:has(.vip)',
            chapterTitle: '.chapter h4',
            content: async (doc, res, request) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter: request.raw,
                        url: res.responseText.match(/id="bookPartResourceUrl" value="(.*?)"/)[1],
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: request.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const content = res.responseText.match(/\{content:'(.*)'\}/)[1];
                                resolve(content);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
        }
// @rule-end
)
