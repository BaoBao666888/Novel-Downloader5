// @rule-name: 暁
// @rule-source: special
(
// @rule-begin
        { // https://www.akatsuki-novels.com
            siteName: '暁',
            url: '://www\\.akatsuki-novels\\.com/stories/index/novel_id~\\d+',
            chapterUrl: '://www\\.akatsuki-novels\\.com/stories/view/\\d+/novel_id~\\d+',
            filter: () => {
                if (window.location.host !== 'www.akatsuki-novels.com') return 0;
                if (document.querySelector('#LookNovel') && document.querySelector('table.list td > a')) return 1;
                if (document.querySelector('.body-novel')) return 2;
                return 0;
            },
            title: '#LookNovel',
            writer: '.box.story > h3.font-bb:nth-last-of-type(1) > a',
            intro: '.box.story.body-normal > .body-normal > div',
            cover: 'div.font-bb > center > img',
            chapter: 'table.list td > a',
            chapterTitle: '#LookNovel, h2, .font-bb',
            content: '.body-novel',
            getChapters: async (doc) => {
                const chapters = [];
                let volume = '';
                doc.querySelectorAll('table.list tr').forEach((row) => {
                    const header = row.querySelector('td[colspan] > b');
                    if (header) {
                        volume = header.textContent.trim();
                        return;
                    }
                    row.querySelectorAll('td > a[href*="/stories/view/"]').forEach((link) => {
                        chapters.push({
                            title: link.textContent.trim(),
                            url: link.href,
                            volume,
                        });
                    });
                });
                return chapters;
            },
            deal: async (chapter) => {
                const doc = await Rule.helpers.requestDoc(chapter.url);
                doc.querySelectorAll('center > img').forEach((img) => {
                    const parent = img.parentElement;
                    if (parent) parent.replaceWith(img);
                });
                const content = document.createElement('div');
                const nodes = Array.from(doc.querySelectorAll('.body-novel, .body-novel + hr'));
                if (nodes.length > 1) {
                    const previous = nodes[0].previousElementSibling;
                    if (previous && previous.nodeName.toLowerCase() === 'div') nodes.unshift(previous);
                }
                nodes.forEach((node) => {
                    const clone = node.cloneNode(true);
                    if (clone instanceof HTMLDivElement && clone.className === 'body-novel') {
                        clone.innerHTML = clone.innerHTML
                            .replace(/\r?\n/g, '')
                            .replace(/<br\s*\/?>/gi, '</p><p>');
                        content.insertAdjacentHTML('beforeend', `<p>${clone.innerHTML}</p>`);
                    } else {
                        content.appendChild(clone);
                    }
                });
                return {
                    title: $('h2, #LookNovel, .font-bb', doc).first().text().trim() || chapter.title,
                    content: content.innerHTML,
                };
            },
            thread: 2,
        }
// @rule-end
)
