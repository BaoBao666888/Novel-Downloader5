// @rule-name: 长佩文学网
// @rule-source: special
(
// @rule-begin
        { // https://www.gongzicp.com/
            siteName: '长佩文学网',
            url: '://www.gongzicp.com/novel-\\d+.html',
            chapterUrl: '://www.gongzicp.com/read-\\d+.html',
            title: '.info-right .name',
            writer: '.author-name',
            intro: '.info-text>.content',
            cover: '.cover>img',
            chapterTitle: '.title>.name',
            popup: async () => waitFor(() => $('.cp-reader .content>p:not(.watermark)').length, 5 * 1000),
            content: '.cp-reader .content',
            elementRemove: '.cp-hidden,.watermark',
            thread: 1,
            getChapters: async (doc) => {
                const info = window.location.href.match(/\/(novel|read)-(\d+)/);
                const res = await xhr.sync(`https://webapi.gongzicp.com/novel/novelGetInfo?id=${info[2]}`);
                const json = JSON.parse(res.responseText);
                const chapters = [];
                let volume = '';
                for (let i = 0; i < json.data.chapterList.length; i++) {
                    if (json.data.chapterList[i].type === 'volume') {
                        volume = json.data.chapterList[i].name;
                    } else if (json.data.chapterList[i].type === 'item') {
                        chapters.push({
                            title: json.data.chapterList[i].name,
                            url: `https://www.gongzicp.com/read-${json.data.chapterList[i].id}.html`,
                            vip: json.data.chapterList[i].pay,
                            volume,
                        });
                    }
                }
                return chapters;
            },
        }
// @rule-end
)
