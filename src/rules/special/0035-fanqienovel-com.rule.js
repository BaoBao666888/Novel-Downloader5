// @rule-name: 番茄小说 (Fanqie)
// @rule-source: special
(
// @rule-begin
        { // https://fanqienovel.com/
            siteName: '番茄小说 (Fanqie)', // ID duy nhất để tìm rule này
            url: '://fanqienovel.com/page/\\d+',
            chapterUrl: '://fanqienovel.com/reader/\\d+',
            filter: () => {
                if (window.location.pathname.startsWith('/page/')) return 1;
                if (window.location.pathname.startsWith('/reader/')) return 2;
                return 0;
            },

            _internalGetFanqieApiData: async function (ruleObject) {
                const cacheKey = '_cachedFanqieBookApiData';
                if (ruleObject[cacheKey]) return ruleObject[cacheKey];

                const bookIdMatch = window.location.pathname.match(/\/(?:page|reader)\/(\d+)/);
                if (!bookIdMatch) { console.error("Fanqie Rule: Không thể lấy bookId."); return null; }
                const bookId = bookIdMatch[1];
                const apiUrl = `https://api5-normal-sinfonlineb.fqnovel.com/reading/bookapi/multi-detail/v/?aid=2329&iid=1&version_code=999&book_id=${bookId}`;

                try {
                    const res = await xhr.sync(apiUrl, null, { method: 'GET', responseType: 'json' });
                    if (res.response?.data?.[0]) {
                        ruleObject[cacheKey] = res.response.data[0]; // Cache vào đối tượng rule
                        return ruleObject[cacheKey];
                    }
                    console.error("Fanqie Rule: API sách không trả về dữ liệu.", res.response);
                } catch (error) { console.error("Fanqie Rule: Lỗi API sách:", error); }
                return null;
            },
            getFanqieRule: () => Rule.special.find(r => r.siteName === '番茄小说 (Fanqie)'),

            title: async () => {
                const currentRule = Rule.special.find(r => r.siteName === '番茄小说 (Fanqie)');
                if (!currentRule) return '';
                const data = await currentRule._internalGetFanqieApiData(currentRule);
                return data?.book_name || '';
            },
            writer: async () => {
                const currentRule = Rule.special.find(r => r.siteName === '番茄小说 (Fanqie)');
                if (!currentRule) return '';
                const data = await currentRule._internalGetFanqieApiData(currentRule);
                return data?.author || '';
            },
            intro: async () => {
                const currentRule = Rule.special.find(r => r.siteName === '番茄小说 (Fanqie)');
                if (!currentRule) return '';
                const data = await currentRule._internalGetFanqieApiData(currentRule);
                return (data?.abstract || '') + '\nLink cover: ' + (data?.thumb_url || '');
            },
            cover: async () => {
                const currentRule = Rule.special.find(r => r.siteName === '番茄小说 (Fanqie)');
                if (!currentRule) return '';
                const data = await currentRule._internalGetFanqieApiData(currentRule);
                return data?.thumb_url || '';
            },

            chapter: '.page-directory-content a.chapter-item-title',
            vipChapter: '.page-directory-content .chapter-item:has(span.chapter-item-lock) > a.chapter-item-title',

            deal: async (chapterInfo) => {
                const chapIdMatch = chapterInfo.url.match(/\/reader\/(\d+)/);
                if (!chapIdMatch) {
                    console.error(`Fanqie Deal: Lỗi URL: ${chapterInfo.url}`);
                    return { title: chapterInfo.title + " (Lỗi URL)", content: "" };
                }
                const chapId = chapIdMatch[1];

                const currentRule = Rule.special.find(r => r.siteName === '番茄小说 (Fanqie)');
                if (!currentRule) {
                    console.error("Fanqie Deal: Không tìm thấy rule Fanqie để xử lý.");
                    return { title: chapterInfo.title + " (Lỗi cấu hình)", content: "" };
                }

                function extractData(responseData, currentChapId, defaultTitle) {
                    let content = null, title = defaultTitle;
                    if (!responseData) return { title, content };
                    const R = responseData;
                    content = R.content || R.data?.content || R.data?.data?.content || R.chapter?.content || R.text;
                    if (!content && R.data?.[currentChapId]?.content) content = R.data[currentChapId].content;
                    if (!content && R[currentChapId]?.content) content = R[currentChapId].content;
                    if (typeof content === 'object' && content !== null && content.value) content = content.value;
                    title = R.title || R.data?.title || R.data?.data?.title || R.chapter?.title ||
                        R.data?.[currentChapId]?.title || R[currentChapId]?.title || defaultTitle;
                    if (content === "今日次数上限") content = "";
                    return { title, content };
                }

                function fixQuotes(text) {
                    if (!text || !/＂/.test(text)) {
                        return text;
                    }
                    console.log("Fanqie fixQuotes: Phát hiện dấu ＂, chỉnh sửa.");
                    let normalized = text.replace(/[＂“”]/g, '"');
                    let quoteCount = (normalized.match(/"/g) || []).length;
                    if (quoteCount % 2 === 0) {
                        let isOpen = true;
                        return normalized.replace(/"/g, () => {
                            const q = isOpen ? '“' : '”';
                            isOpen = !isOpen;
                            return q;
                        });
                    }
                    console.log("Fanqie fixQuotes: Phát hiện số lượng dấu ngoặc kép lẻ, chỉ sửa dấu ＂.");
                    let isOpen = true;
                    // Tìm dấu ngoặc kép cuối cùng để quyết định trạng thái mở/đóng
                    const lastQuoteIndex = Math.max(text.lastIndexOf('“'), text.lastIndexOf('”'));
                    if (lastQuoteIndex !== -1) {
                        isOpen = text[lastQuoteIndex] === '”'; // Nếu cái cuối là đóng, thì cái tiếp theo sẽ là mở
                    }
                    return text.replace(/＂/g, () => {
                        const q = isOpen ? '“' : '”';
                        isOpen = !isOpen;
                        return q;
                    });
                }

                function generateCookie() {
                    const base = 1000000000000000000;
                    return "novel_web_id=" + (base * 6 + Math.floor(Math.random() * (base * 3)));
                }

                function decodeText(text) {
                    const CODE_ST = 58344, CODE_ED = 58715;
                    const CHARSET = ['D', '在', '主', '特', '家', '军', '然', '表', '场', '4', '要', '只', 'v', '和', '?', '6', '别', '还', 'g', '现', '儿', '岁', '?', '?', '此', '象', '月', '3', '出', '战', '工', '相', 'o', '男', '首', '失', '世', 'F', '都', '平', '文', '什', 'V', 'O', '将', '真', 'T', '那', '当', '?', '会', '立', '些', 'u', '是', '十', '张', '学', '气', '大', '爱', '两', '命', '全', '后', '东', '性', '通', '被', '1', '它', '乐', '接', '而', '感', '车', '山', '公', '了', '常', '以', '何', '可', '话', '先', 'p', 'i', '叫', '轻', 'M', '士', 'w', '着', '变', '尔', '快', 'l', '个', '说', '少', '色', '里', '安', '花', '远', '7', '难', '师', '放', 't', '报', '认', '面', '道', 'S', '?', '克', '地', '度', 'I', '好', '机', 'U', '民', '写', '把', '万', '同', '水', '新', '没', '书', '电', '吃', '像', '斯', '5', '为', 'y', '白', '几', '日', '教', '看', '但', '第', '加', '候', '作', '上', '拉', '住', '有', '法', 'r', '事', '应', '位', '利', '你', '声', '身', '国', '问', '马', '女', '他', 'Y', '比', '父', 'x', 'A', 'H', 'N', 's', 'X', '边', '美', '对', '所', '金', '活', '回', '意', '到', 'z', '从', 'j', '知', '又', '内', '因', '点', 'Q', '三', '定', '8', 'R', 'b', '正', '或', '夫', '向', '德', '听', '更', '?', '得', '告', '并', '本', 'q', '过', '记', 'L', '让', '打', 'f', '人', '就', '者', '去', '原', '满', '体', '做', '经', 'K', '走', '如', '孩', 'c', 'G', '给', '使', '物', '?', '最', '笑', '部', '?', '员', '等', '受', 'k', '行', '一', '条', '果', '动', '光', '门', '头', '见', '往', '自', '解', '成', '处', '天', '能', '于', '名', '其', '发', '总', '母', '的', '死', '手', '入', '路', '进', '心', '来', 'h', '时', '力', '多', '开', '己', '许', 'd', '至', '由', '很', '界', 'n', '小', '与', 'Z', '想', '代', '么', '分', '生', '口', '再', '妈', '望', '次', '西', '风', '种', '带', 'J', '?', '实', '情', '才', '这', '?', 'E', '我', '神', '格', '长', '觉', '间', '年', '眼', '无', '不', '亲', '关', '结', '0', '友', '信', '下', '却', '重', '己', '老', '2', '音', '字', 'm', '呢', '明', '之', '前', '高', 'P', 'B', '目', '太', 'e', '9', '起', '稜', '她', '也', 'W', '用', '方', '子', '英', '每', '理', '便', '西', '数', '期', '中', 'C', '外', '样', 'a', '海', '们', '任']
                    let decodedText = "";
                    for (let i = 0; i < text.length; i++) {
                        const code = text.charCodeAt(i);
                        if (CODE_ST <= code && code <= CODE_ED) {
                            decodedText += CHARSET[code - CODE_ST] || text[i];
                        } else {
                            decodedText += text[i];
                        }
                    }
                    return decodedText;
                }

                const timeout = typeof Config !== 'undefined' && Config.timeout ? Config.timeout : 15000;
                const apiConfigs = unsafeWindow.tokenOptions?.Fanqie;

                const doubiDomains = [
                    "api.langge.cf",
                    "api.doubi.tk",
                    "20.langge.tk",
                    "v2.dahuilang.cf",
                    "vip.langge.cf:45800",
                    "219.154.201.122:5006"
                ];

                function isDoubiDomain(url) {
                    return doubiDomains.some(domain => url.includes(domain));
                }

                let apiList = [];
                const addedUrls = new Set();

                // Hàm để thêm một URL vào danh sách nếu chưa có
                const addApiToList = (url, key) => {
                    const finalUrl = url.toString();
                    if (!addedUrls.has(finalUrl)) {
                        apiList.push({ url: finalUrl, key: key });
                        addedUrls.add(finalUrl);
                    }
                };

                if (typeof apiConfigs === 'string' && apiConfigs.includes('{chapter_id}')) {
                    addApiToList(apiConfigs.replace(/{chapter_id}/g, chapId));
                } else if (Array.isArray(apiConfigs)) {
                    // Thêm các URL từ cấu hình người dùng
                    for (const item of apiConfigs) {
                        if (!item?.url) continue;

                        let userUrlStr = item.url.replace(/{chapter_id}/g, chapId);
                        const u = new URL(userUrlStr, location.origin);

                        if (isDoubiDomain(userUrlStr)) {
                            // Chuẩn hóa các tham số cho domain doubi
                            if (!u.searchParams.has('item_id')) u.searchParams.set('item_id', chapId);
                            u.searchParams.set('source', '番茄');
                            u.searchParams.set('tab', '小说');
                            u.searchParams.set('version', '4.6.29');
                        }
                        addApiToList(u.toString(), item.key);
                    }
                }

                for (const { url, key } of apiList) {
                    console.log(`Fanqie Deal: Thử API: ${url}`);
                    try {
                        const headers = {};
                        if (isDoubiDomain(url)) {
                            if (!key) {
                                alert(`⚠️ Thiếu key (qttoken) cho API ${url}!\nVui lòng thêm vào tokenOptions.Fanqie.`);
                                continue;
                            }
                            headers.cookie = `qttoken=${key}`;
                        }

                        const res = await xhr.sync(url, null, {
                            method: 'GET',
                            headers,
                            responseType: 'json',
                            timeout
                        });

                        const { title, content } = extractData(res?.response, chapId, chapterInfo.title);
                        if (validateContent(content)) {
                            console.log(`Fanqie Deal: Thành công từ ${url}`);
                            const fixedContent = fixQuotes(content);
                            if (content !== fixedContent) {
                                console.log("Fanqie Deal: Đã sửa lại dấu ngoặc kép trong chương.");
                            }
                            return { title, content: fixedContent };
                        }
                    } catch (e) {
                        console.warn(`Fanqie Deal: Lỗi từ ${url}:`, e.message);
                    }
                }

                //fallback cho chương không VIP nếu tất cả API thất bại
                const isVip = $(`a[href*="/reader/${chapId}"]`).closest('.chapter-item').find('.chapter-item-lock').length > 0;
                if (!isVip) { // Chỉ fallback khi không có API hoặc tất cả API đã fail
                    console.log(`Fanqie Deal: Không có API hoặc tất cả API thất bại, thử fallback cho chương free ${chapId}...`);
                    try {
                        const readerUrl = "https://fanqienovel.com/reader/" + chapId;
                        const cookie = generateCookie();
                        const readerResp = await xhr.sync(readerUrl, null, {
                            method: "GET",
                            headers: {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.0.0 Safari/537.36",
                                "Cookie": cookie
                            },
                            responseType: 'text' // Yêu cầu response dạng text để parse HTML
                        });

                        const html = readerResp.response;
                        const contentMatch = html.match(/<div class="muye-reader-content.*?">(.*?)<\/div>/s); // Thêm flag 's' để . khớp cả ký tự xuống dòng
                        if (contentMatch && contentMatch[1]) {
                            let rawText = contentMatch[1];
                            const decodedContent = decodeText(rawText);
                            console.log("Fanqie Deal: Fallback thành công!");
                            const fixedContent = fixQuotes(decodedContent);
                            if (decodedContent !== fixedContent) {
                                console.log("Fanqie Deal: Đã sửa lại dấu ngoặc kép trong chương (fallback).");
                            }
                            return { title: chapterInfo.title, content: fixedContent };
                        }
                    } catch (e) {
                        console.error("Fanqie Deal: Fallback thất bại:", e);
                    }
                }

                console.error(`Fanqie Deal: Không thể tải nội dung cho chapterId ${chapId}.`);
                return { title: chapterInfo.title + " (Lỗi tải)", content: "" };
            },

        }
// @rule-end
)
