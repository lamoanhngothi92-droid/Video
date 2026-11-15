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
    for ten, p in nguon.items():
        dich = OUT / f"{ten}.mp4"
        if not dich.exists():
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(p), "-vf", loc,
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
            canh.append({"src": f"v1/goc_{k}.mp4", "from": t, "in": a, "dur": b - a,
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
    giua = moc[("210027", 36)][0] - 0.05
    cen_canh("210240", b0, giua)
    cen_canh("210258", giua, t)
    kw("210027", 23, [["nho", "biểu tượng của"], ["to", "THỊNH VƯỢNG"]], den=("210027", 31), vt="giua")
    kw("210027", 46, [["nho", "cùng chung một"], ["to", "VẬN KHÍ"]], den=("210027", 50), vt="giua")
    # --- Cảnh 6–8
    them_clip("205945")
    s = moc[("205945", 2)][0]
    khung.append({"from": s, "dur": 2.8, "tieuDe": "VỊNH XANH",
                  "muc": [["so", "10,5 ha"], ["so", "747 căn"], ["chu", "3 mặt giáp sông"]]})
    kw("205945", 18, [["to", "AN NINH"], ["so", "24/7"]], den=("205945", 20), vt="phai")
    kw("205945", 23, [["nho", "ngoài hồ Koi"], ["to", "CÒN GÌ?"]], den=("205945", 31), vt="phai")
    chum = [(36, "205624", "SUỐI CẠN"), (38, "205705", "VƯỜN YOGA"), (40, "205729", "TENNIS"),
            (42, "210308", "PICKLEBALL"), (46, "210213", None), (54, "205757", None)]
    for n, (i, src, chu) in enumerate(chum):
        a = moc[("205945", i)][0] - 0.05
        b = moc[("205945", chum[n + 1][0])][0] - 0.05 if n + 1 < len(chum) else t
        cen_canh(src, a, b)
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
    cen_canh("210324", t, t + 4.5)
    canh.append({"src": None, "from": t, "dur": 4.5})
    t += 4.5
    logo_tu = t
    t += 1.2

    data = {
        "tongGiay": round(t, 3),
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
