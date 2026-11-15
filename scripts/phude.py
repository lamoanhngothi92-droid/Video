"""Tạo phụ đề tiếng Việt tự động từ video/âm thanh.

Cách dùng:
    .venv/bin/python scripts/phude.py video.mp4
    .venv/bin/python scripts/phude.py video.mp4 --model medium   # nhanh hơn, kém chính xác hơn

Kết quả: file .srt (phụ đề thường) và .json (từng chữ có thời gian,
dùng cho chữ chạy trong Remotion) nằm cạnh file gốc.
"""
import argparse
import json
import subprocess
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel


def load_audio(path: Path) -> np.ndarray:
    """Dùng FFmpeg đọc âm thanh từ mọi loại file (mp4, mov, wav, mp3...)."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "16000",
         "-f", "s16le", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0


GOI_Y = (
    "Video giới thiệu bất động sản Vinhomes: Vịnh Xanh, Ocean City, căn hộ, "
    "nhà phố, song lập, đơn lập, biệt thự, liền kề, view sông, mét vuông, "
    "hecta, sổ hồng, giá chỉ, tỷ, triệu, vay 70%, vốn tự có, hỗ trợ lãi suất, "
    "chiết khấu, giáp sông, an ninh 24/7, hồ cá Koi, vườn yoga, sân tennis, "
    "pickleball, Vincom, Vinmec, Vinschool, Mega Grand World, tài lộc, "
    "thịnh vượng, CĐT Vinhomes, Lâm Oanh, Đức Thắng."
)


def ts(sec: float) -> str:
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("input")
    p.add_argument("--model", default="large-v3-turbo")
    p.add_argument(
        "--goiy",
        default=GOI_Y,
        help="Từ ngữ gợi ý giúp nhận đúng tên dự án, thuật ngữ",
    )
    args = p.parse_args()

    src = Path(args.input)
    model = WhisperModel(args.model, device="auto", compute_type="int8")
    segments, _ = model.transcribe(
        load_audio(src), language="vi", word_timestamps=True, vad_filter=True,
        initial_prompt=args.goiy,
    )

    srt_lines, captions = [], []
    for i, seg in enumerate(segments, 1):
        text = seg.text.strip()
        print(f"[{ts(seg.start)} -> {ts(seg.end)}] {text}")
        srt_lines += [str(i), f"{ts(seg.start)} --> {ts(seg.end)}", text, ""]
        for w in seg.words or []:
            captions.append({
                "text": w.word,
                "startMs": round(w.start * 1000),
                "endMs": round(w.end * 1000),
                "timestampMs": round(w.start * 1000),
                "confidence": round(w.probability, 3),
            })

    src.with_suffix(".srt").write_text("\n".join(srt_lines), encoding="utf-8")
    src.with_suffix(".json").write_text(
        json.dumps(captions, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    print(f"\nĐã lưu: {src.with_suffix('.srt')} và {src.with_suffix('.json')}")


if __name__ == "__main__":
    main()
