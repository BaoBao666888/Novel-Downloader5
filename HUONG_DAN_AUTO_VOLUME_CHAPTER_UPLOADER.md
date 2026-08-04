# Hướng dẫn Auto Volume/Chapter Uploader và Wikidich Autofill

Tài liệu này dành cho người dùng hai thành phần sau:

- [`Auto Volume Chapter Uploader.user.js`](./Auto%20Volume%20Chapter%20Uploader.user.js), phiên bản `1.2.8.6`: script chính để chọn quyển, phân tích và gán file chương, chia một TXT lớn, lưu/khôi phục form và bấm tải lên trên WikiCV.
- [`Wikidich_Autofill.user.js`](./Wikidich_Autofill.user.js), phiên bản `0.3.9.6`: thư viện con lấy thông tin truyện từ web Trung, dịch, gợi ý phân loại, xử lý ảnh bìa và kiểm tra trùng/cấm nhúng.

> **Điểm quan trọng:** thông thường chỉ cần cài script chính. Không cần cài thư viện con thành một userscript riêng.

## 1. Script làm được gì?

### 1.1. Auto Volume/Chapter Uploader

Script chính hỗ trợ:

- Chạy đầy đủ trên:
  - `https://wikicv.org/nhung-file`
  - `https://wikicv.org/truyen/.../chinh-sua`
- Chọn quyển hiện có, quyển bổ sung hoặc tạo quyển mới.
- Chọn nhiều file `.txt`, tự đọc số chương, tự sắp xếp và điền tên chương + file vào form web.
- Phát hiện file nhỏ, bảng mã không phải UTF-8, emoji/ký tự 4-byte, ký tự ẩn zero-width và dấu `、` có thể làm web từ chối.
- Cảnh báo chương trùng, thiếu chương hoặc file không phân tích được.
- Cho chèn thủ công file lỗi vào đúng vị trí.
- Khi chọn đúng **một** TXT, tự mở công cụ chia file thành nhiều chương.
- Chỉnh, chèn, xóa, gộp chương; thêm Credit; tự chia bằng regex; xuất ZIP hoặc gán thẳng vào web.
- Lưu và khôi phục trạng thái form, gồm cả metadata, bìa, quyển, tên chương và file trong giới hạn lưu trữ của trình duyệt.
- Thêm/xóa quyển và thống kê số chương theo quyển.
- Mở thư viện Autofill để điền thông tin truyện.
- Có giao diện sáng, tối hoặc tự động theo hệ thống.

### 1.2. Wikidich Autofill

Thư viện con hỗ trợ:

- Nhận URL truyện từ Fanqie, JJWXC, PO18, Ihuaben, Qidian, Qimao, Gongzicp và Hải Đường Longma.
- Lấy tên gốc, tác giả, văn án, tag/thể loại, trạng thái và ảnh bìa tùy nguồn.
- Dịch tiêu đề, văn án, tag và thể loại qua DichNgay.
- Dùng bộ name để giữ cách dịch tên nhân vật/địa danh ổn định.
- Gợi ý Tình trạng, Tính chất, Giới tính, Thời đại, Kết thúc, Loại hình và Tag theo nhãn đang có trên web.
- Chạy Gemini để phân tích nâng cao hoặc tạo prompt cho AI thủ công.
- So sánh dữ liệu sắp áp với form đang có trên trang chỉnh sửa.
- Loại trừ những trường không muốn ghi đè, có cấu hình chung và cấu hình riêng theo nguồn.
- Tải, đổi kích thước và tối ưu ảnh bìa xuống khoảng dưới 500 KB khi có thể.
- Kiểm tra truyện trùng, quét sâu trang tác giả, so tên dịch/ảnh bìa và kiểm tra danh sách cấm nhúng.
- Dịch nhanh văn bản theo bốn chế độ: sang Việt, Hán Việt, Phồn → Giản và Giản → Phồn.

## 2. Yêu cầu trước khi dùng

Bạn cần:

1. Trình duyệt Chromium hoặc Firefox có cài Tampermonkey.
2. Đã đăng nhập `wikicv.org`.
3. Quyền chỉnh sửa/nhúng truyện phù hợp với tài khoản đang dùng.
4. Nếu lấy dữ liệu PO18 hoặc Hải Đường Longma, nên đăng nhập trang nguồn trong cùng trình duyệt.
5. Nếu dùng Gemini tự động, cần Gemini API Key hợp lệ. Luồng lấy dữ liệu và dịch cơ bản không bắt buộc có Gemini API Key.

Script được khai báo chạy trên mọi website để có thể mở công cụ **Chia TXT** độc lập. Vì vậy Tampermonkey có thể báo script có quyền truy cập nhiều trang và kết nối nhiều tên miền; đây là hành vi khớp với cấu hình hiện tại của script.

## 3. Cài đặt và cập nhật

### 3.1. Cài mới

1. Cài Tampermonkey và bật tiện ích.
2. Nhấn cài script chính: [Auto Volume Chapter Uploader.user.js](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Auto%20Volume%20Chapter%20Uploader.user.js)
   hoặc copy link sau rồi mở trong tab mới:
   ```https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Auto%20Volume%20Chapter%20Uploader.user.js```

3. Khi Tampermonkey hiện trang cài đặt, bấm **Install/Cài đặt**.
4. Mở hoặc tải lại trang `/nhung-file` hay `/chinh-sua`.
5. Nếu Tampermonkey hỏi quyền kết nối tới nguồn truyện, DichNgay hoặc Google Gemini, hãy chỉ cấp các quyền bạn thực sự muốn dùng.

### 3.2. Có cần cài `Wikidich_Autofill.user.js` riêng không?

Không. File này là **library**: nó cung cấp hàm `WDA_InitAutofill` cho script chính gọi khi bấm **Autofill Thông tin**. Tự cài riêng có thể không tạo giao diện như mong đợi vì thư viện không tự khởi động panel.

Nếu nút Autofill báo “Không tìm thấy module Autofill”, hãy kiểm tra:

