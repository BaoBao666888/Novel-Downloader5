// @rule-name: 掌阅书城
// @rule-source: special
(
// @rule-begin
        { // https://www.ireader.com/
            siteName: '掌阅书城',
            url: '://www.ireader.com/index.php\\?ca=bookdetail.index&bid=\\d+$',
            chapterUrl: ':https://www.ireader.com/index.php\\?ca=Chapter.Index&pca=bookdetail.index&bid=\\d+&cid=\\d+',
            title: '.bookname>h2>a',
            writer: '.bookInfor .author',
            intro: '.bookinf03>p',
            cover: '.bookInfor>div>a>img',
            chapterTitle: '.content h2',
            content: '.content>.article',
            getChapters: async (doc) => {
                const bid = window.location.search.match(/&bid=(\d+)(&|$)/)[1];
                const chapters = [];
                let page = 0;
                let total = 0;
                while ((page = page + 1)) {
                    const res = await xhr.sync(`${window.location.origin}/index.php?ca=Chapter.List&ajax=1&bid=${bid}&page=${page}&pageSize=100`);
                    const json = JSON.parse(res.responseText);
                    for (const i of json.list) {
                        chapters.push({
                            title: i.chapterName,
                            url: `https://www.ireader.com/index.php?ca=Chapter.Index&pca=Chapter.Index&bid=${bid}&cid=${i.id}`,
                            vip: i.priceTag === '收费',
                        });
                    }
                    if (json.list[chapters.length - 1].priceTag === '收费') break;
                    total = total + json.list.length;
                    if (total >= json.page.total) break;
                }
                return chapters;
            },
        }
// @rule-end
)
