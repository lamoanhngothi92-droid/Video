#!/usr/bin/env bash
# Xuất Video 1 có nhạc nền tự giảm khi MC nói.  Dùng:  bash scripts/xuat_video1.sh 720|1080
set -euo pipefail
cd "$(dirname "$0")/.."
CO=${1:-720}
NHAC=public/nhac/video1-nhac.wav
npx remotion render src/index.ts Video1-VinhXanh-HoKoi out/.v1_hinh.mp4 --crf=14 --x264-preset=slow
npx remotion render src/index.ts Video1-VinhXanh-HoKoi out/.v1_loi.wav --codec=wav
# [loi] = giọng MC + hiệu ứng; nhạc nền -10 dB, tự nén thêm khi có lời (sidechain)
LOC="[1:a]asplit=2[loi][sc];[2:a]volume=0.22[nhac];[nhac][sc]sidechaincompress=threshold=0.012:ratio=12:attack=15:release=400[nhacduck];[loi][nhacduck]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]"
if [ "$CO" = "720" ]; then
  ffmpeg -v error -y -i out/.v1_hinh.mp4 -i out/.v1_loi.wav -i "$NHAC" -filter_complex "$LOC" \
    -map 0:v -map "[a]" -vf scale=1280:720:flags=lanczos -c:v libx264 -crf 20 -preset medium \
    -c:a aac -b:a 192k -movflags +faststart out/video1-720p.mp4
else
  ffmpeg -v error -y -i out/.v1_hinh.mp4 -i out/.v1_loi.wav -i "$NHAC" -filter_complex "$LOC" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart out/video1-1080p.mp4
fi
rm -f out/.v1_loi.wav
echo "Xong: out/video1-${CO}p.mp4"
