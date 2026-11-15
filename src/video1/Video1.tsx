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
} from "remotion";
import type { Caption } from "@remotion/captions";
import { FONT, FONT_TAY } from "../fonts";
import { MAU, PhuDe } from "../BatDongSan";
import data from "./data.json";

export const FPS = 60;
export const TONG_KHUNG = Math.ceil(data.tongGiay * FPS);
const f = (giay: number) => Math.round(giay * FPS);

const BONG = "0 4px 18px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.5)";

// ===== Cảnh chính (MC nói) – có tiếng =====
const CanhChinh: React.FC<{ src: string; vao: number; zoom: number; dai: number }> = ({
  src,
  vao,
  zoom,
  dai,
}) => {
  const fade = 3; // mờ tiếng 3 khung để không bị "bụp" ở chỗ cắt
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={f(vao)}
        volume={(fr) => interpolate(fr, [0, fade, dai - fade, dai], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};

// ===== Cảnh chèn (flycam / phối cảnh) – không tiếng, zoom chậm =====
const CanhChen: React.FC<{ src: string; vao: number; mo: boolean }> = ({ src, vao, mo }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.07]);
  // Chỉ mờ dần khi chuyển từ cảnh MC; cảnh chèn nối tiếp nhau thì cắt thẳng
  const hien = mo ? interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ opacity: hien }}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={f(vao)}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }}
      />
    </AbsoluteFill>
  );
};

// ===== Chữ khóa kiểu video mẫu: chữ nhỏ nghiêng + CHỮ TO ĐẬM / số vàng / chữ viết tay =====
type Dong = [string, string];
const kieu = (loai: string): React.CSSProperties => {
  switch (loai) {
    case "nho":
      return { fontSize: 58, fontWeight: 300, fontStyle: "italic", color: "white" };
    case "so":
      return { fontSize: 128, fontWeight: 800, color: MAU.vangSo, letterSpacing: 1, lineHeight: 1.0 };
    case "tay":
      return { fontFamily: FONT_TAY, fontSize: 150, fontWeight: 700, color: MAU.vangKim, lineHeight: 1.0 };
    default:
      return { fontSize: 112, fontWeight: 800, fontStyle: "italic", color: "white", lineHeight: 1.02 };
  }
};

const ChuKhoa: React.FC<{ dong: Dong[]; vt: string }> = ({ dong, vt }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const ra = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const viTri: React.CSSProperties =
    vt === "trai"
      ? { left: 120, top: 250, alignItems: "flex-start", textAlign: "left" }
      : vt === "phai"
        ? { right: 120, top: 250, alignItems: "flex-end", textAlign: "right" }
        : { left: 0, right: 0, top: 260, alignItems: "center", textAlign: "center" };
  return (
    <div style={{ position: "absolute", display: "flex", flexDirection: "column", opacity: ra, ...viTri }}>
      {dong.map(([loai, chu], i) => {
        const v = spring({ frame: frame - i * 7, fps, config: { damping: 14, stiffness: 160 } });
        return (
          <div
            key={i}
            style={{
              ...kieu(loai),
              textShadow: BONG,
              opacity: Math.min(1, v * 1.4),
              transform: `translateY(${(1 - v) * 40}px) scale(${0.9 + 0.1 * v})`,
              whiteSpace: "nowrap",
            }}
          >
            {chu}
          </div>
        );
      })}
    </div>
  );
};

// ===== Khung thông tin / giá: trượt vào từ trái =====
const Khung: React.FC<{ tieuDe: string; muc: Dong[] }> = ({ tieuDe, muc }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const vao = spring({ frame, fps, config: { damping: 200 } });
  const ra = interpolate(frame, [durationInFrames - 0.35 * fps, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const x = (1 - vao) * -900 + ra * -900;
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        top: 230,
        transform: `translateX(${x}px)`,
        background: "rgba(0, 45, 42, 0.86)",
        borderLeft: `10px solid ${MAU.vangKim}`,
        borderRadius: 18,
        padding: "26px 38px 30px",
        minWidth: 520,
        boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ color: "#c9efe9", fontSize: 30, fontWeight: 600, letterSpacing: 3 }}>{tieuDe}</div>
      {muc.map(([loai, chu], i) => {
        const v = spring({ frame: frame - 8 - i * 6, fps, config: { damping: 200 } });
        const s: React.CSSProperties =
          loai === "gia"
            ? { color: MAU.vangSo, fontSize: 108, fontWeight: 800, lineHeight: 1.1 }
            : loai === "so"
              ? { color: MAU.vangSo, fontSize: 62, fontWeight: 800, lineHeight: 1.25 }
              : { color: "white", fontSize: 44, fontWeight: 600, lineHeight: 1.4 };
        return (
          <div key={i} style={{ ...s, opacity: v, transform: `translateX(${(1 - v) * -30}px)` }}>
            {chu}
          </div>
        );
      })}
    </div>
  );
};

