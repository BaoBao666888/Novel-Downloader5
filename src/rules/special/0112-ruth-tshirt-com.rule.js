// @rule-name: 老猫小说
// @rule-source: special
(
// @rule-begin
        { // https://www.ruth-tshirt.com/
            siteName: '老猫小说',
            filter: () => ($('[src="https://www.laomaoxs.com/static/image/qrcode.png"]').length && window.location.pathname.match(/\d+\.html$/) ? 1 : 0),
            // chapterUrl: '://www.ruth-tshirt.com/ruth1/\\d+/\\w+.html',
            title: ['.h1title > .shuming > a[title]', '.chapter_nav > div:first > a:last', '#header > .readNav > span > a:last', 'div[align="center"] > .border_b > a:last', '.ydselect > .weizhi > a:last', '.bdsub > .bdsite > a:last', '#sitebar > a:last', '.con_top > a:last', '.breadCrumb > a:last'].join(','),
            chapter: ['[id*="list"] a', '[class*="list"] a', '[id*="chapter"] a', '[class*="chapter"] a'].join(','),
            chapterTitle: '.chaptername',
            content: (doc, res, request) => {
                let content = $('.txt', res.responseText).html();
                const str = '的一是了我不人在他有这个上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学么之都好看起发当没成只如事把还用第样道想作种开美总从无情己面最女但现前些所同日手又行意动';
                content = content.replace(/[\ue800-\ue863]/g, (matched) => str[matched.charCodeAt(0) - 0xe800]);
                return content;
            },
        }
// @rule-end
)
