import { useMemo } from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  type CalculateMetadataFunction,
} from "remotion";
import type { Caption } from "@remotion/captions";
import { parseMedia } from "@remotion/media-parser";
import { FONT } from "./fonts";

// ===== Màu thương hiệu (xem CLAUDE.md) =====
export const MAU = {
  vangSo: "#FFD400", // tô con số trong phụ đề
  xanhNgoc: "#00A19A", // màu chủ đạo
  xanhNgocDam: "#00534F",
  vangKim: "#D4AF37", // màu phụ
  xanhDuongNgoc: "#1ECBE1", // chữ khóa to (giống video cũ của kênh)
};

export type BatDongSanProps = {
  video: string; // file trong thư mục public/
  logo?: string; // ví dụ "tainguyen/logo.png" (trong public/), bỏ trống nếu chưa có
  cauMoc: string; // chữ to giữa màn hình 3 giây đầu
  tieuDe: string;
  diaChi: string;
  gia: string;
  thongTin: string[]; // ví dụ ["2 phòng ngủ", "70 m²", "View biển"]
  giaHienTuGiay: number; // khung giá bắt đầu hiện ở giây thứ mấy
  ten: string;
  soDienThoai: string;
  cauKetThuc: string;
  phuDe: Caption[]; // từ file .json do scripts/phude.py tạo ra
};

export const FPS = 60;
const GIAY_KET = 3;

// Độ dài video = độ dài file quay gốc
export const tinhThoiLuong: CalculateMetadataFunction<BatDongSanProps> = async ({
  props,
}) => {
  const { slowDurationInSeconds } = await parseMedia({
    src: staticFile(props.video),
    fields: { slowDurationInSeconds: true },
  });
  return { durationInFrames: Math.ceil(slowDurationInSeconds * FPS) };
};

