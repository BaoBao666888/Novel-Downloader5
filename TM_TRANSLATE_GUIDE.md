# 🌸 Hướng dẫn TM Translate

> Dành cho **TM Translate v3.5.5.19_beta**.
>
> 🌐 Dịch trang · 📚 Thư viện · ✏️ Edit Name · 📷 OCR · 🔊 TTS

TM Translate giúp dịch trang truyện Trung → Việt, sửa Name, lưu truyện vào Thư viện, đọc bằng Reader, OCR ảnh và nghe TTS. Phần đầu là cách dùng nhanh. Giải thích kỹ hơn được gom xuống cuối.

## 1. 🚀 Bắt đầu nhanh

### 📥 Cài đặt

1. Cài Tampermonkey hoặc Violentmonkey cho trình duyệt.
2. Mở [TM Translate.user.js](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/TM%20Translate.user.js) và chọn **Cài đặt**.
3. Mở lại trang truyện. Các nút của TM Translate sẽ xuất hiện ở mép màn hình.

Xem thêm [yêu cầu cài đặt](README.md#cài-đặt). Trên Android có thể thử [Quetta Browser](https://play.google.com/store/apps/details?id=net.quetta.browser).

### 🌐 Dịch một trang web

1. Mở trang cần đọc.
2. Bấm **Dịch Trang**.
3. Nếu trang tải thêm nội dung khi cuộn, bật **Tự động dịch khi cuộn** trong Cài đặt.

Bấm **Quay về** để khôi phục trang gốc. Bản 3.5.5.16 giữ nguyên ảnh, icon và bố cục của các link phức tạp trên trang mobile. Chữ hoa mà server dịch đúng cũng được giữ nguyên.

### 📚 Import và đọc một bộ truyện

1. Bấm **Thư viện** → **Import**.
2. Chọn file TXT, EPUB, ZIP, DOCX/DOC, RTF, ODT hoặc HTML.
3. Chọn ngôn ngữ:
   - **RAW Trung**: script dịch khi đọc hoặc xuất.
   - **Tiếng Việt**: đọc trực tiếp, không gửi dịch lại.
4. Chọn nơi lưu rồi bấm **Tiếp tục**.
5. Giữ **Tùy chỉnh trước khi nhập** nếu muốn xem và sửa thông tin/chương. Bỏ chọn để nhập nhanh theo mặc định.

Truyện vừa import hoặc vừa đọc sẽ nằm đầu Thư viện. Bấm **Mở** để vào trang Thông tin. Nếu đã đọc dở, script mở tiếp vị trí gần nhất.

## 2. 🧭 Các nút chính

- 🟢 **Dịch Trang:** dịch nội dung trang hiện tại.
- 🟩 **Thư viện:** import, đọc, chỉnh sửa, xuất và sao lưu truyện.
- 🔵 **Edit Name / Bút chì:** bật chế độ sửa tên Trung → Việt trên trang.
- ⚪ **Dịch Nhanh:** dán một đoạn văn để dịch riêng.
- 📷 **OCR:** nhận dạng và dịch chữ trong ảnh.
- ⚫ **Style:** chỉnh giao diện đọc rút gọn của trang web.
- 🟡 **Quay về:** trả trang về nội dung gốc.

Có thể ẩn/hiện và sắp xếp các nút trong **Cài đặt**. Trên điện thoại, các thanh công cụ dài có thể vuốt ngang.

## 3. ✏️ Dịch trang và Edit Name

### 🖊️ Sửa một Name trên trang

1. Bật **Edit Name**. Nút bút chì sẽ có màu xanh.
2. Bôi đen tên hoặc cụm tiếng Việt cần sửa.
3. Bấm **Bút chì**, kiểm tra cặp Trung/Việt rồi lưu.

**Dự đoán cụm Trung/Việt beta** tự bật cùng Edit Name. Nó dùng dấu câu, Name đã biết, ký tự Latin và Hán-Việt để tìm cụm gọn hơn. Có thể tắt ngay trong hộp Edit Name nếu kết quả chưa phù hợp. Khi đó script dùng nguyên khối Trung và Việt tương ứng.

Khi Edit Name tắt, script không tạo thêm thẻ hay title để đánh dấu Name. Hộp đang sửa không tự đóng khi bấm ra ngoài. Nếu đã thay đổi mà bấm Đóng/Hủy, script sẽ hỏi trước khi bỏ.

### 🗂️ Name Chung và Name Riêng

- **Name Chung:** dùng lại cho nhiều trang hoặc nhiều truyện. Có thể tạo nhiều bộ và chọn nhiều bộ cùng lúc.
- **Name Riêng:** chỉ thuộc một truyện, tự xóa khi xóa truyện.
- Trong Reader, Name mới mặc định lưu vào **Name Riêng**. Bạn vẫn có thể chọn một **Name Chung đang áp dụng** để lưu.
- Khi trùng cụm, thứ tự ưu tiên là **Name Riêng → Name Chung → bản dịch thường**.

Name đang áp dụng cũng được dùng cho tên truyện, tác giả, mô tả, nội dung Reader và file xuất.

## 4. 📚 Thư viện

### 💾 Chọn nơi lưu khi import

- **Tampermonkey:** dễ dùng giữa nhiều website. Hợp với thư viện nhỏ hoặc vừa, nhưng dung lượng an toàn có giới hạn.
- **Thiết bị này:** hợp với truyện lớn hoặc nhiều truyện. Dữ liệu nằm trong IndexedDB/OPFS của website đang mở, nên phụ thuộc domain, trình duyệt và dữ liệu website.

> 💡 **Chọn nhanh:** ít truyện và hay đổi website → **Tampermonkey**. Nhiều truyện hoặc file rất lớn → **Thiết bị này**.

Nếu truyện lưu ở **Thiết bị này** mà bạn mở từ domain khác, script sẽ mở tab đúng domain rồi tiếp tục thao tác. Hãy sao lưu định kỳ dù chọn cách nào.

Import file lớn sẽ dựng giao diện chờ trước rồi xử lý dần ở nền. Không đóng tab khi còn báo đang nhập. Nếu đang tùy chỉnh dở, script sẽ hỏi trước khi thoát.

### ℹ️ Trang Thông tin

Trang đầu của truyện gồm bìa, tên, tác giả, mô tả, link bổ sung, mục lục và các nút:

- **Đọc ngay / Đọc tiếp**
- **BN** để chọn hoặc sửa Bộ Name
- **Chỉnh sửa**
- **Xuất file...**

Tên tác giả Trung được phiên âm Hán-Việt và viết hoa. Văn án, tên truyện và tác giả RAW vẫn có thể sửa trong **Chỉnh sửa**.

### 📖 Reader

Reader ghi nhớ chương và vị trí đọc. Thanh công cụ có:

- **Thông tin**, **Mục lục**, **BN**
- **RAW / DỊCH**
- **Cài đặt**, **TTS**, **Thoát**

Bôi đen nội dung để mở các thao tác **Phát**, **Sửa tên/Thay thế từ**, **Xóa rác** và **Sao chép**. Khi sửa Name, script chỉ cập nhật các đoạn bị ảnh hưởng và cố giữ nguyên vị trí đang đọc.

Trên điện thoại, vuốt ngang thanh công cụ thay vì để các nút che nội dung. Nút ở cuối chương dùng để chuyển chương. Tiến độ đọc được lưu tự động.

### 🛠️ Chỉnh sửa truyện

Mục **Chỉnh sửa** cho phép:

- Đổi tên truyện, tác giả, mô tả, bìa và link bổ sung.
- Chuyển loại nội dung giữa **RAW Trung** và **Tiếng Việt**.
- Sửa RAW/text của từng chương.
- Thêm, xóa, đổi tên hoặc sắp xếp chương.
- Chia lại chương bằng regex, xem preview và đặt số ký tự tối đa.

Các trường tên/tác giả/mô tả là text gốc. Nếu truyện là RAW, sau khi sửa script sẽ dịch lại khi cần. Popup không đóng khi bấm ra ngoài. Thay đổi chưa lưu luôn được cảnh báo trước khi thoát.

### 🏷️ Bộ Name của truyện

Bấm **BN** trong trang Thông tin hoặc Reader để:

- Chọn một hay nhiều Bộ Name Chung.
- Thêm, sửa, xóa Name Riêng.
- Nhập file, nhập text hoặc xuất JSON/TXT.
- Phân tích Name từ nội dung truyện RAW Trung.

Name Riêng luôn được ưu tiên trước các bộ Chung đã chọn.

#### ✨ Phân tích Name tự động

Tự động nhận diện tên nhân vật, địa danh và tổ chức trong truyện, giúp tạo danh sách Name nhanh chóng.

**Cách sử dụng:**

1. Mở truyện → **BN** → **Phân tích Name**.
2. Chọn phạm vi chương, độ dài Name và tần suất xuất hiện.
3. Chọn một hoặc nhiều engine phân tích:
   - **LAC Local (Khuyên dùng):** Chạy trực tiếp trên thiết bị, cần tải model khoảng 29 MB lần đầu.
   - **BERT Mini Local:** Nhận diện bằng AI, chạy trên thiết bị, cần tải model khoảng 12,6 MB cùng các thành phần hỗ trợ.
   - **TexSmart:** Dịch vụ trực tuyến của Tencent, cần kết nối mạng.
   - **HanLP (Thử nghiệm):** Dịch vụ trực tuyến, hỗ trợ API key tùy chọn. Có giới hạn lượt gọi, không khuyến khích sử dụng thường xuyên.
4. Nhấn **Bắt đầu phân tích** và chờ kết quả.
5. Lọc, chỉnh sửa hoặc chọn bản dịch gợi ý, sau đó nhấn **Thêm Name**.
6. Quay lại trang BN và nhấn **Lưu & áp dụng**.

**Thiết lập mặc định:** Quét 50 chương đầu, tìm Name dài 2–12 chữ Hán, xuất hiện ít nhất 5 lần và bỏ qua Name đã có. Bạn có thể tùy chỉnh theo nhu cầu.

**Lưu ý:**
- LAC và BERT xử lý trên thiết bị, không gửi nội dung truyện ra ngoài.
- TexSmart và HanLP cần gửi nội dung chương được chọn tới dịch vụ tương ứng.
- Có thể kết hợp nhiều engine. Nếu một engine gặp lỗi, các engine còn lại vẫn tiếp tục hoạt động.
- Model đã tải được lưu lại để sử dụng lần sau và có thể xóa trong phần cài đặt phân tích.
- Kết quả và bản dịch gợi ý có thể chỉnh sửa trước khi lưu.

Xem [giấy phép và thông tin bên thứ ba](THIRD_PARTY_NOTICES.md).

### 📤 Xuất file

Bấm **Xuất file...**, sau đó chọn:

- Định dạng **TXT**, **EPUB** hoặc **HTML**.
- Phạm vi: toàn bộ, chương hiện tại, từ chương hiện tại hoặc khoảng chương.
- Với RAW: bật/tắt **Dịch khi xuất**.
- Với EPUB: chọn **EPUB 2** hoặc **EPUB 3**.

Khi sửa chỉ số đầu/cuối, phạm vi tự chuyển sang **Khoảng chương đang chọn**. TXT có tên sách, tác giả và mô tả trước nội dung. EPUB/HTML có trang Thông tin. Bìa đã chỉnh được dùng khi xuất. EPUB 2 thường tương thích máy đọc sách cũ tốt hơn, EPUB 3 phù hợp ứng dụng đọc mới.

Reader và file xuất dùng cùng cách xử lý Name: cụm dài như `沈庄园=Thẩm trang viên` không bị `沈庄=Thẩm Trang` ghi đè. Name chữ thường như `云乡酒店=khách sạn Vân Hương` thành `Khách sạn Vân Hương` ở đầu câu/đầu dòng. Chữ hoa đầu Name có sẵn không bị hạ xuống.

Trong lúc dịch để xuất, request được gửi chậm và tự giãn thêm khi lỗi. Không nên đóng tab cho tới khi file tải xong.

### 🛡️ Sao lưu và khôi phục

- **Sao lưu** tạo file `.tmbackup.jsonl` chứa dữ liệu truyện mà tab hiện tại truy cập được.
- **Khôi phục** nhập lại file sao lưu.
- Truyện lưu ở domain khác có thể bị bỏ qua và sẽ có cảnh báo rõ.

Nên sao lưu trước khi xóa dữ liệu website, đổi trình duyệt, đổi profile hoặc sửa một thư viện lớn.

## 5. 📷 OCR ảnh

1. Bấm **OCR**.
2. Chọn **Khoanh vùng** để quét một khu vực màn hình, hoặc **Dịch ảnh** để chọn ảnh.
3. Kiểm tra kết quả Trung/Việt rồi chèn, sao chép hoặc dịch tiếp.

Nguồn ảnh, cách hiển thị và model OCR nằm trong **Cài đặt → OCR**. Lần đầu dùng có thể cần chờ tải model.

## 6. 🔊 TTS

Trong Reader, bôi đen vị trí bắt đầu rồi chọn **Phát**, hoặc mở nút **TTS**. Mini-player có Phát/Tạm dừng, Tiếp, Dừng và hẹn giờ ngủ.

Bạn có thể chọn Browser, TikTok, Google, Gemini, Bing hoặc Zalo trong **Cài đặt → TTS**. Nếu muốn tự sang chương, bật cả **Tự qua đoạn/chương** và **Tự đọc chương kế**.

Xem thêm [hướng dẫn TTS Reader](https://github.com/BaoBao666888/Novel-Downloader5/blob/main/tools/HUONG_DAN_SU_DUNG_TTS_READER.md).

## 7. ⚙️ Cài đặt

- **Bộ Tên:** tạo, chọn, nhập và xuất Name Chung.
- **Chung:** nút nổi, tự dịch khi cuộn, giao diện và hành vi dịch.
- **Thư viện:** Reader, màu sắc, font, sao lưu tự động và tùy chọn đọc.
- **TTS:** giọng, tốc độ, nguồn đọc và tự chuyển đoạn/chương.
- **OCR:** chế độ quét, nguồn ảnh và model.
- **Nâng cao:** server dịch, độ trễ, giới hạn ký tự và retry.

Trên phone, popup Cài đặt dùng bố cục cuộn. Nếu chưa thấy một mục, vuốt tab ngang hoặc cuộn xuống.

## 8. 🩹 Lỗi thường gặp

### 🌐 Bấm Dịch nhưng thiếu đoạn hoặc sai bố cục

- Chờ trang tải xong rồi bấm **Dịch Trang** lại.
- Bật tự dịch khi cuộn nếu website tải nội dung động.
- Bấm **Quay về** rồi dịch lại nếu trang đã bị extension khác sửa trước.

### 🏷️ Name không áp dụng đúng

- Kiểm tra đúng Bộ Name Chung đã được chọn cho truyện.
- Kiểm tra Name Riêng vì bộ này có ưu tiên cao hơn.
- Xóa cache dịch của truyện rồi mở lại nếu cache quá cũ.

### ⏳ Import hoặc xuất file lớn có vẻ đứng

Hãy chờ dòng trạng thái tiến trình. File EPUB/ZIP lớn cần thời gian giải nén và chia chương. Không tải lại trang khi popup còn báo đang xử lý.

### 🖼️ Máy đọc sách không hiện bìa

Xuất lại EPUB bằng bản mới. Script dùng JPEG cho bìa cần tối ưu và tự chuyển bìa WebP cũ sang JPEG. Nếu thiết bị cũ, nên chọn EPUB 2.

### 🚨 Tampermonkey báo “Message exceeded maximum allowed size of 64MiB”

Xem phần cứu dữ liệu bên dưới. Không cần xóa script hay xóa truyện trước.

## 9. 🔧 Thông tin nâng cao

### 📦 Dung lượng lưu trữ

Kho Tampermonkey được nén tự động. Script cảnh báo khoảng 36 MiB, dọn cache dịch từ khoảng 42 MiB và ngăn ghi thêm trước vùng an toàn 50 MiB. Đây là giới hạn an toàn để tránh message 64 MiB, không phải quota thật của trình duyệt.

**Thiết bị này** dùng IndexedDB và ưu tiên OPFS cho nội dung lớn. Dung lượng không vô hạn: nó phụ thuộc ổ đĩa, quota của trình duyệt, domain và profile. Xóa dữ liệu website có thể xóa luôn truyện local.

Index nhẹ vẫn nằm trong Tampermonkey để bạn nhìn thấy danh sách truyện từ các domain. Nội dung local chỉ đọc được ở domain đã lưu, nên script dùng cơ chế mở nhanh sang đúng trang.

### 🛟 Cứu kho Tampermonkey đã vượt 64 MiB

1. Mở **Tampermonkey Dashboard → Settings**.
2. Đổi **Config mode** sang **Advanced**.
3. Tìm **Content Script API** và chọn **UserScripts API Dynamic**.
4. Reload đúng một tab có TM Translate, chờ thanh chuyển đổi dữ liệu hoàn tất.
5. Sau khi vào Thư viện bình thường, có thể đổi Content Script API về lựa chọn cũ.

Lần chuyển đổi đầu sẽ nén dữ liệu cũ. Không đóng tab giữa chừng.

### 🗃️ File import và bìa

- ZIP có thể chứa TXT, EPUB, Word, RTF, ODT, HTML hoặc ZIP lồng.
- DOCX/ODT/HTML thường giữ cấu trúc tốt hơn DOC cũ. File DOC nhị phân quá lạ có thể cần lưu lại thành DOCX hoặc TXT.
- EPUB có bìa nhúng sẽ dùng bìa đó. Bìa lớn được giảm tối đa khoảng 720×1080 và lưu JPEG để tương thích máy đọc sách.

### ⏱️ Dịch khi xuất

Nếu delay đã thấp hơn 800 ms, xuất RAW dùng tối thiểu 800 ms giữa hai request. Khi request lỗi, script tăng thời gian chờ dần tới giới hạn. Sau khi server ổn định, nhịp gửi trở về mức xuất bình thường.

## 10. 📝 Thay đổi gần đây

### ✨ v3.5.5.19_beta

- Thêm BERT Mini Local trong Worker và HanLP REST thử nghiệm với API key tùy chọn. HanLP chỉ để thử nghiệm/nghiên cứu, không khuyến khích dùng thực tế. Giữ LAC và TexSmart, không tự bật engine online.
- Chuẩn hóa PER/LOC/ORG, cho Name dài tối đa 12 ký tự Hán và chia đầu vào theo từng engine.
- Thêm hàng đợi HanLP dùng chung GM storage, giữ nhịp tối đa 2 lần/phút và dừng khi hết quota.
- Thêm mirror Drive có kiểm tra SHA-256 cho LAC/BERT. Rà lại ghi nhận license, bỏ thông tin môi trường máy và dấu chấm phẩy trong văn bản hướng dẫn/UI.
- Sửa model LAC đổi SHA-256, ghim revision, phục hồi Worker lỗi và tách lỗi engine/gợi ý khỏi kết quả còn lại.
- Gỡ IBM demo, dùng LAC mặc định cho cấu hình mới. Giữ TexSmart tùy chọn và báo lỗi dịch vụ rõ ràng.
- Đồng bộ Name dài/ngắn và viết hoa đầu câu giữa Edit Name, Reader, TXT, EPUB 2/3 và HTML.
- Bổ sung AGPL-3.0 và ghi nhận nguồn/license bên thứ ba.

### 📦 v3.5.5.17_beta - v3.5.5.18_beta

- Thêm Phân tích Name trong BN, phạm vi/tần suất/loại NER, gợi ý dịch và duyệt trước khi thêm Name Riêng.
- Thêm LAC Local thật bằng Web Worker, kiểm tra/cache model theo domain và nút xóa model.

### ✨ v3.5.5.16_beta

- Sửa dịch trang mobile làm mất ảnh/thẻ con trong link có bố cục và chặn link chữ dài tràn ngang.
- Không còn tự hạ chữ hoa mà DichNgay/server đã trả đúng, ví dụ giữ `Troy` sau dấu nháy.

### 📦 v3.5.5.13_beta – v3.5.5.15_beta

- Hoàn thiện export, import file lớn/ZIP, Reader và Edit Name.
- Thêm nén kho Tampermonkey, cảnh báo dung lượng, lưu IndexedDB/OPFS theo domain và bìa JPEG tương thích máy đọc sách.
