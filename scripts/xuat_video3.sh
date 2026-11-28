#!/usr/bin/env bash
# Xuất Video 3.  Dùng:  bash scripts/xuat_video3.sh 720|1080 [file-nhạc]
# Mặc định KHÔNG có nhạc nền (bạn tự thêm nhạc khi đăng). Có file nhạc thì nhạc tự nhỏ lại khi MC nói.
set -euo pipefail
cd "$(dirname "$0")/.."
CO=${1:-720}
NHAC=${2:-}
npx remotion render src/index.ts Video3-GlobalGate-SuKien out/.v3_hinh.mp4 --crf=14 --x264-preset=slow
npx remotion render src/index.ts Video3-GlobalGate-SuKien out/.v3_loi.wav --codec=wav
if [ -n "$NHAC" ]; then
  VAO=(-i out/.v3_hinh.mp4 -i out/.v3_loi.wav -i "$NHAC")
  LOC="[1:a]asplit=2[loi][sc];[2:a]volume=0.22[nhac];[nhac][sc]sidechaincompress=threshold=0.012:ratio=12:attack=15:release=400[d];[loi][d]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]"
else
  VAO=(-i out/.v3_hinh.mp4 -i out/.v3_loi.wav)
  LOC="[1:a]loudnorm=I=-16:TP=-1.5:LRA=11[a]"
fi
if [ "$CO" = "720" ]; then
  ffmpeg -v error -y "${VAO[@]}" -filter_complex "$LOC" -map 0:v -map "[a]" \
    -vf scale=1280:720:flags=lanczos -c:v libx264 -crf 20 -preset medium -c:a aac -b:a 192k -movflags +faststart out/video3-720p.mp4
else
  ffmpeg -v error -y "${VAO[@]}" -filter_complex "$LOC" -map 0:v -map "[a]" \
    -c:v copy -c:a aac -b:a 192k -movflags +faststart out/video3-1080p.mp4
fi
rm -f out/.v3_loi.wav
echo "Xong: out/video3-${CO}p.mp4"
