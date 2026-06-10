// @rule-name: UUks
// @rule-source: special
(
// @rule-begin
        // 文学
        { //https://www.uuks.org/
            siteName: 'UUks',
            filter: () => (window.location.host === 'www.uuks.org' ? ($('div.box_con li a').length ? 1 : 2) : 0),
            url: '://www.uuks.org/b/\\d+/$',
            chapterUrl: '://www.uuks.org/b/\\d+/\\d+.html$',
            title: 'dd.jieshao_content > h1 > a',
            writer: () => {
                const writerElem = $('dd.jieshao_content > h2');
                return writerElem.length ? writerElem.text().replace('作者：', '').trim() : '';
            },
            intro: () => {
                const introElem = $('dd.jieshao_content > h3');
                if (introElem.length) {
                    let text = introElem.text().replace('简介：', '').trim();
                    //     // // Nếu có dấu ngắt dòng <br> thì lấy hết luôn
                    //     introElem.find('br').each((_, br) => {
                    //         text += '<br>';
                    // });
                    return text;
                }
                return '';
            },
            chapter: 'div.box_con > li > a',
            chapterTitle: 'div.h1title > h1',
            content: 'div#contentbox',
            elementRemove: '',
            chapterPrev: '.fanye_cen a:contains("上一章")',
            chapterNext: '.fanye_cen a:contains("下一章")',
        }
// @rule-end
)