// ===== Thanh tên + số điện thoại (đè lên cảnh MC chào) =====
const ThanhTen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = (tre: number) => spring({ frame: frame - tre, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        bottom: 190,
        transform: `translateX(${(1 - v(0)) * -1000}px)`,
        display: "flex",
        alignItems: "stretch",
        boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div style={{ width: 12, background: MAU.vangKim }} />
      <div style={{ background: `linear-gradient(135deg, ${MAU.xanhNgoc}F2, ${MAU.xanhNgocDam}F5)`, padding: "22px 40px 24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 28, opacity: v(8) }}>
          <span style={{ color: "white", fontSize: 58, fontWeight: 800 }}>Lâm Oanh</span>
          <span style={{ color: MAU.vangSo, fontSize: 64, fontWeight: 800, letterSpacing: 1 }}>0346 032 032</span>
        </div>
        <div style={{ color: "#e6fffb", fontSize: 32, fontWeight: 400, marginTop: 4, opacity: v(16) }}>
          Liên hệ trực tiếp từ văn phòng bán hàng CĐT Vinhomes
        </div>
      </div>
    </div>
  );
};

const Logo: React.FC<{ cao: number }> = ({ cao }) => (
  <div style={{ background: "rgba(255,255,255,0.88)", borderRadius: 14, padding: `${cao * 0.18}px ${cao * 0.3}px` }}>
    <Img src={staticFile("thuonghieu/logo.png")} style={{ height: cao, display: "block" }} />
  </div>
);

const LogoCuoi: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = spring({ frame, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ background: "#071a19", justifyContent: "center", alignItems: "center" }}>
      <div style={{ opacity: v, transform: `scale(${0.92 + 0.08 * v})` }}>
        <Logo cao={150} />
      </div>
    </AbsoluteFill>
  );
};

export const Video1: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black", fontFamily: FONT }}>
      {data.canh.map((c, i) =>
        c.src ? (
          <Sequence key={`c${i}`} from={f(c.from)} durationInFrames={f(c.dur)}>
            <CanhChinh src={c.src} vao={c.in ?? 0} zoom={c.zoom ?? 1} dai={f(c.dur)} />
          </Sequence>
        ) : null,
      )}
      {data.chen.map((c, i) => (
        <Sequence key={`b${i}`} from={f(c.from)} durationInFrames={f(c.dur)}>
          <CanhChen
            src={c.src}
            vao={c.in}
            mo={i === 0 || Math.abs(data.chen[i - 1].from + data.chen[i - 1].dur - c.from) > 0.05}
          />
        </Sequence>
      ))}
      {/* Tối nhẹ trên/dưới để chữ dễ đọc */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, transparent 25%, transparent 70%, rgba(0,0,0,0.40) 100%)",
        }}
      />
      {data.khung.map((k, i) => (
        <Sequence key={`k${i}`} from={f(k.from)} durationInFrames={f(k.dur)} layout="none">
          <Khung tieuDe={k.tieuDe} muc={k.muc as Dong[]} />
        </Sequence>
      ))}
      {data.chuKhoa.map((k, i) => (
        <Sequence key={`w${i}`} from={f(k.from)} durationInFrames={f(k.dur)} layout="none">
          <ChuKhoa dong={k.dong as Dong[]} vt={k.vt} />
        </Sequence>
      ))}
      <PhuDe phuDe={data.phuDe as Caption[]} coToiDa={44} day={42} />
      <Sequence from={f(data.thanhTen.from)} durationInFrames={f(data.thanhTen.dur)} layout="none">
        <ThanhTen />
      </Sequence>
      <Sequence durationInFrames={f(data.logoCuoi.from)} layout="none">
        <div style={{ position: "absolute", top: 36, right: 46, opacity: 0.8 }}>
          <Logo cao={58} />
        </div>
      </Sequence>
      <Sequence from={f(data.logoCuoi.from)}>
        <LogoCuoi />
      </Sequence>
    </AbsoluteFill>
  );
};
