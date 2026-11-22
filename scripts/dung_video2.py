"""Chuẩn bị dữ liệu dựng Video 2 – Vinhomes Phố Hiến – 3 câu khách hỏi (dọc 9:16).

Chạy:  python3 scripts/dung_video2.py
Nguồn (đã chỉnh màu, chạy lệnh FFmpeg trong README/skill):
  public/v2/mc_1080.mp4, mc_2160.mp4   – bản nháp MC không bảng CSBH (goc4k/1121.mov, khớp từng khung với pho_hien_mc.mov)
  public/v2/phu_1080.mp4, phu_2160.mp4 – cảnh phụ sa bàn (thay đoạn dính cốc nước)
  public/v2/tienich/*.jpg              – ảnh tiện ích (Wikimedia Commons, CC) + ảnh sân thể thao cắt từ bản nháp
Kết quả: src/video2/data.json (khung 1080x1920; xuất 4K bằng --scale=2)
"""
import json
from pathlib import Path

PHUDE = Path("goc4k/pho_hien_mc.json")
DATA = Path("src/video2/data.json")
XF = 0.3  # mờ chồng giữa các đoạn

# Sửa chữ Whisper nghe nhầm theo kịch bản: chỉ số chữ -> chữ đúng; None = gộp vào chữ trước
SUA = {
    8: "Vinhomes", 45: "Yên –", 48: "80,5m,", 49: None, 51: "Thành", 106: "vay", 107: "0%", 108: None,
    110: "lời", 111: "nhất?", 121: "vô", 130: "vay", 173: "7,5%", 174: None, 175: None, 193: "Vinhomes,", 196: "30%", 197: None,
    202: "động", 215: "dòng", 216: "tiền", 229: "Phố", 230: "Hiến,", 234: "tới", 248: "Vinhomes,",
}
BO_TU = 252  # từ chữ này trở đi là Whisper nghe nhầm ("Hãy subscribe…") → bỏ

# Các đoạn lấy từ bản nháp (giây trong file gốc). Bản nháp có sẵn chuyển cảnh mờ chồng ở
# 16,5–17,5 / 29,7–30,1 / 41,47–41,75 / 47,5–49 / 77,3–77,6 → cắt ngoài các đoạn đó.
DOAN = [
    (0.00, 18.40),   # câu móc + câu 1 (+ cảnh sảnh kính không lời cuối đoạn)
    (29.36, 41.40),  # câu 2 (phần đầu 29,36–30,15 còn hình sa bàn có cốc nước → che bằng cảnh phụ)
    (46.90, 73.55),  # Thắng trước logo Vinhomes (không lời) → câu 3
    (75.90, 86.70),  # sa bàn bên cửa kính (không lời) → 2 MC chốt + chào
]
PHU_CHEN = 2.4   # giây cảnh phụ đứng riêng giữa đoạn 1 và 2
KET = 2.4        # giây cảnh kết "Lâm Oanh Vinhomes" mờ mờ (hình MC dừng lại)


def doc_chu():
    chu = json.load(open(PHUDE, encoding="utf-8"))[:BO_TU]
    out = []
    for i, w in enumerate(chu):
        t = SUA.get(i, w["text"].strip())
        if t is None:
            out[-1]["end"] = w["endMs"] / 1000
            continue
        out.append({"i": i, "text": t, "start": w["startMs"] / 1000, "end": w["endMs"] / 1000})
    return out