- Script chính đang bật trong Tampermonkey.
- Mạng có truy cập được GitHub Raw.
- Dòng `@require` chưa bị xóa hoặc sửa.
- Tải lại tab sau khi cập nhật script.

### 3.3. Cập nhật

Script chính có `@updateURL` và `@downloadURL`, nên có thể kiểm tra cập nhật từ menu Tampermonkey. Sau khi cập nhật, tải lại trang web. Khi phiên bản thay đổi, script có thể tự mở phần thay đổi mới và hỏi có bật nút **Chia TXT** trên các trang khác hay không.

## 4. Làm quen với giao diện chính

Trên trang hỗ trợ, panel ban đầu được thu thành icon tròn **WDU**.

- Bấm **WDU** để mở panel.
- Kéo phần đầu panel để đổi vị trí.
- Bấm **✕** để thu nhỏ về icon WDU.
- Bấm **⚙** để mở Cài đặt.
- Bấm **?** để xem hướng dẫn/changelog tích hợp.
- Nút **↕** cạnh danh sách quyển đảo thứ tự hiển thị, hữu ích khi truyện có nhiều quyển.

Các nút chính:

| Nút | Chức năng |
| --- | --- |
| **Files TXT** | Chọn file chương. Chọn nhiều file để upload thường; chọn đúng một file để mở trình chia TXT. |
| **Add New** | Thêm một quyển mới trên form và tự chọn quyển đó. |
| **🗑 Xóa** | Xóa quyển đang chọn. Một số quyển trên trang chỉnh sửa bắt buộc xác nhận username người đăng. |
| **🚀 Tải lên** | Bấm nút tải lên thật của website sau khi script đã gán file vào form. |
| **💾 Lưu** | Tạo bản lưu trạng thái form hiện tại trong trình duyệt. |
| **🗂 Bản lưu** | Xem, chọn, khôi phục hoặc xóa các bản lưu. |
| **Autofill Thông tin beta** | Mở panel Wikidich Autofill. |

> **Phân biệt hai bước:** **Files TXT** chỉ chuẩn bị/gán dữ liệu vào form. Hãy kiểm tra tên chương, file và thông tin truyện. Chỉ khi bấm **🚀 Tải lên**, script mới bấm nút upload thật trên web.

## 5. Cách upload nhiều file chương

### 5.1. Luồng nhanh

1. Vào trang `/nhung-file` hoặc trang `/chinh-sua` của truyện.
2. Bấm icon **WDU**.
3. Trong **1. Chọn Quyển**, chọn quyển cần nhận chương.
4. Nếu chưa có quyển phù hợp, bấm **Add New**, nhập tên quyển trên form web nếu cần.
5. Bấm **Files TXT**.
6. Chọn từ hai file TXT trở lên.
7. Xử lý các hộp thoại cảnh báo nếu xuất hiện.
8. Nếu script báo thiếu/trùng/không parse được, kiểm tra và chọn **Vẫn tiếp tục** hoặc **Hủy bỏ**.
9. Chờ thông báo “Đã gán xong tên chương + file vào web”.
10. Kiểm tra trực tiếp các hàng chương trên form web.
11. Khi chắc chắn đúng, bấm **🚀 Tải lên**.

### 5.2. Cách đặt tên file để script hiểu tốt

Các dạng tên file phù hợp:

```text
第123章 标题.txt
第十二章 标题.txt
Chương 123 - Tiêu đề.txt
Chapter 123 - Title.txt
Chap 123 - Title.txt
123 - Tiêu đề.txt
0001.txt
```

Ở chế độ parse mặc định, script có thể lấy số và tiêu đề từ tên file. Nếu tên file không dùng được, script thử dòng đầu theo cấu hình ưu tiên.

Dòng đầu được parser mặc định nhận tốt nhất khi bắt đầu như sau:

```text
第123章 标题
第十二章 标题
123 - Tiêu đề
123. Tiêu đề
```

Lưu ý: parser **dòng đầu** hiện nhận dạng dạng `第...章` hoặc dòng bắt đầu trực tiếp bằng số. Dạng `Chương 123...` nên đặt ở **tên file**, hoặc dùng chế độ **File tên số, dùng dòng đầu làm tiêu đề** nếu chỉ cần lấy nguyên dòng đầu.

### 5.3. Script sắp xếp như thế nào?

- Chế độ bình thường: parse số chương rồi sắp xếp tăng dần theo số.
- Chế độ **File tên số, dùng dòng đầu**: sắp theo tên file kiểu natural sort, ví dụ `2.txt` đứng trước `10.txt`.
- Tên chương cuối cùng được tạo từ mẫu trong Cài đặt, mặc định:

  ```text
  第{num}章 {title}
  ```

Ví dụ file `123 - Gặp lại.txt` sẽ cho tên chương `第123章 Gặp lại`.

Nếu tiêu đề đã lặp lại cùng tiền tố chương, script cố bỏ phần lặp để tránh kết quả kiểu `第123章 第123章 Gặp lại`.

### 5.4. Chế độ “File tên số, dùng dòng đầu làm tiêu đề”

Bật trong **⚙ Cài đặt** khi bộ file có dạng:

```text
000.txt
001.txt
002.txt
```

Trong chế độ này:

- Script không parse số chương.
- File được sắp theo tên file.
- Nguyên dòng đầu được dùng làm tên chương.
- Không kiểm tra trùng số hoặc thiếu số chương.
- Không tự điền mô tả khoảng chương bổ sung.
- Các tùy chọn ưu tiên nguồn parse và mẫu `{num}` bị vô hiệu hóa vì không dùng đến.

### 5.5. Các bước kiểm tra/làm sạch file

Sau khi chọn file, script có thể lần lượt hỏi:

