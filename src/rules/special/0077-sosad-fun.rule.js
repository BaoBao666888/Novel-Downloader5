// @rule-name: SosadFun|废文
// @rule-source: special
(
// @rule-begin
        { // https://sosad.fun/
            siteName: 'SosadFun|废文',
            url: '://(sosad.fun|xn--pxtr7m.com|xn--pxtr7m5ny.com)/threads/\\d+/(profile|chapter_index)',
            chapterUrl: '://(sosad.fun|xn--pxtr7m.com|xn--pxtr7m5ny.com)/posts/\\d+',
            title: '.font-1',
            writer: '.h5 a[href*="/users/"]',
            intro: '.article-body .main-text',
            chapter: '.panel-body .table th:nth-child(1)>a[href*="/posts/"]',
            chapterTitle: 'strong.h3',
            content: '.post-body>.main-text:nth-child(1)',
            elementRemove: 'div:last-child,.hidden',
        }
// @rule-end
)
