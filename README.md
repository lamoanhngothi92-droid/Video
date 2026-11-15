# Video – Remotion + FFmpeg

Dự án làm video và motion graphic bằng [Remotion](https://www.remotion.dev) (React), kèm FFmpeg để cắt/ghép video.

## Cài đặt

```bash
npm install
```

FFmpeg (cài riêng):
- Ubuntu/Debian: `sudo apt install ffmpeg`
- macOS: `brew install ffmpeg`
- Windows: `winget install ffmpeg`

## Lệnh Remotion

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Mở Remotion Studio để xem trước và chỉnh sửa |
| `npm run render` | Xuất `out/hello.mp4` |
| `npm run still` | Xuất ảnh thumbnail `out/thumb.png` |

Các composition nằm trong `src/Root.tsx`; ví dụ animation ở `src/HelloWorld.tsx`.
Đặt video/ảnh/nhạc vào thư mục `public/` rồi dùng `staticFile("ten-file.mp4")`.

## Lệnh FFmpeg hay dùng

```bash
# Cắt đoạn từ giây 10 đến 25 (không encode lại, rất nhanh)
ffmpeg -ss 00:00:10 -to 00:00:25 -i input.mp4 -c copy cut.mp4

# Cắt chính xác từng frame (encode lại)
ffmpeg -ss 10 -to 25 -i input.mp4 -c:v libx264 -c:a aac cut.mp4

# Ghép nhiều video (list.txt chứa các dòng: file 'a.mp4')
ffmpeg -f concat -safe 0 -i list.txt -c copy merged.mp4

# Đổi sang khung dọc 9:16 (TikTok/Reels)
ffmpeg -i input.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920" vertical.mp4

# Tách âm thanh / ghép nhạc nền
ffmpeg -i input.mp4 -vn -c:a mp3 audio.mp3
ffmpeg -i video.mp4 -i music.mp3 -map 0:v -map 1:a -c:v copy -shortest out.mp4

# Chèn motion graphic (nền trong suốt) lên video
ffmpeg -i input.mp4 -i overlay.mov -filter_complex overlay out.mp4
```

Xuất motion graphic có nền trong suốt từ Remotion:

```bash
npx remotion render src/index.ts HelloWorld out/overlay.mov --codec=prores --prores-profile=4444 --image-format=png --pixel-format=yuva444p10le
```
