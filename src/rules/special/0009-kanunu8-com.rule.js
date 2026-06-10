// @rule-name: 努努书坊
// @rule-source: special
(
// @rule-begin
        { // https://www.kanunu8.com/book2/11107/index.html
            siteName: '努努书坊',
            filter: () => (window.location.href.match(/kanunu8.com\/book2/) ? ($('.book').length ? 1 : 2) : 0),
            title: '.book>h1',
            writer: '.book>h2>a',
            intro: '.description>p',
            chapter: '.book>dl>dd>a',
            volume: '.book>dl>dt',
            content: '#Article>.text',
            elementRemove: 'table,a',
        }
// @rule-end
)
