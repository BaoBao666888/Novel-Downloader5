// @rule-name: 全书斋
// @rule-source: special
(
// @rule-begin
        { // https://www.quanshuzhai.com/book/*.html
            siteName: '全书斋',
            filter: () => {
                if (window.location.host !== 'www.quanshuzhai.com') return 0;
                if (document.querySelector('#list-chapterAll > dd > a')) return 1;
                if (document.querySelector('.readcontent')) return 2;
                return 0;
            },
            title: '.booktitle',
            writer: 'a.red',
            intro: '.bookintro',
            chapter: '#list-chapterAll > dd > a',
            chapterTitle: 'h1, .readtitle',
            content: '.readcontent',
        }
// @rule-end
)