1. **File nhỏ hơn ngưỡng**: mặc định cảnh báo dưới 4 KB. File nhỏ không chắc là sai, nhưng nên kiểm tra có bị rỗng/cắt nội dung không.
2. **Bảng mã không phải UTF-8**: script nhận diện UTF-8, UTF-16, GBK/GB18030 và Windows-1252. Có thể chọn chuyển sang UTF-8 hoặc giữ nguyên.
3. **Ký tự 4-byte/emoji**:
   - **Đổi sang text**: ví dụ icon được đổi thành dạng `<U+1F...>`; đây là lựa chọn được script khuyên dùng.
   - **Xóa icon**: loại bỏ toàn bộ ký tự 4-byte.
   - **Giữ nguyên**: có nguy cơ web chính thức từ chối upload.
4. **Ký tự ẩn zero-width**: nên xóa nếu nội dung bị lỗi kiểu mỗi từ/từng chữ cách nhau bất thường.
5. **Dấu phẩy Nhật `、`**: có thể chuẩn hóa thành dấu phẩy `,` để tránh bị web chặn.

Các thao tác chuyển/làm sạch tạo đối tượng file mới trong bộ nhớ để gán lên web; script không ghi đè file gốc trên ổ đĩa.

### 5.6. Khi có chương trùng, thiếu hoặc file lỗi

Script kiểm tra trong phạm vi bộ file vừa chọn:

- **Trùng chương**: hai file parse ra cùng số.
- **Thiếu chương**: có khoảng trống giữa số nhỏ nhất và lớn nhất, ví dụ có 10, 11, 13 nhưng thiếu 12.
- **Không parse được**: không tìm thấy số chương trong cả nguồn ưu tiên lẫn nguồn fallback.

Với file không parse được, khu vực **Sắp xếp file chèn** xuất hiện:

1. Bấm dấu **+** tại vị trí muốn chèn.
2. Chọn một file trong danh sách.
3. Bấm **Chèn**.
4. File chèn hiện màu cam. Bấm vào hàng màu cam nếu muốn bỏ khỏi vị trí đó và đưa lại về danh sách chờ.
5. Khi thứ tự đã đúng, bấm **Vẫn tiếp tục**.

File chèn thủ công không có số chương; tên chương sẽ lấy từ tên file sau khi bỏ đuôi `.txt`. Có thể sửa lại tên trực tiếp trên form web trước khi tải lên.

## 6. Chia một file TXT lớn thành nhiều chương

### 6.1. Ba cách mở

- Trên trang upload/edit: chọn quyển, bấm **Files TXT** và chọn đúng một file.
- Trên mọi trang: mở menu Tampermonkey của script và chọn **📚 Chia 1 file TXT**.
- Bật **Hiện nút Chia TXT trên các trang khác** trong Cài đặt, sau đó bấm nút nổi **📚 Chia TXT**.

Ở chế độ độc lập ngoài trang upload/edit, bạn có thể chỉnh và tải ZIP nhưng không có nút **Gán vào web**.

### 6.2. Script chia bằng cách nào?

Thứ tự xử lý:

1. Dùng regex tùy chỉnh đã lưu, nếu có và kết quả đủ hợp lý.
2. Nếu không, dùng các mẫu có sẵn cho `第...章`, `Chương ...`, `Chapter ...` và một số kiểu tiêu đề đánh số.
3. Nếu tiêu đề không đáng tin cậy, chia theo đoạn/dòng, cố giữ kích thước gần mức **Tối đa mỗi chương**.

Giá trị mặc định là 8.000 ký tự và tối thiểu cho phép là 500. Đây là mục tiêu cho fallback và kiểm tra chất lượng, không phải lúc nào cũng là giới hạn cắt cứng đối với chương đã nhận đúng tiêu đề.

### 6.3. Xử lý phần Văn án/Mở đầu

Phần chữ đứng trước tiêu đề chương đầu có ba chế độ:

| Chế độ | Kết quả |
| --- | --- |
| **Xóa khỏi file** | Không đưa phần mở đầu vào file xuất/gán. Đây là mặc định. |
| **Gộp vào chương 1** | Đặt phần mở đầu trước tên chương đầu tiên. |
| **Tách thành file Mở đầu** | Tạo một mục/file riêng tên “Mở đầu”. |

Có thể đặt mặc định trong Cài đặt hoặc đổi trong tab **Regex chia file** rồi chia lại.

### 6.4. Giao diện chỉnh chương

Bên trái là danh sách chương; bên phải là nội dung chương đang chọn.

- Ô **Tên chương** sửa tiêu đề.
- Ô **Nội dung chương** hiển thị file thật, trong đó dòng đầu là tên chương.
- Nếu sửa dòng đầu của **Nội dung chương**, tên chương cũng được cập nhật.
- **Chèn trước/Chèn sau** tạo chương trống cạnh chương hiện tại.
- **Xóa chương** hoặc dấu **×** xóa mục đó khỏi danh sách.
- Nút **Gốc** chỉ hiện khi chương đã bị sửa; bấm để trả chương hiện tại về bản ban đầu.
- Ô tìm kiếm có thể tìm theo **Tên** hoặc **Nội dung**; bấm nút phạm vi để đổi.

Để gộp chương:

1. Tick các ô bên trái của các chương kề nhau, hoặc chọn một chương rồi giữ `Shift` và bấm chương cuối.
2. Script tự mở rộng thành một vùng liên tục từ chương đầu đến chương cuối.
3. Bấm **Gộp N chương**.
4. Nếu có chương đã sửa, chọn **Giữ thay đổi** hoặc **Dùng bản gốc**.

Tên sau khi gộp lấy theo chương đầu tiên; nội dung các chương sau được nối tiếp vào chương đầu.

### 6.5. Thêm Credit hàng loạt

Trong tab **Thêm Credit**:

1. Nhập Credit, nguồn, editor hoặc nội dung muốn thêm.
2. Chọn vị trí:
   - **Đầu file**.
   - **Cuối file**.
   - **Trước dòng n**.
3. Xem preview.
4. Bấm **Áp dụng Credit**.

Cấu hình Credit được lưu để lần sau dùng lại. Bấm **Tắt Credit** nếu không muốn chèn vào file xuất/gán. Credit được thêm lúc tạo file; không cần tự dán vào từng chương.

### 6.6. Regex chia file tùy chỉnh

