// @rule-name: 读书网
// @rule-source: special
(
// @rule-begin
        { // https://www.dushu.com/showbook/*
            siteName: '读书网',
            filter: () => {
                if (window.location.host !== 'www.dushu.com') return 0;
                if (document.querySelector('table.booklist-table a[href*="/showbook/"][href$=".html"]')) return 1;
                if (document.querySelector('div.content_txt')) return 2;
                return 0;
            },
            title: 'div.book-title > h1',
            writer: (doc) => {
                const cells = Array.from(doc.querySelectorAll('table td'));
                const label = cells.find((td) => /^作\s*者/.test(td.textContent.trim()));
                return label && label.nextElementSibling ? label.nextElementSibling.textContent.trim() : '';
            },
            intro: 'div.book-summary div.txtsummary',
            cover: (doc) => {
                const src = $('div.book-pic img', doc).first().attr('src') || '';
                return src ? Rule.helpers.absoluteUrl(src.replace(/_200\.jpg$/, ''), location.href) : '';
            },
            chapter: 'table.booklist-table a[href*="/showbook/"][href$=".html"]',
            volume: 'div.book-chapter',
            chapterTitle: 'p.text-center.text-large, h1',
            content: 'div.content_txt',
            elementRemove: 'ins, iframe, script, style',
        }
// @rule-end
)
