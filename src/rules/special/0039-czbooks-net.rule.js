// @rule-name: czbooks
// @rule-source: special
(
// @rule-begin
        { // https://czbooks.net/n/xxxxx
            siteName: 'czbooks',
            filter: () => {
                if (!window.location.host.includes('czbooks.net')) return 0;
                if (window.location.pathname.match(/^\/n\/[^\/]+\/[^\/]+/)) return 2; // chapter page
                if (window.location.pathname.match(/^\/n\/[^\/]+$/)) return 1; // detail/toc page
                return 0;
            },
            title: (doc) => {
                const raw = $('.novel-detail .title', doc).text() || '';
                return raw.replace(/《/g, '').replace(/》/g, '').trim();
            },
            writer: '.novel-detail .author > a',
            intro: '.novel-detail .description',
            cover: '.thumbnail img',
            chapter: '#chapter-list li > a',
            content: '.content',
        }
// @rule-end
)
