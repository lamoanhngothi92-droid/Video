"""Chuẩn bị dữ liệu dựng Video 1 – Vịnh Xanh – Hồ Koi (theo storyboard v2).

Chạy:  .venv/bin/python scripts/dung_video1.py
Kết quả:
  public/v1/*.mp4      – clip đã phóng lên 1920x1080, chỉnh màu sáng/ấm/tươi
  src/video1/data.json – thời gian cắt, cảnh chèn, chữ khóa, phụ đề, khung thông tin
"""
import json
import subprocess
from pathlib import Path

GOC = Path("goc")
TN = Path("tainguyen")
PHUDE = Path("goc_phude")
OUT = Path("public/v1")
DATA = Path("src/video1/data.json")

PAD_TRUOC = 0.12  # giữ trước chữ đầu
PAD_SAU = 0.15  # giữ sau chữ cuối
LANG_TOI_DA = 0.4  # cắt khoảng lặng dài hơn


def goc(k):
    return GOC / f"dji_export_20261114_{k}_0.f_compose_0.MOV"


def tn(k):
    return TN / f"dji_export_20261114_{k}_0.f_compose_0.MOV"


# Sửa chữ Whisper nghe nhầm (theo kịch bản) – (vị trí chữ, chữ đúng); None = bỏ chữ
SUA = {
    "210054": {3: "cả", 4: "tỷ", 7: "xây", 17: "mua"},
    "210027": {27: "thịnh"},
    "205945": {3: "10,5", 4: None, 5: "ha,", 14: "compound", 15: None,
               20: "24/7.", 21: None, 22: None, 27: "Koi", 42: "sân", 43: "pickleball,",
               44: None, 45: None},
    "205904": {4: "144m²,", 29: "giữ", 40: "đại"},
    "205807": {15: "kính"},
}

# Bản gốc 4K tương ứng (dò bằng so khớp âm thanh, điểm khớp ≥ 0,96)
GOC_4K = {"205807": "0302", "205904": "0297", "205945": "0275", "210027": "0256", "210054": "0232"}
TN_4K = {"205614": "0313", "205624": "0312", "205633": "0309", "205643": "0306", "205705": "0305",
         "205729": "0304", "205757": "0303", "205821": "0298", "210114": "0228", "210131": "0224",
         "210213": "0222", "210240": "0220", "210258": "0219", "210308": "0218"}
# 210324 (cành thông + nắng, cảnh kết) chưa có bản 4K → dùng 205614 (cùng kiểu cảnh) đoạn sau

# Thứ tự cảnh chính (A-roll) theo kịch bản
THU_TU = ["210054", "210027", "205945", "205904", "205807"]


def doc_chu(k):
    f = next(PHUDE.glob(f"*{k}*.json"))
    chu = json.load(open(f, encoding="utf-8"))
    sua = SUA.get(k, {})
    out = []
    for i, w in enumerate(chu):
        t = sua.get(i, w["text"].strip())
        if t is None:
            out[-1]["end"] = w["endMs"] / 1000  # gộp thời gian vào chữ trước
            continue
        out.append({"i": i, "text": t, "start": w["startMs"] / 1000, "end": w["endMs"] / 1000})
    return out