Mỗi dòng là một regex. Có thể viết dạng JavaScript literal hoặc chỉ viết pattern:

```text
/^第\s*\d+\s*章.*$/gmi
^Chương\s+\d+.*$
# Dòng bắt đầu bằng # là ghi chú
```

- Script tự bảo đảm cờ global và multiline.
- **Xem trước** chỉ phân tích và hiện kết quả dự kiến, chưa thay danh sách chương.
- **Chia lại** mới áp regex, lưu cấu hình và tạo lại danh sách từ TXT nguồn.
- **Xóa regex** xóa cấu hình đã lưu và chia lại bằng mẫu mặc định.
- Dòng regex lỗi được chỉ rõ theo số dòng và bị bỏ qua.
- Nếu regex tùy chỉnh cho kết quả không hợp lý, script có thể fallback về mẫu mặc định hoặc chia theo đoạn.

> **Cẩn thận:** bấm **Chia lại** dựng lại danh sách từ TXT nguồn, vì vậy các sửa tay đang có trong danh sách chương có thể mất. Hãy lưu ZIP trước nếu cần giữ một bản.

### 6.7. Xuất hoặc gán kết quả

- **💾 Lưu về**: nén toàn bộ chương thành một ZIP rồi mở hộp thoại **Tải ZIP**. Tên file có dạng `0001 Tên chương.txt`, `0002 ...`.
- **🚀 Gán vào web**: biến các chương thành file UTF-8 trong bộ nhớ, đóng modal và điền chúng vào quyển đã chọn.
- Sau khi gán, vẫn cần kiểm tra form rồi bấm **🚀 Tải lên** ở panel chính.

## 7. Quản lý quyển

### 7.1. Chọn và đảo danh sách quyển

Danh sách có thể ghi thêm:

- **(Bổ sung)**: quyển hỗ trợ thêm chương.
- **Không thể bổ sung**: không thể gán file mới; chỉ có thể tạo quyển khác hoặc dùng chức năng xóa nếu đủ quyền.

Trên trang chỉnh sửa, script thường chọn quyển bổ sung cuối cùng khi thích hợp. Nút **↕** chỉ đảo cách hiển thị, không đổi thứ tự quyển thật trên web.

### 7.2. Thêm quyển

Bấm **Add New**. Script bấm nút thêm quyển của website, làm mới danh sách và cố tự chọn quyển mới. Nếu web phản hồi chậm, chọn lại quyển thủ công.

### 7.3. Xóa quyển

1. Chọn đúng quyển.
2. Bấm **🗑 Xóa**.
3. Đọc kỹ tên quyển trong hộp xác nhận.
4. Với quyển bổ sung hoặc không thể chỉnh trên trang `/chinh-sua`, nhập username của **Người đăng**. Script chấp nhận username thường hoặc dạng URL-encode nếu khớp dữ liệu trên trang truyện.
5. Bấm **Xóa**. Script sẽ bấm cả nút xóa và nút xác nhận của website.

Đây là thao tác có tác động thật lên web và không có chức năng hoàn tác của script. Nên tạo **💾 Bản lưu** trước, nhưng bản lưu không bảo đảm khôi phục được một quyển đã bị server xóa.

## 8. Lưu và khôi phục trạng thái

### 8.1. Bản lưu chứa gì?

Một bản lưu có thể chứa:

- Tên truyện, tác giả và các trường metadata trên form.
- Nhãn radio/checkbox và liên kết bổ sung.
- Ảnh bìa nếu trình duyệt lưu được blob ảnh.
- Danh sách quyển, tên chương và tên file.
- Nội dung file chương trong giới hạn lưu trữ.
- Quyển đang chọn và một số cấu hình parse của công cụ.

### 8.2. Giới hạn

- Tối đa 40 bản; bản cũ nhất bị loại khi vượt giới hạn.
- File được lưu theo kiểu best-effort, tối đa khoảng **10 MB cho mỗi bản lưu**.
- Nếu IndexedDB không dùng được, fallback inline chỉ phù hợp dữ liệu nhỏ.
- Trình duyệt có thể xóa dữ liệu do dọn site data, đổi profile, chế độ riêng tư hoặc thiếu quota.
- Bản lưu nằm cục bộ, không phải bản backup trên server và không tự đồng bộ sang máy khác.

### 8.3. Cách dùng

- Bấm **💾 Lưu** để chụp trạng thái hiện tại.
- Bấm **🗂 Bản lưu** để mở danh sách.
- Có thể chọn nhiều bản để xóa.
- Chỉ khi chọn đúng một bản, nút **↩ Khôi phục** mới bật.
- Khôi phục sẽ thay đổi/ghi đè nhiều phần của form hiện tại và có thể thêm quyển còn thiếu. Luôn đọc hộp xác nhận trước khi tiếp tục.
- Sau khôi phục, nếu log báo thiếu file, hãy chọn lại các file đó từ máy.

## 9. Cài đặt của Auto Uploader

| Tùy chọn | Mặc định trong code | Ý nghĩa |
| --- | ---: | --- |
| Giới hạn dòng log | 1000 | Xóa bớt log cũ để panel không quá nặng. Giao diện hiện còn một dòng mô tả cũ ghi 100, nhưng giá trị khởi tạo thực tế là 1000. |
| Cảnh báo file nhỏ | 4 KB | Đặt `0` để tắt cảnh báo. |
| Giao diện | Sáng | Chọn Sáng, Tối hoặc Tự động. Theme được chia sẻ với panel Autofill. |
| File tên số, dùng dòng đầu | Tắt | Bỏ parse số, sắp theo filename và lấy nguyên dòng đầu làm tiêu đề. |
| Ưu tiên lấy thông tin | Tên file | Có thể ưu tiên dòng đầu; nếu thất bại sẽ fallback sang nguồn còn lại. |
| Hiện thống kê chương theo quyển | Hỏi lần đầu | Hiện số chương + chương cuối ở từng quyển và tổng số chương trong Cài đặt. Chủ yếu có tác dụng trên trang chỉnh sửa. |
| Mẫu tên chương | `第{num}章 {title}` | Bắt buộc chứa `{num}` khi không dùng chế độ file tên số. `{title}` là phần tiêu đề parse được. |
| Phần Mở đầu/văn án | Xóa khỏi file | Dùng khi chia một TXT lớn. |
| Tối đa mỗi chương khi chia TXT | 8000 | Từ 500 đến 200.000; dùng làm kích thước mục tiêu/fallback. |
| Hiện nút Chia TXT trên trang khác | Tắt | Cho hiện nút riêng ngoài trang upload/edit. |

