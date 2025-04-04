/* eslint-env browser */
// ==UserScript==
// @name        novelDownloaderVietSub
// @description Menu Download Novel hoặc nhấp đúp vào cạnh trái của trang để hiển thị bảng điều khiển
// @version     3.5.446
// @author      dodying | VietSub by BaoBao
// @namespace   https://github.com/dodying/UserJs
// @supportURL  https://github.com/dodying/UserJs/issues
// @icon        https://gitee.com/dodying/userJs/raw/master/Logo.png
// @downloadURL https://github.com/BaoBao666888/Novel-Downloader5/raw/refs/heads/main/novelDownloaderVietSub.user.js
// @updateURL   https://github.com/BaoBao666888/Novel-Downloader5/raw/refs/heads/main/novelDownloaderVietSub.user.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.0/jquery.js

// @require     https://greasyfork.org/scripts/398502-download/code/download.js?version=977735

// @require     https://greasyfork.org/scripts/21541-chs2cht/code/chs2cht.js?version=605976
// @require     https://cdnjs.cloudflare.com/ajax/libs/jszip/3.0.0/jszip.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js
// @require     https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js

// @resource fontLib https://gitee.com/dodying/userJs/raw/master/novel/novelDownloader/SourceHanSansCN-Regular-Often.json?v=2


// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_getResourceText
// @run-at      document-end
// @connect     *
// @include     *
// @noframes
// ==/UserScript==

