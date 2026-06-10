// @rule-name: 凤鸣轩小说网
// @rule-source: special
(
// @rule-begin
        { // https://www.fmx.cn/
            siteName: '凤鸣轩小说网',
            url: '://read.fmx.cn/files/article/html/[\\d/]+/index.html',
            chapterUrl: '://read.fmx.cn/files/article/html/[\\d/]+.html',
            infoPage: '.art_fnbox_sy>a,strong>a',
            title: 'h1>span',
            writer: 'h1>span:nth-child(2)',
            intro: '#zjp',
            cover: 'img[onerror]',
            chapter: '.art_fnlistbox>span>a:visible,.art_fnlistbox_vip>ul>li>span>a:visible',
            vipChapter: '.art_fnlistbox_vip>ul>li>span>a:visible',
            chapterTitle: 'h1',
            content: '#content',
            elementRemove: 'div,p:last',
        }
// @rule-end
)
