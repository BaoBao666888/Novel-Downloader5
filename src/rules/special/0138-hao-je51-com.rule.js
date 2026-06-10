// @rule-name: je51
// @rule-source: special
(
// @rule-begin
        { // https://hao.je51.com/ https://je51.com/
            siteName: 'je51',
            url: '://(hao.)?je51.com/st_l.en/st_did.l--.*?.html',
            chapterUrl: '://(hao.)?je51.com/st_l.en/st_did.d--.*?--\\d+.html',
            title: '.story-list-title',
            writer: '#module8>.story-cat-list .author>a',
            intro: '#module8>.story-cat-list .text',
            chapter: '.story-list .container>.autocol>a',
            chapterTitle: '#module8>.navlinks>.navtitle:last',
            content: '#story-text',
        }
// @rule-end
)
