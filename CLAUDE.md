# Luật edit video BĐS – Lâm Oanh Vinhomes

## Thông tin chung
- Người xem: khách mua nhà, nhà đầu tư 25–55 tuổi
- Ngôn ngữ: tiếng Việt, giọng miền Bắc
- Định dạng mặc định: dọc 9:16, 1080x1920, 30fps, dài khoảng 60 giây
- Luôn trả lời tôi bằng tiếng Việt, dễ hiểu

## Phong cách học từ video tham khảo (thamkhao/)
<!-- Chưa phân tích được: 4 video mẫu trên Drive đều > 10 MB. Sẽ điền sau. -->
- Nhịp cắt cảnh: [... giây/cảnh]
- Kiểu phụ đề: [font, màu, vị trí, số chữ mỗi dòng]
- 3 giây đầu: [...]
- Kết thúc: [...]

## Cắt ghép
- Cắt hết khoảng lặng dài hơn 0,4 giây và các tiếng "à, ừ, ơ"
- Cắt bỏ câu nói vấp, giữ lần nói cuối cùng
- Mỗi cảnh theo kịch bản quay sẵn (goc/); nói xong thì chèn ảnh phối cảnh /
  flycam trong tainguyen/ đè lên
- 3 giây đầu phải có câu "móc" + chữ to giữa màn hình

## Phụ đề
- Font: Be Vietnam Pro, đậm, chữ trắng viền đen
- Vị trí: 1/3 dưới màn hình, không che mặt, tránh vùng nút của TikTok
- Tối đa 2 dòng, 7 chữ mỗi dòng
- Tô màu vàng #FFD400 cho con số: giá, diện tích, % chiết khấu, khoảng cách
- Viết đúng tên riêng: Vịnh Xanh, Ocean City, cá Koi, Mega Grand World,
  Vincom, Vinmec, Vinschool, pickleball, Lâm Oanh, Đức Thắng

## Màu và thương hiệu
- Màu chủ đạo: xanh ngọc, phụ: vàng kim
- Logo: tainguyen/logo.png ("LOGO V3 XANH.png" trên Drive), góc trên phải, độ trong 80%
- Màu hình: sáng, ấm, hơi tăng độ bão hòa cho cảnh xanh và biển

## Nhạc
- Nhạc nền dễ viral, âm lượng thấp (khoảng -20 dB) để nghe rõ lời
- Tự giảm nhạc khi có tiếng nói
- Nhạc trend có bản quyền: Claude không tự tải; chèn trong app TikTok/Reels lúc
  đăng, hoặc dùng file nhạc bạn đặt trong tainguyen/nhac/

## Motion graphic (Remotion)
- Khung thông tin giá / diện tích trượt vào từ trái, hiện 2–3 giây
- Không dùng hiệu ứng lòe loẹt, giữ cảm giác sang trọng

## Kết thúc
- 3 giây cuối: Lâm Oanh + số điện thoại 0346032032 + câu kêu gọi
  "Lâm Oanh – Liên hệ trực tiếp từ văn phòng bán hàng CĐT Vinhomes"

## Quy trình làm việc
- Trước khi render: gửi storyboard (bảng từng cảnh: giây, hình, phụ đề, hiệu ứng) để tôi duyệt
- Xuất bản xem thử 720p trước, tôi đồng ý mới xuất 1080p
- Không bao giờ xóa hay ghi đè file trong thư mục goc trên Drive
- Kiểm tra chính tả phụ đề, đặc biệt con số và tên dự án

## Thư mục (Google Drive ↔ máy làm việc)
| Thư mục | Nội dung | Drive |
|---|---|---|
| goc/ | Video quay gốc theo kịch bản, chỉ đọc | https://drive.google.com/drive/folders/14gw2oFTLhgr9mPxZrlOs9IyQpGZGfu3Z |
| thamkhao/ | Video mẫu để học phong cách, không lấy tiếng | https://drive.google.com/drive/folders/1z2TE0q7mBhPG7aD3lgo-mgePfQkTa_3q |
| tainguyen/ | Logo, nhạc, ảnh phối cảnh, flycam | https://drive.google.com/drive/folders/1dyJLAyJqh_DY4xYqH_r1Hh1Isr_tnDLJ |
| out/ | Video xuất ra | https://drive.google.com/drive/folders/1lZgsd4vhLsFb7WK4jYEY9G1xpR61AyF_ |

- public/: file dùng trong Remotion
- goc/, tainguyen/, thamkhao/ không đưa lên GitHub (file nặng)

## Công cụ (ghi chú kỹ thuật cho Claude)
- Tải từ Drive: dùng công cụ Google Drive, giới hạn 10 MB mỗi file; file lưu dạng
  base64 JSON → giải mã ra video.
- Phụ đề: `npm run phude -- <file>` (faster-whisper large-v3-turbo, tiếng Việt)
  → ra .srt và .json. Luôn rà và sửa .json trước khi dựng. Lỗi hay gặp:
  "bí cà bôn" → pickleball, "dư căn" → giữ căn. Thêm tên mới vào GOI_Y
  trong scripts/phude.py.
- Remotion: mẫu ở src/BatDongSan.tsx, đặt thông số trong src/Root.tsx.
  Xem thử: `npm run dev` · Bản xem thử 720p: `npm run render:720`
  · Bản chính 1080p: `npm run render`
- Font: Be Vietnam Pro đóng gói sẵn (src/fonts.ts), không cần mạng.
- FFmpeg tự giảm nhạc khi có tiếng nói: dùng bộ lọc `sidechaincompress`
  (lời nói điều khiển âm lượng nhạc).
- Cắt khoảng lặng: dùng thời gian từng chữ trong file .json của Whisper
  để tìm chỗ ngắt dài hơn 0,4 giây.
- Trên máy cloud: chạy Remotion với `NODE_USE_ENV_PROXY=1`.
