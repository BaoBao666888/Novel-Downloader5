// @rule-name: 话本小说 (ihuaben)
// @rule-source: special
(
// @rule-begin

        // https://www.ihuaben.com/
        {
            siteName: '话本小说 (ihuaben)',
            filter: () => {
                if (!/(^|\.)ihuaben\.com$/i.test(window.location.hostname)) return false;
                if (/^\/book\/\d+\/\d+\.html$/i.test(window.location.pathname)) return 2;
                if (/^\/(?:book|list)\/\d+(?:\.html)?\/?$/i.test(window.location.pathname)) return 1;
                return false;
            },

            _extractBookId: (url = window.location.href) => {
                const match = String(url || '').match(/\/(?:book|list)\/(\d+)/i);
                return match ? match[1] : '';
            },

            _fetchJson: async (url) => {
                let fetchError = null;
                try {
                    const response = await fetch(url, {
                        credentials: 'include',
                        headers: { Accept: 'application/json, text/javascript, */*; q=0.01' }
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.json();
                } catch (error) {
                    fetchError = error;
                }

                try {
                    const response = await xhr.sync(url, null, {
                        method: 'GET',
                        responseType: 'text',
                        timeout: Config.timeout
                    });
                    const text = String(response.responseText || response.response || '').trim();
                    if (!text) throw fetchError || new Error('Phản hồi rỗng');
                    try {
                        return JSON.parse(text);
                    } catch (error) {
                        const jsonp = text.match(/^[^(]*\(([\s\S]*)\)\s*;?$/);
                        if (!jsonp) throw error;
                        return JSON.parse(jsonp[1]);
                    }
                } catch (error) {
                    throw new Error(`Không gọi được API iHuaben: ${(fetchError || error).message || error}`);
                }
            },

            _normalizeMediaUrl: (url) => {
                const value = String(url || '').trim();
                if (!value) return '';
                if (/^https?:\/\//i.test(value)) return value.replace(/^http:\/\//i, 'https://');
                if (value.startsWith('//')) return `https:${value}`;
                return `https://piccn.ihuaben.com/${value.replace(/^\/+/, '')}`;
            },

            _formatContent: function (rawContent) {
                let text = Array.isArray(rawContent)
                    ? rawContent.filter(item => item != null).join('\n')
                    : String(rawContent || '');

                text = text.replace(/\[img:([^\]]+)\]/gi, (_, src) => {
                    const imageUrl = this._normalizeMediaUrl(src);
                    return imageUrl ? `[img:${imageUrl}]` : '';
                });

                if (/<\/?(?:p|div|br|span|i|a|img)\b/i.test(text) || /&(?:nbsp|amp|lt|gt|quot|#\d+);/i.test(text)) {
                    const box = document.createElement('div');
                    box.innerHTML = text;
                    box.querySelectorAll('img').forEach((img) => {
                        const imageUrl = this._normalizeMediaUrl(img.getAttribute('src') || img.getAttribute('data-src'));
                        img.replaceWith(document.createTextNode(imageUrl ? `\n[img:${imageUrl}]\n` : ''));
                    });
                    box.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode('\n')));
                    box.querySelectorAll('p,div').forEach(el => el.appendChild(document.createTextNode('\n')));
                    text = box.textContent || '';
                }

                return text
                    .replace(/\r\n?/g, '\n')
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line && line !== '.')
                    .map((line) => {
                        const dialogue = line.match(/^#{1,2}\s*([^\s#]+)\s+(.+)$/);
                        return dialogue ? `${dialogue[1]}：“${dialogue[2]}”` : line;
                    })
                    .join('\n\n')
                    .trim();
            },

            infoPage: () => {
                const match = window.location.href.match(/\/(?:book|list)\/(\d+)/i);
                const bookId = match ? match[1] : '';
                return bookId ? `https://www.ihuaben.com/book/${bookId}.html` : window.location.href;
            },

            title: (doc) => {
                const element = doc.querySelector('.infodetail .simpleinfo h1.text-danger, .infodetail .simpleinfo h1');
                const meta = doc.querySelector('meta[property="og:novel:book_name"], meta[property="og:title"]');
                return element && element.textContent.trim() || meta && meta.getAttribute('content') || '';
            },
            writer: (doc) => {
                const element = doc.querySelector('.infodetail .simpleinfo a.text-muted, .infodetail .simpleinfo a');
                const meta = doc.querySelector('meta[property="og:novel:author"]');
                return element && element.textContent.trim() || meta && meta.getAttribute('content') || '';
            },
            intro: (doc) => {
                const element = doc.querySelector('.infodetail .aboutbook');
                const meta = doc.querySelector('meta[property="og:description"], meta[name="description"]');
                return element && element.innerHTML || meta && meta.getAttribute('content') || '';
            },
            cover: (doc) => {
                const image = doc.querySelector('.biginfo .cover img, .cover img');
                const meta = doc.querySelector('meta[property="og:image"], meta[property="og:img"]');
                const src = image && (image.getAttribute('src') || image.getAttribute('data-src'))
                    || meta && meta.getAttribute('content');
                const value = String(src || '').split('?')[0].split('@')[0].trim();
                if (/^https?:\/\//i.test(value)) return value.replace(/^http:\/\//i, 'https://');
                if (value.startsWith('//')) return `https:${value}`;
                return value ? `https://piccn.ihuaben.com/${value.replace(/^\/+/, '')}` : '';
            },

            getChapters: async function () {
                const bookId = this._extractBookId(window.location.href);
                if (!bookId) throw new Error('iHuaben: Không tìm thấy bookId trong URL hiện tại');

                const data = await this._fetchJson(`https://www.ihuaben.com/book/chapters/${bookId}`);
                if (!data || data.code !== 0 || !Array.isArray(data.chapters) || !data.chapters.length) {
                    throw new Error('iHuaben: API không trả về danh sách chương hợp lệ');
                }

                return data.chapters.map((chapter, index) => {
                    const rawTitle = String(chapter.title || '').trim() || `Chương ${index + 1}`;
                    const title = /^第\d+[章话节卷篇]/.test(rawTitle)
                        ? rawTitle
                        : `第${index + 1}章 ${rawTitle}`;
                    return {
                        title,
                        url: `https://www.ihuaben.com/book/${bookId}/${chapter.chapterId}.html`,
                        vip: Boolean(chapter.chapterType && chapter.chapterType !== 'FREE')
                    };
                }).filter(chapter => !/\/undefined\.html$/.test(chapter.url));
            },

            deal: async function (chapter) {
                const match = String(chapter && chapter.url || '').match(/\/book\/(\d+)\/(\d+)\.html/i);
                if (!match) throw new Error(`iHuaben: URL chương không hợp lệ: ${chapter && chapter.url || ''}`);

                const data = await this._fetchJson(
                    `https://www.ihuaben.com/book/app/chapter?bookId=${encodeURIComponent(match[1])}&chapterId=${encodeURIComponent(match[2])}`
                );
                const chapterData = data && data.chapter;
                if (!data || data.code !== 0 || !chapterData) {
                    throw new Error(`iHuaben: API không trả về chương ${match[2]}`);
                }

                const marks = chapterData.marks && typeof chapterData.marks === 'object' ? chapterData.marks : {};
                const content = this._formatContent(
                    chapterData.content || marks.content || marks.contentText || marks.content_text || ''
                );
                if (!content) throw new Error(`iHuaben: Nội dung chương ${match[2]} rỗng hoặc chưa được cấp quyền`);

                return {
                    title: String(chapterData.title || chapter.title || '').trim(),
                    content
                };
            }
        }
// @rule-end
)
