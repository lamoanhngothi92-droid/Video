// Video 2 – Vinhomes Phố Hiến – 3 câu khách hỏi nhiều nhất. Khung dọc 1080x1920 (xuất 4K: --scale=2).
import {
  AbsoluteFill,
  Audio,
  Easing,
  Freeze,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Caption } from "@remotion/captions";
import { useMemo } from "react";
import { FONT, FONT_TAY } from "../fonts";
import { chiaTrang, hienThi, laConSo } from "../BatDongSan";
import data from "./data.json";

export const FPS = 30;
export const TONG_KHUNG = Math.ceil(data.tongGiay * FPS);
const f = (giay: number) => Math.round(giay * FPS);
const XF = 9; // 0,3s mờ chồng

export type Video2Props = { nguon: "1080" | "2160" };

// Màu chữ kiểu hot trend: xanh dương ngọc + vàng cam
const NGOC = "#1ECBE1";
const VIEN_NGOC = "#062A3A";
const VANG_CAM = "linear-gradient(180deg, #FFE14D 0%, #FFB300 55%, #FF8A00 100%)";
const VIEN_CAM = "drop-shadow(0 0 1.5px #3a1600) drop-shadow(0 0 1.5px #3a1600) drop-shadow(0 0 2px #3a1600) drop-shadow(0 5px 9px rgba(0,0,0,0.5)) drop-shadow(0 0 14px rgba(255,150,0,0.4))";
const VANG_KIM = "#E6B94A";
const SO_PHU_DE = "#FFC107";