Ngoài panel Cài đặt, menu Tampermonkey có:

- **⚙️ Mở Cài đặt Auto Volume**.
- **📚 Chia 1 file TXT**.
- **Hiện/Ẩn nút Chia TXT trên trang khác**.

## 10. Dùng Wikidich Autofill

### 10.1. Mở Autofill

Trên trang hỗ trợ:

1. Mở WDU.
2. Chọn một quyển hợp lệ; nút Autofill chỉ được bật sau khi chọn quyển.
3. Bấm **Autofill Thông tin beta**.

Panel **Auto Fill Info** mở ra. Script con chỉ làm việc trên `/nhung-file` hoặc `/chinh-sua`.

### 10.2. Luồng chuẩn

1. Dán URL truyện vào **URL Web Trung**.
2. Bấm **Lấy dữ liệu**.
3. Chờ lấy dữ liệu, dịch và tạo gợi ý xong. Trong lúc chạy, AI/Recompute/Áp vào form bị khóa để tránh áp dữ liệu dở dang.
4. Kiểm tra và sửa các ô trong panel.
5. Nếu đã sửa Tên gốc, văn án gốc, bộ name hoặc từ khóa, bấm **Recompute**.
6. Nếu cần, bấm **AI** ở thanh đầu hoặc **AI thủ công**.
7. Dùng các nút **Chọn** để đối chiếu nhãn Thời đại/Kết thúc/Loại hình/Tag với danh sách thật trên web.
8. Bấm **Loại trừ** nếu có trường không muốn ghi đè.
9. Bấm **Áp vào form**.
10. Trên trang chỉnh sửa, đọc popup so sánh rồi bấm **Áp dụng**.
11. Kiểm tra form web lần cuối trước khi Nhúng/Lưu/Tải lên.

### 10.3. Nguồn được hỗ trợ

| Nguồn | Dạng URL mẫu | Ghi chú | Trang mặc định được phép dùng |
| --- | --- | --- | --- |
| Fanqie/Cà Chua | `https://fanqienovel.com/page/ID` | Metadata đầy đủ, bìa gốc. | WikiCV |
| JJWXC/Tấn Giang | `https://www.jjwxc.net/onebook.php?novelid=ID` | Có API New/Old, bìa và tag. Quét văn án cho gợi ý mặc định đang tắt. | WikiCV |
| PO18 | `https://www.po18.tw/books/ID` | Cần đăng nhập để lấy ổn định. | Web Hồng |
| Ihuaben | `https://www.ihuaben.com/book/ID` | Lấy thông tin và bìa cơ bản. | WikiCV |
| Qidian/Khởi Điểm | `https://www.qidian.com/book/ID` | Có thể gặp captcha từ nguồn. | WikiCV |
| Qimao/Thất Miêu | `https://www.qimao.com/shuku/ID` | Hỗ trợ metadata và xử lý URL bìa. | WikiCV |
| Gongzicp/Trường Bội | `https://www.gongzicp.com/novel-ID` | Bìa HD nếu có và lọc tag. | WikiCV |
| Hải Đường Longma | `https://ebook.longmabook.com/?act=showinfo&...&bookid=...` | Cần đăng nhập Longma; URL phải có `bookid`, có thể kèm `bookwritercode`/`pavilionid`. | Web Hồng |

“Trang mặc định” lấy từ cấu hình nguồn. Có thể đổi trong **⚙ Cài đặt → Cấu hình Nguồn → Hiển thị**:

- **Wikidich**: chỉ cho lấy khi đang ở WikiCV.
- **Webhong**: chỉ cho lấy khi đang ở Web Hồng/Koanchay.
- **Tự động**: cho phép ở cả hai.

Nếu URL đúng nhưng script báo nguồn chỉ dùng ở trang khác, kiểm tra cột **Hiển thị** này.

### 10.4. Ý nghĩa các ô và nút

| Thành phần | Cách dùng |
| --- | --- |
| **Từ khóa bổ sung** | Thêm tín hiệu phân loại, phân cách bằng dấu phẩy, ví dụ `tiên hiệp, HE, hiện đại`; sau đó bấm Recompute. |
| **Bộ name** | Mỗi dòng `chữ gốc=chữ dịch`, ví dụ `张三=Trương Tam`. Được áp khi dịch tiêu đề/văn án. |
| **Tên gốc/Tác giả/Tên dịch** | Dữ liệu lấy và dịch được; có thể sửa tay trước khi áp. |
| **Mở** cạnh tác giả | Mở trang tác giả trên website hiện tại để kiểm tra bằng mắt. |
| **VI/ZH** cạnh mô tả | Chuyển giữa bản dịch Việt và bản gốc Trung; hai bản được giữ riêng. |
| **Cover URL / WxH** | Xem URL, kích thước gốc và kích thước đích. Có thể chọn kích thước trước khi áp bìa. |
| **Tình trạng/Tính chất/Giới tính** | Chọn một nhãn radio tương ứng trên web. |
| **Thời đại/Kết thúc/Loại hình/Tag** | Nhập label cách nhau bằng dấu phẩy hoặc dùng nút **Chọn**. Tag tối đa 25 mục. |
| **Liên kết bổ sung** | Mô tả nguồn và URL nguồn; script áp vào hàng liên kết đầu tiên của form. |
| Dấu **✔/✖** | Trên trang chỉnh sửa: ✔ là panel khớp form hiện tại, ✖ là khác; rê chuột để xem chi tiết. |
| **Recompute** | Dịch/gợi ý lại phần liên quan sau khi người dùng sửa dữ liệu đầu vào. |
| **Loại trừ** | Chọn các trường không được ghi đè khi Áp vào form. |
| **Áp vào form** | Đưa dữ liệu đã duyệt từ panel sang form web; không tự bấm Nhúng. |