def main():
    DATA.parent.mkdir(parents=True, exist_ok=True)
    chu = doc_chu()
    canh, phude = [], []
    moc = {}
    t = 0.0
    for n, (a, b) in enumerate(DOAN):
        if n == 1:
            t += PHU_CHEN
        elif n > 0:
            t -= XF  # đoạn sau bắt đầu sớm 0,3s để mờ chồng
        canh.append({"src": "mc", "from": round(t, 3), "in": a, "dur": round(b - a, 3), "mo": n > 1})
        for w in chu:
            if a <= w["start"] < b:
                ws, we = t + w["start"] - a, t + w["end"] - a
                moc[w["i"]] = (ws, we)
                phude.append({"text": " " + w["text"], "startMs": round(ws * 1000), "endMs": round(we * 1000),
                              "timestampMs": round(ws * 1000), "confidence": 1})
        if n == 0:
            het_doan1 = t + (b - a)
        t += b - a
    ket_tu = t
    t += KET
    T = lambda i: moc[i][0]
    E = lambda i: moc[i][1]

    # Cảnh phụ sa bàn: mờ chồng từ cuối đoạn 1, che luôn phần sa bàn có cốc nước đầu đoạn 2
    d2 = canh[1]["from"]
    # (người dùng yêu cầu: thay các cảnh sa bàn bị ngược sáng bằng cảnh phụ)
    # 1) Ngược sáng cửa kính 16,6–18,4 + đoạn cốc nước → Oanh đi dọc sa bàn (cảnh phụ từ giây 1,0)
    bd1 = 16.6
    chen = [{"src": "phu", "from": bd1, "in": 1.0, "dur": round(d2 + 0.85 - bd1, 3), "mo": True, "ra": True}]
    # 2) Sa bàn bên cửa kính ngược sáng đầu đoạn 4 (75,9–77,6 trong bản nháp) → lia sa bàn (cảnh phụ từ giây 10,5)
    d4 = canh[3]
    chen.append({"src": "phu", "from": d4["from"], "in": 10.5, "dur": round(77.75 - d4["in"], 3), "mo": True, "ra": True})

    # Chữ khóa: (từ chữ, đến chữ, dòng, vị trí y (khung 1080x1920), căn)
    chukhoa = []

    def kw(i, den, dong, y, can="giua", them=0.25, trai=30):
        chukhoa.append({"from": round(T(i), 3), "dur": round(E(den) + them - T(i), 3), "dong": dong, "y": y, "can": can,
                        "trai": trai})

    kw(0, 10, [["nho", "Có"], ["so", "3"], ["to", "CÂU HỎI"], ["br", ""], ["nho", "về"], ["to2", "VINHOMES PHỐ HIẾN"]], 300, them=0.05)
    kw(11, 19, [["tay", "ai cũng"], ["br", ""], ["tay", "hiểu sai"]], 820, them=-0.12, trai=650)
    kw(20, 26, [["nho", "Thứ nhất"], ["br", ""], ["to", "VỊ TRÍ CÓ ĐẸP?"]], 250)
    kw(59, 65, [["nho", "Câu thứ hai"], ["br", ""], ["to", "Ở CÓ TIỆN?"]], 280)
    kw(82, 88, [["nho", "tất cả"], ["br", ""], ["to", "TRONG NỘI KHU"]], 270)
    kw(89, 97, [["nho", "đi học · đi khám · đi chợ"]], 300, them=0.1)
    kw(98, 103, [["tay", "không cần ra ngoài"]], 300, them=0.6)
    kw(104, 111, [["nho", "Thứ ba"], ["br", ""], ["to", "VAY"], ["so", "0%"], ["br", ""], ["to", "LÀ LỜI NHẤT?"]], 250)
    kw(112, 116, [["tay", "Chưa chắc đâu!"]], 270, them=0.5)
    kw(117, 124, [["nho", "chính sách"], ["br", ""], ["to", "VÔ CÙNG LINH HOẠT"]], 270)
    kw(171, 176, [["nho", "thanh toán sớm"], ["br", ""], ["to", "CHIẾT KHẤU"], ["so", "7,5%"]], 270)
    kw(212, 218, [["tay", "Mỗi nhà"], ["br", ""], ["to", "MỘT DÒNG TIỀN"]], 280, them=0.4)

    # Khung thông tin trượt từ trái (cạnh MC). Mỗi mục hiện đúng lúc MC nói
    khung = []

    def kh(i, den, tieu_de, muc, y, them=0.6):
        khung.append({"from": round(T(i) - 0.1, 3), "dur": round(E(den) + them - T(i) + 0.1, 3), "tieuDe": tieu_de,
                      "y": y, "muc": [{"at": round(T(j) - T(i) + 0.1, 3), "loai": l, "chu": c} for j, l, c in muc]})

    kh(27, 58, "VINHOMES PHỐ HIẾN", [
        (30, "so", "303 căn"), (32, "chu", "liền kề thấp tầng"), (36, "chu", "Giáp 3 mặt đường:"),
        (42, "duong", "Cao tốc HY – TB|80,5m"), (50, "duong", "Đường Thành phố|47m"), (54, "duong", "Đại lộ Thương Cảng|34m"),
    ], 600, them=0.8)
    kh(125, 159, "TÀI CHÍNH LINH HOẠT", [
        (129, "duong", "Vay đến|70%"), (138, "chu", "Vốn tự có: phần nhỏ"),
        (145, "chu", "Lãi suất cố định thấp"), (154, "duong", "Hỗ trợ lãi suất|0%"),
    ], 255)
    kh(185, 211, "ƯU ĐÃI ĐI KÈM", [
        (186, "duong", "Tặng phí quản lý|24 tháng"), (192, "duong", "Voucher Vinhomes|30%"),
        (205, "duong", "Hạn đến|31/12/2026"),
    ], 255, them=1.2)

    # Khung ảnh tiện ích (nửa trên, phủ đúng vùng ảnh chèn sẵn của bản nháp)
    anh = []
    ds = [(66, "vinschool", "Trường mầm non", "VINSCHOOL", True),
          (68, "yte", "Chăm sóc sức khỏe", "TRẠM Y TẾ", True),
          (71, "tttm", "Mua sắm – giải trí", "TRUNG TÂM THƯƠNG MẠI", True),
          (75, "thethao", "Vận động mỗi ngày", "SÂN THỂ THAO", False),
          (78, "sacxe", "Xanh – tiện lợi", "TRỤ SẠC XE ĐIỆN", True)]
    for n, (i, ten, nho, to, web) in enumerate(ds):
        a0 = T(i) - 0.08
        a1 = (T(ds[n + 1][0]) - 0.08 + 0.2) if n + 1 < len(ds) else T(82) - 0.05
        anh.append({"src": f"v2/tienich/{ten}.jpg", "from": round(a0, 3), "dur": round(a1 - a0, 3),
                    "nho": nho, "to": to, "web": web})

    # Âm thanh hiệu ứng nhẹ
    sfx = []
    for c in canh[1:]:
        sfx.append({"ten": "luot", "from": c["from"] - 0.2, "vol": 0.1})
    sfx.append({"ten": "luot", "from": chen[0]["from"] - 0.1, "vol": 0.1})
    for n, k in enumerate(chukhoa):
        loai = [d[0] for d in k["dong"]]
        ten = "shimmer" if "tay" in loai else ("ding" if "so" in loai else "pop")
        sfx.append({"ten": ten, "from": k["from"] + 0.08, "vol": 0.13 if ten != "pop" else 0.12})
    for k in khung:
        sfx.append({"ten": "luot", "from": k["from"] - 0.1, "vol": 0.09})
        for n, m in enumerate(k["muc"][1:]):
            sfx.append({"ten": f"go{n % 6 + 1}", "from": k["from"] + m["at"], "vol": 0.09})
    for n, x in enumerate(anh):
        sfx.append({"ten": f"go{n + 1}", "from": x["from"] + 0.04, "vol": 0.1})
    sfx.append({"ten": "chime", "from": ket_tu + 0.1, "vol": 0.13})
    sfx.sort(key=lambda x: x["from"])
    loc = []
    for x in sfx:
        if loc and x["ten"] == loc[-1]["ten"] and x["from"] - loc[-1]["from"] < 0.3:
            continue
        loc.append({**x, "from": round(max(0.0, x["from"]), 3)})

    data = {
        "tongGiay": round(t, 3), "canh": canh, "chen": chen, "phuDe": phude, "chuKhoa": chukhoa,
        "khung": khung, "anh": anh, "sfx": loc,
        "thanhTen": {"from": round(T(235) - 0.1, 3), "dur": round(ket_tu - T(235) + 0.1, 3)},
        "ket": {"from": round(ket_tu, 3), "dur": KET},
    }
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    from collections import Counter
    print(f"Tổng: {t:.1f}s · {len(canh)} đoạn · {len(chukhoa)} chữ khóa · {len(khung)} khung · {len(anh)} ảnh")
    print("SFX:", dict(Counter(x["ten"] for x in loc)))
    print("Phụ đề:", "".join(w["text"] for w in phude))


if __name__ == "__main__":
    main()
