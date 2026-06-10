// @rule-name: 漫画柜
// @rule-source: special
(
// @rule-begin
        { // https://www.manhuagui.com/
            siteName: '漫画柜',
            url: '://www.manhuagui.com/comic/\\d+/$',
            chapterUrl: '://www.manhuagui.com/comic/\\d+/\\d+.html',
            title: '.book-title>h1',
            writer: '.detail-list [href^="/author/"]',
            intro: '#intro-all',
            cover: '.book-cover>.hcover>img',
            chapter: '.chapter-list a',
            volume: 'h4>span',
            chapterTitle: '.title h2',
            content: (doc, res, request) => {
                let info = res.responseText.match(/window\["\\x65\\x76\\x61\\x6c"\](.*?)<\/script>/)[1];
                info = window.eval(info); // eslint-disable-line no-eval
                info = info.match(/^SMH.imgData(.*?).preInit\(\);/)[1];
                info = window.eval(info); // eslint-disable-line no-eval
                const a = info.files.map((item, index, arr) => `<img src="https://us.hamreus.com${info.path}${item}?e=${info.sl.e}&m=${info.sl.m}" /><p class="img_info">(${index + 1}/${arr.length})</p>`);
                return a.join('');
            },
            contentReplace: [
                [/<img id="img_\d+" style=".*?" data-original="(.*?)" src=".*?">/g, '<img src="$1">'],
            ],
        }
// @rule-end
)
