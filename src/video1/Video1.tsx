import {
  AbsoluteFill,
  Audio,
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
const CanhChen: React.FC<{ src: string; vao: number; mo: boolean; ra?: boolean }> = ({ src, vao, mo, ra }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const cham = interpolate(frame, [0, durationInFrames], [1.0, 1.07]);
  // Vào từ cảnh MC: hiệu ứng phóng + nhòe chuyển động (zoom blur) 10 khung.
  // Cảnh chèn nối tiếp nhau (chùm nhanh): cắt thẳng, chỉ "giật" phóng nhẹ.
  // Không giật: vào từ cảnh MC thì mờ dần mượt 12 khung; cảnh nối tiếp thì cắt thẳng
  const zoom = cham;
  const nhoe = 0;
  const vao18 = mo ? interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }) : 1;
  const ra18 = ra
    ? interpolate(frame, [durationInFrames - 18, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) })
    : 1;
  const hien = Math.min(vao18, ra18);
  return (
    <AbsoluteFill style={{ opacity: hien }}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={f(vao)}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, filter: `blur(${nhoe}px)` }}
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
      return { fontSize: 112, fontWeight: 800, fontStyle: "italic", color: MAU.xanhDuongNgoc, lineHeight: 1.02 };
  }
};

// Đếm số lên: "10,5 ha" → 0 … 10,5 (giữ nguyên số chữ số thập phân)
const demSo = (chu: string, p: number) =>
  chu.includes("/") ? chu : chu.replace(/\d+(?:,\d+)?/, (m) => {
    const tp = m.includes(",") ? m.split(",")[1].length : 0;
    const v = parseFloat(m.replace(",", ".")) * Math.min(1, Math.max(0, p));
    return v.toFixed(tp).replace(".", ",");
  });

