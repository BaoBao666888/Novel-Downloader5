// @rule-name: 努努书坊
// @rule-source: special
(
// @rule-begin
        { // https://www.kanunu8.com
            siteName: '努努书坊',
            filter: () => (window.location.host === 'www.kanunu8.com' ? ($(['body>div:nth-child(1)>table:nth-child(10)>tbody>tr:nth-child(4)>td>table:nth-child(2)>tbody>tr>td>a', 'body>div>table>tbody>tr>td>table>tbody>tr>td>table:not(:has([class^="p"])) a'].join(',')).length ? 1 : 2) : 0),
            title: 'h1>strong>font,h2>b',
            writer: 'body > div:nth-child(1) > table:nth-child(10) > tbody > tr:nth-child(2) > td,body > div:nth-child(1) > table:nth-child(10) > tbody > tr > td:nth-child(2) > table:nth-child(2) > tbody > tr:nth-child(2) > td',
            intro: '[align="left"]>[class^="p"]',
            cover: 'img[height="160"]',
            chapter: ['body>div:nth-child(1)>table:nth-child(10)>tbody>tr:nth-child(4)>td>table:nth-child(2)>tbody>tr>td>a', 'body>div>table>tbody>tr>td>table>tbody>tr>td>table:not(:has([class^="p"])) a'].join(','),
            content: 'body > div:nth-child(1) > table:nth-child(5) > tbody > tr > td:nth-child(2) > p',
        }
// @rule-end
)
