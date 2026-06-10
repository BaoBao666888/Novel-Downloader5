// @rule-name: 刺猬猫
// @rule-source: special
(
// @rule-begin
        { // https://www.ciweimao.com
            siteName: '刺猬猫',
            url: /:\/\/(www.)?ciweimao.com\/(book|chapter-list)\/\d+/,
            chapterUrl: /:\/\/(www.)?ciweimao.com\/chapter\/\d+/,
            infoPage: () => `https://www.ciweimao.com/book/${window.location.href.match(/\d+/)[0]}`,
            title: 'h3',
            writer: '.book-info [href*="reader/"]',
            intro: '.book-intro-cnt>div:nth-child(1)',
            cover: '.cover>img',
            chapter: '.book-chapter-list a',
            vipChapter: '.book-chapter-list a:has(.icon-lock),.book-chapter-list a:has(.icon-unlock)',
            volume: '.book-chapter-box>.sub-tit',
            chapterTitle: 'h3.chapter',
            deal: async (chapter) => {
                if (!unsafeWindow.CryptoJS) {
                    const result = await Promise.all([
                        '/resources/js/enjs.min.js',
                        '/resources/js/myEncrytExtend-min.js',
                        '/resources/js/jquery-plugins/jquery.base64.min.js',
                    ].map((i) => `https://www.ciweimao.com${i}`).map((i) => xhr.sync(i, null, { cache: true })));
                    for (const res of result) unsafeWindow.eval(res.responseText);
                }

                const chapterId = chapter.url.split('/').slice(-1)[0];
                const res1 = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        method: 'POST',
                        url: `${window.location.origin}/chapter/ajax_get_session_code`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        data: `chapter_id=${chapterId}`,
                        responseType: 'json',
                        onload(res) {
                            resolve(res);
                        },
                    }, null, 0, true);
                });
                const accessKey = res1.response.chapter_access_key;

                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        method: 'POST',
                        url: `${window.location.origin}/chapter/get_book_chapter_detail_info`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        data: `chapter_id=${chapterId}&chapter_access_key=${accessKey}`,
                        // responseType: 'json',
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const content = unsafeWindow.$.myDecrypt({
                                    content: json.chapter_content,
                                    keys: json.encryt_keys,
                                    accessKey,
                                });
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
            elementRemove: 'span',
            chapterPrev: '#J_BtnPagePrev',
            chapterNext: '#J_BtnPageNext',
            thread: 1,
            vip: {
                deal: null,
                iframe: async (win) => {
                    win.getDataUrl = async (img) => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        canvas.width = img.width;
                        canvas.height = img.height;

                        ctx.drawImage(img, 0, 0);
                        const url = canvas.toDataURL('image/jpeg', 0.5);
                        img.src = url;
                        // return new Promise((resolve, reject) => {
                        //   canvas.toBlob(function (blob) {
                        //     const url = URL.createObjectURL(blob);
                        //     img.src = url;
                        //     resolve();
                        //   });
                        // });
                    };
                    await waitFor(() => $('#J_BookImage', win.document).css('background-image').match(/^url\("?(.*?)"?\)/));
                    let src = $('#J_BookImage', win.document).css('background-image').match(/^url\("?(.*?)"?\)/)[1];
                    await new Promise((resolve, reject) => {
                        $('#realBookImage', win.document).one('load', async () => {
                            src = await win.getDataUrl($('#realBookImage', win.document).get(0));
                            window.history.back();
                            resolve();
                        }).attr('src', src);
                    });
                },
                content: '#J_BookImage',
                elementRemove: 'i',
            },
        }
// @rule-end
)