## 11. Dịch, bộ name và Recompute

### 11.1. Dịch cơ bản

Khi bấm **Lấy dữ liệu**, script gửi các phần cần dịch tới DichNgay. Nội dung dài được chia thành batch; lỗi batch có thể được tách nhỏ và thử lại. Vì có timeout, mạng chậm có thể làm log báo lỗi thay vì chờ vô hạn.

### 11.2. Bộ name

Định dạng:

```text
张三=Trương Tam
李四=Lý Tứ
长安=Trường An
```

- Mỗi cặp một dòng.
- Sửa bộ name sau khi đã lấy dữ liệu thì bấm **Recompute** để dịch lại tiêu đề và văn án.
- Khi bật **Auto Tách Names** và dùng AI, AI có thể gợi ý tên; script tiếp tục chuẩn hóa/dịch Hán Việt để cách viết ổn định hơn.
- Luôn đọc lại tên riêng, vì máy dịch và AI có thể chọn sai âm hoặc hiểu nhầm danh từ thường thành tên.

### 11.3. Khi nào cần Recompute?

Panel hiện cảnh báo “Đã thay đổi...” khi dữ liệu nguồn đã bị sửa sau lần tính gần nhất. Bấm **Recompute** khi thay đổi:

- Tên gốc.
- Văn án gốc ZH.
- Bộ name.
- Từ khóa bổ sung.
- Các trường phân loại cần tính lại.

Nếu trước đó đã dùng AI và bạn sửa các trường do AI quản lý, Recompute hỏi:

- Dùng lại đề xuất AI.
- Giữ phần bạn vừa sửa tay.

## 12. Gemini AI và AI thủ công

### 12.1. Gemini tự động

Vào **⚙ Cài đặt** của Autofill:

1. Nhập Gemini API Key.
2. Bấm **Lấy Model**.
3. Chọn model phù hợp. Giá trị mặc định trong phiên bản hiện tại là `gemini-3-flash-preview`, nhưng model thực tế còn khả dụng hay không phụ thuộc tài khoản/API tại thời điểm dùng.
4. Chọn chế độ:
   - **Tự động (Keyword)**: lấy dữ liệu xong chỉ gợi ý bằng rule/từ khóa. Muốn dùng Gemini thì bấm nút **AI** thủ công ở thanh đầu.
   - **AI (Ưu tiên)**: sau khi lấy và dịch dữ liệu, tự chạy Gemini nếu đã có API Key.
5. Bật/tắt **Auto Tách Names**, **Tự xuống dòng** và **Check sâu** tùy nhu cầu.

Nút **AI** trên thanh đầu luôn dùng cấu hình Gemini hiện tại. Một số model có thinking mode nên có thể chậm; panel sẽ hiện thời gian đang xử lý.

### 12.2. AI thủ công

Dùng khi không muốn lưu API Key vào script hoặc muốn dùng một AI khác:

1. Phải **Lấy dữ liệu** thành công trước.
2. Bấm **AI thủ công**.
3. Bấm **Copy Prompt**.
4. Dán prompt vào AI bạn chọn.
5. Yêu cầu AI trả đúng JSON theo prompt.
6. Copy JSON.
7. Quay lại popup và bấm **Dán Kết Quả**, hoặc dán trực tiếp bằng `Ctrl+V` khi popup đang mở.

