"""Chuẩn bị dữ liệu dựng Video 3 – Sự kiện Vinhomes Global Gate Hạ Long
"Dấu ấn Di sản – Kiến tạo Tương lai" (storyboard/03-global-gate-ha-long.md).

Chạy:  .venv/bin/python scripts/dung_video3.py [--4k]
Kết quả:
  public/v3/*.mp4   (hoặc public/v3_4k/ với --4k) – từng đoạn đã cắt, chỉnh màu, tua nhanh (speed ramp)
  src/video3/data.json – dòng thời gian, chữ khóa, phụ đề, thẻ nội dung, SFX

Dùng đủ 24/24 clip trong goc4k/v3/ (kiểm tra ở cuối script).
"""
import json
import math
import subprocess
import sys
from collections import Counter
from pathlib import Path

GOC = Path("goc4k/v3")
PHUDE = Path("goc_phude/v3")
K4 = "--4k" in sys.argv
OUT = Path("public/v3_4k" if K4 else "public/v3")
DATA = Path("src/video3/data.json")
W, H = (3840, 2160) if K4 else (1920, 1080)

PAD_TRUOC, PAD_SAU, LANG_TOI_DA = 0.12, 0.15, 0.4
DU = 0.35  # đoạn dư cuối mỗi cảnh chèn để mờ chồng

TAT_CA = ["0671", "0676", "0681", "0688", "0697", "0700", "0704", "0713", "0718", "0723", "0732",
          "0733", "0735", "0739", "0742", "0743", "0744", "0745", "0749", "0750", "0751", "0752",
          "0754", "0756"]

# Sửa chữ Whisper nghe nhầm – (vị trí chữ, chữ đúng)
SUA = {
    "0732": {4: "Vinhomes", 25: "Tương", 26: "lai."},
    "0700": {20: "suốt."},
}

LOC = ("scale={w}:{h}:flags=lanczos,"
       "eq=brightness=0.03:saturation=1.15:gamma=1.03,"
       "colorbalance=rs=0.03:gs=0.01:bs=-0.03:rm=0.02:bm=-0.02")


def nguon(k):
    return next(GOC.glob(f"{k}.*"))


