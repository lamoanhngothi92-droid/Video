# Video bất động sản – Lâm Oanh Vinhomes

Bộ công cụ:
- **FFmpeg**: cắt, ghép, chèn nhạc, xuất video
- **Whisper** (faster-whisper, mô hình `large-v3-turbo`): tự tạo phụ đề tiếng Việt
- **Remotion**: chữ chạy, khung giá, motion graphic (khung ngang 1920×1080, 60fps)
- **Font Be Vietnam Pro**: đủ dấu tiếng Việt, đóng gói sẵn trong dự án

## Cài đặt lần đầu

```bash
# 1. FFmpeg (Ubuntu: sudo apt install ffmpeg | macOS: brew install ffmpeg | Windows: winget install ffmpeg)
# 2. Remotion + font
npm install
# 3. Whisper
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt     # Windows: .venv\Scripts\pip ...
```
Lần chạy Whisper đầu tiên sẽ tự tải mô hình (~1,6 GB).

## Quy trình làm 1 video

1. Bỏ video quay nhà vào `public/`, ví dụ `public/nha-q7.mp4`.
2. Tạo phụ đề: `npm run phude -- public/nha-q7.mp4`
   → ra `public/nha-q7.srt` (phụ đề thường) và `public/nha-q7.json` (cho Remotion).
   Mở file `.json` sửa lại chữ nếu nghe nhầm.
3. Mở `src/Root.tsx`, đổi `video`, `tieuDe`, `gia`, `thongTin`, `hotline`, `phuDe`.
4. Xem trước: `npm run dev` · Bản xem thử 720p: `npm run render:720` · Bản chính 1080p: `npm run render`

Mẫu giao diện ở `src/BatDongSan.tsx`: câu móc 3 giây đầu, khung giá trượt từ trái, phụ đề 2 dòng × 7 chữ (con số tô vàng), logo, cảnh kết 3 giây. Luật chi tiết xem `CLAUDE.md`.

## Lệnh FFmpeg hay dùng

```bash
# Cắt đoạn từ giây 10 đến 25
ffmpeg -ss 10 -to 25 -i input.mp4 -c:v libx264 -c:a aac cut.mp4
# Ghép nhiều đoạn (list.txt gồm các dòng: file 'a.mp4')
ffmpeg -f concat -safe 0 -i list.txt -c copy merged.mp4
# Đổi video ngang thành dọc 9:16
ffmpeg -i input.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920" vertical.mp4
# Chèn nhạc nền nhỏ (15%) dưới giọng nói gốc
ffmpeg -i video.mp4 -i nhac.mp3 -filter_complex "[1:a]volume=0.15[n];[0:a][n]amix=inputs=2:duration=first[a]" -map 0:v -map "[a]" -c:v copy out.mp4
# Gắn phụ đề .srt cứng vào video
ffmpeg -i video.mp4 -vf "subtitles=video.srt:force_style='FontName=Be Vietnam Pro,FontSize=14'" out.mp4
```
