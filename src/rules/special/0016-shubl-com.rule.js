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
            deal: async (chapter) => Rule.special.find((i) => i.siteName === '刺猬猫').deal(chapter),
            elementRemove: 'span',
            chapterPrev: '#J_BtnPagePrev',
            chapterNext: '#J_BtnPageNext',
            thread: 1,
        }
// @rule-end
)