Nếu báo “JSON không hợp lệ”, hãy bỏ dấu ``` bao quanh, lời giải thích và mọi chữ nằm ngoài object JSON rồi thử lại.

## 13. Ảnh bìa

Khi áp Cover URL, script:

1. Tải ảnh từ nguồn.
2. Nếu đã chọn kích thước, resize chính xác về WxH đó.
3. Nếu ảnh lớn hơn 500 KB, thử giảm kích thước/chất lượng để nhẹ hơn.
4. Tạo file `cover.jpg`, `cover.png` hoặc `cover.webp` và gán vào input bìa của web.

Các lựa chọn kích thước:

- **Gốc**: giữ kích thước gốc.
- Preset **560×788**.
- Kích thước tùy chỉnh do người dùng thêm.

Cấu hình được lưu theo nguồn, ví dụ Fanqie có thể dùng kích thước khác PO18. Resize hiện kéo ảnh đúng về WxH, không crop, nên tỷ lệ đích khác tỷ lệ ảnh gốc có thể làm ảnh bị kéo dãn. Hãy kiểm tra preview trên form.

Nếu bìa không gán được:

- Thử mở URL bìa trực tiếp.
- Kiểm tra đăng nhập nguồn.
- Đổi JJWXC New/Old nếu là bìa Tấn Giang.
- Chọn **Gốc** thay cho WxH tùy chỉnh.
- Tải bìa thủ công nếu nguồn chặn request chéo.

## 14. Kiểm tra trùng và cấm nhúng

Chức năng này chủ yếu hoạt động trên `/nhung-file` khi Tên gốc và Tác giả có chữ Hán.

### 14.1. Check trùng cơ bản

Script gọi API check của website theo cặp **Tên gốc + Tác giả**:

- Không thấy trùng: mức an toàn cơ bản hiển thị khoảng 80% trước khi check sâu.
- Server báo trùng: mức an toàn về 0%, hiện cảnh báo.
- Trùng thông thường vẫn cho **Áp vào form** và vẫn có thể **Nhúng**, nhưng khi bấm Nhúng sẽ hỏi xác nhận về quy định nhúng bản mới trước rồi báo cáo xóa bản cũ.

### 14.2. Check sâu

Khi bật **Check sâu**, script còn:

- Mở dữ liệu trang đầu danh sách truyện của tác giả trên domain hiện tại.
- So tên dịch.
- So ảnh bìa bằng hash hình ảnh nếu có.
- Hiện popup nếu nghi trùng để người dùng bấm **Mở**, **Trùng** hoặc **Không trùng**.

Nếu chọn **Không trùng** trong khi tác giả đã có truyện, mức an toàn giữ ở 98% vì script chỉ quét trang đầu và không thể thay việc kiểm tra bằng mắt. 100% chỉ dùng khi trang tác giả không có truyện.

Phần trăm là tín hiệu hỗ trợ, không phải bảo đảm tuyệt đối.

### 14.3. Danh sách cấm nhúng

Script đọc `Danh sách cấm nhúng` và đối chiếu đúng cặp **Tên gốc + Tác giả**.

- Nếu khớp, popup cảnh báo xuất hiện và nút **Nhúng** trên web bị khóa cho đúng cặp đó.
- Nếu người dùng sửa Tên gốc hoặc Tác giả trên form thành cặp khác, script đồng bộ lại trạng thái nút.
- Nếu request danh sách cấm thất bại, log sẽ báo lỗi; không nên xem lỗi mạng là kết luận “không bị cấm”. Hãy mở trang prohibited kiểm tra thủ công.

## 15. Loại trừ và popup so sánh

Trong popup **Loại trừ**, ô được tick nghĩa là trường đó **không được áp vào form**.

- **Tất cả nguồn** là cấu hình nền.
- Chọn một nguồn để tạo ngoại lệ riêng.
- **Dùng theo “Tất cả”** xóa ngoại lệ của nguồn đó.
- Cấu hình của `/nhung-file` và `/chinh-sua` được lưu riêng.

Mặc định an toàn trên trang `/chinh-sua`, các trường sau bị loại trừ để tránh ghi đè dữ liệu quan trọng:

- Tên gốc.
- Tác giả.
- Tên dịch.
- Liên kết bổ sung.
- Ảnh bìa.

Trên `/nhung-file`, mặc định không loại trừ trường nào.

Khi bấm **Áp vào form** ở trang chỉnh sửa, popup diff hiện giá trị cũ và mới. Màu đỏ là phần bỏ đi, màu xanh là phần thêm vào. Popup không tự đóng khi bấm ra ngoài; phải chọn **Áp dụng** hoặc **Hủy**.

## 16. Cài đặt của Autofill

| Tùy chọn | Mặc định | Ý nghĩa |
| --- | ---: | --- |
| Độ chính xác gợi ý | 0,90 | Ngưỡng khớp label, cho phép từ 0,50 đến 0,99. Hạ thấp sẽ nhiều gợi ý hơn nhưng tăng sai. |
| Chế độ AI | Tự động (Keyword) | Rule/từ khóa mặc định; AI ưu tiên chỉ chạy tự động khi có key. |
| Gemini API Key | Trống | Chỉ cần cho Gemini tự động/nút AI. |
| Gemini model | `gemini-3-flash-preview` | Nên bấm Lấy Model để chọn model tài khoản đang dùng được. |
| Auto Tách Names | Bật | Cho AI tách tên nhân vật/địa danh rồi chuẩn hóa. |
| Tự xuống dòng | Tắt | Khi áp văn án dài trên 100 ký tự mà chưa có newline, xuống dòng sau `.。!?！？`. |
| Check sâu | Bật | Quét trang tác giả và so tên/bìa trên trang nhúng. |
| Quét theo nguồn | Tùy nguồn | Quyết định có dùng văn án làm ngữ cảnh gợi ý nhãn; không có nghĩa là bỏ lấy văn án. |
| Gán nhãn theo nguồn | Bật | Thêm dòng `Nhãn: ...` vào văn án trước khi dịch. |
| Hiển thị theo nguồn | WikiCV/Web Hồng | Giới hạn nguồn được dùng trên loại trang nào. |
| Tỷ lệ bìa | Gốc | Lưu riêng cho từng nguồn. |

## 17. Bảng dịch nhanh

Bấm icon hình hội thoại ở thanh đầu Autofill:

1. Chọn chế độ:
   - **Dịch sang Việt**.
   - **Hán Việt**.
   - **Phồn → Giản**.
   - **Giản → Phồn**.
2. Nhập văn bản gốc.
3. Bấm **Dịch nhanh**.
4. Bấm **Copy kết quả** nếu cần.

Công cụ này độc lập với việc áp form, phù hợp để kiểm tra nhanh tên riêng hoặc một đoạn văn án.

## 18. Ba quy trình mẫu

### 18.1. Nhúng truyện mới và upload nhiều chương

1. Vào `/nhung-file`.
2. Mở WDU, chọn quyển đầu tiên hoặc Add New.
3. Mở Autofill, dán URL nguồn, bấm **Lấy dữ liệu**.
4. Kiểm tra tên, văn án, nhãn, bìa, trùng và prohibited.
5. Bấm **Áp vào form**.
6. Quay lại WDU, bấm **Files TXT**, chọn nhiều chương.
7. Xử lý cảnh báo và kiểm tra hàng chương.
8. Bấm **💾 Lưu** để giữ trạng thái tạm.
9. Kiểm tra form rồi bấm **🚀 Tải lên/Nhúng** theo luồng của website.

### 18.2. Bổ sung chương cho truyện có sẵn

1. Vào `/truyen/.../chinh-sua`.
2. Mở WDU, chọn quyển có chữ **(Bổ sung)**.
3. Nếu cần cập nhật metadata, mở Autofill; nhớ rằng một số trường quan trọng đang được loại trừ mặc định.
4. Chọn nhiều TXT.
5. Kiểm tra khoảng chương mà script điền vào mô tả bổ sung, ví dụ `101-120`.
6. Kiểm tra tên/file từng hàng.
7. Bấm **🚀 Tải lên**.

### 18.3. Chia ebook TXT rồi lưu về máy

1. Mở menu Tampermonkey → **📚 Chia 1 file TXT**.
2. Chọn TXT nguồn.
3. Kiểm tra số chương và chiến lược chia ở thanh tiêu đề modal.
4. Sửa tiêu đề/nội dung, gộp hoặc xóa chương lỗi.
5. Cấu hình Mở đầu, Credit và regex nếu cần.
6. Bấm **💾 Lưu về** → **Tải ZIP**.

## 19. Lỗi thường gặp

### Không thấy icon WDU

- Kiểm tra URL phải đúng `/nhung-file` hoặc kết thúc bằng `/chinh-sua` trên `wikicv.org`.
- Kiểm tra script đang bật.
- Tải lại trang bằng `Ctrl+F5`.
- Kiểm tra Console nếu giao diện web vừa thay đổi DOM.

### Nút Files TXT/Autofill bị mờ

- Chưa chọn quyển.
- Quyển được đánh dấu **Không thể bổ sung**.
- Quyển vừa bị xóa/đổi khiến lựa chọn cũ không còn hợp lệ; chọn lại.

### Chọn một file nhưng không upload ngay

Đây là hành vi thiết kế: đúng một TXT luôn mở trình **Chia TXT**. Nếu đó thực sự là một chương, kiểm tra modal chỉ có một mục rồi bấm **Gán vào web**.

### Tên chương bị sai hoặc rỗng

- Kiểm tra tên file/dòng đầu theo mục 5.2.
- Đổi **Ưu tiên lấy thông tin từ**.
- Dùng chế độ **File tên số, dùng dòng đầu** nếu muốn lấy nguyên dòng đầu.
- Kiểm tra bảng mã; chữ Trung bị mojibake sẽ làm parser thất bại.
- Sửa thủ công trên form trước khi tải lên.

### Thiếu hàng hoặc file chưa được gán

- Chờ toast hoàn tất, nhất là khi có hàng trăm file.
- Đọc log xem số hàng nhập liệu có khớp số file không.
- Kiểm tra các hàng trống mà script báo.
- Tải lại trang, chọn lại quyển và thử theo lô nhỏ hơn.

### Bấm Tải lên nhưng script không tìm thấy nút thật

Script hiện nhấn nút **Tải lên**. Nếu website đổi giao diện/ID, cần upload thủ công hoặc báo ad cập nhật script.

### Autofill báo URL không hợp lệ

- Dùng URL trang chi tiết truyện, không dùng URL chương, tìm kiếm hoặc trang tác giả.
- Kiểm tra nguồn có nằm trong bảng hỗ trợ.
- Với Longma, URL phải có `bookid`.
- Kiểm tra cột **Hiển thị** của nguồn.

### Lấy dữ liệu bị lỗi

- Đăng nhập nguồn nếu PO18/Longma.
- Qidian có thể yêu cầu giải captcha trên trang nguồn.
- Thử lại sau nếu nguồn giới hạn request.
- Với JJWXC, đổi nút **New/Old** cạnh URL rồi lấy lại.
- Kiểm tra quyền cross-origin của Tampermonkey.

### Dịch bị timeout hoặc kết quả thiếu

- Thử lại khi mạng ổn định.
- Văn án quá dài có thể cần nhiều batch.
- Kiểm tra log xem lỗi ở tiêu đề, mô tả, tag hay thể loại.
- Có thể sửa tay hoặc dùng bảng dịch nhanh cho phần bị thiếu.

### AI không chạy

- Phải Lấy dữ liệu trước.
- Kiểm tra API Key.
- Bấm **Lấy Model** và chọn model đang khả dụng.
- Nếu không muốn dùng key, dùng **AI thủ công**.

### Cover không hiện

- URL ảnh hết hạn/chặn hotlink.
- Chưa đăng nhập nguồn.
- File sau tối ưu vẫn không phù hợp web.
- Chọn lại ảnh bìa thủ công trên form.

### Snapshot khôi phục nhưng thiếu file

File đã vượt quota/khoảng 10 MB, IndexedDB bị dọn hoặc snapshot được tạo ở môi trường trình duyệt khác. Chọn lại file từ ổ đĩa; không coi snapshot là bản backup duy nhất.

## 20. Dữ liệu, quyền riêng tư và lưu ý an toàn

- Dữ liệu dịch được gửi tới `dichngay.com`.
- Khi dùng Gemini tự động, dữ liệu prompt được gửi tới Google Generative Language API.
- Khi dùng AI thủ công, dữ liệu được gửi tới nhà cung cấp AI mà bạn tự dán prompt vào.
- URL và metadata được lấy từ các website nguồn đã nêu.
- Check trùng/cấm dùng endpoint của WikiCV và trang tác giả hiện tại.
- Gemini API Key và cấu hình Autofill được lưu trong vùng lưu trữ của Tampermonkey trên trình duyệt. Không chia sẻ ảnh chụp màn hình có lộ key.
- Snapshot và file được giữ cục bộ trong GM storage/IndexedDB của trình duyệt, trong giới hạn quota.
- Script tự động hóa thao tác nhưng không thể xác minh nội dung, bản quyền, quy định nguồn hay độ chính xác dịch. Người dùng vẫn phải đọc lại và chịu trách nhiệm trước khi Nhúng/Tải lên.
- Không bấm **Xóa**, **Khôi phục**, **Nhúng** hoặc **Tải lên** khi chưa kiểm tra đúng truyện, đúng quyển và đúng tài khoản.

## 21. Checklist trước khi bấm tải lên

- [ ] Đúng website và đúng truyện.
- [ ] Đúng quyển; không nhầm quyển cũ/quyển bổ sung.
- [ ] Số chương và thứ tự chương đúng.
- [ ] Không còn hàng thiếu tên hoặc thiếu file.
- [ ] Đã xử lý encoding, emoji, zero-width và ký tự dễ lỗi.
- [ ] Khoảng chương bổ sung đúng.
- [ ] Tên gốc, tác giả, tên dịch và văn án đúng.
- [ ] Nhãn phân loại đã đối chiếu với danh sách thật của web.
- [ ] Ảnh bìa đúng truyện và không méo.
- [ ] Đã kiểm tra cảnh báo trùng và danh sách cấm nhúng.
- [ ] Đã tạo bản lưu nếu form có nhiều dữ liệu quan trọng.
- [ ] Đã kiểm tra lại form web sau khi script gán dữ liệu.
