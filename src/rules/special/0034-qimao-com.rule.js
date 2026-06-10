// @rule-name: Qimao (七猫文化)
// @rule-source: special
(
// @rule-begin

        { // https://www.qimao.com
            siteName: 'Qimao (七猫文化)',
            url: /(?:www\.)?qimao\.com\/shuku\/\d+/,
            chapterUrl: /(?:www\.)?qimao\.com\/shuku\/\d+-\d+/,
            title: '.book-information .title .txt',
            writer: '.author-name a, .sub-title .txt a',
            intro: '.intro',
            cover: '.book-information .wrap-pic img',

            getChapters: async (doc) => {
                console.log('Qimao: getChapters called', window.location.href);
                const match = window.location.href.match(/shuku\/(\d+)/);
                if (!match) {
                    console.error('Qimao: URL invalid, cannot extract bookId');
                    return [];
                }
                const bookId = match[1];

                const secret = "d3dGiJc651gSQ8w1";
                const sign = CryptoJS.MD5(`id=${bookId}` + secret).toString();
                const headerSign = CryptoJS.MD5("app-version=71900application-id=com.kmxs.readerplatform=android" + secret).toString();
                const apiUrl = `https://api-ks.wtzw.com/api/v1/chapter/chapter-list?id=${bookId}&sign=${sign}`;

                console.log(`Qimao: Fetching chapters from ${apiUrl}`);

                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: apiUrl,
                        headers: {
                            "platform": "android",
                            "app-version": "71900",
                            'application-id': 'com.kmxs.reader',
                            'sign': headerSign,
                            'user-agent': 'webviewversion/0'
                        },
                        onload: (res) => {
                            console.log('Qimao: API response received', res.status);
                            try {
                                const json = JSON.parse(res.responseText);
                                if (json.data && json.data.chapter_lists) {
                                    console.log(`Qimao: Found ${json.data.chapter_lists.length} chapters`);
                                    const list = json.data.chapter_lists.map(c => ({
                                        title: c.title,
                                        url: `https://www.qimao.com/shuku/${bookId}-${c.id}/`
                                    }));

                                    // VẼ THỦ CÔNG DANH SÁCH CHƯƠNG (Style: TruyenWikiDich)
                                    try {
                                        $('#qimao-chapter-container').remove(); // Xóa cũ nếu có

                                        const container = document.createElement("div");
                                        container.id = "qimao-chapter-container";
                                        container.style = "padding: 16px; border: 1px solid #ccc; background: #fff; max-width: 800px; margin: 20px auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1);";
                                        container.innerHTML = `<h2 style="text-align:center; color: #1a73e8;">📖 Danh sách chương (${list.length} chương - tải từ API)</h2>`;

                                        list.forEach((chap, index) => {
                                            const link = document.createElement("a");
                                            link.href = chap.url;
                                            link.innerText = chap.title;
                                            link.setAttribute("novel-downloader-chapter", "");
                                            link.setAttribute("order", index + 1);
                                            link.style = "display: block; padding: 8px 12px; margin: 5px 0; border-left: 4px solid #2196F3; text-decoration: none; color: #333; background-color: #f9f9f9; border-radius: 4px;";
                                            container.appendChild(link);
                                        });

                                        document.body.prepend(container);
                                        container.scrollIntoView({ behavior: 'smooth', block: 'start' });

                                        setTimeout(() => {
                                            $('a[order]').each((_, a) => {
                                                if (!container.contains(a)) {
                                                    a.removeAttribute('order');
                                                    a.removeAttribute('novel-downloader-chapter');
                                                }
                                            });
                                        }, 500);

                                    } catch (renderErr) {
                                        console.error('Qimao: Error rendering manual chapter list', renderErr);
                                    }

                                    resolve(list);
                                } else {
                                    console.error('Qimao: API error or no data', json);
                                    resolve([]);
                                }
                            } catch (e) {
                                console.error('Qimao: JSON parse error', e);
                                resolve([]);
                            }
                        },
                        onerror: (e) => {
                            console.error('Qimao: Request error', e);
                            resolve([]);
                        }
                    });
                });
            },

            deal: async (chapterInfo) => {
                const match = chapterInfo.url.match(/(\d+)-(\d+)\/?$/);
                if (!match) return { title: chapterInfo.title, content: null };
                const [_, bookId, chapterId] = match;

                const buildParams = `chapterId=${chapterId}&id=${bookId}`;
                const signParams = `chapterId=${chapterId}id=${bookId}`;
                const secret = "d3dGiJc651gSQ8w1";
                const sign = CryptoJS.MD5(signParams + secret).toString();

                const apiUrl = `https://api-ks.wtzw.com/api/v1/chapter/content?${buildParams}&sign=${sign}`;
                const headerSign = CryptoJS.MD5("app-version=71900application-id=com.kmxs.readerplatform=android" + secret).toString();

                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: apiUrl,
                        headers: {
                            "platform": "android",
                            "app-version": "71900",
                            'application-id': 'com.kmxs.reader',
                            'sign': headerSign,
                            'user-agent': 'webviewversion/0'
                        },
                        onload: (res) => {
                            try {
                                const $ = JSON.parse(res.responseText);

                                if ($.data && $.data.content) {
                                    const rawBase64 = $.data.content;
                                    console.log('Qimao: content length', rawBase64.length);
                                    const binaryString = atob(rawBase64);
                                    const bytes = new Uint8Array(binaryString.length);
                                    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

                                    const iv = bytes.slice(0, 16);
                                    const ciphertext = bytes.slice(16);
                                    // Key: "242ccb8230d709e1" (ASCII for hex 3234...)
                                    const key = new TextEncoder().encode("242ccb8230d709e1");

                                    if (window.AES && window.AES.aesCbcDecrypt) {
                                        let decrypted;
                                        try {
                                            decrypted = window.AES.aesCbcDecrypt(ciphertext, key, iv);
                                        } catch (decryptErr) {
                                            console.error("Qimao: Decryption failed", decryptErr);
                                            // Try standard CryptoJS if window.AES fails or is different from expected
                                            try {
                                                const keyHex = CryptoJS.enc.Utf8.parse("242ccb8230d709e1");
                                                const ivHex = CryptoJS.lib.WordArray.create(iv);
                                                const encryptedParams = CryptoJS.lib.WordArray.create(ciphertext);
                                                const decryptedParams = CryptoJS.AES.decrypt(
                                                    { ciphertext: encryptedParams },
                                                    keyHex,
                                                    { iv: ivHex, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
                                                );
                                                const decryptedText = decryptedParams.toString(CryptoJS.enc.Utf8);
                                                if (decryptedText) {
                                                    const formatted = decryptedText.trim().replace(/\n/g, '<br>');
                                                    resolve({ title: $.data.title || chapterInfo.title, content: formatted });
                                                    return;
                                                }
                                            } catch (cryptoJSErr) {
                                                console.error("Qimao: Fallback CryptoJS decryption failed", cryptoJSErr);
                                            }
                                            throw decryptErr;
                                        }

                                        const unpadded = window.AES.pkcs7Unpad(decrypted);
                                        const text = new TextDecoder().decode(unpadded);
                                        const formatted = text.trim().replace(/\n/g, '<br>');
                                        resolve({ title: $.data.title || chapterInfo.title, content: formatted });
                                    } else {
                                        // Fallback to CryptoJS
                                        console.log('Qimao: using CryptoJS fallback');
                                        const keyHex = CryptoJS.enc.Utf8.parse("242ccb8230d709e1");
                                        const ivHex = CryptoJS.lib.WordArray.create(iv);
                                        const encryptedParams = CryptoJS.lib.WordArray.create(ciphertext);
                                        const decryptedParams = CryptoJS.AES.decrypt(
                                            { ciphertext: encryptedParams },
                                            keyHex,
                                            { iv: ivHex, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
                                        );
                                        const text = decryptedParams.toString(CryptoJS.enc.Utf8);
                                        const formatted = text.trim().replace(/\n/g, '<br>');
                                        resolve({ title: $.data.title || chapterInfo.title, content: formatted });
                                    }
                                } else {
                                    console.error('Qimao: API Error data', $);
                                    reject(new Error("API Error: " + ($.msg || "Unknown error or no content")));
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            }
        }
// @rule-end
)
