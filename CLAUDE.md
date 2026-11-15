# Luật edit video BĐS – Lâm Oanh Vinhomes

## Thông tin chung
- Người xem: khách mua nhà, nhà đầu tư 25–55 tuổi
- Ngôn ngữ: tiếng Việt, giọng miền Bắc
- Định dạng mặc định: dọc 9:16, 1080x1920, 30fps, dài khoảng 60 giây
- Luôn trả lời tôi bằng tiếng Việt, dễ hiểu

## Phong cách học từ video tham khảo (thamkhao/)
<!-- Chưa có video. Sẽ điền sau khi phân tích: -->
- Nhịp cắt cảnh: [... giây/cảnh]
- Kiểu phụ đề: [font, màu, vị trí, số chữ mỗi dòng]
- 3 giây đầu: [...]
- Kết thúc: [...]

## Cắt ghép
- Cắt hết khoảng lặng dài hơn 0,4 giây và các tiếng "à, ừ, ơ"
- Cắt bỏ câu nói vấp, giữ lần nói cuối cùng
- Mỗi cảnh theo kịch bản quay sẵn; nói xong thì chèn ảnh phối cảnh / flycam
  trong thư mục tainguyen/ đè lên
- 3 giây đầu phải có câu "móc" + chữ to giữa màn hình

## Phụ đề
- Font: Be Vietnam Pro, đậm, chữ trắng viền đen
- Vị trí: 1/3 dưới màn hình, không che mặt, tránh vùng nút của TikTok
- Tối đa 2 dòng, 7 chữ mỗi dòng
- Tô màu vàng #FFD400 cho con số: giá, diện tích, % chiết khấu, khoảng cách
- Viết đúng tên riêng: Vinhomes Green Paradise, Vinhomes Hạ Long Xanh, ...

## Màu và thương hiệu
- Màu chủ đạo: xanh ngọc, phụ: vàng kim
- Logo: tainguyen/logo.png, góc trên phải, độ trong 80%
- Màu hình: sáng, ấm, hơi tăng độ bão hòa cho cảnh xanh và biển

## Nhạc
- Nhạc nền từ tainguyen/nhac/, âm lượng thấp (khoảng -20 dB) để nghe rõ lời
- Tự giảm nhạc khi có tiếng nói

## Motion graphic (Remotion)
- Khung thông tin giá / diện tích trượt vào từ trái, hiện 2–3 giây
- Không dùng hiệu ứng lòe loẹt, giữ cảm giác sang trọng

## Kết thúc
- 3 giây cuối: Lâm Oanh + số điện thoại 0346032032 + câu kêu gọi
  "Lâm Oanh – Liên hệ trực tiếp từ văn phòng bán hàng CĐT Vinhomes"

## Quy trình làm việc
- Trước khi render: gửi storyboard (bảng từng cảnh: giây, hình, phụ đề, hiệu ứng) để tôi duyệt
- Xuất bản xem thử 720p trước, tôi đồng ý mới xuất 1080p
- Không bao giờ xóa hay ghi đè file trong goc/
- Kiểm tra chính tả phụ đề, đặc biệt con số và tên dự án

## Thư mục
- goc/: video quay gốc (chỉ đọc, không sửa)
- thamkhao/: video mẫu để học phong cách
- tainguyen/: logo, nhạc, ảnh phối cảnh, flycam
- public/: file dùng trong Remotion · out/: video xuất ra

## Công cụ (ghi chú kỹ thuật cho Claude)
- Phụ đề: `npm run phude -- <file>` (faster-whisper large-v3-turbo, tiếng Việt)
  → ra .srt và .json. Whisper hay nghe nhầm thuật ngữ BĐS ("view" → "lưu",
  "mét vuông" → "m vùng"), nên luôn rà và sửa .json trước khi dựng.
  Thêm tên dự án vào GOI_Y trong scripts/phude.py.
- Remotion: mẫu ở src/BatDongSan.tsx, đặt thông số trong src/Root.tsx.
  Xem thử: `npm run dev` · Xuất: `npm run render`
  · Bản xem thử 720p: `npm run render:720`
- Font: Be Vietnam Pro đóng gói sẵn (src/fonts.ts), không cần mạng.
- FFmpeg tự giảm nhạc khi có tiếng nói: dùng bộ lọc `sidechaincompress`
  (lời nói điều khiển âm lượng nhạc).
- Cắt khoảng lặng: dùng thời gian từng chữ trong file .json của Whisper
  để tìm chỗ ngắt dài hơn 0,4 giây.
- Trên máy cloud: chạy Remotion với `NODE_USE_ENV_PROXY=1`.