def chia_doan(chu):
    """Chia 1 clip thành các đoạn nói, cắt khoảng lặng > 0,4 giây."""
    doan, cur = [], [chu[0]]
    for a, b in zip(chu, chu[1:]):
        if b["start"] - a["end"] > LANG_TOI_DA:
            doan.append(cur)
            cur = []
        cur.append(b)
    doan.append(cur)
    return [(max(0, d[0]["start"] - PAD_TRUOC), d[-1]["end"] + PAD_SAU, d) for d in doan]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    DATA.parent.mkdir(parents=True, exist_ok=True)

    # 1) Phóng to + chỉnh màu (sáng, ấm, tăng nhẹ bão hòa) bằng FFmpeg
    loc = (
        "scale=1920:1080:flags=lanczos,unsharp=5:5:0.5:5:5:0.0,"
        "eq=brightness=0.03:saturation=1.18:gamma=1.03,"
        "colorbalance=rs=0.03:gs=0.01:bs=-0.03:rm=0.02:bm=-0.02"
    )
    nguon = {f"goc_{k}": goc(k) for k in THU_TU}
    nguon.update({f"tn_{p.stem.split('_')[3]}": p for p in sorted(TN.glob("*.MOV"))})
    # Ưu tiên bản gốc 4K (goc4k/, tainguyen4k/). Bản gốc dài hơn bản xuất cũ 0,1s ở đầu
    # (đã dò bằng so khớp âm thanh) → cắt bỏ 0,1s để thời gian khớp y như cũ.
    ban4k = {**{f"goc_{k}": Path(f"goc4k/{v}.mp4") for k, v in GOC_4K.items()},
             **{f"tn_{k}": Path(f"tainguyen4k/{v}.mp4") for k, v in TN_4K.items()}}
    loc4k = loc.replace("unsharp=5:5:0.5:5:5:0.0,", "")  # 4K thu nhỏ đã rất nét, không cần làm nét
    for ten, p in nguon.items():
        dich = OUT / f"{ten}.mp4"
        p4k = ban4k.get(ten)
        dung4k = p4k is not None and p4k.exists()
        if not dich.exists():
            vao = ["-ss", "0.1", "-i", str(p4k)] if dung4k else ["-i", str(p)]
            subprocess.run(["ffmpeg", "-v", "error", "-y", *vao, "-vf", loc4k if dung4k else loc,
                            "-c:v", "libx264", "-preset", "medium", "-crf", "17",
                            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", str(dich)],
                           check=True)

    # 2) Dựng dòng thời gian
    canh, chen, phude, chukhoa, khung = [], [], [], [], []
    t = 0.0
    moc = {}  # (clip, chỉ số chữ gốc) -> thời điểm trên video

    def them_clip(k, punch_in_doan_sau=False):
        nonlocal t
        chu = doc_chu(k)
        for n, (a, b, ds) in enumerate(chia_doan(chu)):
            canh.append({"src": f"v1/goc_{k}.mp4", "from": t, "in": a, "dur": b - a, "dau": n == 0,
                         "zoom": 1.08 if (punch_in_doan_sau and n > 0) else 1.0})
            for w in ds:
                ws, we = t + w["start"] - a, t + w["end"] - a
                moc[(k, w["i"])] = (ws, we)
                phude.append({"text": " " + w["text"], "startMs": round(ws * 1000),
                              "endMs": round(we * 1000), "timestampMs": round(ws * 1000),
                              "confidence": 1})
            t += b - a

    def cen_canh(src_key, bat_dau, ket_thuc, vao=0.4):
        chen.append({"src": f"v1/tn_{src_key}.mp4", "from": bat_dau, "in": vao,
                     "dur": ket_thuc - bat_dau})

    def kw(k, i, dong, den=None, vt="trai", dur=None):
        s = moc[(k, i)][0]
        while den and den not in moc:  # chữ đã bị gộp khi sửa → lùi về chữ trước
            den = (den[0], den[1] - 1)
        e = moc[den][1] + 0.25 if den else s + (dur or 1.6)
        chukhoa.append({"from": s, "dur": e - s, "dong": dong, "vt": vt})

    # --- Cảnh 1–2: câu móc
    them_clip("210054")
    cen_canh("205643", moc[("210054", 14)][0] - 0.05, t)
    kw("210054", 2, [["nho", "Người ta bỏ"], ["so", "CẢ TỶ"]], den=("210054", 6), vt="trai")
    kw("210054", 8, [["nho", "để làm"], ["to", "HỒ KOI"]], den=("210054", 13), vt="phai")
    kw("210054", 14, [["nho", "ở đây"], ["to", "CÓ SẴN"]], den=("210054", 23), vt="giua")
    kw("210054", 24, [["nho", "ngay"], ["to", "TRƯỚC CỬA"]], den=("210054", 26), vt="giua")
    # --- Cảnh 3: chuyển cảnh không lời
    cen_canh("205614", t, t + 1.0)
    canh.append({"src": None, "from": t, "dur": 1.0})
    t += 1.0
    # --- Cảnh 4–5
    them_clip("210027")
    kw("210027", 11, [["nho", "có cá Koi là có"], ["tay", "Tài Lộc"]], den=("210027", 14), vt="trai")
    b0 = moc[("210027", 15)][0] - 0.05
    vx = moc[("210027", 32)][0] - 0.05  # "mà ở Vịnh Xanh, cộng đồng cư dân…"
    cen_canh("210240", b0, vx)
    # Phối cảnh toàn khu + chữ "Shophouse VỊNH XANH" (lấy từ video cũ "Thắng Oanh Shop Vịnh Xanh")
    chen.append({"src": "v1/tn_vinhxanh.mp4", "from": vx, "in": 0.0, "dur": 1.95})
    cen_canh("210258", vx + 1.95, t)
    kw("210027", 23, [["nho", "biểu tượng của"], ["to", "THỊNH VƯỢNG"]], den=("210027", 31), vt="giua")
    kw("210027", 46, [["nho", "cùng chung một"], ["to", "VẬN KHÍ"]], den=("210027", 50), vt="giua")
    # --- Cảnh 6–8
    them_clip("205945")
    # Giữ cảnh MC đi vào; khung thông tin dạng dải ngang phía trên để không che MC
    s = moc[("205945", 2)][0]
    khung.append({"from": s, "dur": 3.0, "tieuDe": "VỊNH XANH", "kieu": "ngang",
                  "muc": [["so", "10,5 ha"], ["so", "747 căn"], ["chu", "3 mặt giáp sông"]]})
    # Cảnh 2 MC nhìn ra hồ + dãy nhà phố (210114) cho câu "compound khép kín, an ninh 24/7"
    cen_canh("210114", moc[("205945", 14)][0] - 0.05, moc[("205945", 23)][0] - 0.05, vao=0.6)
    kw("205945", 18, [["to", "AN NINH"], ["so", "24/7"]], den=("205945", 20), vt="trai")
    kw("205945", 23, [["nho", "ngoài hồ Koi"], ["to", "CÒN GÌ?"]], den=("205945", 31), vt="phai")
    chum = [(36, "205624", "SUỐI CẠN"), (38, "205705", "VƯỜN YOGA"), (40, "205729", "TENNIS"),
            (42, "210308", "PICKLEBALL"), (46, "210213", None), (54, "205757", None)]
    vao_rieng = {"210213": 9.6}  # MC chỉ tay ra xa từ giây ~10 (ý bạn chọn)
    for n, (i, src, chu) in enumerate(chum):
        a = moc[("205945", i)][0] - 0.05
        b = moc[("205945", chum[n + 1][0])][0] - 0.05 if n + 1 < len(chum) else t
        cen_canh(src, a, b, vao=vao_rieng.get(src, 0.4))
        if chu:
            ket = chum[n + 1][0] - 1
            kw("205945", i, [["to", chu]], den=("205945", ket), vt="giua")
    kw("205945", 51, [["to", "VINCOM · VINMEC · VINSCHOOL"]], den=("205945", 53), vt="giua")
    kw("205945", 55, [["nho", "đặc biệt"], ["to", "MEGA GRAND WORLD"]], den=("205945", 60), vt="giua")
    # --- Cảnh 9–10: giá (đoạn sau có punch-in để che chỗ cắt)
    them_clip("205904", punch_in_doan_sau=True)
    s = moc[("205904", 5)][0]
    khung.append({"from": s, "dur": 3.0, "tieuDe": "GIÁ CHỈ TỪ",
                  "muc": [["gia", "23 tỷ"], ["chu", "Song lập 144 m²"], ["chu", "Vay 70%"]]})
    kw("205904", 19, [["nho", "hỗ trợ lãi suất"], ["so", "18 THÁNG"]], den=("205904", 24), vt="phai")
    kw("205904", 27, [["nho", "giữ căn chỉ"], ["so", "300 TRIỆU"]], den=("205904", 30), vt="phai")
    cen_canh("205633", moc[("205904", 45)][0] - 0.05, t)
    kw("205904", 45, [["nho", "phải"], ["to", "ĐI XEM NGAY"]], den=("205904", 48), vt="giua")
    # --- Cảnh 11–13: kết
    them_clip("205807")
    ten_tu = moc[("205807", 0)][0]
    kw("205807", 9, [["nho", "văn phòng bán hàng"], ["to", "VINHOMES"]], den=("205807", 16), vt="giua")
    cen_canh("205614", t, t + 4.5, vao=4.6)
    canh.append({"src": None, "from": t, "dur": 4.5})
    t += 4.5
    logo_tu = t
    t += 1.2

    # 3) Lưới nhịp nhạc 124 BPM: cảnh chèn đổi đúng nhịp (xê dịch tối đa 0,2s)
    PHACH = 60 / 124
    O_NHIP = 4 * PHACH
    def bat_nhip(x):
        g = round(x / PHACH) * PHACH
        return g if abs(g - x) <= 0.2 else x
    chen.sort(key=lambda c: c["from"])
    lo_trong = [(c["from"], c["from"] + c["dur"]) for c in canh if not c["src"]]
    for c in chen:
        # cảnh chèn che chỗ không có hình MC thì giữ nguyên, tránh lộ màn đen
        if any(abs(c["from"] - a) < 0.05 or abs(c["from"] + c["dur"] - b) < 0.05 for a, b in lo_trong):
            continue
        dau, cuoi = bat_nhip(c["from"]), bat_nhip(c["from"] + c["dur"])
        c["in"] += max(0.0, dau - c["from"]) if dau > c["from"] else 0.0
        c["from"], c["dur"] = dau, cuoi - dau
    NHAC_BUNG = 3 * O_NHIP  # nhạc bùng ở ô nhịp thứ 3 (khớp scripts/taonhac.py --intro 3)
    # Ô nhịp để hình MC "nhún" nhẹ theo nhạc (chỉ khi nhạc sôi động)
    nhip = [round(b * O_NHIP, 3) for b in range(3, int(t / O_NHIP) + 1)
            if not (18 <= b < 20)]

    # 4) Hiệu ứng chuyển cảnh + âm thanh hiệu ứng (SFX)
    sfx, chuyen = [], []
    for i, c in enumerate(chen):
        lien = i > 0 and abs(chen[i - 1]["from"] + chen[i - 1]["dur"] - c["from"]) < 0.05
        c["mo"] = not lien
        if lien:
            sfx.append({"ten": "swish", "from": c["from"] - 0.05, "vol": 0.35})
        else:
            sfx.append({"ten": "whoosh", "from": c["from"] - 0.2, "vol": 0.4})
    for c in canh:  # đầu mỗi đoạn MC mới (trừ đoạn đầu) có vệt sáng chuyển cảnh
        if c["src"] and c["from"] > 0 and c.get("dau"):
            chuyen.append({"from": c["from"]})
            sfx.append({"ten": "whoosh", "from": c["from"] - 0.25, "vol": 0.35})
    for n, k in enumerate(chukhoa):
        loai = [d[0] for d in k["dong"]]
        if n == 0:
            sfx.append({"ten": "impact", "from": k["from"], "vol": 0.55})
        elif "tay" in loai:
            sfx.append({"ten": "shimmer", "from": k["from"], "vol": 0.4})
        elif "so" in loai:
            sfx.append({"ten": "ding", "from": k["from"] + 0.1, "vol": 0.22})
        elif len(k["dong"]) > 1:
            sfx.append({"ten": "pop", "from": k["from"] + 0.1, "vol": 0.4})
    for k in khung:
        sfx.append({"ten": "whoosh", "from": k["from"] - 0.1, "vol": 0.35})
        sfx.append({"ten": "ding", "from": k["from"] + 0.35, "vol": 0.22})
    sfx.append({"ten": "whoosh", "from": ten_tu - 0.1, "vol": 0.25})
    sfx.append({"ten": "chime", "from": logo_tu, "vol": 0.4})
    # bỏ âm trùng nhau quá sát (< 0,15s)
    sfx.sort(key=lambda x: x["from"])
    loc_sfx = []
    for x in sfx:
        gan = 0.4 if x["ten"] == "whoosh" else 0.15
        if loc_sfx and x["ten"] == loc_sfx[-1]["ten"] and x["from"] - loc_sfx[-1]["from"] < gan:
            continue
        # tiếng hiệu ứng nhỏ hơn giọng MC khoảng 8–10 dB
        loc_sfx.append({**x, "from": max(0.0, x["from"]), "vol": round(x["vol"] * (0.25 if x["ten"] == "impact" else 0.33), 3)})

    data = {
        "tongGiay": round(t, 3),
        "sfx": loc_sfx, "chuyen": chuyen, "nhip": nhip, "nhacBung": NHAC_BUNG,
        "canh": canh, "chen": chen, "phuDe": phude, "chuKhoa": chukhoa, "khung": khung,
        "thanhTen": {"from": ten_tu, "dur": logo_tu - ten_tu},
        "logoCuoi": {"from": logo_tu, "dur": t - logo_tu},
    }
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Tổng thời lượng: {t:.1f} giây · {len(canh)} cảnh chính · {len(chen)} cảnh chèn · "
          f"{len(chukhoa)} chữ khóa · {len(phude)} chữ phụ đề")
    print("Phụ đề:", "".join(w["text"] for w in phude))


if __name__ == "__main__":
    main()
