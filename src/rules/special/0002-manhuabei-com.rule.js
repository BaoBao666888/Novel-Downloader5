// @rule-name: 漫画堆
// @rule-source: special
(
// @rule-begin
        { // https://www.manhuabei.com/ https://www.manhuafen.com/
            siteName: '漫画堆',
            filter: () => ($('.dmzj-logo').length && $('.wrap_intro_l_comic').length && $('.wrap_intro_r').length && $('.list_con_li').length
                ? 1
                : $('.foot-detail:contains("漫画")').length && $('.dm_logo').length && $('.chapter-view').length ? 2 : 0),
            title: '.comic_deCon>h1',
            writer: '.comic_deCon_liO>li>a[href^="/author/"]',
            intro: '.comic_deCon_d',
            cover: '.comic_i_img>img',
            chapter: '.list_con_li>li>a',
            volume: '.zj_list_head>h2>em',
            chapterTitle: '.head_title>h2',
            iframe: (win) => $('<div class="nd3-images">').html(win.chapterImages.map((item, index, arr) => `<img data-src="${win.SinMH.getChapterImage(index + 1)}" /><p class="img_info">(${index + 1}/${arr.length})</p>`).join('')).appendTo(win.document.body),
            content: '.nd3-images',
            contentReplace: [
                [/<img data-src/g, '<img src'],
            ],
        }
// @rule-end
)