const nuot = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ===== Cảnh chính (bản nháp MC) =====
const CanhChinh: React.FC<{ src: string; vao: number; mo: boolean; dai: number }> = ({ src, vao, mo, dai }) => {
  const frame = useCurrentFrame();
  const hien = mo ? interpolate(frame, [0, XF], [0, 1], { ...nuot, easing: Easing.inOut(Easing.quad) }) : 1;
  return (
    <AbsoluteFill style={{ opacity: hien }}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={f(vao)}
        volume={(fr) => interpolate(fr, [0, 3, dai - 3, dai], [0, 1, 1, 0], nuot)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};

// ===== Cảnh chèn không tiếng: mờ vào / mờ ra, phóng chậm =====
const CanhChen: React.FC<{ src: string; vao: number; mo: boolean; ra: boolean }> = ({ src, vao, mo, ra }) => {
  const frame = useCurrentFrame();
  const { durationInFrames: d } = useVideoConfig();
  const a = mo ? interpolate(frame, [0, XF], [0, 1], { ...nuot, easing: Easing.inOut(Easing.quad) }) : 1;
  const b = ra ? interpolate(frame, [d - 12, d], [1, 0], { ...nuot, easing: Easing.inOut(Easing.quad) }) : 1;
  return (
    <AbsoluteFill style={{ opacity: Math.min(a, b) }}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={f(vao)}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${interpolate(frame, [0, d], [1, 1.07])})` }}
      />
    </AbsoluteFill>
  );
};

// ===== Chữ kiểu trend =====
const SoVangCam: React.FC<{ chu: string; co: number; style?: React.CSSProperties }> = ({ chu, co, style }) => (
  <span
    style={{
      fontSize: co,
      fontWeight: 800,
      lineHeight: 1.05,
      backgroundImage: VANG_CAM,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      filter: VIEN_CAM,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {chu}
  </span>
);

const kieuTo = (co: number): React.CSSProperties => ({
  fontSize: co,
  fontWeight: 800,
  lineHeight: 1.05,
  color: NGOC,
  WebkitTextStroke: `${Math.round(co * 0.11)}px ${VIEN_NGOC}`,
  paintOrder: "stroke fill",
  filter: "drop-shadow(0 0 16px rgba(30,203,225,0.5)) drop-shadow(0 5px 8px rgba(0,0,0,0.45))",
  letterSpacing: -0.5,
  whiteSpace: "nowrap",
});

type Dong = [string, string];

const ChuKhoa: React.FC<{ dong: Dong[]; y: number }> = ({ dong, y }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const ra = interpolate(frame, [durationInFrames - 7, durationInFrames], [1, 0], nuot);
  // tách thành các hàng theo "br"
  const hang: { loai: string; chu: string; k: number }[][] = [[]];
  dong.forEach(([loai, chu], k) => (loai === "br" ? hang.push([]) : hang[hang.length - 1].push({ loai, chu, k })));
  let dem = 0;
  return (
    <div style={{ position: "absolute", left: 30, right: 30, top: y, opacity: ra, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      {hang.map((h, i) => (
        <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 16 }}>
          {h.map(({ loai, chu, k }) => {
            const tre = dem * 5;
            dem++;
            const v = spring({ frame: frame - tre, fps, config: { damping: 15, stiffness: 170 } });
            const vao: React.CSSProperties = { opacity: Math.min(1, v * 1.5), transform: `translateY(${(1 - v) * 30}px) scale(${0.9 + 0.1 * v})`, display: "inline-block" };
            if (loai === "nho")
              return (
                <span key={k} style={{ ...vao, fontSize: 44, fontWeight: 300, fontStyle: "italic", color: "white", textShadow: "0 2px 10px rgba(0,0,0,0.7), 0 0 3px rgba(0,0,0,0.6)", whiteSpace: "nowrap" }}>
                  {chu}
                </span>
              );
            if (loai === "so") return <span key={k} style={vao}><SoVangCam chu={chu} co={124} /></span>;
            if (loai === "tay")
              return (
                <span key={k} style={vao}>
                  <SoVangCam chu={chu} co={104} style={{ fontFamily: FONT_TAY, fontWeight: 700, lineHeight: 1.2, padding: "0 10px" }} />
                </span>
              );
            // chữ TO: bật từng ký tự
            const co = loai === "to2" ? 68 : chu.length > 13 ? 82 : 100;
            return (
              <span key={k} style={{ ...kieuTo(co), display: "inline-block" }}>
                {Array.from(chu).map((c, j) => {
                  const w = spring({ frame: frame - tre - j * 0.8, fps, config: { damping: 15, stiffness: 220 } });
                  return (
                    <span key={j} style={{ display: "inline-block", opacity: Math.min(1, w * 1.5), transform: `translateY(${(1 - w) * 26}px)` }}>
                      {c === " " ? " " : c}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ===== Khung thông tin: kính tối, viền vàng kim, trượt từ trái; mục hiện khớp lời =====
type Muc = { at: number; loai: string; chu: string };
const Khung: React.FC<{ tieuDe: string; muc: Muc[]; y: number; hep: boolean }> = ({ tieuDe, muc, y, hep }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const vao = spring({ frame, fps, config: { damping: 200 } });
  const ra = interpolate(frame, [durationInFrames - 0.35 * fps, durationInFrames], [0, 1], { ...nuot, easing: Easing.in(Easing.cubic) });
  const x = (1 - vao) * -1100 + ra * -1100;
  return (
    <div
      style={{
        position: "absolute",
        left: 28,
        top: y,
        width: hep ? 370 : 1024,
        transform: `translateX(${x}px)`,
        background: "linear-gradient(135deg, rgba(4,30,40,0.80), rgba(4,30,40,0.62))",
        backdropFilter: "blur(10px)",
        border: `2px solid ${VANG_KIM}`,
        borderRadius: 24,
        padding: hep ? "20px 22px 22px" : "20px 30px 24px",
        boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ color: "#bff3f8", fontSize: 22, fontWeight: 600, letterSpacing: 3, marginBottom: 6 }}>{tieuDe}</div>
      <div style={{ width: 70, height: 3, background: VANG_KIM, marginBottom: 10 }} />
      <div style={hep ? {} : { display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 26, rowGap: 6 }}>
        {muc.map((m, i) => {
          const v = spring({ frame: frame - f(m.at), fps, config: { damping: 200 } });
          const s: React.CSSProperties = { opacity: v, transform: `translateX(${(1 - v) * -24}px)` };
          if (m.loai === "so") return <div key={i} style={s}><SoVangCam chu={m.chu} co={64} /></div>;
          if (m.loai === "duong") {
            const [nhan, so] = m.chu.split("|");
            return (
              <div key={i} style={{ ...s, display: "flex", flexDirection: "column", marginTop: 4 }}>
                <span style={{ color: "white", fontSize: hep ? 27 : 28, fontWeight: 600, lineHeight: 1.2 }}>{nhan}</span>
                <SoVangCam chu={so} co={hep ? 50 : 52} />
              </div>
            );
          }
          return (
            <div key={i} style={{ ...s, color: "white", fontSize: hep ? 29 : 30, fontWeight: 600, lineHeight: 1.3, marginTop: 2 }}>
              {m.chu}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== Khung ảnh tiện ích: lớn, bo góc, viền vàng kim, nhãn kính tối =====
const AnhTienIch: React.FC<{ src: string; nho: string; to: string; web: boolean; dau: boolean; cuoi: boolean }> = ({ src, nho, to, web, dau, cuoi }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: d } = useVideoConfig();
  const v = dau ? spring({ frame, fps, config: { damping: 200 } }) : interpolate(frame, [0, 6], [0, 1], { ...nuot, easing: Easing.out(Easing.cubic) });
  const ra = cuoi ? interpolate(frame, [d - 10, d], [1, 0], nuot) : 1;
  const nhan = spring({ frame: frame - 3, fps, config: { damping: 200 } });
  const sang = interpolate(frame, [2, 20], [-40, 140], nuot);
  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        top: 40,
        width: 1000,
        height: 550,
        borderRadius: 28,
        overflow: "hidden",
        opacity: Math.min(v, ra),
        transform: dau ? `translateY(${(1 - v) * -60}px)` : undefined,
        boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
      }}
    >
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${interpolate(frame, [0, d], [1.02, 1.09])})` }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${sang - 12}%, rgba(255,255,255,0.35) ${sang}%, transparent ${sang + 12}%)` }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.35) 0%, transparent 40%)" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 28, border: `3px solid ${VANG_KIM}` }} />
      <div
        style={{
          position: "absolute",
          left: 26,
          bottom: 24,
          padding: "12px 24px 14px",
          borderRadius: 16,
          background: "linear-gradient(135deg, rgba(4,30,40,0.80), rgba(4,30,40,0.55))",
          backdropFilter: "blur(8px)",
          opacity: nhan,
          transform: `translateY(${(1 - nhan) * 14}px)`,
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.92)", fontSize: 26, fontWeight: 300, fontStyle: "italic" }}>{nho}</div>
        <div style={{ width: 80 * nhan, height: 3, background: VANG_KIM, margin: "6px 0 4px" }} />
        <div style={{ ...kieuTo(50), WebkitTextStroke: `5px ${VIEN_NGOC}` }}>{to}</div>
      </div>
      {web ? (
        <div style={{ position: "absolute", right: 18, bottom: 12, color: "rgba(255,255,255,0.75)", fontSize: 15, textShadow: "0 1px 3px #000" }}>
          Ảnh minh họa · Wikimedia Commons (CC)
        </div>
      ) : null}
    </div>
  );
};

// ===== 2 logo nhỏ trong khung trắng mờ, góc trên phải =====
const HaiLogo: React.FC<{ cao: number }> = ({ cao }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: cao * 0.4,
      padding: `${cao * 0.26}px ${cao * 0.34}px`,
      borderRadius: 999,
      background: "rgba(255,255,255,0.80)",
      backdropFilter: "blur(10px)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
    }}
  >
    <Img src={staticFile("thuonghieu/tudoanh.png")} style={{ height: cao, display: "block" }} />
    <div style={{ width: 2, height: cao * 0.7, background: "rgba(20,40,110,0.35)" }} />
    <Img src={staticFile("thuonghieu/logo.png")} style={{ height: cao * 0.82, display: "block" }} />
  </div>
);

// ===== Phụ đề đủ câu (dọc): 1/3 dưới, tránh nút TikTok bên phải & đáy =====
const PhuDeDoc: React.FC<{ phuDe: Caption[] }> = ({ phuDe }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const trang = useMemo(() => chiaTrang(phuDe), [phuDe]);
  const t = trang.find((p) => ms >= p.batDau && ms < p.ketThuc);
  if (!t) return null;
  const dai = Math.max(...t.dong.map((d) => d.map((w) => w.text).join("").trim().length));
  return (
    <div
      style={{
        position: "absolute",
        bottom: 430,
        left: 60,
        right: 140,
        textAlign: "center",
        fontSize: Math.min(46, Math.floor(880 / (dai * 0.56))),
        fontWeight: 800,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        color: "white",
        WebkitTextStroke: "7px black",
        paintOrder: "stroke",
        textShadow: "0 3px 10px rgba(0,0,0,0.6)",
      }}
    >
      {t.dong.map((d, i) => (
        <div key={i}>
          {d.map((w) => (
            <span key={w.startMs} style={{ color: laConSo(w.text) ? SO_PHU_DE : "white", opacity: ms >= w.startMs ? 1 : 0.75 }}>
              {hienThi(w.text)}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

// ===== Thanh tên khi chào =====
const ThanhTen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: d } = useVideoConfig();
  const v = (tre: number) => spring({ frame: frame - tre, fps, config: { damping: 200 } });
  const ra = interpolate(frame, [d - 8, d], [1, 0], nuot);
  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        top: 1130,
        opacity: ra,
        transform: `translateX(${(1 - v(0)) * -700}px)`,
        padding: "16px 26px 18px 22px",
        borderLeft: `4px solid ${VANG_KIM}`,
        borderRadius: 14,
        background: "linear-gradient(90deg, rgba(4,30,40,0.78), rgba(4,30,40,0.35))",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ color: "white", fontSize: 38, fontWeight: 700, opacity: v(4) }}>Lâm Oanh – Đức Thắng</div>
      <div style={{ opacity: v(8) }}>
        <SoVangCam chu="0346 032 032" co={50} />
      </div>
      <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 21, letterSpacing: 0.5, marginTop: 2, opacity: v(12) }}>
        Liên hệ trực tiếp từ văn phòng bán hàng CĐT Vinhomes
      </div>
    </div>
  );
};

// ===== Kết: hình dừng, mờ dần; "Lâm Oanh Vinhomes" hiện mờ mờ =====
const Ket: React.FC<{ src: string; vao: number }> = ({ src, vao }) => {
  const frame = useCurrentFrame();
  const { durationInFrames: d } = useVideoConfig();
  const mo = interpolate(frame, [0, 24], [0, 1], { ...nuot, easing: Easing.inOut(Easing.quad) });
  const chu = interpolate(frame, [6, 30], [0, 1], { ...nuot, easing: Easing.out(Easing.cubic) });
  const het = interpolate(frame, [d - 10, d], [1, 0], nuot);
  return (
    <AbsoluteFill style={{ opacity: het }}>
      <Freeze frame={f(vao)}>
        <AbsoluteFill style={{ filter: `blur(${mo * 14}px) brightness(${1 - mo * 0.45})`, transform: `scale(${1 + mo * 0.04})` }}>
          <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      </Freeze>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 26 }}>
        <div
          style={{
            fontSize: 92,
            fontWeight: 300,
            letterSpacing: 4 + chu * 4,
            color: "rgba(255,255,255,0.9)",
            opacity: chu * 0.9,
            filter: `blur(${(1 - chu) * 8}px)`,
            textShadow: "0 0 30px rgba(30,203,225,0.55), 0 0 60px rgba(255,255,255,0.25)",
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          Lâm Oanh
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: 18, color: "rgba(214,247,251,0.9)" }}>VINHOMES</div>
        </div>
        <div style={{ opacity: interpolate(frame, [18, 36], [0, 1], nuot) }}>
          <HaiLogo cao={64} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Video2: React.FC<Video2Props> = ({ nguon }) => {
  const mc = `v2/mc_${nguon}.mp4`;
  const phu = `v2/phu_${nguon}.mp4`;
  const cuoi = data.canh[data.canh.length - 1];
  return (
    <AbsoluteFill style={{ backgroundColor: "black", fontFamily: FONT }}>
      {data.canh.map((c, i) => (
        <Sequence key={`c${i}`} from={f(c.from)} durationInFrames={f(c.dur)}>
          <CanhChinh src={mc} vao={c.in} mo={c.mo} dai={f(c.dur)} />
        </Sequence>
      ))}
      {data.chen.map((c, i) => (
        <Sequence key={`b${i}`} from={f(c.from)} durationInFrames={f(c.dur)}>
          <CanhChen src={phu} vao={c.in} mo={c.mo} ra={c.ra} />
        </Sequence>
      ))}
      {data.sfx.map((x, i) => (
        <Sequence key={`s${i}`} from={f(x.from)} layout="none">
          <Audio src={staticFile(`sfx/${x.ten}.wav`)} volume={x.vol} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, transparent 18%, transparent 62%, rgba(0,0,0,0.30) 85%, rgba(0,0,0,0.15) 100%)" }} />
      {data.anh.map((x, i) => (
        <Sequence key={`a${i}`} from={f(x.from)} durationInFrames={f(x.dur)} layout="none">
          <AnhTienIch src={x.src} nho={x.nho} to={x.to} web={x.web} dau={i === 0} cuoi={i === data.anh.length - 1} />
        </Sequence>
      ))}
      {data.khung.map((k, i) => (
        <Sequence key={`k${i}`} from={f(k.from)} durationInFrames={f(k.dur)} layout="none">
          <Khung tieuDe={k.tieuDe} muc={k.muc} y={k.y} hep={i === 0} />
        </Sequence>
      ))}
      {data.chuKhoa.map((k, i) => (
        <Sequence key={`w${i}`} from={f(k.from)} durationInFrames={f(k.dur)} layout="none">
          <ChuKhoa dong={k.dong as Dong[]} y={k.y} />
        </Sequence>
      ))}
      <Sequence durationInFrames={f(data.ket.from)} layout="none">
        <PhuDeDoc phuDe={data.phuDe as Caption[]} />
      </Sequence>
      <Sequence from={f(data.thanhTen.from)} durationInFrames={f(data.thanhTen.dur)} layout="none">
        <ThanhTen />
      </Sequence>
      <Sequence durationInFrames={f(data.ket.from)} layout="none">
        <div style={{ position: "absolute", top: 150, right: 36 }}>
          <HaiLogo cao={50} />
        </div>
      </Sequence>
      <Sequence from={f(data.ket.from)} durationInFrames={f(data.ket.dur)}>
        <Ket src={mc} vao={cuoi.in + cuoi.dur - 0.1} />
      </Sequence>
    </AbsoluteFill>
  );
};