// Chữ TO: từng ký tự bật lên lần lượt (nhanh, mượt)
const ChuChay: React.FC<{ chu: string; tre: number; style: React.CSSProperties }> = ({ chu, tre, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ ...style, whiteSpace: "pre" }}>
      {Array.from(chu).map((c, i) => {
        const v = spring({ frame: frame - tre - i * 1.2, fps, config: { damping: 15, stiffness: 220 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: Math.min(1, v * 1.5),
              transform: `translateY(${(1 - v) * 34}px)`,
              filter: `blur(${(1 - Math.min(1, v)) * 6}px)`,
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
};

// Hạt lấp lánh vàng bay lên (dùng cho Tài Lộc / Thịnh Vượng / Vận Khí)
const LapLanh: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: -60, pointerEvents: "none" }}>
      {Array.from({ length: 22 }).map((_, i) => {
        const r = (k: number) => {
          const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
          return x - Math.floor(x);
        };
        const t = (frame + r(1) * 60) / 60;
        const y = 100 - ((t * 35 + r(2) * 100) % 100);
        const nhay = 0.5 + 0.5 * Math.sin(frame * 0.35 + i);
        const co = 4 + r(3) * 8;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${r(4) * 100}%`,
              top: `${y}%`,
              width: co,
              height: co,
              borderRadius: "50%",
              background: "radial-gradient(circle, #fff7d6 0%, #FFD400 45%, rgba(255,212,0,0) 70%)",
              opacity: nhay * interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" }),
              boxShadow: "0 0 10px rgba(255,212,0,0.8)",
            }}
          />
        );
      })}
    </div>
  );
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
  const lapLanh = dong.some(([l, c]) => l === "tay" || /THỊNH VƯỢNG|VẬN KHÍ/.test(c));
  const anhSang = interpolate(frame, [8, 40], [-60, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", display: "flex", flexDirection: "column", opacity: ra, ...viTri }}>
      {lapLanh ? <LapLanh /> : null}
      {dong.map(([loai, chu], i) => {
        const tre = i * 7;
        const v = spring({ frame: frame - tre, fps, config: { damping: 14, stiffness: 160 } });
        if (loai === "to") {
          return <ChuChay key={i} chu={chu} tre={tre} style={{ ...kieu(loai), textShadow: BONG }} />;
        }
        if (loai === "so") {
          // Số vàng: đếm lên + vệt sáng lướt qua mặt chữ
          return (
            <div
              key={i}
              style={{
                ...kieu(loai),
                color: "transparent",
                backgroundImage: `linear-gradient(105deg, ${MAU.vangSo} ${anhSang - 25}%, #fff8d0 ${anhSang}%, ${MAU.vangSo} ${anhSang + 25}%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.55))",
                opacity: Math.min(1, v * 1.4),
                transform: `translateY(${(1 - v) * 40}px) scale(${0.85 + 0.15 * v})`,
                whiteSpace: "nowrap",
              }}
            >
              {demSo(chu, interpolate(frame, [tre, tre + 0.6 * fps], [0, 1], { easing: Easing.out(Easing.cubic) }))}
            </div>
          );
        }
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

// ===== Khung dạng dải ngang phía trên (không che MC) =====
const KhungNgang: React.FC<{ tieuDe: string; muc: Dong[] }> = ({ tieuDe, muc }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const vao = spring({ frame, fps, config: { damping: 200 } });
  const ra = interpolate(frame, [durationInFrames - 0.35 * fps, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        top: 60,
        transform: `translateX(${(1 - vao) * -1500 + ra * -1500}px)`,
        display: "flex",
        alignItems: "center",
        gap: 34,
        background: "rgba(0, 45, 42, 0.82)",
        borderLeft: `8px solid ${MAU.vangKim}`,
        borderRadius: 14,
        padding: "16px 40px 18px 30px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ color: "#c9efe9", fontSize: 30, fontWeight: 600, letterSpacing: 3 }}>{tieuDe}</div>
      {muc.map(([loai, chu], i) => {
        const v = spring({ frame: frame - 8 - i * 6, fps, config: { damping: 200 } });
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 34, opacity: v }}>
            <span style={{ color: MAU.vangKim, fontSize: 30 }}>•</span>
            <span
              style={{
                color: loai === "so" ? MAU.vangSo : "white",
                fontSize: loai === "so" ? 56 : 40,
                fontWeight: loai === "so" ? 800 : 600,
              }}
            >
              {loai === "so" ? demSo(chu, interpolate(frame, [8 + i * 6, 8 + i * 6 + 0.7 * fps], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) })) : chu}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ===== Vệt sáng ấm quét ngang khi chuyển đoạn (light leak) =====
const ChopSang: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 2, 16], [0, 0.45, 0], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: "#fffaf0", opacity: o }} />;
};

const VetSang: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = frame / durationInFrames;
  const x = interpolate(p, [0, 1], [-20, 120]);
  const o = interpolate(p, [0, 0.3, 0.7, 1], [0, 1, 0.6, 0]);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: o,
        background: `radial-gradient(38% 120% at ${x}% 45%, rgba(255,170,80,0.62), rgba(255,120,40,0.28) 50%, rgba(255,120,40,0) 78%)`,
      }}
    />
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
            {/\d/.test(chu) ? demSo(chu, interpolate(frame, [8 + i * 6, 8 + i * 6 + 0.7 * fps], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) })) : chu}
          </div>
        );
      })}
    </div>
  );
};

