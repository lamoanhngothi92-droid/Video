"""Tự tạo bộ âm thanh hiệu ứng (SFX) không bản quyền cho video BĐS.

Chạy:  .venv/bin/python scripts/taosfx.py   → public/sfx/*.wav
- whoosh : tiếng vút khi chuyển cảnh / khung trượt vào
- swish  : tiếng vút ngắn cho chùm cảnh nhanh
- pop    : tiếng bật khi chữ khóa hiện lên
- ding   : tiếng "ting" sáng cho con số (giá, diện tích)
- impact : tiếng nhấn mạnh trầm cho câu móc
- shimmer: tiếng chuông lấp lánh (tài lộc, thịnh vượng)
- chime  : tiếng chuông kết, hiện logo
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
rng = np.random.default_rng(3)
OUT = Path("public/sfx")


def t(sec):
    return np.arange(int(sec * SR)) / SR


def onepole_lp(x, cut):
    """Lọc thấp với tần số cắt thay đổi theo thời gian (cut là mảng hoặc số)."""
    cut = np.broadcast_to(cut, x.shape)
    a = np.exp(-2 * np.pi * cut / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def bandsweep(dur, f0, f1, curve=1.0):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    p = np.linspace(0, 1, n) ** curve
    cut = f0 * (f1 / f0) ** p
    lo = onepole_lp(noise, cut)
    hi = onepole_lp(noise, cut * 0.35)
    return lo - hi


def save(name, x, gain=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    st = np.stack([x, x], axis=1)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    # whoosh: lên rồi xuống, 0,55s
    d = 0.55
    x = bandsweep(d, 300, 6000, 0.8)
    tt = t(d)[: len(x)]
    envl = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.6
    save("whoosh", x * envl, 0.75)

    # swish: ngắn 0,22s, sáng hơn
    d = 0.22
    x = bandsweep(d, 1500, 9000, 0.6)
    tt = t(d)[: len(x)]
    save("swish", x * np.sin(np.pi * tt / d) ** 2, 0.6)

    # pop: sine bật nhanh, tụt cao độ
    d = 0.12
    tt = t(d)
    f = 900 * np.exp(-tt * 30) + 380
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 38)
    x[:40] *= np.linspace(0, 1, 40)
    save("pop", x, 0.7)

    # ding: chuông sáng (các họa âm không nguyên)
    d = 1.2
    tt = t(d)
    x = sum(a * np.sin(2 * np.pi * 1568 * r * tt) * np.exp(-tt * k)
            for a, r, k in [(1, 1, 4), (0.5, 2.0, 6), (0.3, 2.76, 8), (0.2, 4.07, 11)])
    x[:60] *= np.linspace(0, 1, 60)
    save("ding", x, 0.6)

    # impact: bass trầm + nhiễu đập
    d = 1.3
    tt = t(d)
    f = 38 + 70 * np.exp(-tt * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3.2)
    hit = onepole_lp(rng.standard_normal(len(tt)), 2500) * np.exp(-tt * 25)
    save("impact", np.tanh(1.6 * (boom + 0.5 * hit)), 0.85)

    # shimmer: chuỗi chuông lấp lánh đi lên
    d = 1.6
    n = int(d * SR)
    x = np.zeros(n)
    notes = [1318.5, 1568, 1760, 2093, 2349, 2637, 3136]
    for j, fr in enumerate(notes):
        s = int(j * 0.07 * SR)
        tt = t(d)[: n - s]
        x[s:] += np.sin(2 * np.pi * fr * tt) * np.exp(-tt * 5) * 0.6
        x[s:] += np.sin(2 * np.pi * fr * 2.01 * tt) * np.exp(-tt * 8) * 0.2
    x += bandsweep(d, 4000, 12000)[:n] * 0.05 * np.exp(-t(d)[:n] * 2)
    save("shimmer", x, 0.6)

    # chime: hợp âm chuông kết (A trưởng), ngân dài
    d = 2.4
    tt = t(d)
    x = np.zeros_like(tt)
    for j, fr in enumerate([880, 1108.7, 1318.5, 1760]):
        s = int(j * 0.05 * SR)
        x[s:] += np.sin(2 * np.pi * fr * tt[: len(tt) - s]) * np.exp(-tt[: len(tt) - s] * 2.2)
    x[:100] *= np.linspace(0, 1, 100)
    save("chime", x, 0.55)
    # riser: tiếng vút lên 1,2s trước khi nhạc bùng
    d = 1.2
    x = bandsweep(d, 400, 9000, 1.6)
    tt = t(d)[: len(x)]
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (tt / d * 2)) / SR) * 0.25
    save("riser", (x + tone) * (tt / d) ** 2.2, 0.7)
    print("Đã tạo:", ", ".join(sorted(p.stem for p in OUT.glob("*.wav"))))


if __name__ == "__main__":
    main()
