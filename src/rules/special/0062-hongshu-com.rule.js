// @rule-name: 红薯中文网
// @rule-source: special
(
// @rule-begin
        { // https://www.hongshu.com
            siteName: '红薯中文网',
            url: '://www.hongshu.com/bookreader/\\d+/',
            chapterUrl: '://www.hongshu.com/content/\\d+/\\d+-\\d+.html',
            infoPage: () => `https://www.hongshu.com/book/${window.location.href.match(/\d+/)[0]}/`,
            title: 'h1>a',
            writer: '.txinfor>.right [href*="userspace"]',
            intro: '.intro',
            cover: '.fm>img',
            chapter: '.columns>li>a',
            vipChapter: '.columns>li:has(.vip)>a',
            deal: async (chapter) => {
                const urlArr = chapter.url.split(/\/|-|\./);
                const res1 = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.protocol}//www.hongshu.com/bookajax.do`,
                        method: 'POST',
                        data: `method=getchptkey&bid=${urlArr[6]}&cid=${urlArr[8]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                resolve(json);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.protocol}//www.hongshu.com/bookajax.do`,
                        method: 'POST',
                        data: `method=getchpcontent&bid=${urlArr[6]}&jid=${urlArr[7]}&cid=${urlArr[8]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const title = json.chptitle;
                                let { content } = json;
                                content = unsafeWindow.utf8to16(unsafeWindow.hs_decrypt(unsafeWindow.base64decode(content), res1.key));
                                // const other = unsafeWindow.utf8to16(unsafeWindow.hs_decrypt(unsafeWindow.base64decode(json.other), res1.key)); // 标点符号及常用字使用js生成的stylesheet显示
                                resolve({ title, content });
                            } catch (error) {
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