/* eslint-disable no-debugger  */
/* global $ xhr tranStr JSZip saveAs CryptoJS opentype */
; (function () { // eslint-disable-line no-extra-semi
  let fontLib;

  /*
    * interface Chapter {
    *   title?:      string;
    *   url?:        string;
    *   volume?:     string;
    *   document?:   string;
    *   contentRaw?: string;
    *   content?:    string;
    * }
  */

  let Storage = null;
  Storage = {
    debug: {
      book: false,
      content: false,
    },
    mode: null, // 1=index 2=chapter
    rule: null, // 当前规则
    book: {
      image: [],
    },
    xhr,
  };
  const Config = {
    thread: 5,
    retry: 3,
    timeout: 60000,
    reference: true,
    format: true,
    useCommon: true,
    modeManual: true,
    templateRule: true,
    volume: true,
    failedCount: 5,
    failedWait: 60,
    image: true,
    addChapterNext: true,
    removeEmptyLine: 'auto',
    css: 'body {\n  line-height: 130%;\n  text-align: justify;\n  font-family: \\"Microsoft YaHei\\";\n  font-size: 22px;\n  margin: 0 auto;\n  background-color: #CCE8CF;\n  color: #000;\n}\n\nh1 {\n  text-align: center;\n  font-weight: bold;\n  font-size: 28px;\n}\n\nh2 {\n  text-align: center;\n  font-weight: bold;\n  font-size: 26px;\n}\n\nh3 {\n  text-align: center;\n  font-weight: bold;\n  font-size: 24px;\n}\n\np {\n  text-indent: 2em;\n}',
    customize: '[]',
    ...GM_getValue('config', {}),
  };
  const Rule = {
    // 如无说明，所有可以为*选择器*都可以是async (doc)=>string
    //                              章节内async (doc,res,request)
    // 快速查找脚本的相应位置：rule.key

    // ?siteName
    siteName: 'Trang chủ web',

    // 以下三个必须有一个
    // ?url: string[]/regexp[]
    // ?chapterUrl: string[]/regexp[]
    // ?filter: function=> 0=notmatched 1=index 2=chapter
    url: [/(index|0|list|default)\.(s?html?|php)$/i],
    chapterUrl: [/\d+\/\d+\.(s?html?|php)$/i],

    // ?infoPage: 选择器 或 async (doc)=>url
    //  如果存在infoPage，则基本信息（title,writer,intro,cover）从infoPage页面获取
    //  当infoPage与当前页相同时，直接从当前页获取（极少数情况）

    // title 书籍名称:选择器
    title: ['.h1title > .shuming > a[title]', '.chapter_nav > div:first > a:last', '#header > .readNav > span > a:last', 'div[align="center"] > .border_b > a:last', '.ydselect > .weizhi > a:last', '.bdsub > .bdsite > a:last', '#sitebar > a:last', '.con_top > a:last', '.breadCrumb > a:last'].join(','),
    // titleRegExp 从<title>获取标题，返回$1
    titleRegExp: /^(.*?)(_|-|\(| |最新|小说|无弹窗|目录|全文|全本|txt|5200章节)/i,
    // ?titleReplace:[[find,replace]]

    // ?writer:选择器
    writer: '#info>p:eq(0):maxsize(20),:contains(作):contains(者):maxsize(20):last',

    // ?intro:选择器
    intro: '#intro>p:eq(0)',

    // ?cover:选择器

    // chapter:选择器(应包含vip章节) 或 async (doc)=>url[]或{url,title}[]
    chapter: [
      '.dir a', '#BookText a', '#Chapters a', '#TabCss a',
      '#Table1 a', '#at a', '#book a', '#booktext a',
      '#catalog_list a', '#chapterList a', '#chapterlist a', '#container1 a',
      '#content_1 a', '#contenttable a', '#dir a', '#htmlList a',
      '#list a', '#oneboolt a', '#read.chapter a', '#readerlist a',
      '#readerlists a', '#readlist a', '#tbchapterlist a', '#xslist a',
      '#zcontent a', '.Chapter a', '.L a', '.TabCss>dl>dd>a',
      '.Volume a', '._chapter a', '.aarti a', '.acss a',
      '.all-catalog a', '.art_fnlistbox a', '.art_listmain_main a', '.article_texttitleb a',
      '.as a', '.bd a', '.book a', '.book-chapter-list a',
      '.bookUpdate a', '.book_02 a', '.book_article_listtext a', '.book_con_list a',
      '.book_dirbox a', '.book_list a', '.booklist a', '#booklist a',
      '.box-item a', '.box1 a', '.box_box a', '.box_chap a',
      '.catalog a', '.catalog-list a', '.catebg a', '.category a',
      '.ccss a', '.centent a', '.chapname a', '.chapter a',
      '.chapter-list a', '.chapterBean a', '.chapterNum a', '.chapterTable a',
      '.chapter_box_ul a', '.chapter_list_chapter a', '.chapterlist a', '.chapterlistxx a',
      '.chapters a', '.chapters_list a', '.chaptertable a', '.chaptertd a',
      '.columns a', '.con_05 a', '.content a', '.contentlist a',
      '.conter a', '.css a', '.d_contarin a', '.dccss a',
      '.detail-chapters a', '.dir_main_section a', '.dirbox a', '.dirconone a',
      '.dirinfo_list a', '.dit-list a', '.download_rtx a', '.entry_video_list a',
      '.float-list a', '.index a', '.indexlist a', '.info_chapterlist a',
      '.insert_list a', '.item a', '.kui-item a', '.l_mulu_table a',
      '.lb a', '.liebiao a', '.liebiao_bottom a', '.list a',
      '.list-directory a', '.list-group a', '.list01a', '.list_Content a',
      '.list_box a', '.listmain a', '.lists a', '.lrlb a',
      '.m10 a', '.main a', '.mb_content a', '.menu-area a',
      '.ml-list1 a', '.ml_main a', '.mls a', '.mod_container a',
      '.mread a', '.mulu a', '.mulu_list a', '.nav a',
      '.nolooking a', '.novel_leftright a', '.novel_list a', '.ocon a',
      '.opf a', '.qq', '.read_list a', '.readout a',
      '.td_0 a', '.td_con a', '.third a', '.uclist a',
      '.uk-table a', '.volume a', '.volumes a', '.wiki-content-table a',
      '.www a', '.xiaoshuo_list a', '.xsList a', '.zhangjieUl a',
      '.zjbox a', '.zjlist a', '.zjlist4 a', '.zl a',
      '.zp_li a', 'dd a', '.chapter-list a', '.directoryArea a',

      '[id*="list"] a', '[class*="list"] a',
      '[id*="chapter"] a', '[class*="chapter"] a',
    ].join(','),
    // vipChapter:选择器 或 async (doc)=>url[]或{url,title}[]

    // volume:
    //  选择器/async (doc)=>elem[]；原理 $(chaptes).add(volumes);
    //  async (doc,chapters)=>chapters；尽量不要生成新的对象，而是在原有对象上增加键"volume"（方便重新下载）

    // 以下在章节页面内使用
    // ?chapterTitle:选择器 省略留空时，为chapter的textContent
    chapterTitle: '.bookname>h1,h2',

    // iframe: boolean 或 async (win)=>null
    //   使用时，只能一个一个获取（慎用）

    // popup: boolean 或 async ()=>null
    //   仅当X-Frame-Options:DENY时使用，使用时，只能一个一个获取（慎用）

    // deal: async(chapter)=>content||object
    //   不请求章节相对网页，而直接获得内容（请求其他网址）
    //   可以直接给chapter赋值，也可以返回content或需要的属性如title

    // content:选择器
    content: [
      '#pagecontent', '#contentbox', '#bmsy_content', '#bookpartinfo',
      '#htmlContent', '#text_area', '#chapter_content', '#chapterContent', '#chaptercontent',
      '#partbody', '#BookContent', '#article_content', '#BookTextRead',
      '#booktext', '#BookText', '#readtext', '#readcon',
      '#text_c', '#txt_td', '#TXT', '#txt',
      '#zjneirong', '.novel_content', '.readmain_inner', '.noveltext',
      '.booktext', '.yd_text2', '#contentTxt', '#oldtext',
      '#a_content', '#contents', '#content2', '#contentts',
      '#content1', '#content', '.content', '#arctext',
      '[itemprop="acticleBody"]', '.readerCon',
      '[id*="article"]:minsize(100)', '[class*="article"]:minsize(100)',
      '[id*="content"]:minsize(100)', '[class*="content"]:minsize(100)',
    ].join(','),

    // ?contentCheck: 检查页面是否正确，true时保留，否则content=null
    //   选择器 存在元素则为true
    //   或 async (doc,res,request)=>boolean

    // ?elementRemove:选择器 或 async (contentHTML)=>contentHTML
    //   如果需要下载图片，请不要移除图片元素
    elementRemove: 'script,style,iframe,*:emptyHuman:not(br,p,img),:hiddenHuman,a:not(:has(img))',

    // ?contentReplace:[[find,replace]]
    //   如果有图片，请不要移除图片元素

    // ?chapterPrev,chapterNext:选择器 或 async (doc)=>url
    chapterPrev: 'a[rel="prev"],a:regexp("[上前]一?[章页话集节卷篇]+"),#prevUrl',
    chapterNext: 'a[rel="next"],a:regexp("[下后]一?[章页话集节卷篇]+"),#nextUrl',
    // ?ignoreUrl:url[] 忽略的网站（用于过滤chapterPrev,chapterNext）

    // ?getChapters 在章节页面时使用，获取全部章节
    //   async (doc)=>url[]或{url,title,vip,volume}[]

    // ?charset:utf-8||gb2312||other
    //   通常来说不用设置

    // ?thread:下载线程数 通常来说不用设置

    // ?vip:{} 对于vip页面
    //  可用key: chapterTitle,iframe,deal,content,contentCheck,elementRemove,contentReplace,chapterPrev,chapterNext
  };

  Rule.special = [
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
    },
    { // https://www.manhuabei.com/ https://www.manhuafen.com/
      siteName: '漫画堆',
      filter: () => ($('.dmzj-logo').length && $('.wrap_intro_l_comic').length && $('.wrap_intro_r').length && $('.list_con_li').length
        ? 1
        : $('.foot-detail:contains("漫画")').length && $('.dm_logo').length && $('.chapter-view').length ? 2 : 0),
      title: '.comic_deCon>h1',
      writer: '.comic_deCon_liO>li>a[href^="/author/"]',
      intro: '.comic_deCon_d',
      cover: '.comic_i_img>img',
      chapter: '.list_con_li>li>a',
      volume: '.zj_list_head>h2>em',
      chapterTitle: '.head_title>h2',
      iframe: (win) => $('<div class="nd3-images">').html(win.chapterImages.map((item, index, arr) => `<img data-src="${win.SinMH.getChapterImage(index + 1)}" /><p class="img_info">(${index + 1}/${arr.length})</p>`).join('')).appendTo(win.document.body),
      content: '.nd3-images',
      contentReplace: [
        [/<img data-src/g, '<img src'],
      ],
    },
    { // https://www.manhuagui.com/
      siteName: '漫画柜',
      url: '://www.manhuagui.com/comic/\\d+/$',
      chapterUrl: '://www.manhuagui.com/comic/\\d+/\\d+.html',
      title: '.book-title>h1',
      writer: '.detail-list [href^="/author/"]',
      intro: '#intro-all',
      cover: '.book-cover>.hcover>img',
      chapter: '.chapter-list a',
      volume: 'h4>span',
      chapterTitle: '.title h2',
      content: (doc, res, request) => {
        let info = res.responseText.match(/window\["\\x65\\x76\\x61\\x6c"\](.*?)<\/script>/)[1];
        info = window.eval(info); // eslint-disable-line no-eval
        info = info.match(/^SMH.imgData(.*?).preInit\(\);/)[1];
        info = window.eval(info); // eslint-disable-line no-eval
        const a = info.files.map((item, index, arr) => `<img src="https://us.hamreus.com${info.path}${item}?e=${info.sl.e}&m=${info.sl.m}" /><p class="img_info">(${index + 1}/${arr.length})</p>`);
        return a.join('');
      },
      contentReplace: [
        [/<img id="img_\d+" style=".*?" data-original="(.*?)" src=".*?">/g, '<img src="$1">'],
      ],
    },
    // 文学
      { // https://www.52shuku.vip/
    siteName: '52书库',
    filter: () => (window.location.host === 'www.52shuku.vip' ? ($('.list.clearfix').length ? 1 : 2) : 0),
    url: '://www.52shuku.vip/\\w+/\\w+/\\w+.html$',
    chapterUrl: '://www.52shuku.vip/\\w+/\\w+/\\w+_\\d+.html$',
    title: () => {
        const breadcrumbs = $('.content-wrap .breadcrumbs');
        if (breadcrumbs.length > 0) {
            let text = breadcrumbs.find('a:last').text().replace('丹青手', '').replace('扶子不好吃', '');
            if (text.endsWith('丹青手')) {
                text = text.replace('丹青手', '');
            } else if (text.endsWith('扶子不好吃')) {
                text = text.replace('扶子不好吃', '');
            }
            return text;
        }
        return '';
    },
    chapter: '.list.clearfix > li > a',
    chapterTitle: '#nr_title',
    content: '#nr1',
    elementRemove: '.related_top, .article-header, .article-nav, script, .chapterNum, .pagination2, hr + p, #go-top',
    chapterPrev: '.pagination2 a:contains("上一页")',
    chapterNext: '.pagination2 a:contains("下一页")',
   },
    { // http://gj.zdic.net
      siteName: '汉典古籍',
      filter: () => (window.location.host === 'gj.zdic.net' ? ($('#ml_1').length ? 1 : 2) : 0),
      title: '#shuye>h1',
      intro: '#jj_2',
      chapter: '.mls>li>a',
      chapterTitle: '#snr1>h1',
      content: '#snr2',
      elementRemove: '.pagenav1',
      chapterPrev: 'a:contains("上一篇")',
      chapterNext: 'a:contains("下一篇")',
    },
    { // https://www.99csw.com
      siteName: '九九藏书网',
      url: /99csw.com\/book\/\d+\/(index\.htm)?$/,
      chapterUrl: /99csw.com\/book\/\d+\/\d+.htm/,
      title: '#book_info>h2',
      writer: 'h4:contains("作者")>a',
      intro: '.intro',
      cover: '#book_info>img',
      chapter: '#dir a',
      volume: '#dir>dt:nochild',
      iframe: async (win) => {
        while (win.content.showNext() !== false) {
          await waitInMs(200);
        }
      },
      content: '#content>div:visible',
      // content: function (doc, res, request) {
      //   const content = [];
      //   const box = $('#content', doc).get(0);
      //   const star = 0; // ? 可能根本没用
      //   var e = CryptoJS.enc.Base64.parse($('meta[name="client"]', doc).attr('content')).toString(CryptoJS.enc.Utf8).split(/[A-Z]+%/);
      //   var j = 0;
      //   function r (a) {
      //     return a;
      //   }
      //   for (var i = 0; i < e.length; i++) {
      //     if (e[i] < 3) {
      //       content[e[i]] = r(box.childNodes[i + star]);
      //       j++;
      //     } else {
      //       content[e[i] - j] = r(box.childNodes[i + star]);
      //       j = j + 2;
      //     }
      //   }
      //   return content.map(i => i.outerHTML).join('<br>');
      // }
    },
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
    },
    { // https://www.kanunu8.com
      siteName: '努努书坊',
      filter: () => (window.location.host === 'www.kanunu8.com' ? ($(['body>div:nth-child(1)>table:nth-child(10)>tbody>tr:nth-child(4)>td>table:nth-child(2)>tbody>tr>td>a', 'body>div>table>tbody>tr>td>table>tbody>tr>td>table:not(:has([class^="p"])) a'].join(',')).length ? 1 : 2) : 0),
      title: 'h1>strong>font,h2>b',
      writer: 'body > div:nth-child(1) > table:nth-child(10) > tbody > tr:nth-child(2) > td,body > div:nth-child(1) > table:nth-child(10) > tbody > tr > td:nth-child(2) > table:nth-child(2) > tbody > tr:nth-child(2) > td',
      intro: '[align="left"]>[class^="p"]',
      cover: 'img[height="160"]',
      chapter: ['body>div:nth-child(1)>table:nth-child(10)>tbody>tr:nth-child(4)>td>table:nth-child(2)>tbody>tr>td>a', 'body>div>table>tbody>tr>td>table>tbody>tr>td>table:not(:has([class^="p"])) a'].join(','),
      content: 'body > div:nth-child(1) > table:nth-child(5) > tbody > tr > td:nth-child(2) > p',
    },
    { // http://www.my2852.com
      siteName: '梦远书城',
      filter: () => (window.location.href.match(/my2852?.com/) ? ($('a:contains("回目录")').length ? 2 : 1) : 0),
      titleRegExp: /(.*?)[|_]/,
      title: '.book>h1',
      writer: 'b:contains("作者")',
      intro: '.zhj,body > div:nth-child(4) > table > tbody > tr > td.td6 > div > table > tbody > tr > td:nth-child(1) > div > table > tbody > tr:nth-child(1) > td',
      cover: 'img[alt="封面"]',
      chapter: () => $('a[href]').toArray().filter((i) => $(i).attr('href').match(/^\d+\.htm/)).map((i) => ({ url: $(i).attr('href'), title: $(i).text().trim() })),
      content: 'td:has(br)',
    },
    { // https://www.tianyabooks.com
      siteName: '天涯书库',
      url: /tianyabooks\.com\/.*?\/$/,
      chapterUrl: /tianyabooks\.com\/.*?\.html$/,
      title: '.book>h1',
      writer: 'h2>a[href^="/author/"]',
      intro: '.description>p',
      chapter: '.book>dl>dd>a',
      volume: '.book>dl>dt',
      chapterTitle: 'h1',
      content: '[align="center"]+p',
    },
    { // https://www.51xs.com/
      siteName: '我要小说网',
      url: '://www.51xs.com/.*?/index.html',
      chapterUrl: '://www.51xs.com/.*?/\\d+.htm',
      title: '[style="FONT-FAMILY: 宋体; FONT-SIZE:12pt"]',
      writer: '[href="../index.html"]',
      chapter: '[style="FONT-FAMILY: 宋体; FONT-SIZE:12pt"]+center a',
      volume: '[bgcolor="#D9DDE8"]',
      chapterTitle: '.tt2>center>b',
      content: '.tt2',
    },
    // 正版
    { // https://www.qidian.com https://www.hongxiu.com https://www.readnovel.com https://www.xs8.cn
      siteName: '起点中文网',
      url: /(qidian.com|hongxiu.com|readnovel.com|xs8.cn)\/(info|book)\/\d+/,
      chapterUrl: /(qidian.com|hongxiu.com|readnovel.com|xs8.cn)\/chapter/,
      title: 'h1>em',
      writer: '.writer',
      intro: '.book-intro',
      cover: '.J-getJumpUrl>img',
      chapter: '.volume>.cf>li a',
      vipChapter: '.volume>.cf>li a[href^="//vipreader.qidian.com"]',
      volume: () => $('.volume>h3').toArray().map((i) => i.childNodes[2]),
      chapterTitle: '.j_chapterName',
      content: '.j_readContent',
      elementRemove: '.review-count,span[style]',
      chapterPrev: (doc) => [$('[id^="chapter-"]', doc).attr('data-purl')],
      chapterNext: (doc) => [$('[id^="chapter-"]', doc).attr('data-nurl')],
      vip: {
        iframe: async (win) => waitFor(() => win.enContent === undefined && win.cuChapterId === undefined && win.fEnS === undefined),
      },
    },
    { // https://www.ciweimao.com
      siteName: '刺猬猫',
      url: /:\/\/(www.)?ciweimao.com\/(book|chapter-list)\/\d+/,
      chapterUrl: /:\/\/(www.)?ciweimao.com\/chapter\/\d+/,
      infoPage: () => `https://www.ciweimao.com/book/${window.location.href.match(/\d+/)[0]}`,
      title: 'h3',
      writer: '.book-info [href*="reader/"]',
      intro: '.book-intro-cnt>div:nth-child(1)',
      cover: '.cover>img',
      chapter: '.book-chapter-list a',
      vipChapter: '.book-chapter-list a:has(.icon-lock),.book-chapter-list a:has(.icon-unlock)',
      volume: '.book-chapter-box>.sub-tit',
      chapterTitle: 'h3.chapter',
      deal: async (chapter) => {
        if (!unsafeWindow.CryptoJS) {
          const result = await Promise.all([
            '/resources/js/enjs.min.js',
            '/resources/js/myEncrytExtend-min.js',
            '/resources/js/jquery-plugins/jquery.base64.min.js',
          ].map((i) => `https://www.ciweimao.com${i}`).map((i) => xhr.sync(i, null, { cache: true })));
          for (const res of result) unsafeWindow.eval(res.responseText);
        }

        const chapterId = chapter.url.split('/').slice(-1)[0];
        const res1 = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            method: 'POST',
            url: `${window.location.origin}/chapter/ajax_get_session_code`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            data: `chapter_id=${chapterId}`,
            responseType: 'json',
            onload(res) {
              resolve(res);
            },
          }, null, 0, true);
        });
        const accessKey = res1.response.chapter_access_key;

        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            method: 'POST',
            url: `${window.location.origin}/chapter/get_book_chapter_detail_info`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            data: `chapter_id=${chapterId}&chapter_access_key=${accessKey}`,
            // responseType: 'json',
            onload(res, request) {
              try {
                const json = JSON.parse(res.responseText);
                const content = unsafeWindow.$.myDecrypt({
                  content: json.chapter_content,
                  keys: json.encryt_keys,
                  accessKey,
                });
                resolve(content);
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
      elementRemove: 'span',
      chapterPrev: '#J_BtnPagePrev',
      chapterNext: '#J_BtnPageNext',
      thread: 1,
      vip: {
        deal: null,
        iframe: async (win) => {
          win.getDataUrl = async (img) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);
            const url = canvas.toDataURL('image/jpeg', 0.5);
            img.src = url;
            // return new Promise((resolve, reject) => {
            //   canvas.toBlob(function (blob) {
            //     const url = URL.createObjectURL(blob);
            //     img.src = url;
            //     resolve();
            //   });
            // });
          };
          await waitFor(() => $('#J_BookImage', win.document).css('background-image').match(/^url\("?(.*?)"?\)/));
          let src = $('#J_BookImage', win.document).css('background-image').match(/^url\("?(.*?)"?\)/)[1];
          await new Promise((resolve, reject) => {
            $('#realBookImage', win.document).one('load', async () => {
              src = await win.getDataUrl($('#realBookImage', win.document).get(0));
              window.history.back();
              resolve();
            }).attr('src', src);
          });
        },
        content: '#J_BookImage',
        elementRemove: 'i',
      },
    },
    { // https://www.shubl.com/
      siteName: '书耽',
      url: '://www.shubl.com/book/book_detail/\\d+',
      chapterUrl: '://www.shubl.com/chapter/book_chapter_detail/\\d+',
      title: '.book-title>span',
      writer: '.right>.box>.user-info .username',
      intro: '.book-brief',
      cover: '.book-img',
      chapter: '#chapter_list .chapter_item>a',
      vipChapter: '#chapter_list .chapter_item:has(.lock)>a',
      chapterTitle: '.article-title',
      deal: async (chapter) => Rule.special.find((i) => i.siteName === '刺猬猫').deal(chapter),
      elementRemove: 'span',
      chapterPrev: '#J_BtnPagePrev',
      chapterNext: '#J_BtnPageNext',
      thread: 1,
    },
    { // http://chuangshi.qq.com http://yunqi.qq.com
      siteName: '创世中文网',
      url: /(chuangshi|yunqi).qq.com\/bk\/.*?-l.html/,
      chapterUrl: /(chuangshi|yunqi).qq.com\/bk\/.*?-r-\d+.html/,
      infoPage: '.title>a,.bookNav>a:nth-child(4)',
      title: '.title>a>b',
      writer: '.au_name a',
      intro: '.info',
      cover: '.bookcover>img',
      chapter: 'div.list>ul>li>a',
      vipChapter: 'div.list:has(span.f900)>ul>li>a',
      volume: '.juan_height',
      deal: async (chapter) => {
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `${window.location.origin}/index.php/Bookreader/${$('.title a:eq(0)').attr('href').match(/\/(\d+).html/)[1]}/${chapter.url.match(/-(\d+).html/)[1]}`,
            method: 'POST',
            data: 'lang=zhs',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const json = JSON.parse(res.responseText);
                let content = json.Content;
                const base = 30;
                const arrStr = [];
                const arrText = content.split('\\');
                for (let i = 1, len = arrText.length; i < len; i++) {
                  arrStr.push(String.fromCharCode(parseInt(arrText[i], base)));
                }
                let html = arrStr.join('');
                if ($('<div>').html(html).text().match(/url\((https?:\/\/yuewen-skythunder-\d+.*?\.ttf)\)/)) {
                  if (!fontLib) fontLib = JSON.parse(GM_getResourceText('fontLib')).reverse();
                  const font = $('<div>').html(html).text().match(/url\((https?:\/\/yuewen-skythunder-\d+.*?\.ttf)\)/)[1];

                  opentype.load(font, (err, font) => {
                    if (err) resolve('');
                    const obj = {};
                    const undefinedFont = [];
                    for (const i in font.glyphs.glyphs) {
                      const data = font.glyphs.glyphs[i].path.toPathData();

                      const key = fontLib.find((i) => i.path === data);
                      if (key) obj[font.glyphs.glyphs[i].unicode] = key.unicode;
                      if (!key) undefinedFont.push(data);
                    }
                    if (undefinedFont.length) console.error('未确定字符', undefinedFont);
                    html = html.replace(/&#(\d+);/g, (matched, m1) => (m1 in obj ? obj[m1] : matched));
                    content = $('.bookreadercontent', html).html();
                    resolve(content);
                  });
                } else {
                  content = $('.bookreadercontent', html).html();
                  resolve(content);
                }
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
    },
    { // http://dushu.qq.com 待测试:http://book.qq.com
      siteName: 'QQ阅读',
      url: /(book|dushu).qq.com\/intro.html\?bid=\d+/,
      chapterUrl: /(book|dushu).qq.com\/read.html\?bid=\d+&cid=\d+/,
      title: 'h3>a',
      writer: '.w_au>a',
      intro: '.book_intro',
      cover: '.bookBox>a>img',
      chapter: '#chapterList>div>ol>li>a',
      vipChapter: '#chapterList>div>ol>li:not(:has(span.free))>a',
      deal: async (chapter) => {
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `${window.location.origin}/read/${unsafeWindow.bid}/${chapter.url.match(/cid=(\d+)/)[1]}`,
            method: 'POST',
            data: 'lang=zhs',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const json = JSON.parse(res.responseText);
                let content = json.Content;
                content = $('.bookreadercontent', content).html();
                resolve(content);
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
    },
    { // https://www.webnovel.com
      siteName: '起点国际',
      url: /webnovel.com\/book\/\d+(#contents)?$/,
      chapterUrl: /webnovel.com\/book\/\d+\/\d+/,
      title: 'h2',
      writer: 'address span',
      intro: '#about .g_txt_over',
      cover: '.det-info .g_thumb',
      chapter: '.content-list a',
      volume: '.volume-item>h4',
      content: '.cha-words',
      elementRemove: 'pirate',
    },
    { // https://book.tianya.cn/
      siteName: '天涯文学',
      url: /book.tianya.cn\/html2\/dir.aspx\?bookid=\d+/,
      chapterUrl: /book.tianya.cn\/chapter-\d+-\d+/,
      infoPage: () => `https://book.tianya.cn/book/${window.location.href.split('/').slice(-1)[0].match(/\d+/)[0]}.aspx`,
      title: '.book-name>a',
      writer: '.bd>p>span',
      intro: '#brief_intro',
      cover: '.lft-pic>a>img',
      chapter: 'ul.dit-list>li>a',
      vipChapter: 'ul.dit-list>li:not(:has(.free))>a',
      deal: async (chapter) => {
        const result = await new Promise((resolve, reject) => {
          const urlArr = chapter.url.split('-');
          xhr.add({
            chapter,
            url: 'https://app3g.tianya.cn/webservice/web/read_chapter.jsp',
            method: 'POST',
            data: `bookid=${urlArr[1]}&chapterid=${urlArr[2]}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: 'https://app3g.tianya.cn/webservice/web/proxy.html',
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const json = JSON.parse(res.responseText);
                const title = json.data.curChapterName;
                const content = json.data.chapterContent;
                resolve({ title, content });
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return result;
      },
    },
    { // http://www.3gsc.com.cn
      siteName: '3G书城',
      url: /3gsc\.com\.cn\/bookreader\/\d+/,
      chapterUrl: /3gsc.com.cn\/bookcon\//,
      infoPage: '[href^="/book/"]',
      title: 'h1.RecArticle',
      writer: '.author',
      intro: '.RecReview',
      cover: '.RecBook img[onerror]',
      chapter: '.menu-area>p>a',
      vipChapter: '.menu-area>p>a:has(span.vip)',
      volume: '.menu-area>h2',
      chapterTitle: 'h1',
      content: '.menu-area',
    },
    { // http://book.zongheng.com/ http://huayu.zongheng.com/
      siteName: '纵横',
      url: /(book|huayu).zongheng.com\/showchapter\/\d+.html/,
      chapterUrl: /(book|huayu).zongheng.com\/chapter\/\d+\/\d+.html/,
      infoPage: '[class$="crumb"]>a:nth-child(3)',
      title: '.book-name',
      writer: '.au-name',
      intro: '.book-dec>p',
      cover: '.book-img>img',
      chapter: '.chapter-list a',
      vipChapter: '.chapter-list .vip>a',
      volume: () => $('.volume').toArray().map((i) => i.childNodes[6]),
      chapterTitle: '.title_txtbox',
      content: '.content',
    },
    { // https://www.17k.com/
      siteName: '17K',
      url: /www.17k.com\/list\/\d+.html/,
      chapterUrl: /www.17k.com\/chapter\/\d+\/\d+.html/,
      infoPage: '.infoPath a:nth-child(4)',
      title: '.Info>h1',
      writer: '.AuthorInfo .name',
      intro: '.intro>a',
      cover: '.cover img',
      chapter: 'dl.Volume>dd>a',
      vipChapter: 'dl.Volume>dd>a:has(.vip)',
      volume: '.Volume>dt>.tit',
      chapterTitle: 'h1',
      content: '.p',
      elementRemove: '.copy,.qrcode',
    },
    { // https://www.8kana.com/
      siteName: '不可能的世界',
      url: /www.8kana.com\/book\/\d+(.html)?/,
      chapterUrl: /www.8kana.com\/read\/\d+.html/,
      title: 'h2.left',
      writer: '.authorName',
      intro: '.bookIntroduction',
      cover: '.bookContainImgBox img',
      chapter: '#informList li.nolooking>a',
      vipChapter: '#informList li.nolooking>a:has(.chapter_con_VIP)',
      volume: '[flag="volumes"] span',
      chapterTitle: 'h2',
      content: '.myContent',
      elementRemove: '[id="-2"]',
    },
    { // https://www.heiyan.com https://www.ruochu.com
      siteName: '黑岩',
      url: /www.(heiyan|ruochu).com\/chapter\//,
      chapterUrl: /www.(heiyan|ruochu).com\/book\/\d+\/\d+/,
      infoPage: '.pic [href*="/book/"],.breadcrumb>a:nth-child(5)',
      title: 'h1[style]',
      writer: '.name>strong',
      intro: '.summary>.note',
      cover: '.book-cover',
      chapter: 'div.bd>ul>li>a',
      vipChapter: 'div.bd>ul>li>a.isvip',
      volume: '.chapter-list>.hd>h2',
      deal: async (chapter) => {
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `http://${window.location.host.replace('www.', 'a.')}/ajax/chapter/content/${chapter.url.replace(/.*\//, '')}`,
            onload(res, request) {
              try {
                const json = JSON.parse(res.responseText);
                const { title } = json.chapter;
                const content = json.chapter.htmlContent;
                resolve({ title, content });
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
    },
    { // https://b.faloo.com
      siteName: '飞卢',
      url: /b.faloo.com\/\d+.html/,
      chapterUrl: /b.faloo.com\/\d+_\d+.html/,
      title: '#novelName',
      writer: '#novelName+a',
      intro: '.T-L-T-C-Box1',
      cover: '.imgcss',
      chapter: '#mulu .DivTable .DivTd>a',
      vipChapter: '#mulu .DivVip~.DivTable .DivTd>a',
      volume: '.C-Fo-Z-ML-TitleBox>h3',
      chapterTitle: '.c_l_title',
      content: '.noveContent',
      elementRemove: 'p:has(a,b,font)',
      vip: {
        content: (doc, res, request) => {
          const doc1 = new window.DOMParser().parseFromString(res.responseText, 'text/html');
          const func = $('script:contains("image_do3")', doc1).text();
          /* eslint-disable camelcase */
          if (!unsafeWindow.image_do3) {
            unsafeWindow.image_do3 = function (num, o, id, n, en, t, k, u, time, fontsize, fontcolor, chaptertype, font_family_type) {
              const type = 1;
              let domain = '//read.faloo.com/';
              if (chaptertype === 0) { domain = '//read6.faloo.com/'; }
              if (type === 2) { domain = '//read2.faloo.com/'; }
              if (typeof (font_family_type) === 'undefined' || font_family_type == null) {
                font_family_type = 0;
              }
              let url = `${domain}Page4VipImage.aspx?num=${num}&o=${o}&id=${id}&n=${n}&ct=${chaptertype}&en=${en}&t=${t}&font_size=${fontsize}&font_color=${fontcolor}&FontFamilyType=${font_family_type}&u=${u}&time=${time}&k=${k}`;
              url = encodeURI(url);
              return url;
            };
          }
          /* eslint-enable camelcase */
          const image = window.eval(`window.${func}`); // eslint-disable-line no-eval
          const elem = $('.noveContent', doc1);
          elem.find('.con_img').replaceWith(`<img src="${image}">`);
          return elem.html();
        },
      },
    },
    { // https://www.jjwxc.net // TODO vip自定义字体
      siteName: '晋江文学城',
      filter: () => {
        if (window.location.href.match(/www.jjwxc.net\/onebook.php\?novelid=\d+$/)) {
          $('[id^="vip_"]').toArray().forEach((i) => {
            i.href = i.rel;
            i.target = '_blank';
          });
          return 1;
        } if (window.location.href.match(/www.jjwxc.net\/onebook.php\?novelid=\d+&chapterid=\d+/)) {
          return 2;
        }
        return 0;
      },
      title: '[itemprop="name"]',
      writer: '[itemprop="author"]',
      intro: '[itemprop="description"]',
      cover: '[itemprop="image"]',
      chapter: '[itemprop="url"][href]',
      vipChapter: '#oneboolt>tbody>tr>td>span>div>a[id^="vip_"]',
      volume: '.volumnfont',
      chapterTitle: 'h2',
      content: '.noveltext',
      elementRemove: 'div',
      // vip
      // http://static.jjwxc.net/tmp/fonts/jjwxcfont_00147.ttf
      // http://static.jjwxc.net/tmp/fonts/jjwxcfont_000bl.ttf
      // http://static.jjwxc.net/tmp/fonts/jjwxcfont_00bmn.ttf
    },
    { // https://www.xxsy.net
      siteName: '潇湘书院',
      url: /www.xxsy.net\/info\/\d+.html/,
      chapterUrl: /www.xxsy.net\/chapter\/\d+.html/,
      title: '.title h1',
      writer: '.title a[href^="/authorcenter/"]',
      intro: '.introcontent',
      cover: '.bookprofile>dt>img',
      chapter: '.catalog-list>li>a',
      vipChapter: '.catalog-list>li.vip>a',
      volume: () => $('.catalog-main>dt').toArray().map((i) => i.childNodes[2]),
      chapterTitle: '.chapter-title',
      content: '.chapter-main',
    },
    { // http://www.zhulang.com http://www.xxs8.com/
      siteName: '逐浪',
      url: /book.(zhulang|xxs8).com\/\d+\/$/,
      chapterUrl: /book.(zhulang|xxs8).com\/\d+\/\d+.html/,
      infoPage: 'strong>a,.textinfo>a',
      title: '.crumbs>strong',
      writer: '.cover-tit>h2>span>a',
      intro: '#book-summary',
      cover: '.cover-box-left>img',
      chapter: '.chapter-list>ul>li>a',
      vipChapter: '.chapter-list>ul>li>a:has(span)',
      volume: '.catalog-tit>h2',
      chapterTitle: 'h2>span',
      content: '#read-content',
      elementRemove: 'h2,div,style,p:has(cite)',
    },
    { // https://www.kanshu.com
      siteName: '看书网',
      url: /www.kanshu.com\/artinfo\/\d+.html/,
      chapterUrl: /www.kanshu.com\/files\/article\/html\/\d+\/\d+.html/,
      title: '.author',
      intro: '.detailInfo',
      cover: '.bookImg',
      chapter: '.list>a',
      vipChapter: '.list>a.isvip',
      chapterTitle: '.contentBox .title',
      content: '.contentBox .tempcontentBox',
    },
    { // http://vip.book.sina.com.cn
      siteName: '微博读书-书城',
      url: /vip.book.sina.com.cn\/weibobook\/book\/\d+.html/,
      chapterUrl: /vip.book.sina.com.cn\/weibobook\/vipc.php\?bid=\d+&cid=\d+/,
      title: 'h1.book_name',
      writer: '.authorName',
      intro: '.info_txt',
      cover: '.book_img>img',
      chapter: '.chapter>span>a',
      vipChapter: '.chapter>span:has(i)>a',
      chapterTitle: '.sr-play-box-scroll-t-path>span',
      content: (doc, res, request) => window.eval(res.responseText.match(/var chapterContent = (".*")/)[1]), // eslint-disable-line no-eval
    },
    { // http://www.lcread.com
      siteName: '连城读书',
      url: /www.lcread.com\/bookpage\/\d+\/index.html/,
      chapterUrl: /www.lcread.com\/bookpage\/\d+\/\d+rc.html/,
      title: '.bri>table>tbody>tr>td>h1',
      writer: '[href^="http://my.lc1001.com/book/q?u="]',
      intro: '.bri2',
      cover: '.brc>img',
      chapter: '#abl4>table>tbody>tr>td>a',
      vipChapter: '#abl4>table>tbody>tr>td>a[href^="http://my.lc1001.com/vipchapters"]',
      volume: '#cul>.dsh',
      chapterTitle: 'h2',
      content: '#ccon',
    },
    { // https://www.motie.com
      siteName: '磨铁中文网',
      url: /www.motie.com\/book\/\d+/,
      chapterUrl: /www.motie.com\/chapter\/\d+\/\d+/,
      title: '.title>.name',
      writer: '.title>.name+a',
      intro: '.brief_text',
      cover: '.pic>span>img',
      chapter: '.catebg a',
      vipChapter: '.catebg a:has([alt="vip"])',
      volume: '.cate-tit>h2',
      deal: async (chapter) => {
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `https://app2.motie.com/pc/chapter/${chapter.url.split('/')[5]}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const json = JSON.parse(res.responseText);
                const title = json.data.name;
                const { content } = json.data;
                resolve({ title, content });
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
    },
    { // http://www.shuhai.com
      siteName: '书海小说网',
      url: 'www.shuhai.com/book/\\d+.htm',
      chapterUrl: 'www.shuhai.com/read/\\d+/\\d+.html',
      title: '.book-info-bookname>span',
      writer: '.book-info-bookname>span+span',
      intro: '.book-info-bookintro',
      cover: '.book-info .book-cover',
      chapter: '.chapter-item>a',
      vipChapter: '.chapter-item:has(.vip)>a',
      volume: 'span.chapter-item',
      chapterTitle: '.chapter-name',
      content: '.chapter-item:has(.chaper-info)',
      elementRemove: 'div',
    },
    { // http://www.xiang5.com
      siteName: '香网',
      url: 'www.xiang5.com/booklist/\\d+.html',
      chapterUrl: 'www.xiang5.com/content/\\d+/\\d+.html',
      infoPage: '.pos a:last',
      title: '.fr>h4',
      writer: '.colR>a[href*="author"]',
      intro: '.workSecHit+h2+p',
      cover: '.worksLList .fl >a>img',
      chapter: '.lb>table>tbody>tr>td>a',
      volume: '.lb>h2',
      chapterTitle: '.pos>h1',
      content: '.xsDetail',
      elementRemove: 'p[style],p>*',
    },
    { // https://www.fmx.cn/
      siteName: '凤鸣轩小说网',
      url: '://read.fmx.cn/files/article/html/[\\d/]+/index.html',
      chapterUrl: '://read.fmx.cn/files/article/html/[\\d/]+.html',
      infoPage: '.art_fnbox_sy>a,strong>a',
      title: 'h1>span',
      writer: 'h1>span:nth-child(2)',
      intro: '#zjp',
      cover: 'img[onerror]',
      chapter: '.art_fnlistbox>span>a:visible,.art_fnlistbox_vip>ul>li>span>a:visible',
      vipChapter: '.art_fnlistbox_vip>ul>li>span>a:visible',
      chapterTitle: 'h1',
      content: '#content',
      elementRemove: 'div,p:last',
    },
    { // https://www.kujiang.com
      siteName: '酷匠网',
      url: '://www.kujiang.com/book/\\d+/catalog',
      chapterUrl: '://www.kujiang.com/book/\\d+/\\d+',
      infoPage: 'h1.zero>a:nth-child(2),.chapter_crumb>a:nth-child(2)',
      title: '.book_title',
      writer: '.book_author>a',
      intro: '#book_intro',
      cover: '.kjbookcover img',
      chapter: '.third>a',
      volume: '.kjdt-catalog>span:nth-child(1)',
      chapterTitle: 'h1',
      content: '.content',
      elementRemove: 'span',
      contentReplace: [
        ['.*酷.*匠.*网.*'],
      ],
    },
    { // http://www.tadu.com
      siteName: '塔读文学',
      url: '://www.tadu.com(:\\d+)?/book/catalogue/\\d+',
      chapterUrl: '://www.tadu.com(:\\d+)?/book/\\d+/\\d+/',
      infoPage: () => `${window.location.origin}/book/${window.location.pathname.match(/\d+/)[0]}`,
      title: '.bkNm',
      writer: '.bookNm>a:nth-child(2)',
      intro: '.datum+p',
      cover: (doc) => $('.bookImg>img', doc).attr('data-src').replace(/_a\.jpg$/, '.jpg'),
      chapter: '.chapter>a',
      vipChapter: '.chapter>a:has(.vip)',
      chapterTitle: '.chapter h4',
      content: async (doc, res, request) => {
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter: request.raw,
            url: res.responseText.match(/id="bookPartResourceUrl" value="(.*?)"/)[1],
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: request.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const content = res.responseText.match(/\{content:'(.*)'\}/)[1];
                resolve(content);
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
    },
    { // https://yuedu.163.com
      siteName: '网易云阅读',
      url: '://yuedu.163.com/source/.*',
      chapterUrl: '://yuedu.163.com/book_reader/.*',
      title: 'h3>em',
      writer: 'h3>span>a',
      intro: '.description',
      cover: '.cover>img',
      chapter: '.item>a,.title-1>a',
      vipChapter: '.vip>a',
      volume: '.title-1',
      deal: async (chapter) => {
        const urlArr = chapter.url.split('/');
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `${window.location.protocol}//yuedu.163.com/getArticleContent.do?sourceUuid=${urlArr[4]}&articleUuid=${urlArr[5]}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const json = JSON.parse(res.responseText);
                const content = CryptoJS.enc.Base64.parse(json.content).toString(CryptoJS.enc.Utf8);
                const title = $('h1', content).text();
                resolve({ content, title });
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
    },
    { // https://guofeng.yuedu.163.com/ https://caiwei.yuedu.163.com/
      siteName: '网易旗下',
      url: '://(guofeng|caiwei).yuedu.163.com/newBookReader.do\\?operation=catalog&sourceUuid=.*',
      chapterUrl: '://(guofeng|caiwei).yuedu.163.com/book_reader/.*',
      infoPage: () => `${window.location.origin}/source/${window.location.href.match(/sourceUuid=(.*?)($|&)/) ? window.location.href.match(/sourceUuid=(.*?)($|&)/)[1] : window.location.href.split('/')[4]}`,
      title: 'h3>em',
      writer: 'h3>em+span>a',
      intro: '.m-bookdetail .description',
      cover: '.m-bookdetail .cover>img',
      chapter: '.item>a',
      vipChapter: '.vip>a',
      volume: '.title-1',
      deal: async (chapter) => Rule.special.find((i) => i.siteName === '网易云阅读').deal(chapter),
    },
    { // https://www.yueduyun.com/
      siteName: '阅路小说网',
      url: '://www.yueduyun.com/catalog/\\d+',
      chapterUrl: '://www.yueduyun.com/read/\\d+/\\d+',
      infoPage: () => `https://apiuser.yueduyun.com/w/block/book?book_id=${window.location.href.match(/\d+/)[0]}`,
      title: (doc) => JSON.parse($('body', doc).html()).data.book_name,
      writer: (doc) => JSON.parse($('body', doc).html()).data.author_name,
      intro: (doc) => JSON.parse($('body', doc).html()).data.book_intro,
      cover: (doc) => JSON.parse($('body', doc).html()).data.book_cover,
      chapter: '.catalog li>a',
      vipChapter: '.catalog li:has(span)>a',
      deal: async (chapter) => {
        const urlArr = chapter.url.split('/');
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `https://apiuser.yueduyun.com/app/chapter/chapter_content?book_id=${urlArr[4]}&chapter_id=${urlArr[5]}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const json = JSON.parse(res.responseText);
                const title = json.data.chapter_name;
                const content = json.data.chapter_content;
                Storage.book.title = json.data.book_name;
                Storage.book.writer = json.data.author_name;
                resolve({ title, content });
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
    },
    { // http://www.ycsd.cn
      siteName: '原创书殿',
      url: '://www.ycsd.cn/book/chapters/.*?',
      chapterUrl: '://www.ycsd.cn/book/chapter/.*?',
      infoPage: '[class$="crumbs"] a:last',
      title: '.book-name',
      writer: '.author-name',
      intro: '.book-desc',
      cover: '.book-cover>img',
      chapter: '.directory-item>a',
      vipChapter: '.directory-item>a:has(img)',
      chapterTitle: '.chapter-wrap>h1',
      content: '.content',
    },
    { // http://www.longruo.com
      siteName: '龙若中文网',
      url: '://www.longruo.com/chapterlist/\\d+.html',
      chapterUrl: '://www.longruo.com/catalog/\\d+_\\d+.html',
      infoPage: '.fc666 a:last,.position a:last',
      title: '.book_introduction h2>a',
      writer: '.fc999+a',
      intro: '.introduction_text',
      cover: '.mr20>a>img',
      chapter: '.catalog>li>a',
      vipChapter: '.catalog>li>a:has(span.mark)',
      chapterTitle: 'h1',
      content: '.article',
    },
    { // http://www.hxtk.com
      siteName: '华夏天空',
      url: '://www.hxtk.com/chapterList/\\d+',
      chapterUrl: '://www.hxtk.com/chapter/\\d+',
      infoPage: '.breadcrumb>a[href*="/bookDetail/"]',
      title: '.book-name>h1',
      writer: '.book-writer>a',
      intro: '.book-introduction>.part',
      cover: '.book-img>img',
      chapter: '.volume-item a',
      vipChapter: '.volume-item:has(i) a',
      chapterTitle: 'h2',
      content: '#chapter-content-str',
    },
    { // https://www.hongshu.com
      siteName: '红薯中文网',
      url: '://www.hongshu.com/bookreader/\\d+/',
      chapterUrl: '://www.hongshu.com/content/\\d+/\\d+-\\d+.html',
      infoPage: () => `https://www.hongshu.com/book/${window.location.href.match(/\d+/)[0]}/`,
      title: 'h1>a',
      writer: '.txinfor>.right [href*="userspace"]',
      intro: '.intro',
      cover: '.fm>img',
      chapter: '.columns>li>a',
      vipChapter: '.columns>li:has(.vip)>a',
      deal: async (chapter) => {
        const urlArr = chapter.url.split(/\/|-|\./);
        const res1 = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `${window.location.protocol}//www.hongshu.com/bookajax.do`,
            method: 'POST',
            data: `method=getchptkey&bid=${urlArr[6]}&cid=${urlArr[8]}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const json = JSON.parse(res.responseText);
                resolve(json);
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `${window.location.protocol}//www.hongshu.com/bookajax.do`,
            method: 'POST',
            data: `method=getchpcontent&bid=${urlArr[6]}&jid=${urlArr[7]}&cid=${urlArr[8]}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const json = JSON.parse(res.responseText);
                const title = json.chptitle;
                let { content } = json;
                content = unsafeWindow.utf8to16(unsafeWindow.hs_decrypt(unsafeWindow.base64decode(content), res1.key));
                // const other = unsafeWindow.utf8to16(unsafeWindow.hs_decrypt(unsafeWindow.base64decode(json.other), res1.key)); // 标点符号及常用字使用js生成的stylesheet显示
                resolve({ title, content });
              } catch (error) {
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
    },
    { // http://www.qwsy.com
      siteName: '蔷薇书院',
      url: '://www.qwsy.com/mulu/\\d+.html',
      chapterUrl: '://www.qwsy.com/read.aspx\\?cid=\\d+',
      infoPage: '.readtop_nav>.fl>a:nth-child(4)',
      title: '.title_h1',
      writer: '.aAuthorLink',
      intro: '#div_jj2>p',
      cover: '.zpdfmpic>img',
      chapter: '.td_con>a',
      vipChapter: '.td_con:has(span[style="color:#ff0000;"])>a',
      deal: async (chapter) => {
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `http://script.qwsy.com/html/js/${chapter.url.replace('http://www.qwsy.com/read.aspx?cid=', '')}.js`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const content = res.responseText.match(/document.write\("(.*)"\);/)[1];
                resolve(content);
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
      elementRemove: 'font,br',
    },
    { // http://www.shulink.com
      siteName: '书连',
      url: '://vip.shulink.com(/files/article)?/html/\\d+/\\d+/index.*?.html.*',
      chapterUrl: '://vip.shulink.com(/files/article)?/html/\\d+/\\d+/\\d+.html',
      infoPage: 'a:contains("返回书页")',
      title: 'span[style*="color:red"]',
      writer: 'div[style*="float:right"] a[href^="/author"]',
      intro: '.tabvalue>div',
      cover: '.divbox img',
      chapter: '.index>dd>a',
      vipChapter: '.index>dd:has(em)>a',
      chapterTitle: '.atitle',
      content: '#acontent',
      elementRemove: 'div',
      contentReplace: [
        [/作者.*?提醒.*/, ''],
      ],
    },
    { // http://www.soudu.net http://www.wjsw.com/
      siteName: '搜读网',
      url: '://www.(soudu.net|wjsw.com)/html/\\d+/\\d+/index.shtml',
      chapterUrl: '://www.(soudu.net|wjsw.com)/html/\\d+/\\d+/\\d+.shtml',
      infoPage: '.myPlace >a:nth-child(7)',
      title: 'h1',
      writer: '.c>a+a+span',
      intro: '#aboutBook',
      cover: 'img[onerror]',
      chapter: '.list>li>a',
      vipChapter: '.list>li:has(span.r_red)>a',
      chapterTitle: 'h1',
      content: '#content',
      elementRemove: 'div',
    },
    { // http://www.fbook.net
      siteName: '天下书盟',
      url: '://www.fbook.net/list/\\d+',
      chapterUrl: '://www.fbook.net/read/\\d+',
      infoPage: '[class$="crumb"] a[href*="/book/"]',
      title: 'h1',
      intro: 'h1+div+div',
      cover: '.c_img>img',
      chapter: '.mb_content a',
      vipChapter: '.mb_content a:has(span:contains("VIP"))',
      volume: '.mb_content>li[style]',
      chapterTitle: '[itemprop="headline"]',
      content: '[itemprop="acticleBody"]',
    },
    { // https://book.tiexue.net
      siteName: '铁血读书',
      url: '://book.tiexue.net/Book\\d+/list.html',
      chapterUrl: '://book.tiexue.net/Book\\d+/Content\\d+.html',
      infoPage: '.positions>a:nth-child(5)',
      title: '.normaltitle>span',
      writer: '[href^="/FriendCenter.aspx"]>u',
      intro: '.bookPrdt >p',
      cover: '.li_01 img',
      chapter: '.list01>li>p a',
      vipChapter: '.list01>li>p>span>a',
      volume: '.dictry>h2',
      chapterTitle: '#contents>h1',
      content: '#mouseRight',
    },
    { // https://www.yokong.com
      siteName: '悠空网',
      url: '://www.yokong.com/book/\\d+/chapter.html',
      chapterUrl: '://www.yokong.com/book/\\d+/\\d+.html',
      infoPage: '.location>a:nth-child(6)',
      title: '.name>h1',
      writer: '.authorname>a',
      intro: '.book-intro',
      cover: '.bigpic>img',
      chapter: '.chapter-list>li>span>a',
      vipChapter: '.chapter-list>li>span:has(.vip-icon)>a',
      volume: '.chapter-bd>h2',
      chapterTitle: 'h1',
      content: '.article-con',
      contentReplace: [
        ['请记住本站：.*'],
        ['微信公众号：.*'],
      ],
    },
    { // https://www.chuangbie.com
      siteName: '创别书城',
      url: '://www.chuangbie.com/book/catalog/book_id/\\d+.html',
      chapterUrl: '://www.chuangbie.com/book/read\\?book_id=\\d+&chapter_id=\\d+',
      title: '.con_02',
      writer: '.con_03>span',
      chapter: '.con_05 a',
      vipChapter: '.con_05 li:has(img)>a',
      volume: '.con_05>.bt',
      deal: async (chapter) => {
        const info = chapter.url.match(/\d+/g);
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `https://www.chuangbie.com/book/load_chapter_content?book_id=${info[0]}&chapter_id=${info[1]}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const json = unsafeWindow.strdecode(res.responseText);
                const content = json.content.chapter_content;
                const title = json.content.chapter_name;
                if (!Storage.book.title) Storage.book.title = json.content.book_name;
                if (!Storage.book.cover) Storage.book.cover = json.content.book_cover;
                if (!Storage.book.writer) Storage.book.writer = json.content.author_name;
                if (!Storage.book.intro) Storage.book.intro = json.content.descriotion;
                resolve({ title, content });
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
    },
    { // https://www.msxf.cn/
      siteName: '陌上香坊',
      url: '://www.msxf.cn/book/\\d+/chapter.html',
      chapterUrl: '://www.msxf.cn/book/\\d+/\\d+.html',
      infoPage: '[href*="/book/"][href$="index.html"]',
      title: '.title>a',
      writer: '.aInfo>.name>a',
      intro: '.intro',
      cover: '.pIntroduce .pic img',
      chapter: '.chapter-list li>a',
      vipChapter: '.chapter-list li:has(.vipico)>a',
      chapterTitle: '.article-title',
      content: '#article-content-body',
      elementRemove: 'p:contains("www.msxf.cn")',
    },
    { // https://www.lajixs.com/
      siteName: '辣鸡小说',
      url: '://www.lajixs.com/book/\\d+',
      chapterUrl: '://www.lajixs.com/chapter/\\d+',
      title: '.b-title>strong',
      writer: '.b-info>p>span>a',
      intro: '.bookIntro>.text',
      cover: '.cover',
      chapter: '.b_chapter_list a',
      vipChapter: '.b_chapter_list div:has(.zdy-icon__vip)>a',
      volume: '.el-collapse-item__header',
      deal: async (chapter) => {
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: 'https://www.lajixs.com/api/book-read',
            method: 'POST',
            data: `chapterId=${chapter.url.match(/\d+/)[0]}&readType=1`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const json = JSON.parse(res.responseText);
                const title = json.data.chapterInfo.bookTitle;
                const content = json.data.chapterInfo.chapterContent;
                resolve({ title, content });
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
      elementRemove: 'lg',
    },
    { // https://www.popo.tw
      siteName: 'POPO原創市集',
      url: '://www.popo.tw/books/\\d+/articles(\\?page=\\d+)?$',
      chapterUrl: '://www.popo.tw/books/\\d+/articles/\\d+',
      title: '.booksdetail .title',
      writer: '.b_author>a',
      intro: '.book_intro',
      cover: '.cover-b',
      chapter: '.list-view .c2>a',
      chapterTitle: '.read-txt>h2',
      content: '.read-txt',
      getChapters: (doc) => Rule.special.find((i) => i.siteName === 'PO18臉紅心跳').getChapters(doc),
      elementRemove: 'blockquote',
    },
    { // https://www.po18.tw/
      siteName: 'PO18臉紅心跳',
      url: '://www.po18.tw/books/\\d+/articles(\\?page=\\d+)?$',
      chapterUrl: '://www.po18.tw/books/\\d+/articles/\\d+',
      title: '.book_name',
      writer: '.book_author',
      cover: '.book_cover>img',
      chapter: '.list-view .l_chaptname>a',
      deal: async (chapter) => {
        const urlArr = chapter.url.split('/');
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `${window.location.origin}/books/${urlArr[4]}/articlescontent/${urlArr[6]}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                resolve(res.responseText);
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
      getChapters: async (doc) => {
        const urlArr = window.location.href.split('/');
        const res = await xhr.sync(`${window.location.origin}/books/${urlArr[4]}/allarticles`, null, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            Referer: window.location.href,
            'X-Requested-With': 'XMLHttpRequest',
          },
          responseType: 'document',
        });
        return $('a', res.response).toArray().map((i) => ({
          title: $(i).text(),
          url: $(i).prop('href'),
          vip: $(i).is(':has(img)'),
        }));
      },
      elementRemove: 'blockquote',
    },
    { // https://www.qidian.com.tw/
      siteName: '起点台湾',
      url: '://www.qidian.com.tw/books/\\d+/volumes',
      chapterUrl: '://www.qidian.com.tw/books/\\d+/articles/\\d+',
      infoPage: '.breadcrumb>a:nth-child(3)',
      title: 'h1',
      writer: 'h1+.bm',
      intro: '#dot1',
      cover: '.imgbc-b>img',
      chapter: '.chapter>a',
      vipChapter: '.chapter.pay>a',
      volume: '.chapter-list-all>ul>li.TITLE',
      chapterTitle: 'h1',
      content: '.box-text dd',
    },
    { // https://www.linovel.net/
      siteName: '轻之文库',
      url: '://www.linovel.net/book/\\d+.html',
      chapterUrl: '://www.linovel.net/book/\\d+/\\d+.html',
      title: '.book-title',
      writer: '.author-frame .name>a',
      intro: '.about-text',
      cover: '.book-cover img',
      chapter: '.chapter a',
      volume: '.volume-title>a',
      chapterTitle: '.article-title',
      content: '.article-text',
    },
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
    },
    { // https://sosad.fun/
      siteName: 'SosadFun|废文',
      url: '://(sosad.fun|xn--pxtr7m.com|xn--pxtr7m5ny.com)/threads/\\d+/(profile|chapter_index)',
      chapterUrl: '://(sosad.fun|xn--pxtr7m.com|xn--pxtr7m5ny.com)/posts/\\d+',
      title: '.font-1',
      writer: '.h5 a[href*="/users/"]',
      intro: '.article-body .main-text',
      chapter: '.panel-body .table th:nth-child(1)>a[href*="/posts/"]',
      chapterTitle: 'strong.h3',
      content: '.post-body>.main-text:nth-child(1)',
      elementRemove: 'div:last-child,.hidden',
    },
    { // https://www.myhtlmebook.com/ https://www.myhtebooks.com/ https://www.haitbook.com/
      siteName: '海棠文化线上文学城',
      filter: () => {
        if ($('.title>a>img[alt="海棠文化线上文学城"]').length) {
          if (window.location.search.match('\\?act=showinfo&bookwritercode=.*?&bookid=')) {
            return 1;
          } if (window.location.search.match('\\?act=showpaper&paperid=')) {
            return 2;
          }
        }
      },
      // url: '(myhtlmebook|myhtebooks?|urhtbooks|haitbook).com/\\?act=showinfo&bookwritercode=.*?&bookid=',
      // chapterUrl: '(myhtlmebook|myhtebooks?|urhtbooks|haitbook).com/\\?act=showpaper&paperid=',
      title: '#mypages .uk-card h4',
      writer: '#writerinfos>a',
      chapter: '.uk-list>li>a[href^="/?act=showpaper&paperid="]',
      vipChapter: '.uk-list>li:not(:contains("免費"))>a[href^="/?act=showpaper&paperid="]',
      volume: '.uk-list>li:not(:has(a[href^="/?act=showpaper&paperid="])):has(b>font)',
      chapterTitle: '.uk-card-title',
      content: async (doc, res, request) => {
        const writersay = $('#colorpanelwritersay', res.responseText).html();
        let egg;
        if ($('[id^="eggsarea"]+[uk-icon="commenting"]', res.responseText).length) {
          const paperid = $('[id^="eggsarea"]', res.responseText).attr('id').match(/^eggsarea(.*)$/)[1];
          const bookwritercode = $('[uk-icon="list"]', res.responseText).attr('href').match(/bookwritercode=(.*?)($|&)/)[1];
          const bookid = $('[uk-icon="list"]', res.responseText).attr('href').match(/bookid=(.*?)($|&)/)[1];
          const msgs = ['q', '敲', '\ud83e\udd5a'];
          await new Promise((resolve, reject) => {
            xhr.add({
              method: 'POST',
              url: `${window.location.origin}/papergbookresave.php`,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                Referer: request.raw.url,
                'X-Requested-With': 'XMLHttpRequest',
              },
              data: `paperid=${paperid}&bookwritercode=${bookwritercode}&bookid=${bookid}&repapergbookid=0&papergbookpage=1&repostmsgtxt=${msgs[Math.floor(Math.random() * msgs.length)]}&postmode=1&giftid=0`,
              onload(res) {
                resolve(res);
              },
            }, null, 0, true);
          });

          const res2 = await new Promise((resolve, reject) => {
            xhr.add({
              method: 'POST',
              url: `${window.location.origin}/showpapereggs.php`,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                Referer: request.raw.url,
                'X-Requested-With': 'XMLHttpRequest',
              },
              data: `paperid=${paperid}&bookwritercode=${bookwritercode}`,
              onload(res) {
                resolve(res);
              },
            }, null, 0, true);
          });
          egg = res2.responseText;
          if (egg.includes('#gopapergbook')) {
            egg = '彩蛋加载失败';
          }
        } else {
          egg = $('[id^="eggsarea"]', res.responseText).html();
        }

        const content = await new Promise((resolve, reject) => {
          const [, paperid, vercodechk] = res.responseText.match(/data: { paperid: '(\d+)', vercodechk: '(.*?)'},/);
          xhr.add({
            chapter: request.raw,
            url: '/showpapercolor.php',
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: request.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            data: `paperid=${paperid}&vercodechk=${vercodechk}`,
            onload(res, request) {
              try {
                const content = res.responseText;
                resolve(content);
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content + (writersay ? `${writersay}<br>---<br>以下正文` : '') + (egg ? `<br>---<br>彩蛋內容：<br>${egg}` : '');
      },
      getChapters: async (doc) => {
        const id = window.location.href.match(/bookid=(.*?)($|&)/)[1];
        const chapters = [];
        let pages = 1;
        while (true) {
          const res = await xhr.sync(`${window.location.origin}/showbooklist.php`, `ebookid=${id}&pages=${pages}&showbooklisttype=1`, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: window.location.href,
              'X-Requested-With': 'XMLHttpRequest',
            },
            responseType: 'document',
          });
          chapters.push(...$('.uk-list>li>a[href^="/?act=showpaper&paperid="]', res.response).toArray().map((i) => ({
            title: $(i).text(),
            url: $(i).prop('href'),
            vip: $(i).is('.uk-list>li:not(:contains("免費"))>a[href^="/?act=showpaper&paperid="]'),
            volume: $(i).parent().prevAll('.uk-list>li:not(:has(a[href^="/?act=showpaper&paperid="])):has(b>font)').eq(0)
              .text(),
          })));
          if ($('.uk-list>li:has([onclick^="showbooklistpage"])', res.response).length && $('.uk-list>li:has([onclick^="showbooklistpage"])', res.response).eq(0).find('font:has(b)').next('a').length) {
            pages++;
          } else {
            break;
          }
        }
        return chapters;
      },
    },
    { // https://www.doufu.la/
      siteName: '豆腐',
      url: '://www.doufu.la/novel-',
      chapterUrl: '://www.doufu.la/chapter/',
      title: 'h1.book_tt>a',
      writer: '.book_author',
      intro: '.book_des',
      cover: '.book_img',
      chapter: '.catelogue a',
      vipChapter: '.catelogue .list_item:has([class*="icon-lock"])>a',
      chapterTitle: '.chapter_tt',
      content: async (doc, res, request) => {
        const chapter = request.raw;
        const token = $(res.responseText).toArray().find((i) => i.tagName === 'META' && i.name === 'csrf-token').content; // same as XSRF-TOKEN<cookie>
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `https://www.doufu.la/novel/getChapter/${chapter.url.split('/')[4]}`,
            method: 'POST',
            headers: {
              Referer: chapter.url,
              'x-csrf-token': token,
            },
            onload(res, request) {
              try {
                const json = JSON.parse(res.responseText);
                const { content } = json;
                resolve(content);
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
      elementRemove: '.hidden',
      thread: 1,
    },
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
    },
    { // https://www.ireader.com/
      siteName: '掌阅书城',
      url: '://www.ireader.com/index.php\\?ca=bookdetail.index&bid=\\d+$',
      chapterUrl: ':https://www.ireader.com/index.php\\?ca=Chapter.Index&pca=bookdetail.index&bid=\\d+&cid=\\d+',
      title: '.bookname>h2>a',
      writer: '.bookInfor .author',
      intro: '.bookinf03>p',
      cover: '.bookInfor>div>a>img',
      chapterTitle: '.content h2',
      content: '.content>.article',
      getChapters: async (doc) => {
        const bid = window.location.search.match(/&bid=(\d+)(&|$)/)[1];
        const chapters = [];
        let page = 0;
        let total = 0;
        while ((page = page + 1)) {
          const res = await xhr.sync(`${window.location.origin}/index.php?ca=Chapter.List&ajax=1&bid=${bid}&page=${page}&pageSize=100`);
          const json = JSON.parse(res.responseText);
          for (const i of json.list) {
            chapters.push({
              title: i.chapterName,
              url: `https://www.ireader.com/index.php?ca=Chapter.Index&pca=Chapter.Index&bid=${bid}&cid=${i.id}`,
              vip: i.priceTag === '收费',
            });
          }
          if (json.list[chapters.length - 1].priceTag === '收费') break;
          total = total + json.list.length;
          if (total >= json.page.total) break;
        }
        return chapters;
      },
    },
    { // https://read.douban.com/
      siteName: '豆瓣阅读',
      url: '://read.douban.com/column/\\d+/',
      chapterUrl: '://read.douban.com/reader/column/\\d+/chapter/\\d+/',
      title: '.title[itemprop="name"]',
      writer: '.name[itemprop="name"]',
      intro: '.intro',
      cover: () => $('[property="og:image"]').attr('content'),
      getChapters: async (doc) => {
        const id = window.location.href.split('/')[4];
        const chapters = [];
        while (true) {
          const res = await xhr.sync(`https://read.douban.com/j/column_v2/${id}/chapters?start=0&limit=100&latestFirst=0`);
          const json = JSON.parse(res.responseText);
          for (const item of json.list) {
            chapters.push({
              title: item.title,
              url: `${window.location.origin}${item.links.reader}`,
              vip: !item.isPurchased && item.price,
            });
          }
          if (chapters.length >= json.total) break;
        }
        return chapters;
      },
      fns: {
        cookieGet(e) {
          const t = document.cookie.match(new RegExp(`(?:\\s|^)${e}\\=([^;]*)`));
          return t ? decodeURIComponent(t[1]) : null;
        },
        decrypt: async function test(t) {
          const { cookieGet } = Rule.special.find((i) => i.siteName === '豆瓣阅读').fns;
          const e = Uint8Array.from(window.atob(t), (t) => t.charCodeAt(0));
          const i = e.buffer;
          const d = e.length - 16 - 13;
          const p = new Uint8Array(i, d, 16);
          const f = new Uint8Array(i, 0, d);
          const g = {
            name: 'AES-CBC',
            iv: p,
          };
          return (function () {
            const t = unsafeWindow.Ark.user;
            const e = t.isAnonymous ? cookieGet('bid') : t.id;
            const i = (new TextEncoder()).encode(e);
            return window.crypto.subtle.digest('SHA-256', i).then((t) => window.crypto.subtle.importKey('raw', t, 'AES-CBC', !0, ['decrypt']));
          }()).then((t) => window.crypto.subtle.decrypt(g, t, f)).then((t) => JSON.parse((new TextDecoder()).decode(t)));
        },

      },
      deal: async (chapter) => {
        const aid = chapter.url.match('read.douban.com/reader/column') ? chapter.url.split('/')[7] : chapter.url.split('/')[5];
        let content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `${window.location.origin}/j/article_v2/get_reader_data`,
            method: 'POST',
            data: `aid=${aid}&reader_data_version=${window.localStorage.getItem('readerDataVersion')}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const json = JSON.parse(res.responseText);
                resolve(json.data);
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        if (content) {
          const json = await Rule.special.find((i) => i.siteName === '豆瓣阅读').fns.decrypt(content);
          content = {
            content: chapter.url.match('read.douban.com/reader/column') ? json.posts[0].contents.filter((i) => i.data && i.data.text).map((i) => i.data.text).flat().map((i) => i.content)
              .join('\n') : json.posts[0].contents.filter((i) => i.data && i.data.text).map((i) => (i.type === 'headline' ? '\n' : '') + i.data.text).join('\n'),
            title: json.posts[0].title,
          };
        }
        return content;
      },
    },
    { // https://read.douban.com/ebook
      siteName: '豆瓣阅读Ebook',
      url: '://read.douban.com/ebook/\\d+/',
      chapterUrl: '://read.douban.com/reader/ebook/\\d+/',
      title: '.article-title[itemprop="name"]',
      writer: '.author-item',
      intro: '[itemprop="description"]>.info',
      cover: '.cover>[itemprop="image"]',
      chapter: '.btn-read',
      deal: async (chapter) => Rule.special.find((i) => i.siteName === '豆瓣阅读').deal(chapter),
    },
    // 轻小说
    { // https://www.wenku8.net
      siteName: '轻小说文库',
      url: /wenku8.(net|com)\/novel\/.*?\/(index\.htm)?$/,
      chapterUrl: /wenku8.(net|com)\/novel\/.*?\/\d+\.htm/,
      infoPage: 'a:contains("返回书页")',
      title: 'span>b',
      writer: '#content td:contains("小说作者"):last',
      intro: 'span:contains("内容简介")+br+span',
      cover: 'img[src*="img.wenku8.com"]',
      chapter: '.css>tbody>tr>td>a',
      volume: '.vcss',
      chapterTitle: '#title',
      content: '#content',
    },
    { // https://book.sfacg.com
      siteName: 'SF轻小说',
      url: '://book.sfacg.com/Novel/\\d+/MainIndex/',
      chapterUrl: '://book.sfacg.com/Novel/\\d+/\\d+/\\d+/|://book.sfacg.com/vip/c/\\d+/',
      infoPage: '.crumbs a:nth-child(6)',
      title: 'h1.title>.text',
      writer: '.author-name',
      intro: '.introduce',
      cover: '.summary-pic>img',
      chapter: '.catalog-list>ul>li>a',
      vipChapter: '.catalog-list>ul>li>a:has(.icn_vip)',
      volume: '.catalog-title',
      chapterTitle: '.article-title',
      content: '#ChapterBody',
      vip: {
        deal: async (chapter) => `<img src="http://book.sfacg.com/ajax/ashx/common.ashx?op=getChapPic&tp=true&quick=true&cid=${chapter.url.split('/')[5]}&nid=${window.location.href.split('/')[4]}&font=16&lang=&w=728">`,
      },
    },
    { // https://www.qinxiaoshuo.com/
      siteName: '亲小说网',
      url: '://www.qinxiaoshuo.com/book/.*?',
      chapterUrl: '://www.qinxiaoshuo.com/read/\\d+/\\d+/.*?.html',
      title: 'h1',
      writer: '.info_item>div>a',
      intro: '.intro',
      cover: '.show_info>img',
      chapter: '.chapter>a',
      volume: '.volume_title>span',
      chapterTitle: '.c_title+.c_title>h3',
      content: '#chapter_content',
    },
    { // https://www.linovelib.com/
      siteName: '轻小说文库(linovelib.com)',
      url: '://www.linovelib.com/novel/\\d+/catalog',
      chapterUrl: '://www.linovelib.com/novel/\\d+/\\d+(_\\d+)?.html',
      infoPage: '.crumb>a:nth-child(3)',
      title: '.book-name',
      writer: '.au-name>a',
      intro: '.book-dec>p',
      cover: '.book-img>img',
      chapter: '.chapter-list a',
      volume: '.volume',
      chapterTitle: '#mlfy_main_text>h1',
      content: '.read-content',
    },
    { // https://www.esjzone.cc/
      siteName: 'ESJ Zone',
      url: '://(www.)?esjzone.cc/detail/\\d+.html',
      chapterUrl: '://(www.)?esjzone.cc/forum/\\d+/\\d+.html',
      title: 'h2',
      writer: '.book-detail a[href^="/tags/"]',
      intro: '.description',
      cover: '.product-gallery img',
      chapter: '#chapterList a',
      chapterTitle: 'h2',
      content: '.forum-content',
    },
    { // https://www.esjzone.cc/forum/ 论坛
      siteName: 'ESJ Zone 论坛',
      url: '://www.esjzone.cc/forum/\\d+',
      chapterUrl: '://www.esjzone.cc/forum/\\d+/\\d+.html',
      title: 'h2',
      writer: '.book-detail a[href^="/tags/"]',
      intro: '.description',
      cover: '.product-gallery img',
      chapter: '.forum-list a',
      chapterTitle: 'h2',
      content: '.forum-content',
    },
    { // http://www.shencou.com/
      siteName: '神凑小说网',
      url: '://www.shencou.com/read/\\d+/\\d+/index.html',
      chapterUrl: '://www.shencou.com/read/\\d+/\\d+/\\d+.html',
      infoPage: '[href*="books/read_"]',
      title: 'span>a',
      writer: '#content td:contains("小说作者"):nochild',
      intro: '[width="80%"]:last',
      cover: 'img[src*="www.shencou.com/files"]',
      chapter: '.zjlist4 a',
      volume: '.ttname>h2',
      chapterTitle: '>h1',
      content: 'body',
      elementRemove: 'div,script,center',
    },
    { // http://book.suixw.com
      siteName: '随想轻小说',
      url: '://book.suixw.com/modules/article/reader.php\\?aid=\\d+',
      chapterUrl: '://book.suixw.com/modules/article/reader.php\\?aid=\\d+&cid=\\d+',
      infoPage: 'a:contains("返回书页")',
      title: 'span[style]',
      writer: '#content td:contains("小说作者"):nochild',
      intro: '#content td:has(.hottext):last',
      cover: 'img[src*="book.suixw.com"]',
      chapter: '.ccss>a',
      volume: '.vcss',
      chapterTitle: '#title',
      content: '#content',
      contentReplace: [
        [/pic.wenku8.com/g, 'picture.wenku8.com'],
      ],
    },
    { // https://colorful-fantasybooks.com/
      siteName: '繽紛幻想',
      url: '://colorful-fantasybooks.com/module/novel/info.php\\?tid=\\d+&nid=\\d+',
      chapterUrl: '://colorful-fantasybooks.com/module/novel/read.php\\?tid=\\d+&nid=\\d+&cid=\\d+',
      title: '.works-intro-title>strong',
      writer: '.works-author-name',
      intro: 'works-intro-short',
      cover: '.works-cover>img',
      chapter: '.works-chapter-item>a',
      volume: '.vloume',
      chapterTitle: '#content>h2',
      content: '.content',
    },
    { // https://www.lightnovel.us/
      siteName: '轻之国度',
      url: '://www.lightnovel.us(/cn)?/search\\?kw=',
      chapterUrl: '://www.lightnovel.us(/cn)?/detail/\\d+',
      title: () => $('.search-input').val() || $('.article-title').text(),
      titleReplace: [[/^\[.*?\]([^[\]])/, '$1'], [/([^[\]])\[.*?\]$/, '$1']],
      cover: () => $('.long-item>a>div.cover').css('background-image').match(/url\("?(.*?)"?\)/)[1],
      chapter: '.long-item>.info>a',
      chapterTitle: '.article-title',
      content: (doc, res, request) => {
        const contentRaw = $('#article-main-contents', res.responseText).html();
        const content = contentRaw.replace(/^(<br>)+/, '').split(/<div.*?>.*?<\/div>|(<br>\s*){3,}/).map((i) => i && i.replace(/^(\s*|<br>)+/, '')).filter((i) => i);
        Storage.book.chapters.splice(Storage.book.chapters.indexOf(request.raw), 1, ...content.map((item, index) => ({
          title: `${request.raw.title} - 第${String(index + 1)}部分`,
          url: request.raw.url,
          content: item,
          contentRaw: item,
          document: res.responseText,
        })));
      },
    },
    { // https://www.lightnovel.us/
      siteName: '轻之国度',
      url: '://www.lightnovel.us(/cn)?/series',
      chapterUrl: '://www.lightnovel.us(/cn)?/detail/\\d+',
      title: () => unsafeWindow.__NUXT__.data[0].series.name,
      writer: () => unsafeWindow.__NUXT__.data[0].series.author,
      intro: () => unsafeWindow.__NUXT__.data[0].series.intro,
      cover: () => unsafeWindow.__NUXT__.data[0].series.cover,
      getChapters: () => window.__NUXT__.data[0].series.articles.sort((a, b) => a.aid - b.aid).map((i) => ({ title: i.title, url: `https://www.lightnovel.us/detail/${i.aid}` })),
      chapterTitle: '.article-title',
      content: (doc, res, request) => Rule.special.find((i) => i.siteName === '轻之国度').content(doc, res, request),
    },
    { // https://ncode.syosetu.com/
      siteName: '小説家になろう',
      url: '://ncode.syosetu.com/n\\d+[a-z]{2}(/#main)?',
      chapterUrl: '://ncode.syosetu.com/n\\d+[a-z]{2}/\\d+/',
      title: '.novel_title',
      writer: '.novel_writername>a',
      intro: '#novel_ex',
      chapter: '.index_box>dl>dd>a',
      chapterTitle: '.novel_subtitle',
      content: (doc, res, request) => {
        const content = $('#novel_honbun', res.responseText).html();
        const authorSays = $('#novel_a', res.responseText).html();
        return content + '-'.repeat(20) + authorSays;
      },
    },
    { // https://www.wattpad.com/
      siteName: 'Wattpad',
      url: '://www.wattpad.com/story/\\d+-',
      chapterUrl: '://www.wattpad.com/\\d+-',
      title: '.story-info__title',
      writer: '.author-info__username>a',
      intro: '.description>pre',
      cover: '.story-cover>img',
      chapter: '.story-parts__part',
      chapterTitle: '.panel-reading>h1.h2',
      content: '.part-content .page>div>pre',
      chapterPrev: (doc, res, request) => $('.table-of-contents>li.active', res.responseText).prevAll().find('a').toArray()
        .map((i) => i.href)
        .reverse(),
      chapterNext: (doc, res, request) => $('.table-of-contents>li.active', res.responseText).nextAll().find('a').toArray()
        .map((i) => i.href),
    },
    { // http://xs.kdays.net/index
      siteName: '萌文库',
      url: '://xs.kdays.net/book/\\d+/chapter',
      chapterUrl: '://xs.kdays.net/book/\\d+/read/\\d+',
      infoPage: '[href$="/detail"]',
      title: '.info-side>h2',
      writer: '.items>li>a[href^="/search/author"]',
      intro: '.info-side>blockquote',
      cover: '.book-detail>div>div>img',
      chapter: '#vols>div>div>ul>li>a',
      volume: '#vols>div>div>h2',
      chapterTitle: '.chapterName',
      content: 'article',
    },
    { // https://www.biquge1000.com/
      siteName: '吾的轻小说',
      url: '://www.biquge1000.com/book/\\d+.html',
      chapterUrl: '://www.biquge1000.com/book/\\d+/\\d+.html',
      title: '.bookTitle',
      writer: '.booktag>a[href*="?author"]',
      intro: '#bookIntro',
      cover: '.img-thumbnail',
      chapter: '#list-chapterAll>dl>dd>a',
      volume: '#list-chapterAll>dl>dt',
      chapterTitle: '.readTitle',
      content: '#htmlContent',
    },
    { // https://novel.crazyideal.com/
      siteName: '雷姆轻小说',
      url: '://novel.crazyideal.com/book/\\d+/',
      chapterUrl: '://novel.crazyideal.com/\\d+_\\d+/\\d+(_\\d+)?.html',
      title: '.novel_info_title>h1',
      writer: '.novel_info_title>i>a[href^="/author/"]',
      intro: '.intro',
      cover: '.novel_info_main>img',
      chapter: '#ul_all_chapters>li>a',
      chapterTitle: '.style_h1',
      content: '#article',
    },
    // 盗贴
    { // https://www.xiaoshuokan.com
      siteName: '好看小说网',
      url: '://www.xiaoshuokan.com/haokan/\\d+/index.html',
      chapterUrl: '://www.xiaoshuokan.com/haokan/\\d+/[\\d_]+.html',
      infoPage: () => `https://www.xiaoshuokan.com/haokan/${window.location.href.match(/\d+/)[0]}.html`,
      title: '.booktitle>h1',
      writer: '.bookinfo>span>a',
      intro: '.block-intro',
      cover: '.bookcover img',
      chapter: '.booklist a',
      deal: async (chapter) => {
        const urlArr = chapter.url.split(/[_/.]/);
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `https://www.xiaoshuokan.com/chapreadajax.php?siteno=${urlArr[7]}&bookid=${urlArr[8]}&chapid=${urlArr[9]}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              resolve(res.responseText);
            },
          }, null, 0, true);
        });
        return content;
      },
    },
    { // https://www.ggdtxt.com
      siteName: '格格党',
      url: '://www.ggdtxt.com/book/\\d+/',
      chapterUrl: '://www.ggdtxt.com/\\d+/read_\\d+.html',
      title: '.novelname>a',
      writer: '.pt-bookdetail-info [href^="/author/"]',
      intro: '.pt-bookdetail-intro',
      cover: '.pt-bookdetail-img',
      chapter: '.pt-chapter-cont~.pt-chapter-cont .pt-chapter-cont-detail a[href]',
      deal: async (chapter) => {
        const info = chapter.url.match(/\d+/g);
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `https://www.ggdtxt.com/api/novel/chapter/transcode.html?novelid=${info[0]}&chapterid=${info[1]}&page=1`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const json = JSON.parse(res.responseText);
                const title = json.data.chapter.name;
                const { content } = json.data.chapter;
                resolve({ title, content });
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
    },
    { // https://www.qiqint.com/
      siteName: '平板电子书网',
      url: '://www.qiqint.com/\\d+/$',
      chapterUrl: '://www.qiqint.com/\\d+/\\d+.html',
      title: 'h1',
      writer: '.author',
      intro: '.intro',
      cover: '.cover>img',
      chapter: '.list>dl>dd>a',
      chapterTitle: 'h1',
      content: '.content',
      elementRemove: 'div',
    },
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
    },
    { // http://www.5858xs.com
      siteName: '58小说网',
      url: '://www.5858xs.com/html/\\d+/\\d+/index.html',
      chapterUrl: '://www.5858xs.com/html/\\d+/\\d+/\\d+.html',
      infoPage: () => `http://www.5858xs.com/${window.location.href.split('/')[5]}.html`,
      title: 'h1>b',
      writer: '.info_a li>span',
      intro: '#info_content',
      cover: '#info_content>img',
      chapter: 'td>a[href$=".html"]',
      chapterTitle: 'h1',
      content: '#content',
      elementRemove: 'fieldset,table,div',
    },
    { // https://www.bookba8.com/
      siteName: '在线书吧',
      url: '://www.bookba8.com/mulu-\\d+-list.html',
      chapterUrl: '://www.bookba8.com/read-\\d+-chapter-\\d+.html',
      infoPage: '[href*="book-"][href*="-info.html"]',
      title: '.detail-title>h2',
      writer: '[href^="/author"]',
      intro: '.juqing>dd',
      cover: '.detail-pic>img',
      chapter: '.content>.txt-list>li>a',
      chapterTitle: 'h1',
      content: '.note',
    },
    { // http://www.quanbensw.cn/
      siteName: '全本书屋(quanbensw)',
      url: '://www.quanbensw.cn/index.php\\?s=/Home/Index/articlelist/id/\\d+.html',
      chapterUrl: '://www.quanbensw.cn/index.php\\?s=/Home/Index/info/id/\\d+.html',
      title: 'h4>strong',
      writer: 'h4+p>strong',
      intro: 'h4+p+h5',
      cover: '[alt="avatar"]',
      // chapter: '[href^="/index.php?s=/Home/Index/info/id"]',
      chapterTitle: '.content-header h1',
      content: '.article-story',
    },
    { // https://www.yooread.net/
      siteName: '悠读文学网',
      url: '://www.yooread.net/\\d+/\\d+/$',
      chapterUrl: '://www.yooread.net/\\d+/\\d+/\\d+.html',
      title: '.txt>h1',
      writer: '.wr>a',
      intro: '.last>p',
      cover: '.img>img',
      chapter: '#booklist .bookchapter+table a[href^="/"]',
      chapterTitle: 'h1',
      content: '#TextContent',
      elementRemove: 'div',
    },
    { // https://www.wanbentxt.com/
      siteName: '完本神站',
      url: '://www.wanbentxt.com/\\d+/$',
      chapterUrl: '://www.wanbentxt.com/\\d+/\\d+(_\\d+)?.html',
      title: '.detailTitle>h1',
      writer: '.writer>a',
      intro: '.detailTopMid>table>tbody>tr:nth-child(3)>td:nth-child(2)',
      cover: '.detailTopLeft>img',
      chapter: '.chapter>ul>li>a',
      chapterTitle: '.readerTitle>h2',
      content: '.readerCon',
      contentReplace: [
        [/^\s*(&nbsp;)+谨记我们的网址.*。/m],
        [/^\s*(&nbsp;)+一秒记住.*/m],
        [/^<br>(&nbsp;)+【提示】：.*?。/m],
        [/^<br>(&nbsp;)+看更多好文请搜.*/m],
        [/^<br>(&nbsp;)+《[完本神站]》.*/m],
        [/^<br>(&nbsp;)+喜欢神站记得收藏.*/m],
        [/^<br>(&nbsp;)+支持.*把本站分享那些需要的小伙伴.*/m], // eslint-disable-line no-control-regex
        [/--&gt;&gt;本章未完，点击下一页继续阅读/],
      ],
    },
    { // https://www.qiushubang.com/
      siteName: '求书帮',
      url: '://www.qiushubang.com/\\d+/$',
      chapterUrl: '://www.qiushubang.com/\\d+/\\d+(_\\d+)?.html',
      title: '.bookPhr>h2',
      writer: '.bookPhr>dl>dd:contains("作者")',
      intro: '.introCon>p',
      cover: '.bookImg>img',
      chapter: '.chapterCon>ul>li>a',
      chapterTitle: '.articleTitle>h2',
      content: '.articleCon>p:nth-child(3)',
    },
    { // https://www.lhjypx.net/ // TODO
      siteName: '笔下看书阁',
      url: '://www.lhjypx.net/(novel|other/chapters/id)/\\d+.html',
      chapterUrl: '://www.lhjypx.net/book/\\d+/\\w+.html',
      infoPage: '.breadcrumb>li:nth-child(3)>a',
      title: '.info2>h1',
      writer: '.info2>h3>a',
      intro: '.info2>div>p',
      cover: '.info1>img',
      chapter: '.list-charts [href*="/book/"],.panel-chapterlist [href*="/book/"]',
      chapterTitle: '#chaptername',
      content: '#txt',
    },
    { // http://m.yuzhaige.cc/
      siteName: '御书阁',
      url: '://m.yuzhaige.cc/\\d+/\\d+/$',
      chapterUrl: '://m.yuzhaige.cc/\\d+/\\d+/\\d+(_\\d+)?.html',
      infoPage: '.currency_head>h1>a',
      title: '.cataloginfo>h3',
      writer: '.infotype>p>a[href*="/author/"]',
      intro: '.intro>p',
      chapter: '.chapters a',
      chapterTitle: '#chaptertitle',
      content: (doc, res, request) => {
        const doc1 = new window.DOMParser().parseFromString(res.responseText, 'text/html');
        const order = window.atob(doc1.getElementsByTagName('meta')[7].getAttribute('content')).split(/[A-Z]+%/);
        const codeurl = res.responseText.match(/var codeurl="(\d+)";/)[1] * 1;
        const arrRaw = $('#content', doc1).children().toArray();
        const arr = [];
        for (let i = 0; i < order.length; i++) {
          const truth = order[i] - ((i + 1) % codeurl);
          arr[truth] = arrRaw[i];
        }
        return arr.map((i) => i.textContent);
      },
      chapterNext: '.chapterPages>a.curr~a,.p3>a',
    },
    { // https://www.ruth-tshirt.com/
      siteName: '老猫小说',
      filter: () => ($('[src="https://www.laomaoxs.com/static/image/qrcode.png"]').length && window.location.pathname.match(/\d+\.html$/) ? 1 : 0),
      // chapterUrl: '://www.ruth-tshirt.com/ruth1/\\d+/\\w+.html',
      title: ['.h1title > .shuming > a[title]', '.chapter_nav > div:first > a:last', '#header > .readNav > span > a:last', 'div[align="center"] > .border_b > a:last', '.ydselect > .weizhi > a:last', '.bdsub > .bdsite > a:last', '#sitebar > a:last', '.con_top > a:last', '.breadCrumb > a:last'].join(','),
      chapter: ['[id*="list"] a', '[class*="list"] a', '[id*="chapter"] a', '[class*="chapter"] a'].join(','),
      chapterTitle: '.chaptername',
      content: (doc, res, request) => {
        let content = $('.txt', res.responseText).html();
        const str = '的一是了我不人在他有这个上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学么之都好看起发当没成只如事把还用第样道想作种开美总从无情己面最女但现前些所同日手又行意动';
        content = content.replace(/[\ue800-\ue863]/g, (matched) => str[matched.charCodeAt(0) - 0xe800]);
        return content;
      },
    },
    { // https://www.19826.net/
      siteName: '19826文学',
      url: '://www.19826.net/\\d+/$',
      chapterUrl: '://www.19826.net/\\d+/\\d+(_\\d+)?.html',
      title: '.bookTitle',
      writer: '.booktag>[href*="author="]',
      intro: '#bookIntro',
      cover: '.img-thumbnail',
      chapter: '#list-chapterAll .panel-chapterlist>dd>a',
      chapterTitle: '.readTitle',
      content: '.panel-readcontent>.panel-body>div[id]',
      chapterNext: async (doc, res, request) => (res.responseText.match(/url = "(.*?)";/) ? res.responseText.match(/url = "(.*?)";/)[1] : []),
    },
    { // https://www.lewenn.com/
      siteName: '乐文小说网',
      url: '://www.lewenn.com/lw\\d+/$',
      chapterUrl: '://www.lewenn.com/lw\\d+/\\d+.html',
      title: '#info>h1',
      writer: '#info>h1+p',
      intro: '#intro',
      cover: '#fmimg>img',
      chapter: '.list dd>a',
      chapterTitle: '.head_title>h2',
      iframe: true,
      content: '#content',
      elementRemove: 'script,div',
    },
    { // http://www.daomubiji.org/
      siteName: '盗墓笔记',
      url: '://www.daomubiji.org/([a-z\\d]+)?$',
      chapterUrl: '://www.daomubiji.org/\\d+.html',
      title: '.mulu>h1',
      chapter: '.panel>ul>li>span>a',
      volume: '.panel>h2',
      chapterTitle: '.bg>h1',
      content: '.bg>.content',
    },
    { // https://www.va-etong.com/
      siteName: '全本小说网',
      url: '://www.va-etong.com/xs/\\d+/$',
      chapterUrl: '://www.va-etong.com/xs/\\d+/\\d+.html',
      title: '.book-text>h1',
      writer: '.book-text>h1+span',
      intro: '.book-text>.intro',
      cover: '.book-img>a>img',
      chapter: '.cf+h3+.cf>li>a',
      chapterTitle: '.chaptername',
      content: async (doc, res, request) => {
        const ssid = res.response.match(/var ssid=(.*?);/)[1];
        const bookid = res.response.match(/bookid=(.*?);/)[1];
        const mybookid = res.response.match(/mybookid=(.*?);/)[1];
        const xid = Math.floor(mybookid / 1000);
        const chapterid = res.response.match(/chapterid=(.*?);/)[1];
        const hou = '.html';

        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter: request.raw,
            url: `${window.location.origin}/files/article/html${ssid}/${xid}/${bookid}/${chapterid}${hou}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: request.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const content = window.eval(res.responseText); // eslint-disable-line no-eval
                resolve(content);
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
    },
    { // https://www.shuquge.com/
      siteName: '书趣阁',
      url: '://www.shuquge.com/txt/\\d+/index.html',
      chapterUrl: '://www.shuquge.com/txt/\\d+/\\d+.html',
      title: '.info>h2',
      writer: '.info>.small>span:nth-child(1)',
      intro: '.intro',
      cover: '.cover>img',
      chapter: '.listmain>dl>dt~dt~dd>a',
      volume: '.listmain>dl>dt~dt',
      chapterTitle: '.content>h1',
      content: '#content',
      thread: 1,
      contentReplace: [['https://www.shuquge.com/.*'], ['请记住本书首发域名：www.shuquge.com。书趣阁_笔趣阁手机版阅读网址：m.shuquge.com']],
    },
    { // https://www.kuwx.net/
      siteName: '系统小说网',
      url: '://www.kuwx.net/ku/\\d+/\\d+/',
      chapterUrl: '://www.kuwx.net/ku/\\d+/\\d+/\\d+.html',
      title: '.book_inf h1',
      writer: '.book_inf .zz',
      intro: '.book_inf .jianjie+div',
      cover: '.book_cov>img',
      chapter: '#chapter>a',
      chapterTitle: '.article>h2',
      content: (doc, res, request) => $('#txt>dd', res.responseText).toArray().map((i) => [$(i).data('id'), $(i).html()]).filter((i) => i[0] !== 999)
        .sort((a, b) => a[0] - b[0])
        .map((i) => i[1])
        .join(''),
    },
    // 18X
    { // http://www.6mxs.com/ http://www.baxianxs.com/ http://www.iqqxs.com/
      siteName: '流氓小说网',
      // url: [/6mxs.com\/novel.asp\?id=\d+/, '://www.baxianxs.com/xiaoshuo.asp\\?id=\\d+'],
      // chapterUrl: [/6mxs.com\/pages.asp\?id=\d+/, '://www.baxianxs.com/page.asp\\?id=\\d+'],
      filter: () => ($('.viewxia').length ? ($('.content').length ? 2 : 1) : 0),
      title: '.lookmc>strong',
      writer: '.zl',
      intro: '.js',
      chapter: '.mread:eq(0)>tbody>tr:gt(0) a',
      chapterTitle: 'font>strong',
      content: '[class^="l"],[class^="con"]',
      contentReplace: [
        ['<img src=".*?/([a-z]+\\d?).jpg">', '{$1}'],
        ['{ai}', '爱'],
        ['{ba}', '巴'],
        ['{bang}', '棒'],
        ['{bao}', '饱'],
        ['{bi}', '逼'],
        ['{bi2}', '屄'],
        ['{bo}', '勃'],
        ['{cao}', '操'],
        ['{cao2}', '肏'],
        ['{cha}', '插'],
        ['{chan}', '缠'],
        ['{chao}', '潮'],
        ['{chi}', '耻'],
        ['{chou}', '抽'],
        ['{chuan}', '喘'],
        ['{chuang}', '床'],
        ['{chun}', '春'],
        ['{chun2}', '唇'],
        ['{cu}', '粗'],
        ['{cuo}', '搓'],
        ['{dang}', '荡'],
        ['{dang2}', '党'],
        ['{diao}', '屌'],
        ['{dong}', '洞'],
        ['{dong2}', '胴'],
        ['{fei}', '肥'],
        ['{feng}', '缝'],
        ['{fu}', '腹'],
        ['{gan}', '感'],
        ['{gang}', '肛'],
        ['{gao}', '高'],
        ['{gao2}', '睾'],
        ['{gen}', '根'],
        ['{gong}', '宫'],
        ['{gu}', '股'],
        ['{gui}', '龟'],
        ['{gun}', '棍'],
        ['{huan}', '欢'],
        ['{ji}', '激'],
        ['{ji2}', '鸡'],
        ['{ji3}', '妓'],
        ['{jian}', '贱'],
        ['{jian2}', '奸'],
        ['{jiao}', '交'],
        ['{jin}', '禁'],
        ['{jing}', '精'],
        ['{ku}', '裤'],
        ['{kua}', '胯'],
        ['{lang}', '浪'],
        ['{liao}', '撩'],
        ['{liu}', '流'],
        ['{lou}', '露'],
        ['{lu}', '撸'],
        ['{luan}', '乱'],
        ['{luo}', '裸'],
        ['{man}', '满'],
        ['{mao}', '毛'],
        ['{mi}', '密'],
        ['{mi2}', '迷'],
        ['{min}', '敏'],
        ['{nai}', '奶'],
        ['{nen}', '嫩'],
        ['{niang}', '娘'],
        ['{niao}', '尿'],
        ['{nong}', '弄'],
        ['{nue}', '虐'],
        ['{nv}', '女'],
        ['{pen}', '喷'],
        ['{pi}', '屁'],
        ['{qi}', '骑'],
        ['{qi2}', '妻'],
        ['{qiang}', '枪'],
        ['{ri}', '日'],
        ['{rou}', '肉'],
        ['{rou2}', '揉'],
        ['{ru}', '乳'],
        ['{ru2}', '蠕'],
        ['{rui}', '蕊'],
        ['{sa2i}', '塞'],
        ['{sai}', '塞'],
        ['{sao}', '骚'],
        ['{se}', '色'],
        ['{she}', '射'],
        ['{shen}', '身'],
        ['{shi}', '湿'],
        ['{shu}', '熟'],
        ['{shuang}', '爽'],
        ['{shun}', '吮'],
        ['{tian}', '舔'],
        ['{ting}', '挺'],
        ['{tun}', '吞'],
        ['{tun2}', '臀'],
        ['{tuo}', '脱'],
        ['{wei}', '慰'],
        ['{xi}', '吸'],
        ['{xie}', '泄'],
        ['{xie2}', '邪'],
        ['{xing}', '性'],
        ['{xiong}', '胸'],
        ['{xue}', '穴'],
        ['{ya}', '压'],
        ['{yan}', '艳'],
        ['{yang}', '阳'],
        ['{yang2}', '痒'],
        ['{yao}', '腰'],
        ['{ye}', '液'],
        ['{yi}', '旖'],
        ['{yi2}', '衣'],
        ['{yin}', '阴'],
        ['{yin2}', '淫'],
        ['{yin3}', '吟'],
        ['{ying}', '迎'],
        ['{you}', '诱'],
        ['{yu}', '欲'],
        ['{zhang}', '胀'],
        ['{zuo}', '坐'],
      ],
    },
    { // http://www.22lewen.com/
      siteName: '乐文小说网',
      url: '://www.\\d+lewen.com/read/\\d+(/0)?.html',
      chapterUrl: '://www.\\d+lewen.com/read/\\d+/\\d+(_\\d+)?.html',
      title: '.book-title>h1',
      chapter: '.chapterlist>dd>a',
      chapterTitle: '#BookCon>h1',
      content: '#BookText',
    },
    { // http://www.shubao202.com/index.php http://lawen24.com/
      siteName: '书包网',
      url: ['://www.shubao202.com/book/\\d+', '://lawen24.com/txtbook/\\d+.html'],
      chapterUrl: ['://www.shubao202.com/read/\\d+/\\d+', '://lawen24.com/read/\\d+/\\d+'],
      title: 'h1',
      chapter: '.mulu a',
      chapterTitle: 'h1',
      content: '.mcc',
    },
    { // https://www.cool18.com/bbs4/index.php
      siteName: '禁忌书屋',
      filter: () => (['www.cool18.com'].includes(window.location.host) ? ($('#myform').length ? 2 : 1) : 0),
      chapterUrl: '://www.cool18.com/bbs4/index.php\\?app=forum&act=threadview&tid=\\d+',
      title: 'font>b',
      chapter: 'a:not(:contains("(无内容)"))',
      chapterTitle: 'font>b',
      content: '.show_content>pre',
      chapterPrev: '.show_content>p>a',
      chapterNext: 'body>table td>p:first+ul a:not(:contains("(无内容)")),.show_content>pre a',
      elementRemove: 'font[color*="E6E6DD"],b:contains("评分完成")',
    },
    { // http://www.7zxs.cc/
      siteName: '7z小说网',
      url: '://www.7zxs.cc/ik258/\\d+/\\d+/index.html',
      chapterUrl: '://www.7zxs.cc/ik258/\\d+/\\d+/\\d+.html',
      title: '.title>h2',
      writer: '.title>h2+span',
      chapter: '.ocon>dl>dd>a',
      chapterTitle: '.nr_title>h3',
      content: '#htmlContent',
      contentReplace: [
        ['登陆7z小说网.*'],
      ],
    },
    { // http://www.qdxiaoshuo.net/
      siteName: '青豆小说网',
      url: '://www.qdxiaoshuo.net/book/\\d+.html',
      chapterUrl: '://www.qdxiaoshuo.net/read/\\d+/\\d+.html',
      title: '.kui-left.kui-fs32',
      chapter: '.kui-item>a',
      chapterTitle: 'h1.kui-ac',
      content: '#kui-page-read-txt',
    },
    { // https://www.shushuwu8.com/
      siteName: '书书屋',
      url: '://www.shushuwu8.com/novel/\\d+/$',
      chapterUrl: '://www.shushuwu8.com/novel/\\d+/\\d+.html',
      title: '.ml_title>h1',
      writer: '.ml_title>h1+span',
      chapter: '.ml_main>dl>dd>a',
      chapterTitle: 'h2',
      content: '.yd_text2',
    },
    { // http://www.cuiweijux.com/
      siteName: '翠微居小说网',
      url: '://www.cuiweijux.com/files/article/html/\\d+/\\d+/index.html',
      chapterUrl: '://www.cuiweijux.com/files/article/html/\\d+/\\d+/\\d+.html',
      title: 'td[valign="top"]>div>span:eq(0)',
      writer: 'td[valign="top"]>div>span:eq(1)',
      intro: '.tabvalue>div:nth-child(3)',
      cover: 'img[onerror]',
      chapter: '.chapters:eq(1)>.chapter>a',
      chapterTitle: '.title',
      content: '#content',
    },
    { // http://www.4shubao.com/
      siteName: '4书包',
      url: '://www.4shubao.com/read/\\d+.html',
      chapterUrl: '://www.4shubao.com/read/\\d+/\\d+.html',
      title: 'h1',
      chapter: '.chapterlist a',
      chapterTitle: 'h1',
      content: '#BookText',
    },
    { // http://www.xitxt.net
      siteName: '喜书网',
      url: '://www.xitxt.net/book/\\d+.html',
      chapterUrl: '://www.xitxt.net/read/\\d+_\\d+.html',
      title: 'h1',
      chapter: '.list a',
      chapterTitle: 'h1',
      content: '.chapter',
      elementRemove: 'font',
    },
    { // http://www.shenshuw.com
      siteName: '神书网',
      url: '://www.shenshu.info/s\\d+/',
      chapterUrl: '://www.shenshu.info/s\\d+/\\d+.html',
      title: 'h1',
      chapter: '#chapterlist a',
      chapterTitle: 'h1',
      content: '#book_text',
    },
    { // https://www.quanshuwan.com/
      siteName: '全本书屋',
      url: '://www.quanshuwan.com/book/\\d+.aspx',
      chapterUrl: '://www.quanshuwan.com/article/\\d+.aspx',
      title: 'h1',
      writer: 'h1~p',
      intro: '#bookintroinner',
      cover: '.fm>img',
      chapter: '#readlist a',
      chapterTitle: 'h1',
      content: '#content',
      elementRemove: 'div',
    },
    { // https://www.dzwx520.com/
      siteName: '大众小说网',
      url: '://www.dzwx520.com/book_\\d+/$',
      chapterUrl: '://www.dzwx520.com/book_\\d+/\\d+.html',
      title: 'h1',
      chapter: '.book_list a',
      chapterTitle: 'h1',
      content: '#htmlContent',
      elementRemove: 'script,div',
    },
    { // http://www.mlxiaoshuo.com
      siteName: '魔龙小说网',
      url: '://www.mlxiaoshuo.com/book/.*?.html',
      chapterUrl: '://www.mlxiaoshuo.com/chapter/.*?.html',
      title: '.colorStyleTitle',
      chapter: '.zhangjieUl a',
      chapterTitle: '.colorStyleTitle',
      content: '.textP',
    },
    { // https://www.123xiaoqiang.in/
      siteName: '小强小说网',
      url: '://www.123xiaoqiang.in/\\d+/\\d+/',
      chapterUrl: '://www.123xiaoqiang.in/\\d+/\\d+/\\d+.html',
      title: 'h1',
      chapter: '.liebiao a',
      chapterTitle: 'h2',
      content: '#content',
    },
    { // http://www.haxxs8.com/
      siteName: '海岸线文学网',
      url: '://www.haxxs8.com/files/article/html/\\d+/\\d+/index.html',
      chapterUrl: '://www.haxxs8.com/files/article/html/\\d+/\\d+/\\d+.html',
      infoPage: 'a:contains("返回书页")',
      title: '.book-title>h1',
      writer: '.book-title>h1+em',
      intro: '.book-intro',
      cover: '.book-img>img',
      chapter: '.ccss a',
      chapterTitle: '#content h2',
      content: 'td[id^="content"]',
      elementRemove: 'div,span,font',
    },
    { // http://www.huaisu8.com
      siteName: '怀素吧小说',
      url: '://www.huaisu8.com/\\d+/\\d+/($|#)',
      chapterUrl: '://www.huaisu8.com/\\d+/\\d+/\\d+.html',
      title: '.info>h2',
      chapter: '.index-body .newzjlist:nth-child(4) .dirlist a',
      chapterTitle: '.play-title>h1',
      content: '.txt_tcontent',
    },
    { // https://xxread.net/
      siteName: '肉肉阅读', // 与网易云阅读相同模板
      url: '://xxread.net/book(-\\d+)?.php',
      chapterUrl: '://xxread.net/book_reader.php\\?b=\\d+&c=\\d+',
      title: '.m-bookdetail h3',
      intro: '.m-content .detail>.txt',
      chapter: '.item>a',
      deal: async (chapter) => {
        const info = chapter.url.match(/\d+/g);
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `${window.location.protocol}//xxread.net/getArticleContent.php?sourceUuid=${info[0]}&articleUuid=${info[1]}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const json = JSON.parse(res.responseText.match(/(\{.*\})/)[1]);
                const content = CryptoJS.enc.Base64.parse(json.content).toString(CryptoJS.enc.Utf8);
                const title = $('h1', content).text();
                resolve({ content, title });
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
            checkLoad: () => true,
          }, null, 0, true);
        });
        return content;
      },
      elementRemove: 'h1',
      getChapters: async (doc) => {
        const info = window.location.href.match(/\d+/g);
        const res = await xhr.sync(`https://xxread.net/getBook.php?b=${info[0]}`);
        const json = JSON.parse(res.responseText);
        const chapters = [];
        for (let i = 1; i < json.portions.length; i++) {
          chapters.push({
            title: json.portions[i].title,
            url: `https://xxread.net/book_reader.php?b=${info[0]}&c=${json.portions[i].id}`,
          });
        }
        return chapters;
      },
    },
    { // https://18h.mm-cg.com/novel/index.htm
      siteName: '18H',
      filter: () => ($('meta[content*="18AV"],meta[content*="18av"]').length ? (window.location.href.match(/novel_\d+.html/) ? 2 : 1) : 0),
      title: '.label>div',
      chapter: '.novel_leftright>span>a:visible',
      chapterTitle: 'h1',
      content: '#novel_content_txtsize',
    },
    { // https://hao.je51.com/ https://je51.com/
      siteName: 'je51',
      url: '://(hao.)?je51.com/st_l.en/st_did.l--.*?.html',
      chapterUrl: '://(hao.)?je51.com/st_l.en/st_did.d--.*?--\\d+.html',
      title: '.story-list-title',
      writer: '#module8>.story-cat-list .author>a',
      intro: '#module8>.story-cat-list .text',
      chapter: '.story-list .container>.autocol>a',
      chapterTitle: '#module8>.navlinks>.navtitle:last',
      content: '#story-text',
    },
    { // https://aastory.space/
      siteName: '疯情书库',
      filter: () => (document.title.match('疯情书库') && ['/archive.php', '/read.php'].includes(window.location.pathname) ? (['/archive.php'].includes(window.location.pathname) ? 1 : 2) : 0),
      // url: '://aastory.space/archive.php\\?id=\\d+',
      // chapterUrl: '://aastory.space/read.php\\?id=\\d+',
      title: '.index_title',
      writer: '.index_info>span',
      chapter: '.section_list>li>a',
      volume: '.section_title',
      chapterTitle: '.chapter_title',
      content: async (doc, res, request) => {
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter: request.raw,
            url: `${window.location.origin}/_getcontent.php?id=${request.url.match(/id=(\d+)/)[1]}&v=${res.responseText.match(/chapid\+"&v=(.*?)"/)[1]}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: request.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const content = res.responseText;
                resolve(content);
              } catch (error) {
                console.error(error);
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
    },
    { // https://aaread.club/ 仿起点样式
      siteName: '疯情阅读',
      url: '://aaread.club/book/\\d+',
      chapterUrl: '://aaread.club/chapter/\\d+/\\d+',
      title: 'h1>em',
      writer: '.writer',
      intro: '.intro',
      cover: '.J-getJumpUrl>img',
      chapter: '.volume>.cf>li>a',
      chapterTitle: '.j_chapterName',
      deal: async (chapter) => {
        const urlArr = chapter.url.split('/');
        const content = await new Promise((resolve, reject) => {
          xhr.add({
            chapter,
            url: `${window.location.origin}/_getcontent.php?id=${urlArr[5]}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: chapter.url,
              'X-Requested-With': 'XMLHttpRequest',
            },
            onload(res, request) {
              try {
                const content = res.responseText;
                resolve(content);
              } catch (error) {
                resolve('');
              }
            },
          }, null, 0, true);
        });
        return content;
      },
      chapterPrev: (doc) => [$('[id^="chapter-"]', doc).attr('data-purl')],
      chapterNext: (doc) => [$('[id^="chapter-"]', doc).attr('data-nurl')],
    },
  ];
  Rule.template = [ // 模板网站
    { // http://www.xbiquge.la/54/54439/
      siteName: '模板网站-笔趣阁',
      filter: () => (['.ywtop', '.nav', '.header_logo', '#wrapper', '.header_search'].every((i) => $(i).length) ? ($('#content').length ? 2 : 1) : 0),
      title: '#info>h1',
      writer: '#info>h1+p',
      intro: '#intro',
      cover: '#fmimg>img',
      chapter: '#list>dl>dd>a',
      chapterTitle: 'h1',
      content: '#content',
      elementRemove: 'a,p:empty,script',
    },
    { // https://www.biqukan.com/57_57242/
      siteName: '模板网站-笔趣阁1',
      filter: () => (['body>.ywtop', 'body>.header', 'body>.nav', 'body>.book', 'body>.listmain,body>.book.reader'].every((i) => $(i).length) ? ($('#content').length ? 2 : 1) : 0),
      title: '.info>h2',
      writer: '.info>h2+div>span:nth-child(1)',
      intro: '.intro',
      cover: '.cover>img',
      chapter: '.listmain>dl>dd+dt~dd>a',
      chapterTitle: 'h1',
      content: '#content',
      elementRemove: 'a,p:empty,script',
    },
    { // https://www.x23qb.com/book/775/
      siteName: '模板网站-铅笔小说',
      filter: () => (['#header .wrap980', '.search span.searchBox', '.tabstit', '.coverecom'].every((i) => $(i).length) ? 1 : 0),
      title: '.d_title>h1',
      writer: '.p_author>a',
      intro: '#bookintro>p',
      cover: '#bookimg>img',
      chapter: '#chapterList>li>a',
      chapterTitle: 'h1',
      content: '.read-content',
      elementRemove: 'dt,div',
    },
  ];

  if (Config.customize) {
    try {
      const ruleUser = window.eval(Config.customize); // eslint-disable-line no-eval
      Rule.special = Rule.special.concat(ruleUser);
    } catch (error) {
      console.error(error);
    }
  }

  if (window.opener && window.opener !== window && !window.menubar.visible && window.localStorage.getItem('gm-nd-url') === window.location.href) {
    init();
    (async function () {
      if (typeof Storage.rule.popup === 'function') await Storage.rule.popup();
      window.localStorage.setItem('gm-nd-html', window.document.documentElement.outerHTML);
    }());
  }

  function init() {
    if (!Storage.rule) {
      if (Config.templateRule) Rule.special = Rule.special.concat(Rule.template);
      const _href = window.location.href;
      for (const rule of Rule.special) {
        rule.url = [].concat(rule.url).filter((i) => i);
        rule.chapterUrl = [].concat(rule.chapterUrl).filter((i) => i);
        rule.ignoreUrl = [].concat(rule.ignoreUrl).filter((i) => i);
      }
      Storage.rule = Rule.special.find((i) => (i.url.some((j) => _href.match(j))) || (i.chapterUrl.some((j) => _href.match(j))) || (i.filter && i.filter()));
      if (Storage.rule) {
        if (Storage.rule.url.some((i) => _href.match(i))) {
          Storage.mode = 1;
        } else if (Storage.rule.chapterUrl.some((i) => _href.match(i))) {
          Storage.mode = 2;
        } else if (Storage.rule.filter && typeof Storage.rule.filter === 'function') {
          Storage.mode = Storage.rule.filter();
        }
      } else {
        Storage.rule = Rule;
        if (Config.modeManual) {
          Storage.mode = window.confirm('Đây là trang mục lục hay trang chương?\nChọn "OK" trên trang mục lục, chọn "Hủy" nếu là trang chương.') ? 1 : 2;
        } else if (Storage.rule.url.some((i) => _href.match(i))) {
          Storage.mode = 1;
        } else if (Storage.rule.chapterUrl.some((i) => _href.match(i))) {
          Storage.mode = 2;
        } else {
          Storage.mode = $(Storage.rule.content).length ? 2 : 1;
        }
      }
    }
  }

  async function showUI() {
    if ($('.novel-downloader-v3').length) {
      $('.novel-downloader-v3').toggle();
      if ($('.novel-downloader-style-chapter[media]').length) { // https://stackoverflow.com/a/54441305
        $('.novel-downloader-style-chapter[media]').attr('media', null);
      } else {
        $('.novel-downloader-style-chapter').attr('media', 'max-width: 1px');
      }
      return;
    }

    let chapters,
      chaptersArr;
    let vipChapters = [];
    const chaptersDownloaded = [];

    const issueBody = [
      `- 脚本: \`novelDownloader3 v${GM_info.script.version}\``,
      '- 类型: `Bug/建议`',
      `- 浏览器: \`${GM_info.platform ? GM_info.platform.browserName : '浏览器'} v${GM_info.platform ? GM_info.platform.browserVersion : '版本'}\``,
      `- 扩展: \`${GM_info.scriptHandler} v${GM_info.version}\``,
      '---',
      '<!-- 你的问题 -->',
    ];

    // ui
    const html = [
      '<div name="info">',
      `  Quy tắc hiện tại: <span name="rule"></span><span name="mode"></span><sup><a href="https://github.com/dodying/UserJs/issues/new?body=${encodeURIComponent(issueBody.join('\u000a'))}" target="_blank">Phản hồi</a></sup><sup><a href="https://github.com/dodying/UserJs#捐赠" target="_blank">Donate</a></sup>`,
      '  <br>',
      '  Tên sách: <input type="text" name="title" value="加载中，请稍候">',
      '  <br>',
      '  Tác giả: <input type="text" name="writer">',
      '  <br>',
      '  Tóm tắt: <input type="text" name="intro">',
      '  <br>',
      '  Bìa sách: <input type="text" name="cover">',
      '</div>',

      '<div name="config">',
      '  <span style="color:red;">NEW!</span>',
      '  Nhiều cài đặt hơn: <button name="toggle">Hiển thị</button>',
      '</div>',
      '<div class="useless" name="config">',
      '  Luồng tải xuống: <input type="number" name="thread">',
      '  Số lần thử lại: <input type="number" name="retry">',
      '  <br>',
      '  Thời gian chờ: <input type="number" name="timeout">',
      '  Ngôn ngữ: <select name="language">',
      '    <option value="">Không chuyển đổi</option>',
      '    <option value="sc">Giản thể</option>',
      '    <option value="tc">Phồn thể</option>',
      '  </select>',
      '  <br>',
      '  <input type="checkbox" name="sort">Sắp xếp chương',
      '  <input type="checkbox" name="reference">Hiển thị URL nguồn',
      '  <br>',
      '  <input type="checkbox" name="format">Xử lý văn bản',
      '  <input type="checkbox" name="useCommon"><span title="Chỉ áp dụng cho các quy tắc chưa thiết lập các key tương ứng\nHỗ trợ key: elementRemove,chapterPrev,chapterNext">Sử dụng quy tắc chung</span>',
      '  <br>',
      '  <input type="checkbox" name="modeManual">Xác nhận thủ công mục lục hoặc chương',
      '  <br>',
      '  <input type="checkbox" name="templateRule">Sử dụng quy tắc mẫu',
      '  <input type="checkbox" name="volume">Phân chia chương theo quyển',
      '  <br>',
      '  <span title="{title} Đại diện cho tiêu đề ban đầu\n{order} đại diện cho chương\neg:#{order} {title}\n Để trống để không đổi tên nó">Đối với TEXT: Đổi tên tiêu đề chương</span> <input type="text" name="titleRename">',
      '  <br>',
      '  <input type="checkbox" name="tocIndent">Đối với EPUB: Thụt lề theo tập trong mục lục',
      '  <br><span title="Lưu ý về Auto: Nếu chỉ có một đoạn văn bản giữa tất cả các dòng trống thì loại bỏ các dòng trống, nếu không thì giữ nguyên">Loại bỏ dòng trống</span>: <select name="removeEmptyLine">',
      '    <option value="auto">Auto</option>',
      '    <option value="remove">Loại bỏ tất cả dòng trống</option>',
      '    <option value="keep">Giữ tất cả dòng trống</option>',
      '  </select>',
      '  <br>',
      '  Tải xuống liên tục thất bại<input type="number" name="failedCount" min="0" title="0为禁用"> lần, tạm dừng <input type="number" name="failedWait" min="0" title="0为手动继续"> giây sau đó tiếp tục tải xuống',
      '  <br>',
      '  Epub CSS: <textarea name="css" placeholder="" style="line-height:1;resize:both;"></textarea>',
      '  <br>',
      '  Quy tắc tùy chỉnh: <textarea name="customize" placeholder="" style="line-height:1;resize:both;"></textarea>',
      '</div>',

      '<div name="config">',
      '  <input type="checkbox" name="image"><span title="Nó chỉ có hiệu lực khi tải xuống EPUB và chỉ hỗ trợ các file img">Tải xuống hình ảnh</span>',
      '  <input type="checkbox" name="vip" confirm="Cần phải mua các chương VIP trước khi tải xuống\nNếu tính năng mua tự động được bật, tôi sẽ không chịu trách nhiệm về những tổn thất do tập lệnh này gây ra"><span>Tải xuống chương VIP</span>',
      '  <br>',
      '  <input type="checkbox" name="addChapterPrev"><span title="Dùng cho các trang web chia một chương thành nhiều trang\nTập lệnh sẽ lọc các chương đã tải xuống theo URL\nĐối với 1 số web, nó có thể khiến lặp lại việc tải xuống\nSẽ dẫn tới【Phạm vi tải xuống】、【Tải xuống hàng loạt】không hợp lệ">Tự động tăng thêm trước chương</span>',
      '  <input type="checkbox" name="addChapterNext"><span title="Dùng cho các trang web chia một chương thành nhiều trang\nTập lệnh sẽ lọc các chương đã tải xuống theo URL\nĐối với 1 số web, nó có thể khiến lặp lại việc tải xuống\nSẽ dẫn tới【Phạm vi tải xuống】、【Tải xuống hàng loạt】không hợp lệ">Tự động tăng thêm sau chương</span>',
      '</div>',

      '<div name="limit" title="Ưu tiên: Tải xuống hàng loạt>Phạm vi tải xuống>Tất cả các chương">',
      '  Phạm vi tải xuống: <input name="range" placeholder="Bắt đầu bằng 1, ví dụ 1-25, 35, 50" type="text">',
      '  <br>',
      '  Tải xuống hàng loạt: <textarea name="batch" placeholder="Tất cả các địa chỉ URL sẽ được tải xuống" style="line-height:1;resize:both;"></textarea>',
      '</div>',

      '<div name="buttons">',
      '  <input type="button" name="download" format="debug" value="Kiểm tra">',
      '  <input type="button" name="download" format="text" value="Tải xuống dưới dạng TEXT">',
      '  <br>',
      '  <input type="button" name="download" format="epub" value="Tải xuống dưới dạng EPUB">',
      '  <input type="button" name="download" format="zip" value="Tải xuống dưới dạng ZIP">',
      '  <br>',
      '  <input type="button" name="toggle-opacity" value="Trong suốt">',
      '  <input type="button" name="exit" value="Thoát">',
      '  <input type="button" name="force-download" value="Buộc tải xuống" raw-disabled="disabled">',
      '  <input type="button" name="force-save" value="Buộc lưu" raw-disabled="disabled">',
      '</div>',

      '<div name="progress">',
      '  <span title="Tiến trình hoàn thành chương\nKhi góc phải bên dưới biểu hiện【Tải xuống đã hoàn tất】, nếu thanh tiến trình chưa chạy xong, bạn có thể thử nhấp lại và tập lệnh sẽ thử lại chương bị lỗi trước đó\n（Chỉ hợp lệ đối với các lỗi do sự cố mạng, nếu tập lệnh có vấn đề, vui lòng đưa ra phản hồi hoặc tự mình giải quyết）">Tiến độ</span>: ',
      '  <progress max="0" value="0"></progress>',
      '</div>',
    ].join('');
    const container = $('<div class="novel-downloader-v3"></div>').html(html).appendTo('body');
    container.find('input,select,textarea').attr('disabled', 'disabled');
    container.find('[name="config"]').find('input,select,textarea').on('change', function (e) {
      const { name } = e.target;
      let value = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? (e.target.value || this.placeholder) * 1 : (e.target.value || e.target.placeholder);
      if (e.target.type === 'checkbox' && value && e.target.getAttribute('confirm')) {
        value = window.confirm(e.target.getAttribute('confirm'));
        e.target.checked = value;
      }
      Config[name] = value;
      GM_setValue('config', Config);
      if (['retry', 'thread', 'timeout'].includes(name)) {
        xhr.storage.config.set(name, value);
      }
    }).each(function (i, e) {
      if (Config[e.name] === undefined) return;
      if (e.type === 'checkbox') {
        e.checked = Config[e.name];
      } else if (e.type === 'radio') {
        e.checked = (Config[e.name] === this.value);
      } else {
        e.value = Config[e.name];
      }
    });
    container.find('[name="buttons"]').find('[name="download"]').on('click', async (e) => {
      container.find('[name="progress"]').show();
      container.find('[name="buttons"]').find('[name="download"]').attr('disabled', 'disabled');
      container.find('[name="buttons"]').find('[name="force-download"]').attr('disabled', null);
      if (!Storage.audio) {
        // 来自 E-Hentai-Downloader
        Storage.audio = new window.Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjcxLjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAEAAABVgANTU1NTU1Q0NDQ0NDUFBQUFBQXl5eXl5ea2tra2tra3l5eXl5eYaGhoaGhpSUlJSUlKGhoaGhoaGvr6+vr6+8vLy8vLzKysrKysrX19fX19fX5eXl5eXl8vLy8vLy////////AAAAAExhdmM1Ny44OQAAAAAAAAAAAAAAACQCgAAAAAAAAAVY82AhbwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAALACwAAP/AADwQKVE9YWDGPkQWpT66yk4+zIiYPoTUaT3tnU487uNhOvEmQDaCm1Yz1c6DPjbs6zdZVBk0pdGpMzxF/+MYxA8L0DU0AP+0ANkwmYaAMkOKDDjmYoMtwNMyDxMzDHE/MEsLow9AtDnBlQgDhTx+Eye0GgMHoCyDC8gUswJcMVMABBGj/+MYxBoK4DVpQP8iAtVmDk7LPgi8wvDzI4/MWAwK1T7rxOQwtsItMMQBazAowc4wZMC5MF4AeQAGDpruNuMEzyfjLBJhACU+/+MYxCkJ4DVcAP8MAO9J9THVg6oxRMGNMIqCCTAEwzwwBkINOPAs/iwjgBnMepYyId0PhWo+80PXMVsBFzD/AiwwfcKGMEJB/+MYxDwKKDVkAP8eAF8wMwIxMlpU/OaDPLpNKkEw4dRoBh6qP2FC8jCJQFcweQIPMHOBtTBoAVcwOoCNMYDI0u0Dd8ANTIsy/+MYxE4KUDVsAP8eAFBVpgVVPjdGeTEWQr0wdcDtMCeBgDBkgRgwFYB7Pv/zqx0yQQMCCgKNgonHKj6RRVkxM0GwML0AhDAN/+MYxF8KCDVwAP8MAIHZMDDA3DArAQo3K+TF5WOBDQw0lgcKQUJxhT5sxRcwQQI+EIPWMA7AVBoTABgTgzfBN+ajn3c0lZMe/+MYxHEJyDV0AP7MAA4eEwsqP/PDmzC/gNcwXUGaMBVBIwMEsmB6gaxhVuGkpoqMZMQjooTBwM0+S8FTMC0BcjBTgPwwOQDm/+MYxIQKKDV4AP8WADAzAKQwI4CGPhWOEwCFAiBAYQnQMT+uwXUeGzjBWQVkwTcENMBzA2zAGgFEJfSPkPSZzPXgqFy2h0xB/+MYxJYJCDV8AP7WAE0+7kK7MQrATDAvQRIwOADKMBuA9TAYQNM3AiOSPjGxowgHMKFGcBNMQU1FMy45OS41VVU/31eYM4sK/+MYxKwJaDV8AP7SAI4y1Yq0MmOIADGwBZwwlgIJMztCM0qU5TQPG/MSkn8yEROzCdAxECVMQU1FMy45OS41VTe7Ohk+Pqcx/+MYxMEJMDWAAP6MADVLDFUx+4J6Mq7NsjN2zXo8V5fjVJCXNOhwM0vTCDAxFpMYYQU+RlVMQU1FMy45OS41VVVVVVVVVVVV/+MYxNcJADWAAP7EAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxOsJwDWEAP7SAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxPMLoDV8AP+eAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxPQL0DVcAP+0AFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
        Storage.audio.loop = true;
      }
      $(window).off('blur').off('focus').on({
        blur: () => Storage.audio.play(),
        focus: () => Storage.audio.pause(),
      });
      Storage.title = document.title;

      Storage.book.chapters = Config.vip ? chapters : chapters.filter((i) => !(vipChapters.includes(i.url)));
      Storage.rule.vip = { ...Storage.rule, ...Storage.rule.vip || {} };

      // 限制下载范围
      if (container.find('[name="limit"]>[name="range"]').val()) {
        const arr = container.find('[name="limit"]>[name="range"]').val().split(',').sort();
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].match(/^(\d+)?-(\d+)?$/)) {
            let start = arr[i].match(/^(\d+)?-(\d+)?$/)[1];
            if (!start) start = 1;
            let end = arr[i].match(/^(\d+)?-(\d+)?$/)[2];
            if (!end) end = Storage.book.chapters.length;
            for (let j = start - 1; j <= end - 1; j++) {
              if (j in Storage.book.chapters) Storage.book.chapters[j].filtered = true;
            }
          } else if (/^\d+$/.test(arr[i])) {
            if ((arr[i] - 1) in Storage.book.chapters) Storage.book.chapters[arr[i] - 1].filtered = true;
          }
        }
        Storage.book.chapters = Storage.book.chapters.filter((i) => {
          if (i.filtered) {
            delete i.filtered;
            return true;
          }
        });
      }
      if (container.find('[name="limit"]>[name="batch"]').val()) {
        Storage.book.chapters = container.find('[name="limit"]>[name="batch"]').val().split('\n').filter((i) => i)
          .map((i) => {
            const url = new URL(i, window.location.href).href;
            return chaptersDownloaded.find((i) => i.url === url) || { url };
          });
      }
      chaptersArr = Storage.book.chapters.map((i) => i.url);

      const format = $(e.target).attr('format');
      const onComplete = async (force) => {
        if (!force) {
          container.find('[name="buttons"]').find('[name="force-save"]').attr('disabled', 'disabled').off('click');
          container.find('[name="buttons"]').find('[name="force-download"]').attr('disabled', 'disabled');
        }

        let { chapters } = Storage.book;
        if (Config.sort && chapters.length) {
          const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'case' });
          for (const chapter of chapters) chapter.sort = chapter.url;
          // const dir = new URL('./', chapters[0].sort).href;
          // if (chapters.every(i => new URL('./', i.sort).href === dir)) {
          //   chapters.forEach(i => { i.sort = i.sort.substr(dir.length); });
          // }
          let ext = chapters[0].sort.split('.');
          if (ext.length > 1) {
            ext = `.${ext.slice(-1)}`;
            const extReversed = ext.split('').reverse().join('');
            if (chapters.every((i) => i.sort.split('').reverse().join('').indexOf(extReversed) === 0)) {
              for (const chapter of chapters) chapter.sort = chapter.sort.substr(0, chapter.sort.length - ext.length);
            }
          }
          chapters = chapters.sort((a, b) => collator.compare(a.sort, b.sort));
        }

        const volumes = [];
        for (let i = 0; i < chapters.length; i++) {
          const chapter = chapters[i];

          if (Config.volume) {
            // if (i > 0 && chapters[i - 1].volume !== chapter.volume) {
            //   const title = `【${chapters[i - 1].volume}】-分卷-结束`;
            //   chapters.splice(i, 0, {
            //     title,
            //     contentRaw: title,
            //     content: title,
            //     volume: chapters[i - 1].volume
            //   });
            //   i++;
            // }

            if (chapter.volume && chapter.volume !== volumes.slice(-1)[0]) {
              volumes.push(chapter.volume);
              const title = `【${chapter.volume}】`;
              chapters.splice(i, 0, {
                title,
                contentRaw: title,
                content: title,
                volume: chapter.volume,
              });
              i++;
            }
          }

          const rule = vipChapters.includes(chapter.url) ? Storage.rule.vip : Storage.rule;
          let content = chapter.contentRaw;
          if (!content) continue;
          if (rule.elementRemove || Config.useCommon) {
            if (Storage.debug.content) debugger;
            content = await getFromRule(content, (content) => {
              const elem = $('<div>').html(content);
              if (rule.elementRemove) {
                $(`${rule.elementRemove},script,style,iframe`, elem).remove();
              } else if (Config.useCommon) {
                $(`${Rule.elementRemove},script,style,iframe`, elem).remove();
              }
              return elem.html();
            }, [], '');
          }

          if (Config.format) {
            content = html2Text(content, rule.contentReplace);
            if (['text', 'zip'].includes(format)) content = $('<div>').html(content).text();
            content = content.replace(/^\s+/mg, '').trim(); // 移除开头空白字符
            if (Config.removeEmptyLine === 'auto') {
              const arr = content.split(/\n{2,}/);
              let keep = false;
              for (const i of arr) {
                if (i.match(/\n/)) {
                  keep = true;
                  break;
                }
              }
              content = keep ? content.replace(/\n{3,}/g, '\n\n') : content.replace(/\n+/g, '\n');
            } else if (Config.removeEmptyLine === 'remove') {
              content = content.replace(/\n+/g, '\n');
            } else if (Config.removeEmptyLine === 'keep') {
              content = content.replace(/\n{3,}/g, '\n\n');
            }
            // https://stackoverflow.com/a/25956935
            content = content.replace(/^/gm, '\u3000\u3000'); // 每行增加空白字符作缩进
          }
          if (Config.language) content = tranStr(content, Config.language === 'tc');
          chapter.content = content;

          if (!chapter.title) continue;
          chapter.title = chapter.title.replace(/\s+/g, ' ').trim();
        }

        await downloadTo[format](chapters);
        if (!force) {
          container.find('[name="buttons"]').find('[name="download"]').attr('disabled', null);
          $(window).off('blur').off('focus');
          Storage.audio.pause();
          document.title = Storage.title;
        }
      };
      container.find('[name="buttons"]').find('[name="force-save"]').attr('disabled', null).on('click', async () => {
        await onComplete(true);
      });
      const onChapterFailed = async (res, request) => {
        let chapter = request.raw;
        if ('chapter' in chapter) chapter = chapter.chapter;
        chapter.contentRaw = '';
        chapter.content = '';
        chapter.document = '';
      };
      let failedCount = 0;
      const onChapterFailedEvery = Config.failedCount ? async (res, request, type) => {
        if (type === 'abort' || failedCount < 0) return;
        failedCount = failedCount + 1;
        if (failedCount > Config.failedCount) {
          failedCount = -1;
          xhr.pause();
          if (Config.failedWait > 0) {
            await waitInMs(30 * 1000);
            failedCount = 0;
            xhr.resume();
          } else {
            failedCount = 0;
          }
        }
      } : null;
      let overrideMimeType = `text/html; charset=${document.characterSet}`;
      if (Storage.rule.charset) overrideMimeType = `text/html; charset=${Storage.rule.charset}`;
      const checkRelativeChapter = async (res, request, next) => {
        const chapter = request.raw;
        const rule = vipChapters.includes(chapter.url) ? Storage.rule.vip : Storage.rule;

        let ruleChapterRelative;
        if (next) {
          ruleChapterRelative = Config.useCommon ? (rule.chapterNext || Rule.chapterNext) : rule.chapterNext;
        } else {
          ruleChapterRelative = Config.useCommon ? (rule.chapterPrev || Rule.chapterPrev) : rule.chapterPrev;
        }

        let chapterRelative = await getFromRule(ruleChapterRelative, { attr: 'href', allElement: true, document: new window.DOMParser().parseFromString(res.responseText, 'text/html') }, [res, request], []);
        chapterRelative = [].concat(chapterRelative).map((i) => new URL(i, res.finalUrl || window.location.href).href)
          .filter((url) => url && !url.match(/^(javascript:|#)/)).map((i) => new URL(i, chapter.url).href)
          .filter((url) => {
            if (rule !== Rule && rule.ignoreUrl.some((i) => url.match(i))) return false;
            if (rule !== Rule && rule.url.some((i) => url.match(i))) return false;
            if (rule !== Rule && rule.chapterUrl.length) return rule.chapterUrl.some((i) => url.match(i));
            const pathurl = chapter.url.replace(/(.*\/).*/, '$1').replace(/.*?:\/\/(.*)/, '$1');
            const pathurlThis = url.replace(/(.*\/).*/, '$1');
            return pathurlThis !== url && pathurlThis.replace(/.*?:\/\/(.*)/, '$1') === pathurl;
          });
        let anchor = chapter;
        for (const url of chapterRelative) {
          if (chaptersArr.includes(url) || vipChapters.includes(url)) continue;
          const chapterNew = chaptersDownloaded.find((i) => i.url === url) || { url };
          if (chapter.volume) chapterNew.volume = chapter.volume;
          const index = Storage.book.chapters.indexOf(anchor);
          anchor = chapterNew;
          Storage.book.chapters.splice(next ? index + 1 : index, 0, chapterNew);
          chaptersArr.splice(next ? index + 1 : index, 0, url);

          const rule = vipChapters.includes(url) ? Storage.rule.vip : Storage.rule;

          if (chapterNew.contentRaw && chapterNew.document) {
            await onChapterLoad({ response: chapterNew.document, responseText: chapterNew.document }, { raw: chapterNew });
          } else {
            delete chapterNew.contentRaw;
            if (rule.iframe) {
              chapterList.iframe.push(chapterNew);
            } else if (rule.popup) {
              chapterList.popup.push(chapterNew);
            } else if (rule.deal && typeof rule.deal === 'function') {
              chapterList.deal.push(chapterNew);
            } else {
              chapterList.download.push(chapterNew);
            }
          }
        }
      };
      const onChapterLoad = async (res, request) => {
        const chapter = request.raw;
        const rule = vipChapters.includes(chapter.url) ? Storage.rule.vip : Storage.rule;

        if (failedCount > 0) failedCount = 0;
        if (rule.deal) return;

        const doc = typeof res.response === 'object' ? res.response : new window.DOMParser().parseFromString(res.responseText, 'text/html');

        if (!chaptersDownloaded.includes(chapter)) chaptersDownloaded.push(chapter);

        let chapterTitle = await getFromRule(rule.chapterTitle, { attr: 'text', document: doc }, [res, request], '');
        chapterTitle = chapterTitle || chapter.title || $('title', doc).eq(0).text();
        if (chapterTitle.indexOf(Storage.book.title) === 0) chapterTitle = chapterTitle.replace(Storage.book.title, '').trim();
        chapter.title = chapterTitle;
        request.title = chapter.title;

        let contentCheck = true;
        if (rule.contentCheck) contentCheck = await getFromRule(rule.contentCheck, (selector) => $(selector, doc).length, [res, request], true);
        if (contentCheck) {
          if (Storage.debug.content) debugger;
          let content = chapter.content || await getFromRule(rule.content, (selector) => {
            let elems = $(selector, doc);
            if (Storage.debug.content) debugger;
            if (rule === Rule) elems = elems.not(':emptyHuman'); // 移除空元素
            if (elems.length === 0) { // 没有找到内容
              console.error(`novelDownloader: 找不到内容元素\n选择器: ${selector}`);
              elems = $('body', doc);
            } else if (elems.length > 1) {
              // 当a是b的祖辈元素时，移除a
              elems = elems.filter((i, e) => !elems.not(e).toArray().find((j) => $(e).find(j).length));
            }
            return elems.toArray().map((i) => $(i).html());
          }, [res, request], '');
          if (content instanceof Array) content = content.join('\n');
          chapter.content = content;
          chapter.contentRaw = content;
          chapter.document = res.responseText;

          if (Config.addChapterPrev || Config.addChapterNext) {
            if (Config.addChapterPrev) await checkRelativeChapter(res, request, false);
            if (Config.addChapterNext) await checkRelativeChapter(res, request, true);
          }
        } else {
          chapter.contentRaw = '';
        }

        const now = Storage.book.chapters.filter((i) => i.contentRaw).length;
        const max = Storage.book.chapters.length;
        container.find('[name="progress"]>progress').val(now).attr('max', max);
        document.title = `[${now}/${max}]${Storage.title}`;
      };
      const requestOption = { onload: onChapterLoad, overrideMimeType };

      const chapterList = {
        iframe: [],
        popup: [],
        deal: [],
        download: [],
      };
      for (const chapter of Storage.book.chapters) {
        const rule = vipChapters.includes(chapter.url) ? Storage.rule.vip : Storage.rule;
        if (chapter.contentRaw && chapter.document) {
          await onChapterLoad({ response: chapter.document, responseText: chapter.document }, { raw: chapter });
        } else {
          delete chapter.contentRaw;
          if (rule.iframe) {
            chapterList.iframe.push(chapter);
          } else if (rule.popup) {
            chapterList.popup.push(chapter);
          } else if (rule.deal && typeof rule.deal === 'function') {
            chapterList.deal.push(chapter);
          } else {
            chapterList.download.push(chapter);
          }
        }
      }
      if (Storage.book.chapters.every((i) => i.contentRaw && i.document)) {
        await onComplete();
        return;
      }

      if (chapterList.download.length || chapterList.deal.length) {
        xhr.init({
          retry: Config.retry,
          thread: Storage.rule.thread && Storage.rule.thread < Config.thread ? Storage.rule.thread : Config.thread,
          timeout: Config.timeout,
          onfailed: onChapterFailed,
          onfailedEvery: onChapterFailedEvery,
          checkLoad: async (res) => {
            if ((res.status > 0 && res.status < 200) || res.status >= 300) { // TODO
              return false;
            }
            return true;
          },
        });
      }

      while (Storage.book.chapters.some((i) => !('contentRaw' in i))) {
        if (chapterList.download.length && chapterList.download.find((i) => !('contentRaw' in i))) {
          await new Promise((resolve, reject) => {
            xhr.storage.config.set('onComplete', async (list) => {
              resolve();
            });
            xhr.list(chapterList.download.filter((i) => !('contentRaw' in i)), requestOption);
            xhr.showDialog();
            xhr.start();
          });
        }

        if (chapterList.deal.length && chapterList.deal.find((i) => !('contentRaw' in i))) {
          await new Promise((resolve, reject) => {
            xhr.storage.config.set('onComplete', async (list) => {
              if (chapterList.deal.find((i) => !('contentRaw' in i))) return;
              resolve();
            });
            for (const chapter of chapterList.deal.filter((i) => !('contentRaw' in i))) {
              try {
                const rule = vipChapters.includes(chapter.url) ? Storage.rule.vip : Storage.rule;
                rule.deal(chapter).then((result) => {
                  if (result) {
                    if (typeof result === 'string') {
                      chapter.document = result;
                      chapter.contentRaw = result;
                    } else {
                      chapter.document = result.contentRaw || result.content;
                      chapter.contentRaw = result.content;
                      for (const i in result) chapter[i] = result[i];
                    }
                  } else {
                    chapter.contentRaw = '';
                    chapter.content = '';
                    chapter.document = '';
                  }
                  const now = Storage.book.chapters.filter((i) => i.contentRaw).length;
                  const max = Storage.book.chapters.length;
                  container.find('[name="progress"]>progress').val(now).attr('max', max);
                  document.title = `[${now}/${max}]${Storage.title}`;
                  if (!chapterList.deal.find((i) => !('contentRaw' in i))) resolve();
                }, (error) => {
                  console.error(error);
                  chapter.contentRaw = '';
                  chapter.content = '';
                  chapter.document = '';
                });
              } catch (error) {
                console.error(error);
              }
            }
            xhr.showDialog();
            xhr.start();
          });
        }

        if (chapterList.iframe.length && chapterList.iframe.find((i) => !('contentRaw' in i))) {
          for (const chapter of chapterList.iframe.filter((i) => !('contentRaw' in i))) {
            const rule = vipChapters.includes(chapter.url) ? Storage.rule.vip : Storage.rule;
            await new Promise((resolve, reject) => {
              $('<iframe>').on('load', async (e) => { // TODO 优化
                let response,
                  responseText;
                try {
                  if (typeof rule.iframe === 'function') await rule.iframe(e.target.contentWindow);
                  response = e.target.contentWindow.document;
                  responseText = e.target.contentWindow.document.documentElement.outerHTML;
                } catch (error) {
                  console.error(error);
                  response = '';
                  responseText = '';
                }
                await onChapterLoad({ response, responseText }, { raw: chapter });
                $(e.target).remove();
                resolve();
              }).attr('src', chapter.url).css('visibility', 'hidden')
                .appendTo('body');
            });
          }
        }

        if (chapterList.popup.length && chapterList.popup.find((i) => !('contentRaw' in i))) {
          for (const chapter of chapterList.popup.filter((i) => !('contentRaw' in i))) {
            var popupWindow = window.open(chapter.url, '', 'resizable,scrollbars,width=300,height=350');
            window.localStorage.setItem('gm-nd-url', chapter.url);
            await waitFor(() => window.localStorage.getItem('gm-nd-html') || !popupWindow || popupWindow.closed);
            const html = window.localStorage.getItem('gm-nd-html');
            const doc = html;
            // const doc = new window.DOMParser().parseFromString(html, 'text/html');
            await onChapterLoad({ response: doc, responseText: html }, { raw: chapter });
            popupWindow.close();
            window.localStorage.removeItem('gm-nd-url');
            window.localStorage.removeItem('gm-nd-html');
          }
        }
      }

      await onComplete();
    });
    container.find('[name="buttons"]').find('[type="button"]:not([name="download"])').on('click', async (e) => {
      const name = $(e.target).attr('name');
      if (name === 'exit') {
        $('.novel-downloader-style,.novel-downloader-style-chapter,.novel-downloader-v3').remove();
        $('[novel-downloader-chapter]').attr('order', null).attr('novel-downloader-chapter', null);
      } else if (name === 'force-download') {
        xhr.start();
      } else if (name === 'toggle-opacity') {
        container.toggleClass('opacity01');
      }
    });
    container.find('[name="config"]').find('button[name="toggle"]').on('click', (e) => {
      container.find('.useless[name="config"]').toggle();
    });
    container.find('[name="info"]>input[type="text"]').on('change', (e) => (Storage.book[$(e.target).attr('name')] = e.target.value));

    // style
    const style = [
      '.novel-downloader-v3>div *,.novel-downloader-v3>div *:before,.novel-downloader-v3>div *:after{margin:1px;}',
      '.novel-downloader-v3 input{border:1px solid #000;opacity: 1;}',
      '.novel-downloader-v3 input[type="checkbox"]{position:relative;top:0;opacity:1;appearance:checkbox;}',
      '.novel-downloader-v3 input[type="button"],.novel-downloader-v3 button{border:1px solid #000;cursor:pointer;padding:2px 3px;}',
      '.novel-downloader-v3 input[type=number]{width:36px;}',
      '.novel-downloader-v3 input[type=number]{width:36px;}',
      '.novel-downloader-v3 input:not([disabled="disabled"]),.novel-downloader-v3 button:not([disabled="disabled"]){color:#000;background-color:#fff;}',
      '.novel-downloader-v3 input[disabled="disabled"],.novel-downloader-v3 button[disabled="disabled"]{color:#fff;cursor:default!important;background-color:#545454;text-decoration:line-through double;}',
      '.novel-downloader-v3 span[title]::after{content:"(?)";text-decoration:underline;font-size:x-small;vertical-align:super;cursor:pointer;}',

      '.novel-downloader-v3{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:99999;background:white;border:1px solid black;max-height:99vh;overflow:auto;text-align:center;}',
      '.novel-downloader-v3.opacity01{opacity:0.1;}',
      '.novel-downloader-v3.opacity01:hover{opacity:0.6;}',
      '.novel-downloader-v3>div{margin:2px 0px;}',
      '.novel-downloader-v3>div:nth-child(2n){background-color:#DADADA;}',
      '.novel-downloader-v3>div:nth-child(2n+1){background-color:#FAFAFA;}',

      '.novel-downloader-v3>.useless[name="config"]{display:none;}',
      '.novel-downloader-v3>[name="config"] [name="vip"]:checked+span{color:red;}',

      '.novel-downloader-v3>[name="progress"]{display:none;}',
      '.novel-downloader-v3>[name="progress"]>progress::before{content:attr(value)" / "attr(max);}',

      '[novel-downloader-chapter]:before{content:attr(order)"-"!important;}',
      '[novel-downloader-chapter]:before{color:blue!important;}',
      '[novel-downloader-chapter="vip"]:before{color:red!important;}',
    ].join('');
    $('<style class="novel-downloader-style">').text(style).appendTo('head');

    // rule
    container.find('[name="info"]>[name="rule"]').html(`<a href="${window.location.origin}" target="_blank">${Storage.rule.siteName}</a>`);

    let infoPage = await getFromRule(Storage.rule.infoPage, { attr: 'href' }, [], null);
    if (infoPage === window.location.href) {
      infoPage = null;
    } else if (infoPage) {
      infoPage = new URL(infoPage, window.location.href).href;
      const res = await xhr.sync(infoPage, null, { cache: true });
      try {
        infoPage = new window.DOMParser().parseFromString(res.responseText, 'text/html');
      } catch (error) {
        console.error(error);
        infoPage = null;
      }
    }

    // rule-title

    let title = await getFromRule(Storage.rule.title, { document: infoPage || document }, [], '');
    if (!title && Storage.rule.titleRegExp instanceof RegExp) title = document.title.match(Storage.rule.titleRegExp) ? document.title.match(Storage.rule.titleRegExp)[1] : document.title;
    if (Storage.rule.titleReplace) title = replaceWithDict(title, Storage.rule.titleReplace);
    title = title.replace(/\s+/g, ' ').replace(/^《(.*)》$/, '$1').trim();
    Storage.book.title = title;

    // rule-writer

    let writer = await getFromRule(Storage.rule.writer, { document: infoPage || document }, [], '');
    writer = writer.replace(/\s+/g, ' ').replace(/.*作\s*者(:|：)|\s+著$/g, '').trim();
    Storage.book.writer = writer;

    // rule-intro,cover

    let intro = await getFromRule(Storage.rule.intro, { attr: 'html', document: infoPage || document }, [], '');
    intro = html2Text(intro, Storage.rule.contentReplace);
    intro = $('<div>').html(intro);
    if (Storage.rule.elementRemove || Config.useCommon) {
      if (Storage.rule.elementRemove) {
        $(`${Storage.rule.elementRemove},script,style,iframe`, intro).remove();
      } else if (Config.useCommon) {
        $(`${Rule.elementRemove},script,style,iframe`, intro).remove();
      }
    }
    intro = intro.text();
    Storage.book.intro = intro;
    Storage.book.cover = await getFromRule(Storage.rule.cover, { attr: 'src', document: infoPage || document }, [], '');
    for (const i of ['title', 'writer', 'intro', 'cover']) {
      container.find(`[name="info"]>[name="${i}"]`).val(Storage.book[i] || '');
    }

    if (Storage.mode === 1) {
      container.find('[name="info"]>[name="mode"]').text('Chế độ mục lục');
      const styleChapter = [
        '[novel-downloader-chapter]:before{display:none;}',
      ].join('');
      $('<style class="novel-downloader-style-chapter">').text(styleChapter).attr('media', 'max-width: 1px').appendTo('head');

      // rule-chapter

      chapters = await getFromRule(Storage.rule.chapter, async (selector) => {
        let elems = $(Storage.rule.chapter);
        if (Storage.rule !== Rule && Storage.rule.chapterUrl.length) elems = elems.filter((i, elem) => Storage.rule.chapterUrl.some((j) => elem.href.match(j)));
        let volumes;
        if (typeof Storage.rule.volume === 'string') {
          volumes = $(Storage.rule.volume);
        } else if (typeof Storage.rule.volume === 'function' && Storage.rule.volume.length <= 1) {
          volumes = await Storage.rule.volume(document);
        }
        volumes = $(volumes).toArray();
        const all = $(elems).add(volumes);
        let order = 1;
        return elems.attr('novel-downloader-chapter', '').toArray().map((i) => {
          $(i).attr('order', order++);
          const chapter = {
            title: i.textContent,
            url: i.href,
          };
          if (volumes && volumes.length) {
            const volume = all.slice(0, all.index(i)).toArray().reverse().find((i) => volumes.includes(i));
            if (volume) chapter.volume = html2Text(volume.textContent);
          }
          return chapter;
        });
      }, [], []);
      vipChapters = await getFromRule(Storage.rule.vipChapter, (selector) => $(Storage.rule.vipChapter).attr('novel-downloader-chapter', 'vip').toArray().map((i) => i.href), [], []);
      if (typeof Storage.rule.volume === 'function' && Storage.rule.volume.length > 1) chapters = await Storage.rule.volume(document, chapters);
    } else if (Storage.mode === 2) {
      container.find('[name="info"]>[name="mode"]').text('Chế độ chương');
      chapters = [window.location.href];
    }
    if (typeof Storage.rule.getChapters === 'function') chapters = await Storage.rule.getChapters(document);
    chapters = chapters.map((i) => (typeof i === 'string' ? { url: i } : i));
    vipChapters = vipChapters.concat(chapters.filter((i) => i.vip).map((i) => i.url));
    if (!Storage.rule.chapter && Storage.rule.chapterUrl.length) {
      let order = 1;
      const elems = Array.from(document.links).filter((i) => ((chapters.length || vipChapters.length)
        ? (chapters.map((i) => i.url).includes(i.href) || vipChapters.includes(i.href))
        : Storage.rule.chapterUrl.some((j) => i.href.match(j))));
      const temp = $(elems).toArray().map((i) => {
        $(i).attr('novel-downloader-chapter', vipChapters.includes(i.href) ? 'vip' : '').attr('order', order++);
        return {
          title: i.textContent,
          url: i.href,
        };
      });
      if (!chapters.length) chapters = temp;
    }

    container.find('input,select,textarea').attr('disabled', null);
    container.find('input,select,textarea').filter('[raw-disabled="disabled"]').attr('raw-disabled', null).attr('disabled', 'disabled');

    if (Storage.debug.book) console.log(Storage.book);
  }

  $('<div class="novel-downloader-trigger" style="position:fixed;top:0px;left:0px;width:1px;height:100%;z-index:999999;background:transparent;"></div>').on({
    dblclick() {
      init();
      showUI();
    },
  }).appendTo('body');
  GM_registerMenuCommand('Download Novel', () => {
    init();
    showUI();
  }, 'N');
  GM_registerMenuCommand('Show Storage', () => {
    console.log({ Storage, xhr: xhr.storage.getSelf() });
  }, 'S');

  const downloadTo = {
    debug: async (chapters) => { // TODO
      console.log(chapters);
    },
    text: async (chapters) => {
      const { length } = String(chapters.length);
      const title = Storage.book.title || Storage.book.chapters[0].title;
      const writer = Storage.book.writer || 'novelDownloader';

      let all = [
        `Tên sách: ${title}`,
        Storage.book.writer ? `Tác giả: ${writer}` : '',
        Storage.book.intro ? `Giới thiệu: ${Storage.book.intro}` : '',
        Config.reference ? 'Lưu ý trước khi đọc: Cuốn sách này được sản xuất bởi user script NovelDownloader' : '',
        Config.reference ? 'User script được dịch bởi QB' : '',
        Config.reference ? `Địa chỉ nguồn: ${window.location.href}` : '',
      ].filter((i) => i);
      all.push('');

      for (let i = 0; i < chapters.length; i++) {
        let { title, content } = chapters[i];
        if (Config.titleRename) {
          title = Config.titleRename.replace(/\{(.*?)\}/g, (all, group1) => {
            if (group1 === 'title') return title;
            if (group1 === 'order') return String(i + 1);
            return all;
          });
        }
        all.push(`${title}\n${content || ''}\n`);
      }
      all = all.join('\n');
      const blob = new window.Blob([all], {
        type: 'text/plain;charset=utf-8',
      });
      download(blob, `${title}.txt`);
    },
    epub: async (chapters) => {
      const { length } = String(chapters.length);
      const title = Storage.book.title || Storage.book.chapters[0].title;
      const writer = Storage.book.writer || 'novelDownloader';
      const uuid = `ndv3-${window.location.href.match(/[a-z0-9-]+/ig).join('-')}${$('.novel-downloader-v3').find('[name="limit"]>[name="range"]').val()}`;
      const href = $('<div>').text(window.location.href).html();
      const date = new Date().toISOString();

      let cover = Storage.book.coverBlob;
      if (!Storage.book.coverBlob && Storage.book.cover) {
        try {
          const res = await xhr.sync(Storage.book.cover, null, {
            responseType: 'arraybuffer',
            timeout: Config.timeout * 10,
          });
          Storage.book.coverBlob = new window.Blob([res.response], {
            type: res.responseHeaders.match(/content-type:\s*(image.*)/i) ? res.responseHeaders.match(/content-type:\s*(image.*)/i)[1] : 'image/png',
          });
          cover = Storage.book.coverBlob;
        } catch (error) {
          console.error(error);
        }
      }
      if (!cover) cover = await getCover(title);

      const files = {
        mimetype: 'application/epub+zip',
        'META-INF/container.xml': '<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" /></rootfiles></container>',
        'OEBPS/stylesheet.css': Config.css,
        'OEBPS/cover.jpg': cover,
        'OEBPS/content.opf': [
          `<?xml version="1.0" encoding="UTF-8"?><package version="2.0" unique-identifier="${uuid}" xmlns="http://www.idpf.org/2007/opf"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">`,
          `<dc:title>${title}</dc:title>`,
          `<dc:creator>${writer}</dc:creator>`,
          '<dc:publisher>novelDownloader</dc:publisher>',
          `<dc:date>${date}</dc:date>`,
          `<dc:source>${href}</dc:source>`,
          `<dc:identifier id="${uuid}">urn:uuid:${uuid}</dc:identifier>`,
          `<dc:language>${$('html').attr('xml:lang') || $('html').attr('lang') || 'zh-CN'}</dc:language>`,
          '<meta name="cover" content="cover-image" /></metadata><manifest><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="cover" href="cover.html" media-type="application/xhtml+xml"/><item id="css" href="stylesheet.css" media-type="text/css"/>',
        ].join(''),
        'OEBPS/toc.ncx': `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd"><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="urn:uuid:${uuid}"/><meta name="dtb:depth" content="1"/><meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/></head><docTitle><text>${title}</text></docTitle><navMap><navPoint id="navpoint-1" playOrder="1"><navLabel><text>首页</text></navLabel><content src="cover.html"/></navPoint>`,
        'OEBPS/cover.html': `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${title}</title><link type="text/css" rel="stylesheet" href="stylesheet.css" /><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body>${[
          `<h1>${title}</h1>`,
          Storage.book.writer ? `<h2>${Storage.book.writer}</h2>` : '',
          Storage.book.intro ? `<h2>Giới thiệu: ${Storage.book.intro}</h2>` : '',
          Config.reference ? '<h3>Lưu ý trước khi đọc: Cuốn sách này được sản xuất bởi user script NovelDownloader</h3>' : '',
          Config.reference ? `<h3>Địa chỉ nguồn: <a href="${href}" target="_blank">${href}</a></h3>` : '',
        ].filter((i) => i).join('')}</body></html>`,
      };

      if (Config.image) {
        for (const chapter of Storage.book.chapters) {
          const contentDom = $('<div>').html(chapter.content);
          for (const url of $('img', contentDom).toArray().map((i) => $(i).attr('src'))) {
            if (!Storage.book.image.find((i) => i.raw === url)) {
              Storage.book.image.push({
                raw: url,
                url: new URL(url, chapter.url).href,
              });
            }
          }
        }

        if (Storage.book.image.filter((i) => !i.content).length) {
          await new Promise((resolve, reject) => {
            xhr.init({
              retry: Config.retry,
              thread: Storage.rule.thread && Storage.rule.thread < Config.thread ? Storage.rule.thread : Config.thread,
              timeout: Config.timeout * 10,
              onComplete: () => {
                resolve();
              },
              checkLoad: async (res) => {
                if ((res.status > 0 && res.status < 200) || res.status >= 300) {
                  return false;
                }
                return true;
              },
            });
            xhr.showDialog();
            xhr.list(Storage.book.image.filter((i) => !i.content), {
              responseType: 'arraybuffer',
              onload: (res, reuqest) => {
                const index = Storage.book.image.indexOf(reuqest.raw);
                Storage.book.image[index].content = res.response;
                Storage.book.image[index].type = res.responseHeaders.match(/content-type:\s*image\/(.*)/i) ? res.responseHeaders.match(/content-type:\s*image\/(.*)/i)[1] : 'image/png';
              },
            });
            xhr.start();
          });
        }

        const { length } = String(Storage.book.image.length);
        for (let i = 0; i < Storage.book.image.length; i++) {
          const imgOrder = String(i + 1).padStart(length, '0');
          const type = Storage.book.image[i].type ? Storage.book.image[i].type.split(';')[0] : 'png';
          const imgName = `img/img-${imgOrder}.${type}`;
          Storage.book.image[i].name = imgName;
          files['OEBPS/content.opf'] = `${files['OEBPS/content.opf']}<item id="img-${imgOrder}" href="${imgName}" media-type="image/jpeg"/>`;
          files[`OEBPS/${imgName}`] = Storage.book.image[i].content;
        }

        for (const chapter of Storage.book.chapters) {
          const contentDom = $('<div>').html(chapter.content);
          for (const elem of $('img', contentDom).toArray()) {
            if (Storage.book.image.find((i) => i.raw === $(elem).attr('src'))) {
              contentDom.find(elem).attr('src', Storage.book.image.find((i) => i.raw === $(elem).attr('src')).name);
            }
          }
          chapter.content = contentDom.html();
        }
      }

      let itemref = '<itemref idref="cover" linear="yes"/>';
      let volumeCurrent;
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const chapterName = chapter.title;
        const chapterOrder = String(i + 1).padStart(length, '0');
        const chapterContent = replaceWithDict(chapter.content.trim(), [
          [/\n/g, '</p><p>'], [/<p>\s+/g, '<p>'],
          [/&[a-z]+;/g, (match) => {
            const text = $('<a>').html(match).text();
            if (text.length > 1) return match;
            return `&#${text.charCodeAt(0)};`;
          }],
        ]);

        if (Config.tocIndent) {
          if (Config.volume && chapter.volume && chapter.volume !== volumeCurrent) {
            if (volumeCurrent) files['OEBPS/toc.ncx'] = `${files['OEBPS/toc.ncx']}</navPoint>`;
            volumeCurrent = chapter.volume;
            files['OEBPS/toc.ncx'] = `${files['OEBPS/toc.ncx']}<navPoint id="chapter${chapterOrder}" playOrder="${i + 2}"><navLabel><text>${chapterName}</text></navLabel><content src="${chapterOrder}.html"/>`;
          } else {
            files['OEBPS/toc.ncx'] = `${files['OEBPS/toc.ncx']}<navPoint id="chapter${chapterOrder}" playOrder="${i + 2}"><navLabel><text>${chapterName}</text></navLabel><content src="${chapterOrder}.html"/></navPoint>`;
          }
          if (Config.volume && chapter.volume && i === chapters.length - 1) files['OEBPS/toc.ncx'] = `${files['OEBPS/toc.ncx']}</navPoint>`;
        } else {
          files['OEBPS/toc.ncx'] = `${files['OEBPS/toc.ncx']}<navPoint id="chapter${chapterOrder}" playOrder="${i + 2}"><navLabel><text>${chapterName}</text></navLabel><content src="${chapterOrder}.html"/></navPoint>`;
        }

        files['OEBPS/content.opf'] = `${files['OEBPS/content.opf']}<item id="chapter${chapterOrder}" href="${chapterOrder}.html" media-type="application/xhtml+xml"/>`;
        itemref = `${itemref}<itemref idref="chapter${chapterOrder}" linear="yes"/>`;
        files[`OEBPS/${chapterOrder}.html`] = `<html xmlns="http://www.w3.org/1999/xhtml"><head><title>${chapterName}</title><link type="text/css" rel="stylesheet" media="all" href="stylesheet.css" /><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body><h3>${chapterName}</h3>` + `<div><p>${chapterContent}</p></div></body></html>`;
      }
      files['OEBPS/content.opf'] = `${files['OEBPS/content.opf']}<item id="cover-image" href="cover.jpg" media-type="image/jpeg"/></manifest><spine toc="ncx">${itemref}</spine><guide><reference href="cover.html" type="cover" title="Cover"/></guide></package>`;
      files['OEBPS/toc.ncx'] = `${files['OEBPS/toc.ncx']}</navMap></ncx>`;

      const zip = new JSZip();
      for (const file in files) {
        zip.file(file, files[file]);
      }
      const file = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9,
        },
      });
      download(file, `${title}.epub`);
    },
    zip: async (chapters) => {
      const { length } = String(chapters.length);
      const title = Storage.book.title || Storage.book.chapters[0].title;

      const files = {};
      files[`${String(0).padStart(length, '0')}-说明文件.txt`] = [
        `本书名称: ${title}`,
        Storage.book.writer ? `本书作者: ${Storage.book.writer}` : '',
        Storage.book.intro ? `本书简介: ${Storage.book.intro}` : '',
        Config.reference ? '阅读前说明：本书籍由用户脚本novelDownloader制作' : '',
        Config.reference ? `来源地址: ${window.location.href}` : '',
      ].filter((i) => i).join('\n');

      for (let i = 0; i < chapters.length; i++) {
        const { title, content } = chapters[i];
        files[`${String(i + 1).padStart(length, '0')}-${title.replace(/[\\/:*?"<>|]/g, '-')}.txt`] = content;
      }

      const zip = new JSZip();
      for (const file in files) {
        zip.file(file, files[file]);
      }
      const file = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9,
        },
      });
      download(file, `${title}.zip`);
    },
  };

  /** @name getFromRule
    * @param {string | function} value
    * @param {object | function} argsString 当为function时，参数为value
    * @param {array} argsFunction
  */
  async function getFromRule(value, argsString = {}, argsFunction = [], defaultValue) {
    argsFunction = [].concat(argsFunction);
    let returnValue;

    if (typeof argsString !== 'function') {
      argsString = {
        attr: 'text',
        document,
        allElement: false,
        ...argsString,
      };
    }
    if (typeof argsString.document === 'string') {
      try {
        argsString.document = new window.DOMParser().parseFromString(argsString.document, 'text/html');
      } catch (error) {
        console.error(error);
      }
    }

    if (typeof value === 'string' && typeof argsString !== 'function') {
      const args = argsString;
      argsString = () => {
        const elem = $(value, args.document || document);
        if (args.allElement) {
          return elem.toArray().map((i) => (args.attr === 'html' ? $(i).html() : args.attr === 'text' ? $(i).text() : $(i).attr(args.attr) || $(i).prop(args.attr)));
        }
        return args.attr === 'html' ? elem.eq(0).html() : args.attr === 'text' ? elem.eq(0).text() : elem.eq(0).attr(args.attr) || elem.eq(0).prop(args.attr);
      };
    }
    if (typeof value === 'string') {
      returnValue = await argsString(value);
    } else if (typeof value === 'function') {
      try {
        returnValue = await value(argsString.document || document, ...argsFunction);
      } catch (error) {
        console.error(error);
      }
    }
    returnValue = returnValue !== null && returnValue !== undefined ? returnValue : defaultValue;
    return returnValue;
  }

  function html2Text(text = '', specialDict = []) { // TODO 需要优化
    const dict = (specialDict || []).concat([
      [/<\/p>(\s*)<p(\s+.*?)?>/gi, '\n'],
      [/<\/p>|<p(\s+.*?)?>/gi, '\n'],
      [/<br\s*\/?>/gi, '\n'],
      [/<(\w+)&nbsp;/g, '&lt;$1&nbsp;'],
      [/(\S)<(div)/g, '$1\n<$2'],
      [/<\/(div)>(\S)/g, '</$1>\n$2'],
    ]).filter((i) => typeof i === 'object' && i instanceof Array && i.length).map((i) => {
      const arr = i;
      if (typeof arr[0] === 'string') arr[0] = new RegExp(arr[0], 'gi');
      if (typeof arr[1] === 'undefined') arr[1] = '';
      return arr;
    });
    return replaceWithDict(text, dict).trim();
  }
  function replaceWithDict(text = '', dict = []) {
    let replace = dict.find((i) => text.match(i[0]));
    let replaceLast = null;
    let textLast = null;
    while (replace) {
      if (replace === replaceLast && textLast === text) {
        console.error(`novelDownloader: 替换文本陷入死循环\n替换规则: ${replace}`);
        dict.splice(dict.indexOf(replace), 1);
      }
      textLast = text;
      text = text.replace(replace[0], replace[1] || '');
      replaceLast = replace;
      replace = dict.find((i) => text.match(i[0]));
    }
    return text;
  }
  function getCover(txt) {
    const fontSize = 20;
    const width = 180;
    const height = 240;
    const color = '#000';
    const lineHeight = 10;
    /// ////////
    const maxlen = width / fontSize - 2;
    const txtArray = txt.split(new RegExp(`(.{${maxlen}})`));
    let i = 1;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.strokeRect(0, 0, width, height);
    context.font = `${fontSize}px sans-serif`;
    context.textBaseline = 'top';
    let fLeft,
      fTop;
    for (let j = 0; j < txtArray.length; j++) {
      if (txtArray[j] === '') continue;
      fLeft = fontSize * ((maxlen - txtArray[j].length) / 2 + 1);
      fTop = fontSize / 4 + fontSize * i + lineHeight * i;
      context.fillText(txtArray[j], fLeft, fTop, canvas.width);
      context.fillText('\n', fLeft, fTop, canvas.width);
      i++;
    }
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      });
    });
  }
  function waitInMs(time) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }
  function waitFor(event, timeout) {
    return new Promise((resolve, reject) => {
      const now = new Date().getTime();
      let id;
      id = setInterval(() => {
        if (new Date().getTime() - now >= timeout) {
          if (id) clearInterval(id);
          id = null;
          resolve(false);
        } else if (event()) {
          if (id) clearInterval(id);
          id = null;
          resolve(true);
        }
      }, 200);
    });
  }
  function download(content, name, force) {
    const lastDownload = Storage.lastDownload || {};
    const time = new Date().getTime();
    if (!force && time - lastDownload.time <= 5 * 1000
      && lastDownload.size === content.size && lastDownload.type === content.type
      && lastDownload.name === name) { // 5秒内重复下载
      return;
    }
    Storage.lastDownload = {
      time,
      size: content.size,
      type: content.type,
      name,
    };
    saveAs(content, name);
  }

  $.expr[':'].emptyHuman = function (elem) {
    return $(elem).children().length === 0 && (elem.textContent || elem.innerText || $(elem).text() || '').trim() === '';
  };
  $.expr[':'].hiddenHuman = function (elem) {
    return $(elem).css('display') === 'none' || $(elem).css('visibility') === 'hidden' || $(0).css('opacity') === '0';
  };
  $.expr[':'].visibleHuman = function (elem) {
    return !$(elem).is(':hiddenHuman');
  };
  $.expr[':'].nochild = function (elem) {
    return $(elem).children().length === 0;
  };
  $.expr[':'].minsize = function (elem, index, meta, stack) {
    return (elem.textContent || elem.innerText || $(elem).text() || '').trim().length >= meta[3];
  };
  $.expr[':'].maxsize = function (elem, index, meta, stack) {
    return (elem.textContent || elem.innerText || $(elem).text() || '').trim().length <= meta[3];
  };
  $.expr[':'].regexp = function (elem, index, meta, stack) {
    return !!(elem.textContent || elem.innerText || $(elem).text() || '').match(new RegExp(meta[3], 'i'));
  };
}());
