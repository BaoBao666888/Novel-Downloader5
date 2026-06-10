// @rule-name: ixdzs
// @rule-source: special
(
// @rule-begin

        {
            siteName: 'ixdzs',
            filter: () => {
                if (/(ixdzs8\.com|ixdzs\.tw)\/read\/\d+\/$/.test(window.location.href)) {
                    const btn = document.querySelector('li.catalog-all');
                    if (btn) {
                        btn.click();
                        console.log('[ND5] catalog-all clicked');
                    } else {
                        console.log('[ND5] catalog-all not found');
                    }
                    return 1; // trang mục lục
                }
                if (/(ixdzs8\.com|ixdzs\.tw)\/read\/\d+\/\w+\.html$/.test(window.location.href)) return 2;
                return 0;
            },
            cover: 'div.novel div.n-img img',
            title: 'div.novel div.n-text h1',
            writer: 'div.novel div.n-text a.bauthor',
            intro: 'p#intro',
            chapter: 'div.clist ul.u-chapter a',
            chapterTitle: 'article.page-content h3',
            content: 'article.page-content section',
            chapterNext: '.chapter-act a:contains("上一章")',
            chapterNext: '.chapter-act a:contains("下一章")'
        }
// @rule-end
)
