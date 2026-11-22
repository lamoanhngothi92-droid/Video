#!/usr/bin/env bash
# Xuất Video 2 (dọc 9:16).  Dùng:  bash scripts/xuat_video2.sh 720|4k
#   720 : bản xem thử 720x1280 (dựng từ nguồn 1080)
#   4k  : bản cuối 2160x3840 (nguồn 4K, --scale=2) + bản nhẹ đăng mạng xã hội 1080x1920
# Không nhạc nền (bạn tự thêm khi đăng).
set -euo pipefail
cd "$(dirname "$0")/.."
export NODE_USE_ENV_PROXY=1
CO=${1:-720}
ID=Video2-PhoHien
if [ "$CO" = "720" ]; then
  npx remotion render src/index.ts $ID out/.v2_hinh.mp4 --crf=16 --log=error
  npx remotion render src/index.ts $ID out/.v2_loi.wav --codec=wav --log=error
  ffmpeg -v error -y -i out/.v2_hinh.mp4 -i out/.v2_loi.wav -filter_complex "[1:a]loudnorm=I=-16:TP=-1.5:LRA=11[a]" \
    -map 0:v -map "[a]" -vf scale=720:1280:flags=lanczos -c:v libx264 -crf 20 -preset medium -c:a aac -b:a 192k \
    -movflags +faststart out/video2-pho-hien-720p.mp4
  echo "Xong: out/video2-pho-hien-720p.mp4"
else
  P='{"nguon":"2160"}'
  npx remotion render src/index.ts $ID out/.v2_hinh4k.mp4 --props="$P" --scale=2 --crf=16 --x264-preset=medium --concurrency=2 --offthreadvideo-cache-size-in-bytes=1500000000 --log=error
  npx remotion render src/index.ts $ID out/.v2_loi.wav --codec=wav --log=error
  ffmpeg -v error -y -i out/.v2_hinh4k.mp4 -i out/.v2_loi.wav -filter_complex "[1:a]loudnorm=I=-16:TP=-1.5:LRA=11[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -movflags +faststart out/video2-pho-hien-4k.mp4
  ffmpeg -v error -y -i out/video2-pho-hien-4k.mp4 -vf scale=1080:1920:flags=lanczos -c:v libx264 -preset slow \
    -b:v 12M -maxrate 16M -bufsize 24M -c:a copy -movflags +faststart out/video2-pho-hien-dang-mxh.mp4
  echo "Xong: out/video2-pho-hien-4k.mp4 + out/video2-pho-hien-dang-mxh.mp4"
fi
rm -f out/.v2_loi.wav
