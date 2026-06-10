// @rule-name: 黄金屋中文
// @rule-source: special
(
// @rule-begin
        { // https://tw.hjwzw.com
            siteName: '黄金屋中文',
            url: 'hjwzw.com/Book/Chapter/\\d+',
            chapterUrl: 'hjwzw.com/Book/Read/\\d+,\\d+',
            title: 'h1',
            writer: '[title^="作者"]',
            chapter: '#tbchapterlist>table>tbody>tr>td>a',
            chapterTitle: 'h1',
            content: '#AllySite+div',
            elementRemove: 'a,b',
            contentReplace: [
                ['(请记|請記)住本站域名.*'],
            ],
        }
// @rule-end
)
