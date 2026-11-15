"""Tự soạn nhạc nền sôi động kiểu trend (dance/house 124 BPM), không bản quyền.

Cách dùng:
    .venv/bin/python scripts/taonhac.py public/nhac/nhac-nen-01.wav --giay 62

Bố cục: intro (4 ô nhịp) → sôi động (12) → nghỉ nhẹ (4) → sôi động (8) → kết (4).
"""
import argparse
import wave

import numpy as np

SR = 44100
BPM = 124
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)


def t(n):
    return np.arange(n) / SR


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def note_hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def saw(freq, n, detune=(0.0,)):
    tt = t(n)
    out = np.zeros(n)
    for d in detune:
        f = freq * (1 + d)
        out += 2 * ((tt * f + rng.random()) % 1.0) - 1
    return out / len(detune)


def env(n, a=0.005, d=0.2, s=0.0, r=0.05):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    e[na:na + nd] = np.linspace(1, s, min(nd, max(0, n - na)))[: max(0, min(nd, n - na))]
    if nr and n > nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def kick():
    n = int(0.35 * SR)
    tt = t(n)
    f = 45 + 110 * np.exp(-tt * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt * 7) * 1.0


def clap():
    n = int(0.25 * SR)
    x = highpass(rng.standard_normal(n), 900)
    e = np.exp(-t(n) * 22)
    for k in (0.0, 0.012, 0.024):  # 3 lần vỗ sát nhau
        e[int(k * SR):] += 0.5 * np.exp(-t(n - int(k * SR)) * 60)
    return x * e * 0.35


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    x = highpass(rng.standard_normal(n), 7000)
    return x * np.exp(-t(n) * (18 if open_ else 80)) * (0.22 if open_ else 0.12)


# Hợp âm vòng trend: Am – F – C – G
CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
ROOTS = [45, 41, 36, 43]
# Giai điệu pluck (ngũ cung), 8 nốt móc tai mỗi ô nhịp
MELODY = [
    [76, None, 74, 72, None, 72, 74, None],
    [72, None, 69, 67, None, 69, 72, None],
    [72, None, 74, 76, None, 79, 76, None],
    [74, None, 72, 74, None, 71, 67, None],
]


def place(buf, sample, pos, gain=1.0):
    i = int(pos * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sample))
    buf[i:j] += sample[: j - i] * gain


def build(total_sec):
    bars = int(np.ceil(total_sec / BAR))
    n = int(bars * BAR * SR) + SR
    drums, bass, pad, lead = (np.zeros(n) for _ in range(4))
    K, C, H, HO = kick(), clap(), hat(), hat(True)

    def section(b):
        if b < 4:
            return "intro"
        if b < 16:
            return "drop"
        if b < 20:
            return "break"
        if b < bars - 4:
            return "drop"
        return "outro"

    for b in range(bars):
        s = section(b)
        t0 = b * BAR
        ci = b % 4
        # Trống
        for q in range(4):
            tb = t0 + q * BEAT
            if s in ("drop", "outro") or (s == "intro" and b >= 2):
                place(drums, K, tb, 0.95 if s == "drop" else 0.7)
            if s == "drop" and q in (1, 3):
                place(drums, C, tb)
            if s != "break":
                place(drums, HO, tb + BEAT / 2)
            for e in range(4):
                place(drums, H, tb + e * BEAT / 4, 0.6 + 0.4 * (e % 2))
        # Bass nhịp lệch (offbeat)
        if s in ("drop", "outro"):
            f = note_hz(ROOTS[ci])
            for q in range(4):
                seg = int(BEAT / 2 * SR)
                x = lowpass(saw(f, seg, (0, 0.006)), 380) * env(seg, 0.004, 0.18, 0.5, 0.03)
                place(bass, x, t0 + q * BEAT + BEAT / 2, 0.9)
        # Pad hợp âm (siêu saw)
        seg = int(BAR * SR)
        chord = sum(saw(note_hz(m), seg, (-0.01, 0, 0.011)) for m in CHORDS[ci]) / 3
        cutoff = 900 if s == "intro" else (2400 if s == "drop" else 1500)
        place(pad, lowpass(chord, cutoff) * env(seg, 0.02, 0.1, 1.0, 0.05), t0, 0.5)
        # Pluck giai điệu
        if s in ("drop", "break"):
            for k, m in enumerate(MELODY[ci]):
                if m is None:
                    continue
                segp = int(BEAT / 2 * SR)
                tt = t(segp)
                x = (np.sign(np.sin(2 * np.pi * note_hz(m) * tt)) * 0.5 + np.sin(2 * np.pi * note_hz(m) * tt))
                x = lowpass(x, 3000) * np.exp(-tt * 9)
                place(lead, x, t0 + k * BEAT / 2, 0.22 if s == "drop" else 0.3)

    # "Nhún" theo kick (sidechain) cho pad và bass – chất trend
    pump = np.ones(n)
    for b in range(bars):
        for q in range(4):
            i = int((b * BAR + q * BEAT) * SR)
            m = int(BEAT * SR)
            j = min(n, i + m)
            pump[i:j] = 0.25 + 0.75 * np.clip(t(j - i) / (BEAT * 0.55), 0, 1) ** 1.5
    mix = drums + (bass + pad) * pump + lead * (0.6 + 0.4 * pump)
    mix = mix[: int(total_sec * SR)]
    # Mờ vào / mờ ra
    fi, fo = int(0.5 * SR), int(2.5 * SR)
    mix[:fi] *= np.linspace(0, 1, fi)
    mix[-fo:] *= np.linspace(1, 0, fo)
    mix = np.tanh(mix * 1.2)  # nén nhẹ cho dày
    return mix / np.max(np.abs(mix)) * 0.89


def main():
    p = argparse.ArgumentParser()
    p.add_argument("out")
    p.add_argument("--giay", type=float, default=62)
    a = p.parse_args()
    x = build(a.giay)
    stereo = np.stack([x, np.roll(x, 90)], axis=1)  # tách nhẹ 2 kênh cho rộng
    with wave.open(a.out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((stereo * 32767).astype(np.int16).tobytes())
    print("Đã tạo", a.out)


if __name__ == "__main__":
    main()
