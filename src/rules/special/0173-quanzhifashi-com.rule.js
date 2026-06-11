// @rule-name: 全职小说网
// @rule-source: special
(
// @rule-begin
        { // http://www.quanzhifashi.com/novel/*
            siteName: '全职小说网',
            filter: () => {
                if (window.location.host !== 'www.quanzhifashi.com') return 0;
                if (document.querySelector('div.ml_list > ul > li > a')) return 1;
                if (document.querySelector('.articlecontent')) return 2;
                return 0;
            },
            title: 'div.introduce > h1',
            writer: 'div.introduce > p.bq > span:nth-child(2) > a',
            intro: 'div.introduce > p.jj',
            cover: 'div.pic > img',
            chapter: 'div.ml_list > ul > li > a',
            chapterTitle: 'h1, .bookname h1',
            content: '.articlecontent',
            elementRemove: 'br',
            contentReplace: [
                ['一秒记住m.quanzhifashｉ。com', ''],
                ['ｍ．ｑuanzhifashｉ．com', ''],
                ['ｈttp://m.quanzhifashi.com首发', ''],
            ],
        }
// @rule-end
)