def do_dai(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                 "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)


def doc_chu(k):
    chu = json.load(open(PHUDE / f"{k}.json", encoding="utf-8"))
    sua = SUA.get(k, {})
    return [{"i": i, "text": sua.get(i, w["text"].strip()), "start": w["startMs"] / 1000,
             "end": w["endMs"] / 1000} for i, w in enumerate(chu)]


def chia_doan(chu):
    doan, cur = [], [chu[0]]
    for a, b in zip(chu, chu[1:]):
        if b["start"] - a["end"] > LANG_TOI_DA:
            doan.append(cur)
            cur = []
        cur.append(b)
    doan.append(cur)
    return [(max(0, d[0]["start"] - PAD_TRUOC), d[-1]["end"] + PAD_SAU, d) for d in doan]


def can_vao(T, s0, s1):
    """Độ dài đoạn gốc cần dùng để ra T giây khi tốc độ đổi tuyến tính s0 → s1."""
    if abs(s1 - s0) < 1e-6:
        return T * s0
    return T * (s1 - s0) / math.log(s1 / s0)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    DATA.parent.mkdir(parents=True, exist_ok=True)
    canh, chen, phude, chukhoa, the, sfx = [], [], [], [], [], []
    viec = []  # các đoạn cần xuất bằng FFmpeg
    t = 0.0
    moc = {}
    dem = Counter()

    def them_chu(ds, goc_t, a, k):
        for w in ds:
            ws, we = goc_t + w["start"] - a, goc_t + w["end"] - a
            moc[(k, w["i"])] = (ws, we)
            phude.append({"text": " " + w["text"], "startMs": round(ws * 1000), "endMs": round(we * 1000),
                          "timestampMs": round(ws * 1000), "confidence": 1})

    def mc(k):
        """Clip MC nói (giữ tiếng), cắt khoảng lặng > 0,4 s; đoạn sau phóng nhẹ để che chỗ cắt."""
        nonlocal t
        dem[k] += 1
        viec.append({"ten": f"mc_{k}", "k": k, "vao": 0.0, "T": do_dai(nguon(k)), "s0": 1, "s1": 1})
        for n, (a, b, ds) in enumerate(chia_doan(doc_chu(k))):
            canh.append({"src": f"{OUT.name}/mc_{k}.mp4", "from": t, "in": a, "dur": b - a,
                         "zoom": 1.0 if n % 2 == 0 else 1.07})
            them_chu(ds, t, a, k)
            t += b - a

    def broll(k, vao, T, s0, s1=1.0, vol=0.22, at=None, mo=False, ra=False, phude_tu=None):
        """Cảnh chèn có speed ramp s0 → s1. at=None: nối tiếp trên dòng thời gian (t tăng)."""
        nonlocal t
        dem[k] += 1
        ten = f"b_{k}_{dem[k]}"
        L = can_vao(T + DU, s0, s1)
        dd = do_dai(nguon(k))
        assert vao + L <= dd + 0.05, f"{k}: cần {vao + L:.2f}s nhưng clip chỉ {dd:.2f}s"
        viec.append({"ten": ten, "k": k, "vao": vao, "T": T + DU, "s0": s0, "s1": s1, "L": L})
        tu = t if at is None else at
        chen.append({"src": f"{OUT.name}/{ten}.mp4", "from": tu, "dur": T, "mo": mo, "ra": ra,
                     "vol": vol, "k": k})
        if phude_tu:  # lời thật trong cảnh chèn (tốc độ 1x)
            chu = [w for w in doc_chu(k) if phude_tu[0] <= w["i"] <= phude_tu[1]]
            them_chu(chu, tu, vao, k)
        if at is None:
            t += T
        return tu

    def kw(tu, den, dong, vt="giua", co=1.0, mau="xanh"):
        """mau="cam": chữ to vàng cam – dùng trên nền màn LED / slide xanh cho nổi."""
        chukhoa.append({"from": tu, "dur": den - tu, "dong": dong, "vt": vt, "co": co, "mau": mau})

    def tu_chu(k, i):
        return moc[(k, i)][0]

    def het_chu(k, i):
        return moc[(k, i)][1]

    # ===== 1. Câu móc: chùm 3 cảnh tua nhanh =====
    broll("0697", 2.0, 0.95, 3.0, 1.6, vol=0.35)
    broll("0742", 0.5, 0.9, 3.0, 1.6, vol=0.35)
    broll("0704", 1.0, 1.0, 3.0, 1.2, vol=0.35)
    kw(0.0, 1.42, [["nho", "sáng nay"], ["to", "ĐÔNG KÍN KHÁCH"]], vt="tam", co=1.15)
    kw(1.42, t + 0.05, [["tay", "Dấu ấn"], ["to", "DI SẢN"]], vt="tam", co=1.25, mau="cam")
    hook_het = t

    # ===== 2–4. MC trước sảnh =====
    mc("0732")
    het0732 = t
    kw(tu_chu("0732", 4), het_chu("0732", 8) + 0.3,
       [["nho", "dự án"], ["to", "VINHOMES GLOBAL GATE"], ["tay", "Hạ Long"]], vt="tren", co=0.8)
    a, b = tu_chu("0732", 9) - 0.05, tu_chu("0732", 18) - 0.05  # "sẵn sàng đón chào quý khách tại sự kiện"
    broll("0718", 0.3, b - a, 1.6, 1.0, vol=0, at=a, mo=True, ra=True)
    kw(tu_chu("0732", 18), het_chu("0732", 26) + 0.35,
       [["tay", "Dấu ấn Di sản"], ["to", "KIẾN TẠO TƯƠNG LAI"]], vt="tren", co=0.85)
    kw(tu_chu("0732", 27), het_chu("0732", 30) + 0.3, [["nho", "ngay từ"], ["so", "9H SÁNG"]], vt="trai")
    a = tu_chu("0732", 31) - 0.05  # "rất đông khách hàng đã có mặt tại sự kiện"
    m = tu_chu("0732", 37) - 0.05
    c = tu_chu("0732", 42) - 0.05  # "để cập nhật thông tin về dự án"
    broll("0713", 0.2, m - a, 2.0, 1.0, vol=0, at=a, mo=True)
    broll("0718", 9.5, c - m, 1.8, 1.0, vol=0, at=m)
    kw(a, c, [["nho", "rất"], ["to", "ĐÔNG KHÁCH"]], vt="giua")
    broll("0743", 0.3, het0732 - c, 1.5, 1.0, vol=0, at=c)
    kw(c, het0732 + 0.4, [["nho", "cập nhật"], ["to", "THÔNG TIN DỰ ÁN"]], vt="giua")

    # ===== 5. Chùm không khí sự kiện =====
    s = t
    broll("0676", 0.1, 1.25, 2.0, 1.0, vol=0.25)
    broll("0688", 0.4, 1.25, 2.2, 1.0, vol=0.25)
    broll("0744", 0.2, 1.15, 1.8, 1.0, vol=0.25)
    broll("0718", 17.0, 1.3, 3.0, 1.2, vol=0.25)
    broll("0681", 0.4, 1.3, 2.0, 1.0, vol=0.25)
    broll("0697", 5.5, 1.5, 2.0, 0.8, vol=0.25, ra=True)
    kw(s + 0.3, s + 2.3, [["nho", "không khí"], ["to", "SÔI ĐỘNG"]], vt="tam")
    chum1 = (s, t)

    # ===== 6. MC bên sa bàn =====
    t -= DU  # MC hiện dần dưới cảnh 0697 đang mờ đi
    mc("0739")
    kw(tu_chu("0739", 4), het_chu("0739", 9) + 0.4, [["nho", "tập trung vào"], ["so", "2 NỘI DUNG"]],
       vt="phai", co=0.9)
    het0739 = t
    the.append({"from": tu_chu("0739", 17) - 0.05, "dur": het0739 - tu_chu("0739", 17) + 0.6,
                "so": "01", "nho": "Tiềm năng", "to": "THỊ TRƯỜNG HẠ LONG", "hang": 0})
    the.append({"from": tu_chu("0739", 24) - 0.05, "dur": het0739 - tu_chu("0739", 24) + 0.6,
                "so": "02", "nho": "Chính sách", "to": "BÁN HÀNG MỚI", "hang": 1})

    # ===== 7–8. Hội trường → diễn giả nói về thị trường =====
    broll("0704", 4.0, 1.1, 3.0, 1.3, vol=0.25, mo=True)
    s = broll("0700", 2.7, 3.0, 1.0, 1.0, vol=1.0, phude_tu=(10, 20))
    kw(s + 0.1, s + 1.6, [["so", "01"], ["nho", "tiềm năng"], ["to", "THỊ TRƯỜNG HẠ LONG"]], vt="traiduoi", co=0.75)

    # ===== 9. Chùm chính sách bán hàng =====
    s = broll("0723", 1.0, 1.9, 2.5, 1.0, vol=0.25, mo=True)
    broll("0733", 0.5, 1.9, 2.0, 1.0, vol=0.25)
    s2 = broll("0735", 2.0, 2.1, 2.5, 1.0, vol=0.25)
    broll("0742", 3.5, 1.7, 2.0, 1.0, vol=0.25)
    kw(s + 0.2, s + 1.7, [["so", "02"], ["to", "CHÍNH SÁCH"], ["to", "BÁN HÀNG MỚI"]], vt="thap", co=0.85)
    kw(s2 + 0.2, s2 + 1.6, [["nho", "tiêu chuẩn"], ["to", "BÀN GIAO HOÀN THIỆN"]], vt="thap", co=0.85, mau="cam")

    # ===== 10. Chùm bốc thăm – trao quà =====
    s = broll("0745", 0.3, 2.1, 2.0, 1.0, vol=0.3, mo=True)
    broll("0749", 1.0, 2.2, 3.0, 1.0, vol=0.3)
    s2 = broll("0750", 1.0, 1.8, 3.0, 1.0, vol=0.3)
    broll("0751", 1.0, 2.5, 5.0, 1.0, vol=0.3)
    broll("0752", 2.0, 2.5, 6.0, 1.0, vol=0.3)
    kw(s + 0.2, s + 1.6, [["nho", "bốc thăm"], ["to", "MAY MẮN"]], vt="tren", mau="cam")
    kw(s2 + 0.1, s2 + 1.6, [["nho", "rất nhiều"], ["to", "QUÀ TẶNG HẤP DẪN"]], vt="tren", co=0.9, mau="cam")
    qua = (s, t)

    # ===== 11. Ảnh đội ngũ + ảnh tập thể (giữ tiếng đếm 1, 2, 3) =====
    s = broll("0671", 1.0, 2.5, 2.0, 1.0, vol=0.3, mo=True)
    kw(s + 0.2, s + 1.6, [["tay", "Dấu ấn"], ["to", "DI SẢN"]], vt="tren", mau="cam")
    s = broll("0754", 0.45, 3.1, 1.0, 1.0, vol=1.0)
    kw(s + 0.3, s + 1.8, [["to", "KIẾN TẠO TƯƠNG LAI"]], vt="tren", co=0.85, mau="cam")

    # ===== 12–13. Kết: ảnh tập thể vẫy tay chậm + thanh liên hệ + LÂM OANH VINHOMES mờ mờ =====
    # Giữ nguyên đoạn vẫy chào hô khẩu hiệu (tốc độ thật, đủ tiếng). Hô xong ở giây 4,65 của clip.
    s = broll("0756", 0.0, 6.0, 1.0, 1.0, vol=1.0, mo=True)
    ten_tu = s + 0.4
    # Khẩu hiệu (chị gửi): "Tự doanh Toàn quốc, quyết thắng, quyết thắng" – thời gian từng chữ đo bằng Whisper
    kh = [("Tự", 0.0, 0.7), ("doanh", 0.7, 1.1), ("Toàn", 1.1, 1.5), ("quốc,", 1.5, 1.96),
          ("quyết", 2.24, 2.66), ("thắng,", 2.66, 3.1), ("quyết", 3.26, 3.62), ("thắng!", 3.62, 4.64)]
    them_chu([{"i": 900 + n, "text": w, "start": a, "end": b} for n, (w, a, b) in enumerate(kh)], s, 0.0, "kh")
    kw(s + 1.1, s + 4.6, [["nho", "Tự doanh Toàn quốc"], ["to", "QUYẾT THẮNG!"]], vt="tren", co=0.95, mau="cam")
    chen[-1]["dur"] += 0.3  # chạy tới gần hết clip (phần dư đã xuất sẵn)
    t += 0.3
    logo_tu = s + 4.65
    anh_cuoi = {"src": f"{OUT.name}/ket_0756.jpg", "from": t}  # giữ khung cuối làm nền chữ mờ
    t += 0.8
    tong = t

    # ===== Kiểm tra dùng đủ 24 clip =====
    thieu = [k for k in TAT_CA if dem[k] == 0]
    assert not thieu, f"Chưa dùng clip: {thieu}"

    # ===== Mờ chồng & SFX =====
    chen.sort(key=lambda c: c["from"])
    for i, c in enumerate(chen):
        if c["mo"] and i > 0:
            p = chen[i - 1]
            if abs(p["from"] + p["dur"] - c["from"]) < 0.05:
                p["dur"] += 0.3  # cảnh trước kéo dài để mờ chồng
        if c["ra"]:
            c["dur"] += 0.3 if c["from"] + c["dur"] < tong - 0.1 else 0
    for c in chen:  # cảnh chèn mờ dần vào ngay sau cảnh MC → MC chạy thêm 0,3 s bên dưới
        if c["mo"]:
            for k in canh:
                if abs(k["from"] + k["dur"] - c["from"]) < 0.05:
                    k["dur"] += 0.3
    for i, c in enumerate(chen):
        if c["from"] < 0.01:
            continue
        lien = i > 0 and abs(chen[i - 1]["from"] + chen[i - 1]["dur"] - c["from"]) < 0.05
        if c["mo"]:
            sfx.append({"ten": "luot", "from": c["from"] - 0.25, "vol": 0.3})
        elif lien:
            n = sum(1 for x in sfx if x["ten"].startswith("go")) % 6 + 1
            sfx.append({"ten": f"go{n}", "from": c["from"], "vol": 0.28})
    for n, k in enumerate(chukhoa):
        loai = [d[0] for d in k["dong"]]
        if "tay" in loai:
            sfx.append({"ten": "shimmer", "from": k["from"], "vol": 0.4})
        elif "so" in loai:
            sfx.append({"ten": "ding", "from": k["from"] + 0.1, "vol": 0.25})
        else:
            sfx.append({"ten": "pop", "from": k["from"] + 0.1, "vol": 0.35})
    for x in the:
        sfx.append({"ten": "ding", "from": x["from"] + 0.25, "vol": 0.22})
    for c in chen:
        if c["k"] in ("0749", "0750", "0751", "0752"):
            sfx.append({"ten": "ding", "from": c["from"] + 0.6, "vol": 0.18})
    sfx.append({"ten": "chime", "from": logo_tu, "vol": 0.4})
    sfx.sort(key=lambda x: x["from"])
    gon = []
    for x in sfx:
        if gon and x["from"] - gon[-1]["from"] < 0.15:
            continue
        gon.append({**x, "from": max(0.0, x["from"]), "vol": round(x["vol"] * 0.33, 3)})
    assert not any(x["ten"] in ("whoosh", "swish") for x in gon)
    print("SFX:", dict(Counter(x["ten"] for x in gon)))

    # ===== Xuất đoạn bằng FFmpeg (speed ramp: PTS ra = K·ln(1 + A·t)) =====
    loc = LOC.format(w=W, h=H)
    for v in viec:
        dich = OUT / f"{v['ten']}.mp4"
        if dich.exists():
            continue
        s0, s1 = v["s0"], v["s1"]
        if v["ten"].startswith("mc_"):
            vf, L = f"{loc},fps=60", v["T"]
        else:
            L = v["L"]
            if abs(s1 - s0) < 1e-6:
                pts = f"(T/{s0:.5f})/TB"
            else:
                K = L / (s1 - s0)
                A = (s1 - s0) / (L * s0)
                pts = f"({K:.6f}*log(1{A:+.6f}*T))/TB"
            vf = f"setpts=PTS-STARTPTS,setpts={pts},{loc},fps=60,trim=duration={v['T']:.3f}"
        cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{v['vao']:.3f}", "-t", f"{L + 0.1:.3f}",
               "-i", str(nguon(v["k"])), "-vf", vf,
               "-af", f"atrim=duration={v['T']:.3f},aresample=48000",
               "-c:v", "libx264", "-preset", "medium", "-crf", "16" if K4 else "17",
               "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", str(dich)]
        print("→", dich.name, f"tốc độ {s0}→{s1}")
        subprocess.run(cmd, check=True)

    jpg = OUT / "ket_0756.jpg"
    if not jpg.exists():
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-sseof", "-0.1", "-i", str(OUT / "b_0756_1.mp4"),
                        "-frames:v", "1", "-q:v", "2", str(jpg)], check=True)
    data = {
        "anhCuoi": anh_cuoi, "tongGiay": round(tong, 3), "sfx": gon, "canh": canh, "chen": chen, "phuDe": phude,
        "chuKhoa": chukhoa, "the": the, "hookHet": hook_het,
        "thanhTen": {"from": ten_tu, "dur": tong - ten_tu},
        "logoCuoi": {"from": logo_tu, "dur": tong - logo_tu},
    }
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Tổng: {tong:.1f}s · {len(canh)} đoạn MC · {len(chen)} cảnh chèn · {len(chukhoa)} chữ khóa · "
          f"dùng {len(dem)}/24 clip")
    print("Phụ đề:", "".join(w["text"] for w in phude))


if __name__ == "__main__":
    main()
