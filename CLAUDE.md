# Luật edit video BĐS – Lâm Oanh Vinhomes

## Thông tin chung
- Người xem: khách mua nhà, nhà đầu tư 25–55 tuổi
- Ngôn ngữ: tiếng Việt, giọng miền Bắc
- Định dạng mặc định: ngang 16:9, 1920x1080, 60fps, dài 60 giây – hơn 1 phút 30 giây
- Luôn trả lời tôi bằng tiếng Việt, dễ hiểu

## Phong cách học từ video tham khảo (thamkhao/, 4 video TikTok dọc 9:16)
- Nhịp cắt cảnh: trung bình 3–4 giây/cảnh. Cảnh MC nói dài 5–10 giây, xen các
  "chùm" cảnh minh họa nhanh 0,7–1,5 giây/cảnh khi liệt kê (tiện ích, nội thất).
- Chữ trên màn hình: KHÔNG chạy phụ đề đủ câu. Chỉ hiện CHỮ KHÓA 2–5 chữ, hiện
  từng chữ khớp lời nói, đặt ở khoảng trống cạnh MC (ngang ngực hoặc trên đầu),
  giữ 1–2 giây rồi biến mất.
  - Ghép 2 kiểu chữ: chữ nhỏ mảnh/nghiêng ("khám phá", "Chỉ khi") + chữ TO ĐẬM
    IN HOA ("BÓC TÁCH", "KHÔNG HỀ RẺ").
  - Chữ viết tay (script) cho từ cảm xúc ("Giá", "Không phải").
  - Con số to, màu vàng/cam ("130–180/m²", "40 ha", "12x20").
  - Tên dự án / chủ đầu tư hiện bằng logo khi được nhắc tới.
- 3 giây đầu: MC xuất hiện ngay giây 0, nói thẳng câu móc (không có cảnh tựa
  đề). Câu móc là 2–3 ý ngắn dồn dập ("Pháp lý chuẩn chỉnh, nhà đã có sẵn, giá
  không hề rẻ") hoặc 1 câu gây tò mò ("Có những thứ không thể mua bằng tiền").
  Mỗi ý bật 1 chữ khóa to ngay khi nói.
- Kết thúc: nhẹ nhàng, không cảnh bảng giá. MC nói câu chốt + kêu gọi nhắn tin
  ("đừng ngần ngại nhắn tin…", "Để SSM lo"), kèm logo thương hiệu; hoặc cảnh
  flycam / logo trên nền đen 1 giây.
- Logo thương hiệu nhỏ ở góc trên suốt video.

## Cắt ghép
- Cắt hết khoảng lặng dài hơn 0,4 giây và các tiếng "à, ừ, ơ"
- Cắt bỏ câu nói vấp, giữ lần nói cuối cùng
- Mỗi cảnh theo kịch bản quay sẵn (goc/); nói xong thì chèn ảnh phối cảnh /
  flycam trong tainguyen/ đè lên
- 3 giây đầu phải có câu "móc" + chữ to giữa màn hình

## Phụ đề
- Dùng CẢ HAI: chữ khóa to kiểu video mẫu cạnh MC + phụ đề đủ câu nhỏ gọn ở dưới
- Font: Be Vietnam Pro, đậm, chữ trắng viền đen
- Vị trí: 1/3 dưới màn hình, không che mặt, tránh vùng nút của TikTok
  (khi xuất thêm bản dọc 9:16)
- Tối đa 2 dòng, 7 chữ mỗi dòng
- Tô màu vàng #FFD400 cho con số: giá, diện tích, % chiết khấu, khoảng cách
- Viết đúng tên riêng: Vịnh Xanh, Ocean City, cá Koi, Mega Grand World,
  Vincom, Vinmec, Vinschool, pickleball, Lâm Oanh, Đức Thắng

## Màu và thương hiệu
- Màu chủ đạo: xanh ngọc, phụ: vàng kim
- Logo: "LOGO V3 XANH.png" trên Drive (public/thuonghieu/logo.png), góc trên phải,
  độ trong 80%, đặt trên nền trắng mờ vì chữ logo xanh đậm
- Màu hình: sáng, ấm, hơi tăng độ bão hòa cho cảnh xanh và biển

## Nhạc
- Nhạc nền dễ viral, âm lượng thấp (khoảng -20 dB) để nghe rõ lời
- Tự giảm nhạc khi có tiếng nói
- Nhạc trend có bản quyền: Claude không tự tải; chèn trong app TikTok/Reels lúc
  đăng, hoặc dùng file nhạc bạn đặt trong tainguyen/nhac/
- Mặc định: nhạc tự soạn sôi động kiểu trend (dance/house 124 BPM) bằng
  `.venv/bin/python scripts/taonhac.py public/nhac/<ten>.wav --giay <độ dài>`

## Motion graphic (Remotion)
- Khung thông tin giá / diện tích trượt vào từ trái, hiện 2–3 giây
- Không dùng hiệu ứng lòe loẹt, giữ cảm giác sang trọng

## Kết thúc
- 3 giây cuối: giữ cảnh MC chào; tên Lâm Oanh + số điện thoại 0346032032 + câu
  kêu gọi "Lâm Oanh – Liên hệ trực tiếp từ văn phòng bán hàng CĐT Vinhomes"
  trượt vào đè lên hình (không dùng cảnh nền màu riêng), rồi logo 1 giây

## Quy trình làm việc
- Trước khi render: gửi storyboard (bảng từng cảnh: giây, hình, phụ đề, hiệu ứng) để tôi duyệt
- Xuất bản xem thử 720p (1280x720) trước, tôi đồng ý mới xuất 1080p
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
