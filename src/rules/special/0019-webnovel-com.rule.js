// @rule-name: 起点国际
// @rule-source: special
(
// @rule-begin
        { // https://www.webnovel.com
            siteName: '起点国际',
            url: /webnovel.com\/book\/\d+(#contents)?$/,
            chapterUrl: /webnovel.com\/book\/\d+\/\d+/,
            title: 'h2',
            writer: 'address span',
            intro: '#about .g_txt_over',
            cover: '.det-info .g_thumb',
            chapter: '.content-list a',
            volume: '.volume-item>h4',
            content: '.cha-words',
            elementRemove: 'pirate',
        }
// @rule-end
)