// ===== Thanh tên + số điện thoại (đè lên cảnh MC chào) – nhỏ gọn, tinh tế =====
const ThanhTen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = (tre: number) => spring({ frame: frame - tre, fps, config: { damping: 200 } });
  const vach = interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        bottom: 170,
        display: "flex",
        alignItems: "stretch",
        gap: 18,
      }}
    >
      <div style={{ width: 3, background: MAU.vangKim, transform: `scaleY(${vach})`, transformOrigin: "top" }} />
      <div style={{ textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18, opacity: v(6), transform: `translateX(${(1 - v(6)) * -24}px)` }}>
          <span style={{ color: "white", fontSize: 36, fontWeight: 600, letterSpacing: 1 }}>Lâm Oanh</span>
          <span style={{ color: MAU.vangKim, fontSize: 22 }}>|</span>
          <span style={{ color: MAU.vangSo, fontSize: 36, fontWeight: 600, letterSpacing: 2 }}>0346 032 032</span>
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.88)",
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: 1.5,
            marginTop: 4,
            opacity: v(14),
            transform: `translateX(${(1 - v(14)) * -24}px)`,
          }}
        >
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
      <div style={{ position: "relative", opacity: v, transform: `scale(${0.92 + 0.08 * v})`, overflow: "hidden", borderRadius: 14 }}>
        <Logo cao={150} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(110deg, transparent ${interpolate(frame, [10, 45], [-40, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) - 15}%, rgba(255,255,255,0.85) ${interpolate(frame, [10, 45], [-40, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%, transparent ${interpolate(frame, [10, 45], [-40, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) + 15}%)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Phóng nhẹ 3% đúng mỗi ô nhịp rồi trả về (cảm giác "nhún" theo nhạc, không giật)
const NhunTheoNhac: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const truoc = data.nhip.filter((b) => b <= t);
  const tu = truoc.length ? t - truoc[truoc.length - 1] : 99;
  const zoom = 1 + 0.03 * Math.exp(-tu * 7);
  return <AbsoluteFill style={{ transform: `scale(${zoom})` }}>{children}</AbsoluteFill>;
};

// Ô ảnh tiện ích (Vincom, Vinmec, Vinschool, Grand World) trượt vào bên trái, mép dưới mờ dần
const AnhTienIch: React.FC<{ src: string; dau: boolean; cuoi: boolean }> = ({ src, dau, cuoi }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const v = dau ? spring({ frame, fps, config: { damping: 200 } }) : interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const ra = cuoi ? interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.05]);
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        top: 120,
        width: 820,
        aspectRatio: "1152 / 610",
        borderRadius: 18,
        overflow: "hidden",
        opacity: Math.min(v, ra),
        transform: dau ? `translateX(${(1 - v) * -900}px)` : undefined,
        boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
        WebkitMaskImage: "linear-gradient(180deg, black 93%, transparent 100%)",
        maskImage: "linear-gradient(180deg, black 93%, transparent 100%)",
      }}
    >
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, transformOrigin: "50% 30%" }} />
    </div>
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
            mo={c.mo}
            ra={(c as { ra?: boolean }).ra}
          />
        </Sequence>
      ))}
      {data.chuyen.map((c, i) => (
        <Sequence key={`l${i}`} from={Math.max(0, f(c.from) - 12)} durationInFrames={36} layout="none">
          <VetSang />
          {(c as { loe?: boolean }).loe ? (
            <Sequence from={12} durationInFrames={20} layout="none">
              <ChopSang />
            </Sequence>
          ) : null}
        </Sequence>
      ))}
      {data.sfx.map((x, i) => (
        <Sequence key={`s${i}`} from={f(x.from)} layout="none">
          <Audio src={staticFile(`sfx/${x.ten}.wav`)} volume={x.vol} />
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
          {(k as { kieu?: string }).kieu === "ngang" ? (
            <KhungNgang tieuDe={k.tieuDe} muc={k.muc as Dong[]} />
          ) : (
            <Khung tieuDe={k.tieuDe} muc={k.muc as Dong[]} />
          )}
        </Sequence>
      ))}
      {data.chuKhoa.map((k, i) => (
        <Sequence key={`w${i}`} from={f(k.from)} durationInFrames={f(k.dur)} layout="none">
          <ChuKhoa dong={k.dong as Dong[]} vt={k.vt} />
        </Sequence>
      ))}
      {data.anh.map((x, i) => (
        <Sequence key={`a${i}`} from={f(x.from)} durationInFrames={f(x.dur)} layout="none">
          <AnhTienIch src={x.src} dau={i === 0} cuoi={i === data.anh.length - 1} />
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
