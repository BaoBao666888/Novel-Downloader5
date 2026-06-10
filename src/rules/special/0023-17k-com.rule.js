// @rule-name: 17K
// @rule-source: special
(
// @rule-begin
        { // https://www.17k.com/
            siteName: '17K',
            url: /www.17k.com\/list\/\d+.html/,
            chapterUrl: /www.17k.com\/chapter\/\d+\/\d+.html/,
            infoPage: '.infoPath a:nth-child(4)',
            title: '.Info>h1',
            writer: '.AuthorInfo .name',
            intro: '.intro>a',
            cover: '.cover img',
            chapter: 'dl.Volume>dd>a',
            vipChapter: 'dl.Volume>dd>a:has(.vip)',
            volume: '.Volume>dt>.tit',
            chapterTitle: 'h1',
            content: '.p',
            elementRemove: '.copy,.qrcode',
        }
// @rule-end
)
