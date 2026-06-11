// @rule-name: 爱下电子书
// @rule-source: special
(
// @rule-begin
        { // https://www.aixdzs.com/novel/*
            siteName: '爱下电子书',
            url: '://www\\.aixdzs\\.com/novel/[^/?#]+',
            chapterUrl: '://www\\.aixdzs\\.com/read/\\d+/\\d+/p\\d+\\.html',
            title: '.d_info > h1',
            writer: '.d_ac > ul:nth-child(1) > li:nth-child(1) > a:nth-child(2)',
            intro: '.d_co',
            cover: '.d_af > img',
            chapter: '#i-chapter li.chapter > a',
            volume: '#i-chapter li.volume',
            chapterTitle: 'h1',
            content: '.content',
        }
// @rule-end
)
