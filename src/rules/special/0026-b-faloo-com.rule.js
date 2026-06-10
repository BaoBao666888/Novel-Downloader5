// @rule-name: 飞卢
// @rule-source: special
(
// @rule-begin
        { // https://b.faloo.com
            siteName: '飞卢',
            url: /b.faloo.com\/\d+.html/,
            chapterUrl: /b.faloo.com\/\d+_\d+.html/,
            title: '#novelName',
            writer: '#novelName+a',
            intro: '.T-L-T-C-Box1',
            cover: '.imgcss',
            chapter: '#mulu .DivTable .DivTd>a',
            vipChapter: '#mulu .DivVip~.DivTable .DivTd>a',
            volume: '.C-Fo-Z-ML-TitleBox>h3',
            chapterTitle: '.c_l_title',
            content: '.noveContent',
            elementRemove: 'p:has(a,b,font)',
            vip: {
                content: (doc, res, request) => {
                    const doc1 = new window.DOMParser().parseFromString(res.responseText, 'text/html');
                    const func = $('script:contains("image_do3")', doc1).text();
                    /* eslint-disable camelcase */
                    if (!unsafeWindow.image_do3) {
                        unsafeWindow.image_do3 = function (num, o, id, n, en, t, k, u, time, fontsize, fontcolor, chaptertype, font_family_type) {
                            const type = 1;
                            let domain = '//read.faloo.com/';
                            if (chaptertype === 0) { domain = '//read6.faloo.com/'; }
                            if (type === 2) { domain = '//read2.faloo.com/'; }
                            if (typeof (font_family_type) === 'undefined' || font_family_type == null) {
                                font_family_type = 0;
                            }
                            let url = `${domain}Page4VipImage.aspx?num=${num}&o=${o}&id=${id}&n=${n}&ct=${chaptertype}&en=${en}&t=${t}&font_size=${fontsize}&font_color=${fontcolor}&FontFamilyType=${font_family_type}&u=${u}&time=${time}&k=${k}`;
                            url = encodeURI(url);
                            return url;
                        };
                    }
                    /* eslint-enable camelcase */
                    const image = window.eval(`window.${func}`); // eslint-disable-line no-eval
                    const elem = $('.noveContent', doc1);
                    elem.find('.con_img').replaceWith(`<img src="${image}">`);
                    return elem.html();
                },
            },
        }
// @rule-end
)
