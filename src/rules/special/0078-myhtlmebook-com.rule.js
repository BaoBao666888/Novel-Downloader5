// @rule-name: 海棠文化线上文学城
// @rule-source: special
(
// @rule-begin
        { // https://www.myhtlmebook.com/ https://www.myhtebooks.com/ https://www.haitbook.com/
            siteName: '海棠文化线上文学城',
            filter: () => {
                if ($('.title>a>img[alt="海棠文化线上文学城"]').length) {
                    if (window.location.search.match('\\?act=showinfo&bookwritercode=.*?&bookid=')) {
                        return 1;
                    } if (window.location.search.match('\\?act=showpaper&paperid=')) {
                        return 2;
                    }
                }
            },
            // url: '(myhtlmebook|myhtebooks?|urhtbooks|haitbook).com/\\?act=showinfo&bookwritercode=.*?&bookid=',
            // chapterUrl: '(myhtlmebook|myhtebooks?|urhtbooks|haitbook).com/\\?act=showpaper&paperid=',
            title: '#mypages .uk-card h4',
            writer: '#writerinfos>a',
            chapter: '.uk-list>li>a[href^="/?act=showpaper&paperid="]',
            vipChapter: '.uk-list>li:not(:contains("免費"))>a[href^="/?act=showpaper&paperid="]',
            volume: '.uk-list>li:not(:has(a[href^="/?act=showpaper&paperid="])):has(b>font)',
            chapterTitle: '.uk-card-title',
            content: async (doc, res, request) => {
                const writersay = $('#colorpanelwritersay', res.responseText).html();
                let egg;
                if ($('[id^="eggsarea"]+[uk-icon="commenting"]', res.responseText).length) {
                    const paperid = $('[id^="eggsarea"]', res.responseText).attr('id').match(/^eggsarea(.*)$/)[1];
                    const bookwritercode = $('[uk-icon="list"]', res.responseText).attr('href').match(/bookwritercode=(.*?)($|&)/)[1];
                    const bookid = $('[uk-icon="list"]', res.responseText).attr('href').match(/bookid=(.*?)($|&)/)[1];
                    const msgs = ['q', '敲', '\ud83e\udd5a'];
                    await new Promise((resolve, reject) => {
                        xhr.add({
                            method: 'POST',
                            url: `${window.location.origin}/papergbookresave.php`,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                Referer: request.raw.url,
                                'X-Requested-With': 'XMLHttpRequest',
                            },
                            data: `paperid=${paperid}&bookwritercode=${bookwritercode}&bookid=${bookid}&repapergbookid=0&papergbookpage=1&repostmsgtxt=${msgs[Math.floor(Math.random() * msgs.length)]}&postmode=1&giftid=0`,
                            onload(res) {
                                resolve(res);
                            },
                        }, null, 0, true);
                    });

                    const res2 = await new Promise((resolve, reject) => {
                        xhr.add({
                            method: 'POST',
                            url: `${window.location.origin}/showpapereggs.php`,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                Referer: request.raw.url,
                                'X-Requested-With': 'XMLHttpRequest',
                            },
                            data: `paperid=${paperid}&bookwritercode=${bookwritercode}`,
                            onload(res) {
                                resolve(res);
                            },
                        }, null, 0, true);
                    });
                    egg = res2.responseText;
                    if (egg.includes('#gopapergbook')) {
                        egg = '彩蛋加载失败';
                    }
                } else {
                    egg = $('[id^="eggsarea"]', res.responseText).html();
                }

                const content = await new Promise((resolve, reject) => {
                    const [, paperid, vercodechk] = res.responseText.match(/data: { paperid: '(\d+)', vercodechk: '(.*?)'},/);
                    xhr.add({
                        chapter: request.raw,
                        url: '/showpapercolor.php',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: request.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        data: `paperid=${paperid}&vercodechk=${vercodechk}`,
                        onload(res, request) {
                            try {
                                const content = res.responseText;
                                resolve(content);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content + (writersay ? `${writersay}<br>---<br>以下正文` : '') + (egg ? `<br>---<br>彩蛋內容：<br>${egg}` : '');
            },
            getChapters: async (doc) => {
                const id = window.location.href.match(/bookid=(.*?)($|&)/)[1];
                const chapters = [];
                let pages = 1;
                while (true) {
                    const res = await xhr.sync(`${window.location.origin}/showbooklist.php`, `ebookid=${id}&pages=${pages}&showbooklisttype=1`, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: window.location.href,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        responseType: 'document',
                    });
                    chapters.push(...$('.uk-list>li>a[href^="/?act=showpaper&paperid="]', res.response).toArray().map((i) => ({
                        title: $(i).text(),
                        url: $(i).prop('href'),
                        vip: $(i).is('.uk-list>li:not(:contains("免費"))>a[href^="/?act=showpaper&paperid="]'),
                        volume: $(i).parent().prevAll('.uk-list>li:not(:has(a[href^="/?act=showpaper&paperid="])):has(b>font)').eq(0)
                            .text(),
                    })));
                    if ($('.uk-list>li:has([onclick^="showbooklistpage"])', res.response).length && $('.uk-list>li:has([onclick^="showbooklistpage"])', res.response).eq(0).find('font:has(b)').next('a').length) {
                        pages++;
                    } else {
                        break;
                    }
                }
                return chapters;
            },
        }
// @rule-end
)
