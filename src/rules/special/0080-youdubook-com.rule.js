// @rule-name: 有毒小说网/息壤中文网
// @rule-source: special
(
// @rule-begin
        { // https://www.youdubook.com/ https://www.xrzww.com/
            siteName: '有毒小说网/息壤中文网',
            url: '://www.(youdubook|xrzww).com/bookdetail/\\d+',
            title: '.novel_name>span',
            writer: '.novel_author>span:nth-child(1)',
            intro: '.novel_text',
            cover: '.bookcover',
            getChapters: async (doc) => {
                const urlArr = window.location.href.split('/');

                const res = await xhr.sync(`${window.location.origin.replace('www', 'pre-api')}/api/directoryList?nid=${urlArr[4]}&orderBy=0`);
                const json = JSON.parse(res.responseText);
                const chapters = json.data.data;
                const volumes = json.data.volume;
                return chapters.sort((a, b) => Math.sign(volumes.find((i) => i.volume_id === a.chapter_vid).volume_order - volumes.find((i) => i.volume_id === b.chapter_vid).volume_order)).map((i) => ({
                    url: `${window.location.origin.replace('www', 'pre-api')}/api/readNew?nid=${urlArr[4]}&vid=${i.chapter_vid}&chapter_id=${i.chapter_id}&chapter_order=${i.chapter_order}&showpic=false`,
                    title: i.chapter_name,
                    vip: i.chapter_ispay,
                    volume: volumes.find((j) => j.volume_id === i.chapter_vid).volume_name,
                }));
            },
            content: (doc, res, request) => JSON.parse(res.response).data.content,
        }
// @rule-end
)
