---
name: video-bds
description: Dựng video bất động sản mới cho kênh Lâm Oanh Vinhomes từ kịch bản + video quay gốc trên Google Drive (cắt khoảng lặng, phụ đề Whisper, chữ khóa, cảnh chèn, khung giá, xuất 720p/1080p). Dùng khi người dùng muốn làm video mới, gửi kịch bản hoặc link Drive cảnh quay.
---

# Quy trình dựng video BĐS (đã chạy thành công với Video 1 – Vịnh Xanh – Hồ Koi)

Luôn đọc `CLAUDE.md` trước: luật kênh, màu, font, định dạng. Trả lời bằng tiếng Việt dễ hiểu.
Mẫu code đầy đủ để sao chép: `scripts/dung_video1.py` + `src/video1/Video1.tsx`.

## 0. Hỏi đủ trước khi làm (1 lần, gộp vào AskUserQuestion)
- Kịch bản (văn bản), link thư mục/tệp Drive cảnh quay gốc + tài nguyên.
- Tên dự án, giá, diện tích, con số chính → cho khung giá / chữ khóa.
- Có cần cảnh/ảnh lấy từ video cũ của kênh không (link).

## 1. Lấy cảnh quay từ Drive
- Tìm tệp: `mcp__Google_Drive__search_files` với `parentId = '<thư mục>'` (đọc hết các trang).
- Tệp ≤ 10 MB: `download_file_content` → tệp JSON base64 trong tool-results → giải mã
  (xem hàm trong lịch sử: đọc `content`, `base64.b64decode`, ghi theo `title`).
- Tệp > 10 MB (cảnh 4K luôn lớn): PHẢI hỏi người dùng đồng ý tạm mở link
  ("Bất kỳ ai có đường liên kết – Người xem"); Claude không khóa lại được → nhắc người dùng tự khóa.
  Sau khi đồng ý: `share_file(permissionId="anyoneWithLink", role="reader")`, rồi tải song song:
  `curl -sSL --retry 4 -o <đích> "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"`
- Luôn dùng **file gốc 4K** (`DJI_..._D.MP4`, 3840x2160, HEVC). File `dji_export_..._compose` chỉ 640x352 → mờ.
  Nếu chỉ có bản nén: so khớp âm thanh để tìm bản gốc (FFT cross-correlation, gốc thường lệch +0,1 s).
- Lưu: `goc4k/`, `tainguyen4k/`, `thamkhao/` (đã gitignore). Không bao giờ sửa/xóa tệp trên Drive.

## 2. Nghe lời nói
- `npm run phude -- <clip>` cho từng clip MC → `.json` từng chữ có thời gian. Chuyển vào `goc_phude/`.
- So với kịch bản, sửa chữ sai trong bảng `SUA` của script dựng (theo chỉ số chữ). Phụ đề theo **lời nói thật**,
  chỉ sửa chính tả theo kịch bản. Thêm tên riêng mới vào `GOI_Y` trong `scripts/phude.py`.
- Báo người dùng chỗ lời nói khác kịch bản.

## 3. Storyboard → chờ duyệt
- Tạo `storyboard/NN-<ten>.md`: bảng Giây | Hình | Lời | Chữ khóa/hiệu ứng (mẫu: `storyboard/01-vinh-xanh-ho-koi.md`).
- Gửi tóm tắt bảng trong chat, KHÔNG dựng trước khi người dùng đồng ý.

## 4. Dựng
- Sao chép `scripts/dung_video1.py` → `scripts/dung_videoN.py`, `src/video1/` → `src/videoN/`;
  đăng ký Composition mới trong `src/Root.tsx`; sao chép `scripts/xuat_video1.sh`.
- Trong script: `THU_TU` (thứ tự clip MC), `GOC_4K`/`TN_4K` (tên file 4K), `SUA`, các lệnh
  `cen_canh(...)` (cảnh chèn theo chữ), `kw(...)` (chữ khóa), `khung` (khung giá/dải ngang), `anh` (khung ảnh tiện ích).
- Chạy script: tạo nguồn 1920x1080 đã chỉnh màu trong `public/vN/` (4K thu nhỏ, mất ~15 phút) + `data.json`.
- Kiểm tra bằng `npx remotion still … --frame=<giây*60> --scale=0.5` rồi ghép ảnh xem trước khi xuất cả video.

## 5. Xuất
- Bản xem thử: `NODE_USE_ENV_PROXY=1 bash scripts/xuat_videoN.sh 720` (~12–15 phút, chạy nền).
- Người dùng đồng ý → `… 1080` + bản nhẹ đăng mạng xã hội:
  `ffmpeg -i <1080p> -c:v libx264 -preset slow -b:v 12M -maxrate 16M -bufsize 24M -c:a copy -movflags +faststart <dang-mxh>.mp4`
- Gửi bằng SendUserFile. Không tải được file lớn lên Drive → người dùng tự tải từ chat.

## Sở thích người dùng đã chốt (đừng làm lại lỗi cũ)
- KHÔNG hiệu ứng giật: không nhún theo nhịp, không phóng giật, không chớp trắng, không zoom-blur.
  Chuyển cảnh: mờ dần / mờ chồng mềm 0,3 s; cảnh chèn phóng chậm 1.00→1.07.
- Chữ khóa TO màu **xanh dương ngọc #1ECBE1**, chữ nhỏ nghiêng trắng, số màu vàng #FFD400, từ cảm xúc chữ viết tay vàng kim.
- Không nhạc nền (người dùng tự thêm khi đăng). Âm thanh hiệu ứng nhẹ: `luot` (chuyển cảnh), `go1..6`
  (chùm cảnh / khung ảnh), `pop`, `ding`, `shimmer`, `chime`. Không dùng `whoosh`/`swish`.
- Khung ảnh tiện ích: khung lớn bo góc viền vàng kim, đặt phía KHÔNG có MC, nhãn trên nền kính tối
  (chữ nhỏ nghiêng + tên to xanh dương ngọc). Không chép kiểu ô ảnh nhỏ của video cũ.
- Khung thông tin không được che MC (dùng dải ngang phía trên nếu MC chiếm 2 bên).
- Thanh tên cảnh kết: "Lâm Oanh Vinhomes" + "Liên hệ trực tiếp từ văn phòng bán hàng CĐT Vinhomes", nhỏ, tinh tế.
- Giữ trọn các cảnh người dùng chỉ định; hỏi khi không rõ cảnh nào / đặt ở đâu.

## Lỗi kỹ thuật đã gặp
- Remotion trên máy cloud cần `NODE_USE_ENV_PROXY=1`. `--scale=0.6667` lỗi làm tròn → thu 720p bằng FFmpeg.
- faster-whisper đọc âm thanh lỗi với PyAV mới → script đã tự đọc bằng FFmpeg (`load_audio`).
- `mixBlendMode` trong `<Sequence>` không ăn → dùng `layout="none"`.
- Biến dùng sai vòng lặp từng gắn tiếng "vút" cho mọi cảnh → kiểm tra bảng SFX (Counter) trước khi xuất.
