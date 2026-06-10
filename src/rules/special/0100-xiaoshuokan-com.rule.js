// @rule-name: 好看小说网
// @rule-source: special
(
// @rule-begin
        // 盗贴
        { // https://www.xiaoshuokan.com
            siteName: '好看小说网',
            url: '://www.xiaoshuokan.com/haokan/\\d+/index.html',
            chapterUrl: '://www.xiaoshuokan.com/haokan/\\d+/[\\d_]+.html',
            infoPage: () => `https://www.xiaoshuokan.com/haokan/${window.location.href.match(/\d+/)[0]}.html`,
            title: '.booktitle>h1',
            writer: '.bookinfo>span>a',
            intro: '.block-intro',
            cover: '.bookcover img',
            chapter: '.booklist a',
            deal: async (chapter) => {
                const urlArr = chapter.url.split(/[_/.]/);
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `https://www.xiaoshuokan.com/chapreadajax.php?siteno=${urlArr[7]}&bookid=${urlArr[8]}&chapid=${urlArr[9]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            resolve(res.responseText);
                        },
                    }, null, 0, true);
                });
                return content;
            },
        }
// @rule-end
)
