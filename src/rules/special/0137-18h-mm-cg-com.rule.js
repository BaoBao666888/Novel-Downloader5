// @rule-name: 18H
// @rule-source: special
(
// @rule-begin
        { // https://18h.mm-cg.com/novel/index.htm
            siteName: '18H',
            filter: () => ($('meta[content*="18AV"],meta[content*="18av"]').length ? (window.location.href.match(/novel_\d+.html/) ? 2 : 1) : 0),
            title: '.label>div',
            chapter: '.novel_leftright>span>a:visible',
            chapterTitle: 'h1',
            content: '#novel_content_txtsize',
        }
// @rule-end
)