// ===== 3 giây đầu: câu móc chữ to giữa màn hình =====
const CauMoc: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vao = spring({ frame, fps, config: { damping: 200 } });
  const ra = interpolate(frame, [2.5 * fps, 3 * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 200px",
        opacity: ra,
        background: `rgba(0,0,0,${0.35 * ra})`,
      }}
    >
      <div
        style={{
          transform: `scale(${0.85 + 0.15 * vao})`,
          opacity: vao,
          textAlign: "center",
          color: "white",
          fontSize: 120,
          fontWeight: 800,
          lineHeight: 1.15,
          textShadow: "0 6px 24px rgba(0,0,0,0.6)",
        }}
      >
        {text}
        <div
          style={{
            height: 10,
            width: `${vao * 60}%`,
            background: MAU.vangKim,
            margin: "28px auto 0",
            borderRadius: 5,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ===== Khung giá: trượt vào từ trái, hiện ~2,5 giây rồi trượt ra =====
const KhungGia: React.FC<Pick<BatDongSanProps, "gia" | "thongTin">> = ({
  gia,
  thongTin,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const vao = spring({ frame, fps, config: { damping: 200 } });
  const ra = interpolate(frame, [durationInFrames - 0.4 * fps, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const x = (1 - vao) * -1000 + ra * -1000;
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        width: 720,
        top: 220,
        transform: `translateX(${x}px)`,
        background: "rgba(0, 40, 38, 0.85)",
        borderLeft: `12px solid ${MAU.vangKim}`,
        borderRadius: 20,
        padding: "28px 36px",
      }}
    >
      <div style={{ color: "#d1fae5", fontSize: 36, fontWeight: 600, letterSpacing: 2 }}>
        GIÁ CHỈ TỪ
      </div>
      <div style={{ color: MAU.vangSo, fontSize: 110, fontWeight: 800, lineHeight: 1.1 }}>
        {gia}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
        {thongTin.map((t) => (
          <div
            key={t}
            style={{
              border: `2px solid ${MAU.vangKim}`,
              color: "white",
              fontSize: 36,
              fontWeight: 600,
              padding: "6px 22px",
              borderRadius: 999,
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== Phụ đề: tối đa 2 dòng x 7 chữ, con số tô vàng =====
const CHU_MOI_DONG = 7;
const SO_DONG = 2;

const laConSo = (w: string) =>
  /\d/.test(w) || /^(tỷ|triệu|nghìn|ngàn|m2|m²|km|%|phút|mét)[.,!?]?$/i.test(w.trim());

type Trang = { batDau: number; ketThuc: number; dong: Caption[][] };

const vietHoa = (w?: Caption) => !!w && /^\p{Lu}/u.test(w.text.trim());

// Chia 1 trang thành tối đa 2 dòng cân nhau, không tách tên riêng (VD "Hạ Long Xanh")
const chiaDong = (tu: Caption[]): Caption[][] => {
  const soKyTu = tu.map((w) => w.text).join("").trim().length;
  if (tu.length <= CHU_MOI_DONG && soKyTu <= 28) return [tu];
  let cat = Math.ceil(tu.length / 2);
  const hopLe = (i: number) => i > 0 && i < tu.length && i <= CHU_MOI_DONG && tu.length - i <= CHU_MOI_DONG;
  // ưu tiên ngắt ngay sau dấu phẩy gần giữa nhất
  const sauPhay = tu
    .map((_, i) => i)
    .filter((i) => hopLe(i) && /,$/.test(tu[i - 1].text.trim()))
    .sort((a, b) => Math.abs(a - cat) - Math.abs(b - cat));
  if (sauPhay.length) return [tu.slice(0, sauPhay[0]), tu.slice(sauPhay[0])];
  const tachTen = (i: number) => vietHoa(tu[i - 1]) && vietHoa(tu[i]);
  for (const d of [0, -1, 1, -2, 2]) {
    const i = cat + d;
    if (hopLe(i) && !tachTen(i)) {
      cat = i;
      break;
    }
  }
  return [tu.slice(0, cat), tu.slice(cat)];
};

const chiaTrang = (phuDe: Caption[]): Trang[] => {
  const trang: Trang[] = [];
  let hienTai: Caption[] = [];
  const dong = () => {
    if (!hienTai.length) return;
    trang.push({
      batDau: hienTai[0].startMs,
      ketThuc: hienTai[hienTai.length - 1].endMs,
      dong: chiaDong(hienTai),
    });
    hienTai = [];
  };
  phuDe.forEach((w, i) => {
    const truoc = phuDe[i - 1];
    const ngatCau = truoc && /[.!?]$/.test(truoc.text.trim());
    const nghi = truoc && w.startMs - truoc.endMs > 600;
    const ngatPhay = truoc && /,$/.test(truoc.text.trim()) && hienTai.length >= 4;
    let day = hienTai.length >= CHU_MOI_DONG * SO_DONG;
    // trang đầy nhưng đang giữa tên riêng: lùi 1 trang trước tên đó
    if (day && vietHoa(w) && vietHoa(truoc)) {
      let j = hienTai.length;
      while (j > 1 && vietHoa(hienTai[j - 1])) j--;
      const conLai = hienTai.splice(j);
      dong();
      hienTai = conLai;
      day = false;
    }
    if (ngatCau || nghi || day || ngatPhay) dong();
    hienTai.push(w);
  });
  dong();
  // giữ trang trên màn hình tới khi trang sau bắt đầu
  trang.forEach((t, i) => {
    if (trang[i + 1]) t.ketThuc = trang[i + 1].batDau;
  });
  return trang;
};

const hienThi = (w: string) => w.replace(/(\d)m2\b/g, "$1m²");

// Cỡ chữ tự nhỏ lại khi dòng dài, để luôn nằm gọn trong 1 dòng
const coChu = (dong: Caption[][]) => {
  const dai = Math.max(...dong.map((d) => d.map((w) => w.text).join("").trim().length));
  return Math.min(64, Math.floor(1500 / (dai * 0.56)));
};

export const PhuDe: React.FC<{ phuDe: Caption[]; coToiDa?: number; day?: number }> = ({
  phuDe,
  coToiDa = 64,
  day = 80,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const trang = useMemo(() => chiaTrang(phuDe), [phuDe]);
  const t = trang.find((p) => ms >= p.batDau && ms < p.ketThuc);
  if (!t) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: day, // 1/3 dưới khung ngang 1920x1080
        left: 160,
        right: 160,
        textAlign: "center",
        fontSize: Math.min(coToiDa, coChu(t.dong)),
        fontWeight: 800,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        color: "white",
        WebkitTextStroke: "9px black",
        paintOrder: "stroke",
        textShadow: "0 4px 12px rgba(0,0,0,0.6)",
      }}
    >
      {t.dong.map((d, i) => (
        <div key={i}>
          {d.map((w) => (
            <span
              key={w.startMs}
              style={{
                color: laConSo(w.text) ? MAU.vangSo : "white",
                opacity: ms >= w.startMs ? 1 : 0.75,
              }}
            >
              {hienThi(w.text)}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

// ===== 3 giây cuối: tên + số điện thoại + câu kêu gọi =====
const KetThuc: React.FC<Pick<BatDongSanProps, "ten" | "soDienThoai" | "cauKetThuc">> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nen = interpolate(frame, [0, 0.3 * fps], [0, 1], { extrapolateRight: "clamp" });
  const hien = (tre: number) => spring({ frame: frame - tre * (fps / 30), fps, config: { damping: 200 } });
  const muc = (tre: number): React.CSSProperties => ({
    opacity: hien(tre),
    transform: `translateY(${(1 - hien(tre)) * 40}px)`,
  });
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${MAU.xanhNgoc}EE, ${MAU.xanhNgocDam}F5)`,
        opacity: nen,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        color: "white",
        padding: "0 90px",
      }}
    >
      <div style={{ ...muc(4), fontSize: 100, fontWeight: 800 }}>{p.ten}</div>
      <div style={{ ...muc(8), height: 6, width: 220, background: MAU.vangKim, margin: "24px 0" }} />
      <div style={{ ...muc(12), fontSize: 130, fontWeight: 800, color: MAU.vangSo, letterSpacing: 2 }}>
        {p.soDienThoai.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}
      </div>
      <div style={{ ...muc(18), fontSize: 50, fontWeight: 600, marginTop: 36, lineHeight: 1.35, textWrap: "balance" }}>
        {p.cauKetThuc}
      </div>
    </AbsoluteFill>
  );
};

export const BatDongSan: React.FC<BatDongSanProps> = (p) => {
  const { durationInFrames, fps } = useVideoConfig();
  const ketThucTu = durationInFrames - GIAY_KET * fps;
  return (
    <AbsoluteFill style={{ backgroundColor: "black", fontFamily: FONT }}>
      {/* Màu hình: sáng, ấm, hơi tăng độ bão hòa */}
      <OffthreadVideo
        src={staticFile(p.video)}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(1.05) saturate(1.18) sepia(0.06)" }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 22%, transparent 65%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* Tiêu đề hiện sau câu móc */}
      <Sequence from={3 * fps} durationInFrames={ketThucTu - 3 * fps} layout="none">
        <TieuDe tieuDe={p.tieuDe} diaChi={p.diaChi} />
      </Sequence>

      <Sequence from={Math.round(p.giaHienTuGiay * fps)} durationInFrames={Math.round(2.5 * fps)} layout="none">
        <KhungGia gia={p.gia} thongTin={p.thongTin} />
      </Sequence>

      <Sequence durationInFrames={ketThucTu} layout="none">
        <PhuDe phuDe={p.phuDe} />
      </Sequence>

      <Sequence durationInFrames={3 * fps}>
        <CauMoc text={p.cauMoc} />
      </Sequence>

      <Sequence from={ketThucTu}>
        <KetThuc ten={p.ten} soDienThoai={p.soDienThoai} cauKetThuc={p.cauKetThuc} />
      </Sequence>

      {p.logo ? (
        // Logo chữ xanh đậm → đặt trên nền trắng mờ để đọc được trên mọi cảnh
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 50,
            opacity: 0.8,
            background: "rgba(255,255,255,0.85)",
            borderRadius: 14,
            padding: "12px 20px",
          }}
        >
          <Img src={staticFile(p.logo)} style={{ height: 64, display: "block" }} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const TieuDe: React.FC<{ tieuDe: string; diaChi: string }> = ({ tieuDe, diaChi }) => {
  const frame = useCurrentFrame();
  const hien = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        top: 50,
        left: 70,
        right: 500,
        opacity: hien,
        color: "white",
        textShadow: "0 3px 12px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15 }}>{tieuDe}</div>
      <div style={{ fontSize: 32, fontWeight: 400, marginTop: 8, color: "#e0f2f1" }}>{diaChi}</div>
    </div>
  );
};
