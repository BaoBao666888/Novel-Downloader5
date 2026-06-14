// @rule-name: 书耽
// @rule-source: special
(
// @rule-begin
        { // https://www.shubl.com/
            siteName: '书耽',
            url: '://www.shubl.com/book/book_detail/\\d+',
            chapterUrl: '://www.shubl.com/chapter/book_chapter_detail/\\d+',
            title: '.book-title>span',
            writer: '.right>.box>.user-info .username',
            intro: '.book-brief',
            cover: '.book-img',
            chapter: '#chapter_list .chapter_item>a',
            vipChapter: '#chapter_list .chapter_item:has(.lock)>a',
            chapterTitle: '.article-title',
            _fetch: (url, options = {}) => {
                const fetchImpl = (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.fetch === 'function')
                    ? unsafeWindow.fetch.bind(unsafeWindow)
                    : window.fetch.bind(window);
                return fetchImpl(url, {
                    credentials: 'include',
                    cache: 'no-store',
                    ...options,
                });
            },
            _ensureDecrypt: async () => {
                if (unsafeWindow.$ && typeof unsafeWindow.$.myDecrypt === 'function') return;
                const rule = Rule.special.find((i) => i.siteName === '书耽');
                const scripts = [
                    '/resources/js/enjs.min.js',
                    '/resources/js/plugins/jquery.base64.min.js',
                    '/resources/js/myEncrytExtend-min.js',
                ];
                for (const path of scripts) {
                    const res = await rule._fetch(`https://www.shubl.com${path}`);
                    if (!res.ok) throw new Error(`Không tải được script giải mã Shubl: ${path}`);
                    unsafeWindow.eval(await res.text());
                }
                if (!(unsafeWindow.$ && typeof unsafeWindow.$.myDecrypt === 'function')) {
                    throw new Error('Không khởi tạo được hàm giải mã Shubl.');
                }
            },
            deal: async (chapter) => {
                const rule = Rule.special.find((i) => i.siteName === '书耽');
                await rule._ensureDecrypt();
                const chapterUrl = new URL(chapter.url, window.location.href).href;
                const chapterId = (chapterUrl.match(/\/(\d+)(?:[?#].*)?$/) || [])[1];
                if (!chapterId) throw new Error(`Không lấy được ID chương Shubl: ${chapterUrl}`);

                const fetchJson = async (url, options = {}) => {
                    const { headers = {}, ...restOptions } = options;
                    const res = await rule._fetch(url, {
                        referrer: chapterUrl,
                        ...restOptions,
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            ...headers,
                        },
                    });
                    const text = await res.text();
                    try {
                        return JSON.parse(text);
                    } catch (error) {
                        throw new Error(`Shubl trả JSON không hợp lệ (${res.status}): ${text.slice(0, 120)}`);
                    }
                };

                const session = await fetchJson(`https://www.shubl.com/chapter/ajax_get_session_code?chapter_id=${chapterId}`);
                const accessKey = session && session.chapter_access_key;
                if (session.code !== 100000 || !accessKey) {
                    throw new Error(session.tip || `Không lấy được access key Shubl cho chương ${chapterId}`);
                }

                const params = new URLSearchParams({
                    chapter_id: chapterId,
                    chapter_access_key: accessKey,
                });
                const json = await fetchJson(`https://www.shubl.com/chapter/get_book_chapter_detail_info?${params.toString()}`);
                if (json.code !== 100000 || !json.chapter_content) {
                    throw new Error(json.tip || `Shubl không trả nội dung cho chương ${chapterId}`);
                }

                return unsafeWindow.$.myDecrypt({
                    content: json.chapter_content,
                    keys: json.encryt_keys,
                    accessKey,
                });
            },
            elementRemove: 'span',
            chapterPrev: '#J_BtnPagePrev',
            chapterNext: '#J_BtnPageNext',
            thread: 1,
        }
// @rule-end
)
