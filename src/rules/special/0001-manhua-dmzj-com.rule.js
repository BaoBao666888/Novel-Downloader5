// @rule-name: 动漫之家
// @rule-source: special
(
// @rule-begin
        { // https://manhua.dmzj.com/
            siteName: '动漫之家',
            url: '://manhua.dmzj.com/[a-z0-9]+/',
            chapterUrl: '://manhua.dmzj.com/[a-z0-9]+/\\d+.shtml',
            title: '.anim_title_text h1',
            writer: '.anim-main_list a[href^="../tags/"]',
            intro: '.line_height_content',
            cover: '#cover_pic',
            chapter: '[class^="cartoon_online_border"]>ul>li>a',
            volume: '.h2_title2>h2',
            chapterTitle: '.display_middle',
            content: '#center_box',
            iframe: true,
            contentReplace: [
                [/<img id="img_\d+" style=".*?" data-original="(.*?)" src=".*?">/g, '<img src="$1">'],
            ],
        }
// @rule-end
)
