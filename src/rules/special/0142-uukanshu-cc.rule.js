// @rule-name: UU看书繁体
// @rule-source: special
(
// @rule-begin
        { // https://uukanshu.cc
            siteName: 'UU看书繁体',
            filter: () => {
                if (window.location.host !== 'uukanshu.cc') return 0;
                if (document.querySelector('dd > a[href*="/book/"]')) return 1;
                if (document.querySelector('.readcotent')) return 2;
                return 0;
            },
            title: 'h1',
            writer: 'a[href*="authorarticle"]',
            intro: (doc) => {
                const h1 = doc.querySelector('h1');
                const parent = h1?.parentElement;
                const intro = Array.from(parent?.querySelectorAll('p') || []).find((p) => {
                    const text = (p.textContent || '').trim();
                    return text.length > 50 && !text.startsWith('最新章節') && !text.startsWith('更新時間');
                });
                return intro ? intro.textContent.trim() : '';
            },
            cover: 'img[alt]',
            chapter: 'dd > a[href*="/book/"]',
            chapterTitle: 'h1, .readtitle',
            content: '.readcotent',
            elementRemove: 'iframe, ins, .ad_content, script, style',
        }
// @rule-end
)
