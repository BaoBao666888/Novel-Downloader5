# novelDownloaderVietSub

Đây là một userscript giúp tải truyện chữ (novel) từ nhiều trang web khác nhau về máy tính dưới dạng file TEXT, EPUB hoặc ZIP. Phiên bản này được tùy chỉnh và phát triển dựa trên bản gốc của [dodying](https://github.com/dodying/UserJs).

## Tính năng chính

*   **Hỗ trợ nhiều trang web:** Tải truyện từ các trang phổ biến như Fanqie, Sang Tác Việt, JJWXC, Qidian, 69shuba, PO18, và nhiều trang khác (xem danh sách rule trong code).
*   **Định dạng đa dạng:** Lưu truyện dưới dạng file `.txt`, `.epub` (hỗ trợ ảnh bìa, CSS tùy chỉnh), hoặc `.zip` (mỗi chương một file text).
*   **Tùy chỉnh linh hoạt:** Cho phép cấu hình số luồng tải, thời gian chờ, định dạng tiêu đề, xử lý văn bản, v.v.
*   **Hỗ trợ tải ảnh:** Có thể tải ảnh bìa và ảnh trong nội dung truyện khi xuất ra file EPUB.
*   **Giao diện người dùng:** Cung cấp bảng điều khiển để dễ dàng cấu hình và bắt đầu quá trình tải.
*   **Xử lý chương VIP:** Có cơ chế xử lý chương VIP cho một số trang (như JJWXC cần token, Fanqie/STV dùng API riêng...).

## Cài đặt

1.  **Yêu cầu:** Bạn cần cài đặt một trình quản lý userscript cho trình duyệt của mình. Các lựa chọn phổ biến:
    *   [Tampermonkey](https://www.tampermonkey.net/) (Khuyên dùng cho Chrome, Edge, Firefox, Opera, Safari)
    *   [Violentmonkey](https://violentmonkey.github.io/) (Mã nguồn mở, hỗ trợ nhiều trình duyệt)
    *   Greasemonkey (Chủ yếu cho Firefox phiên bản cũ hơn)
2.  **Cài đặt script:** Nhấn vào link sau và làm theo hướng dẫn của trình quản lý userscript:
    *   **[Cài đặt novelDownloaderVietSub (v3.5.447)](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/novelDownloaderVietSub.user.js)**

## Hướng dẫn sử dụng

1.  **Truy cập trang truyện:** Mở trang web truyện bạn muốn tải (trang giới thiệu/mục lục hoặc trang đọc chương) trên một trang được script hỗ trợ.
2.  **Mở bảng điều khiển:**
    *   **Cách 1:** Nhấp đúp chuột vào cạnh **trái** của trang web.
    *   **Cách 2:** Nhấp vào biểu tượng của trình quản lý userscript (ví dụ: Tampermonkey) trên thanh công cụ trình duyệt, tìm đến `novelDownloaderVietSub` và chọn "Download Novel".
    *   *(Lưu ý: Xem phần "Vấn đề đã biết" nếu gặp khó khăn khi mở bảng điều khiển).*
3.  **Kiểm tra thông tin:** Script sẽ cố gắng tự động lấy thông tin truyện (tên, tác giả, bìa, tóm tắt) nếu rule cho trang đó hỗ trợ. Bạn có thể chỉnh sửa lại nếu cần.
4.  **Cấu hình (Tùy chọn):** Điều chỉnh các tùy chọn tải xuống như định dạng file, số luồng, thời gian chờ, có tải chương VIP hay không, v.v.
5.  **Bắt đầu tải:** Nhấn vào nút "Tải xuống dưới dạng TEXT", "Tải xuống dưới dạng EPUB", hoặc "Tải xuống dưới dạng ZIP".
6.  **Theo dõi:** Theo dõi thanh tiến trình ở cuối bảng điều khiển. Khi hoàn tất, file sẽ được tự động tải về.

## Cấu hình nâng cao (Tùy chọn)

### Cung cấp Token JJWXC và API Fanqie

Để tải các chương VIP trên **JJWXC** hoặc sử dụng API thay thế cho **Fanqie** (thay vì gọi trực tiếp API gốc), bạn cần cung cấp thông tin này cho script `novelDownloaderVietSub` thông qua một userscript phụ trợ.

**Tại sao cần làm việc này?**

*   **JJWXC:** Các chương VIP yêu cầu token xác thực cá nhân để truy cập qua API.
*   **Fanqie:** API gốc của Fanqie có thể bị chặn hoặc yêu cầu cookie phức tạp. Sử dụng API bên ngoài (API riêng của bạn) có thể ổn định hơn.

**Các bước thực hiện:**

1.  **Mở Trình quản lý Userscript:** Mở Tampermonkey (hoặc trình quản lý tương tự).
2.  **Tạo Script Mới:** Nhấp vào biểu tượng "+" hoặc tùy chọn "Tạo script mới".
3.  **Xóa Code Mẫu:** Xóa toàn bộ nội dung mặc định trong trình soạn thảo.
4.  **Dán Code Sau:** Sao chép và dán đoạn mã dưới đây vào trình soạn thảo:

    ```javascript
    // ==UserScript==
    // @name         Auto Inject Token Options
    // @namespace    http://tampermonkey.net/
    // @version      0.1
    // @description  Tự động cung cấp token và API endpoint cho Novel Downloader
    // @author       You
    // @match        *://*/*
    // @grant        none
    // @run-at       document-start // Chạy sớm để đảm bảo biến có sẵn
    // ==/UserScript==

    (function () {
      "use strict";

      // --- CHỈNH SỬA THÔNG TIN DƯỚI ĐÂY ---
      const tokenOptions = {
        // Thay "token của bạn" bằng token JJWXC cá nhân của bạn
        Jjwxc: "token của bạn",

        // API endpoint cho Fanqie (có thể giữ nguyên hoặc đổi nếu bạn có API riêng)
        Fanqie: [
            {url: "http://192.168.1.2:8888/content?item_id={chapter_id}"},
            {url: "url", key: "key"}, //key cần cho api doubi
        ], // Hoặc API khác, phải có {chapter_id}
      };
      // --- KẾT THÚC PHẦN CHỈNH SỬA ---

      // Gán biến vào window để script Novel Downloader có thể đọc
      window.tokenOptions = tokenOptions;

      // console.log("Token Options Injected:", window.tokenOptions); // Bỏ comment dòng này nếu muốn kiểm tra trong Console (F12)
    })();
    ```

5.  **Chỉnh sửa Token và API:**
    *   Tìm dòng `Jjwxc: "token của bạn"`. **Quan trọng:** Thay thế `"token của bạn"` bằng **token JJWXC thực tế** của bạn (token này thường lấy từ quá trình đăng nhập vào app JJWXC, bạn cần tự tìm cách lấy). **Không chia sẻ token này cho người khác.**
    *   Tìm dòng `Fanqie: "..."`. Bạn có thể thay thế bằng một địa chỉ API Fanqie khác nếu bạn có.
6.  **Lưu Script:** Nhấn "File" -> "Save" hoặc nút Lưu tương ứng. Đảm bảo script này được **bật (enabled)** trong trình quản lý userscript.
7.  **Hoàn tất:** Script phụ trợ này sẽ tự động chạy trên mọi trang và tạo ra biến `window.tokenOptions`. Script `novelDownloaderVietSub` sẽ tự động tìm và sử dụng biến này khi tải truyện từ JJWXC (VIP) hoặc Fanqie.

*(Lưu ý: Việc lấy token JJWXC có thể phức tạp và nằm ngoài phạm vi hỗ trợ của script này. Hãy đảm bảo bạn hiểu rõ về token và cách sử dụng nó.)*

## Các trang web được hỗ trợ (Tiêu biểu)

Script hỗ trợ một danh sách lớn các trang web. Danh sách các rule xử lý cụ thể nằm trong mã nguồn của script, trong mảng `Rule.special`. Một số trang tiêu biểu đã được thêm/cập nhật rule bao gồm:

*   Fanqie (蕃茄小说)
*   JJWXC (晋江文学城)
*   Qidian (起点中文网)
*   69shuba (69书吧)
*   PO18 (po18.tw)
*   Haitang (海棠文化)
*   Afdian (afdian.com)
*   Ihuaben (ihuaben.com)
*   Novel543 (Novel543.com)
*   Và nhiều trang khác...

*(Bạn có thể tự thêm hoặc sửa rule trong code nếu muốn hỗ trợ trang web khác hoặc trang hiện tại có thay đổi cấu trúc).*

## Tự viết Rule mới

Bạn có thể dán rule mới trực tiếp trong giao diện (ô “Quy tắc tùy chỉnh”) hoặc sửa file. Rule là một object JS, tối thiểu cần `siteName`, `url`, `chapterUrl`, `chapter` (CSS selector lấy danh sách chương) và `content`/`deal`. Ví dụ khung đầy đủ:

```js
[{
  siteName: 'MySite',
  url: '://www.example.com/books/\\d+$',          // regex hoặc mảng regex cho trang mục lục
  chapterUrl: '://www.example.com/books/\\d+/\\d+', // regex hoặc mảng regex cho trang chương
  title: '.book-title',                           // selector tiêu đề truyện
  writer: '.book-author',                         // selector tác giả
  intro: '.book-intro',
  cover: '.book-cover img',
  chapter: '.chapter-list a',                     // selector danh sách chương (bắt buộc)
  vipChapter: '.chapter-list li.vip a',           // (tùy chọn) selector chương VIP
  chapterTitle: 'h1',                             // selector tiêu đề chương
  content: '.article-body',                       // selector nội dung chương (nếu tải trực tiếp)
  elementRemove: 'script,style',                  // selector cần loại bỏ khỏi nội dung
  contentReplace: [['Quảng cáo.*', '']],          // mảng [pattern, replace] để làm sạch text
  getChapters: async (doc) => { /* tùy chọn: tự build danh sách chương */ },
  deal: async (chapter) => { /* tùy chọn: tự fetch/decrypt trả về string hoặc {title,content} */ },
}]
```

Lưu ý:
- Ô “Quy tắc tùy chỉnh” chấp nhận một chuỗi JSON/JS (ví dụ `[]` hoặc `[{}]`); script sẽ `eval` và nối vào `Rule.special`.
- Nếu bật “Sử dụng quy tắc mẫu”, script sẽ tự thêm `Rule.template` để auto-match các site Biquge tương tự.
- Với `deal`, nếu trả về string rỗng, script sẽ coi là lỗi và thử lại theo cấu hình `retry`.

## Các script & thư mục liên quan trong repo

### Userscript chính

*   **novelDownloaderVietSub.user.js:** Bao gồm bản stable (
ovelDownloaderVietSub.user.js), bản beta và các phiên bản hồi quy (3.5.445, 3.5.446) để test/lùi lỗi; cài đặt nhanh [Stable](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/novelDownloaderVietSub.user.js) • [Beta](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/novelDownloaderVietSub-beta.user.js) • [3.5.446](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/novelDownloaderVietSub-3.5.446.user.js) • [3.5.445](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/novelDownloaderVietSub-3.5.445.user.js).
*   **auto inject tokenOptions.user.js:** Script phụ tự tạo window.tokenOptions (token JJWXC, API Fanqie) cho novelDownloaderVietSub; [Cài đặt](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/auto%20inject%20tokenOptions.user.js).

### Userscript bổ trợ

*   **Auto Volume Chapter Uploader.user.js:** Tự động chèn tập/chương, kiểm tra trùng/thiếu và chọn vị trí chèn -n/n- khi đăng truyện; [Cài đặt](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Auto%20Volume%20Chapter%20Uploader.user.js) và khuyến nghị dùng kèm app [rename_chapters](rename_chapters) để đồng bộ tên chương trước khi tải lên.
*   **Fanqie Chapter Replacer and copy Full.user.js:** Thay nội dung chương Fanqie từ API cá nhân và thêm nút copy tiêu đề + nội dung để dùng lại nhanh; [Cài đặt](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Fanqie%20Chapter%20Replacer%20and%20copy%20Full.user.js).
*   **TM Translate.user.js:** Dịch trang, quản lý name-set, chuẩn hóa tên, chế độ đọc rút gọn và tùy chỉnh giao diện; [Cài đặt](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/TM%20Translate.user.js).
*   **Wikidich Book Sync (Refactored).user.js:** Đồng bộ, chép chương từ nguồn (Fanqie, 69shuba, ...) sang Wikidich ngay trên trang sách, xử lý chương ẩn hoặc rỗng; [Cài đặt](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Wikidich%20Book%20Sync%20(Refactored).user.js).
*   **TruyenWikiDich_Works_Manager.user.js:** Đồng bộ toàn bộ works cá nhân trên Wikidich, lưu vào localForage, hỗ trợ lọc nâng cao và xuất/nhập dữ liệu; [Cài đặt](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/TruyenWikiDich_Works_Manager.user.js).
*   **TruyenWikiDich_Get_Names.user.js:** Lấy danh sách tên nhân vật từ truyenwikidich.net; [Cài đặt](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/TruyenWikiDich_Get_Names.user.js).
*   **wkidich-search-to-detail.user.js:** Thêm nút tìm truyện Wikidich và hiển thị link nhúng detail từ API; [Cài đặt](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/wkidich-search-to-detail.user.js).

### Công cụ & thư mục

*   **decode\\Zongcai-Novel-Decoder.user.js:** Giải mã truyện Zongcai; [Cài đặt STV](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/decode/STV-Downloader.user.js) • [Cài đặt Zongcai](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/decode/Zongcai-Novel-Decoder.user.js).
*   **rename_chapters\\***: Ứng dụng Tkinter Rename Chapters (v0.1.5) đổi tên file theo nội dung, sắp xếp, gộp/tách, hỗ trợ fetch metadata (ảnh, mục lục), plugin cho JJWXC/PO18/Qidian/Fanqie va cập nhật tự động; ưu tiên dùng bản build sẵn [Rename Chapters](https://github.com/BaoBao666888/Novel-Downloader5/releases).

### Dữ liệu & thư viện hỗ trợ

*   **han_viet/output.json:** Từ điển Han-Việt để Việt hóa nhanh các cụm Hán.
*   **download-vietnamese.js:** Bộ tải xuống chung (GM_xmlhttpRequest/fetch/xhr) với UI theo dõi, gom các liên kết tải cấu hình sẵn.
*   **translate\\zh_to_vi\\(HanViet.json, Name.json, VP.json):** Những bộ từ điển lớn (tên riêng, từ vựng, VietPhrase) mà `TranslateZhToVi` dùng làm nền.
*   **fanqie-decrypt-lib.js:** Thư viện giải mã/chuyển hóa Fanqie, tái sử dụng trong các userscript liên quan.
*   **chs2cht.js:** Bộ chuyển Giản thể ↔ Phồn thể, dùng khi cần xuất bản với chữ Hant hoặc chuyển từ nguồn zh-Hant.
*   **SourceHanSansCN-Regular-Often.json:** Bản đồ glyph → ký tự được trích từ font Source Han Sans (dùng để giải mã icon font trong truyện).

## Vấn đề đã biết (Chưa sửa lỗi)

1.  **Khó hiển thị giao diện:** Trong phiên bản `3.5.447` này, giao diện tải xuống (bảng điều khiển) **đôi khi không tự động xuất hiện** khi nhấp đúp vào cạnh trái hoặc dùng menu lệnh, không ổn định như các bản 445, 446 trước đó.
    *   **Cách khắc phục tạm thời:** Tải lại trang (F5) và thử lại thao tác mở bảng điều khiển (nhấp đúp hoặc dùng menu). Có thể cần thử vài lần.
2.  **Luồng tải không hoạt động đúng:** Việc cài đặt nhiều hơn 1 luồng tải (`thread`) trong cấu hình hiện tại **không hoạt động song song** như mong đợi cho tất cả các trường hợp.
    *   Script vẫn xử lý tải xuống một cách **tuần tự** (từng chương một) đối với các rule phức tạp (dùng `deal`, `iframe`, `popup`) hoặc khi có độ trễ (`delayBetweenChapters`).
    *   Ngay cả với các chương tải trực tiếp, việc tăng số luồng dường như **không tăng tốc độ tải song song** mà vẫn chạy như 1 luồng. Đây là vấn đề cần được kiểm tra và sửa lỗi trong code xử lý hàng đợi tải xuống.

## Kế hoạch tương lai (TODO)

*   **Ưu tiên:** Sửa lỗi giao diện không hiển thị và lỗi xử lý luồng tải.
*   Cập nhật các rule hiện có nếu trang web thay đổi cấu trúc.
*   Thêm rule cho các trang web mới theo yêu cầu hoặc đóng góp.
*   Cải thiện hiệu năng và độ ổn định.

## Đóng góp

Mọi đóng góp để cải thiện script (sửa lỗi, thêm rule mới, tối ưu code) đều được hoan nghênh! Vui lòng tạo **Pull Request** trên GitHub repository này.

## Phản hồi & Báo lỗi

Nếu bạn gặp lỗi (ngoài các vấn đề đã biết) hoặc có đề xuất tính năng mới, vui lòng tạo **Issue** trên trang GitHub của dự án:
[https://github.com/BaoBao666888/Novel-Downloader5/issues](https://github.com/BaoBao666888/Novel-Downloader5/issues)

Khi báo lỗi, vui lòng cung cấp các thông tin sau:

*   Link trang web/truyện bạn đang gặp lỗi.
*   Mô tả lỗi chi tiết.
*   Ảnh chụp màn hình (nếu có).
*   Thông tin lỗi từ Console của trình duyệt (Nhấn F12 -> tab Console).

## Lời cảm ơn

*   Script này được phát triển dựa trên phiên bản gốc của **dodying**.
*   Cảm ơn tất cả những người đã đóng góp ý tưởng, báo lỗi và sử dụng script.




