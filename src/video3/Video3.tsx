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

// Video 3 – Sự kiện Vinhomes Global Gate Hạ Long. Bố cục theo khung 1920x1080;
// bản 4K xuất bằng --scale=2 với nguồn trong public/v3_4k (prop "thuMuc").
export const FPS = 60;
export const TONG_KHUNG = Math.ceil(data.tongGiay * FPS);
const f = (giay: number) => Math.round(giay * FPS);
const kep = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const XANH = MAU.xanhDuongNgoc; // #1ECBE1
const VANG = "#FFD400";
const CAM = "#FF9A1F";
const BONG = "0 4px 18px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.5)";

type Props = { thuMuc?: string };
const doiThuMuc = (src: string, thuMuc?: string) => (thuMuc ? src.replace(/^v3\//, `${thuMuc}/`) : src);

// ===== Cảnh MC (có tiếng) =====
const CanhChinh: React.FC<{ src: string; vao: number; zoom: number; dai: number }> = ({ src, vao, zoom, dai }) => (
  <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
    <OffthreadVideo
      src={staticFile(src)}
      startFrom={f(vao)}
      volume={(fr) => interpolate(fr, [0, 3, dai - 6, dai], [0, 1, 1, 0], kep)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  </AbsoluteFill>
);

// ===== Cảnh chèn đã tua sẵn (speed ramp) – phóng chậm 1.00 → 1.06, mờ chồng mềm =====
const CanhChen: React.FC<{ src: string; mo: boolean; ra: boolean; vol: number }> = ({ src, mo, ra, vol }) => {
  const frame = useCurrentFrame();
  const { durationInFrames: d } = useVideoConfig();
  const zoom = interpolate(frame, [0, d], [1.0, 1.06]);
  const vao = mo ? interpolate(frame, [0, 18], [0, 1], { ...kep, easing: Easing.inOut(Easing.quad) }) : 1;
  const het = ra ? interpolate(frame, [d - 18, d], [1, 0], { ...kep, easing: Easing.inOut(Easing.quad) }) : 1;
  return (
    <AbsoluteFill style={{ opacity: Math.min(vao, het) }}>
      <OffthreadVideo
        src={staticFile(src)}
        muted={vol === 0}
        volume={(fr) => vol * interpolate(fr, [0, 8, d - 8, d], [0, 1, 1, 0], kep)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }}
      />
    </AbsoluteFill>
  );
};

// ===== Chữ khóa =====
type Dong = [string, string];

// Chữ TO: từng ký tự trượt lên + hết nhòe, giãn chữ nhẹ dần về, vạch vàng cam chạy dưới chân
const ChuTo: React.FC<{ chu: string; tre: number; co: number; cam?: boolean }> = ({ chu, tre, co, cam }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const gian = interpolate(frame - tre, [0, 30], [10, 1], { ...kep, easing: Easing.out(Easing.cubic) });
  const vach = interpolate(frame - tre, [8, 30], [0, 1], { ...kep, easing: Easing.out(Easing.cubic) });
  const sang = interpolate(frame - tre, [14, 50], [-30, 130], kep);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div
        style={{
          fontSize: 116 * co,
          fontWeight: 800,
          fontStyle: "italic",
          color: XANH,
          lineHeight: 1.04,
          letterSpacing: gian,
          whiteSpace: "pre",
          textShadow: cam ? undefined : BONG,
          filter: cam ? "drop-shadow(0 4px 10px rgba(0,0,0,0.7)) drop-shadow(0 1px 2px rgba(0,0,0,0.6))" : undefined,
        }}
      >
        {Array.from(chu).map((c, i) => {
          const v = spring({ frame: frame - tre - i * 1.1, fps, config: { damping: 16, stiffness: 210 } });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: Math.min(1, v * 1.5),
                transform: `translateY(${(1 - v) * 38}px)`,
                filter: `blur(${(1 - Math.min(1, v)) * 7}px)`,
                ...(cam
                  ? {
                      color: "transparent",
                      backgroundImage: `linear-gradient(180deg, ${VANG} 20%, ${CAM} 100%)`,
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                    }
                  : {}),
              }}
            >
              {c}
            </span>
          );
        })}
      </div>
      {/* ánh sáng trắng lướt qua mặt chữ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(105deg, transparent ${sang - 10}%, rgba(255,255,255,0.35) ${sang}%, transparent ${sang + 10}%)`,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          height: 7 * co,
          marginTop: 2,
          borderRadius: 4,
          background: cam
            ? `linear-gradient(90deg, ${XANH}, ${XANH} 70%, rgba(30,203,225,0))`
            : `linear-gradient(90deg, ${VANG}, ${CAM} 70%, rgba(255,154,31,0))`,
          transform: `scaleX(${vach})`,
          transformOrigin: "left",
          boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
        }}
      />
    </div>
  );
};

const ChuKhoa: React.FC<{ dong: Dong[]; vt: string; co: number; cam: boolean }> = ({ dong, vt, co, cam }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const ra = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], kep);
  const viTri: React.CSSProperties =
    vt === "trai"
      ? { left: 120, top: 230, alignItems: "flex-start", textAlign: "left" }
      : vt === "phai"
        ? { right: 120, top: 200, alignItems: "flex-end", textAlign: "right" }
        : vt === "tren"
          ? { left: 0, right: 0, top: 110, alignItems: "center", textAlign: "center" }
          : vt === "thap"
            ? { left: 0, right: 0, top: 600, alignItems: "center", textAlign: "center" }
            : vt === "traiduoi"
              ? { left: 110, bottom: 190, alignItems: "flex-start", textAlign: "left" }
          : vt === "tam"
            ? { left: 0, right: 0, top: 0, bottom: 60, justifyContent: "center", alignItems: "center", textAlign: "center" }
            : { left: 0, right: 0, top: 240, alignItems: "center", textAlign: "center" };
  const sang = interpolate(frame, [10, 45], [-40, 150], kep);
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        opacity: ra,
        filter: `blur(${(1 - ra) * 6}px)`,
        ...viTri,
      }}
    >
      {dong.map(([loai, chu], i) => {
        const tre = i * 7;
        const v = spring({ frame: frame - tre, fps, config: { damping: 14, stiffness: 160 } });
        if (loai === "to") return <ChuTo key={i} chu={chu} tre={tre} co={co} cam={cam} />;
        if (loai === "so") {
          return (
            <div
              key={i}
              style={{
                fontSize: 132 * co,
                fontWeight: 800,
                lineHeight: 1.02,
                color: "transparent",
                backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) ${sang - 22}%, rgba(255,250,220,0.95) ${sang}%, rgba(255,255,255,0) ${sang + 22}%), linear-gradient(180deg, ${VANG} 25%, ${CAM} 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.55))",
                opacity: Math.min(1, v * 1.4),
                transform: `translateY(${(1 - v) * 40}px) scale(${0.85 + 0.15 * v})`,
                whiteSpace: "nowrap",
              }}
            >
              {chu}
            </div>
          );
        }
        const s: React.CSSProperties =
          loai === "tay"
            ? { fontFamily: FONT_TAY, fontSize: 104 * co, fontWeight: 700, color: VANG, lineHeight: 1.05 }
            : { fontSize: 58 * co, fontWeight: 300, fontStyle: "italic", color: "white", lineHeight: 1.25 };
        return (
          <div
            key={i}
            style={{
              ...s,
              textShadow: loai === "tay" ? BONG : "0 0 12px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.9)",
              opacity: Math.min(1, v * 1.4),
              transform: `translateY(${(1 - v) * 30}px)`,
              filter: `blur(${(1 - Math.min(1, v)) * 5}px)`,
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

// ===== Thẻ nội dung 01 / 02 – bên phải (MC đứng bên trái), nền kính tối, viền vàng kim =====
const TheNoiDung: React.FC<{ so: string; nho: string; to: string; hang: number }> = ({ so, nho, to, hang }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const v = spring({ frame, fps, config: { damping: 200 } });
  const ra = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], kep);
  const vach = interpolate(frame, [6, 28], [0, 1], { ...kep, easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        right: 56,
        top: 300 + hang * 180,
        minWidth: 520,
        display: "flex",
        alignItems: "center",
        gap: 28,
        padding: "22px 34px",
        borderRadius: 20,
        background: "linear-gradient(135deg, rgba(4,32,40,0.82), rgba(4,32,40,0.55))",
        backdropFilter: "blur(8px)",
        border: `2px solid ${MAU.vangKim}`,
        boxShadow: "0 16px 44px rgba(0,0,0,0.4)",
        opacity: Math.min(v, ra),
        transform: `translateX(${(1 - v) * -60}px)`,
      }}
    >
      <div
        style={{
          fontSize: 80,
          fontWeight: 800,
          color: "transparent",
          backgroundImage: `linear-gradient(180deg, ${VANG}, ${CAM})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          lineHeight: 1,
        }}
      >
        {so}
      </div>
      <div>
        <div style={{ color: "rgba(255,255,255,0.92)", fontSize: 32, fontWeight: 300, fontStyle: "italic" }}>{nho}</div>
        <div style={{ width: 110 * vach, height: 3, background: VANG, margin: "6px 0 4px" }} />
        <div style={{ color: XANH, fontSize: 40, fontWeight: 800, whiteSpace: "nowrap" }}>{to}</div>
      </div>
    </div>
  );
};

// ===== Thanh liên hệ (đè lên ảnh tập thể) =====
export const ThanhLienHe: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const v = (tre: number) => spring({ frame: frame - tre, fps, config: { damping: 200 } });
  const ra = interpolate(frame, [durationInFrames - 2.4 * fps, durationInFrames - 1.9 * fps], [1, 0], kep);
  const vach = interpolate(frame, [0, 0.5 * fps], [0, 1], { ...kep, easing: Easing.out(Easing.cubic) });
  const dong = (tre: number): React.CSSProperties => ({
    opacity: v(tre),
    transform: `translateX(${(1 - v(tre)) * -40}px)`,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        bottom: 175,
        display: "flex",
        gap: 22,
        padding: "24px 40px 26px 26px",
        borderRadius: 20,
        background: "linear-gradient(135deg, rgba(4,32,40,0.84), rgba(4,32,40,0.5))",
        backdropFilter: "blur(8px)",
        boxShadow: "0 16px 44px rgba(0,0,0,0.4)",
        opacity: Math.min(v(0), ra),
        transform: `translateX(${(1 - v(0)) * -120}px)`,
      }}
    >
      <div style={{ width: 5, borderRadius: 3, background: `linear-gradient(180deg, ${VANG}, ${CAM})`, transform: `scaleY(${vach})`, transformOrigin: "top" }} />
      <div>
        <div style={{ ...dong(6), color: "white", fontSize: 32, fontWeight: 300, fontStyle: "italic" }}>Liên hệ</div>
        <div style={{ ...dong(10), color: XANH, fontSize: 62, fontWeight: 800, letterSpacing: 1, lineHeight: 1.1 }}>
          LÂM OANH – ĐỨC THẮNG
        </div>
        <div
          style={{
            ...dong(16),
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.15,
            color: "transparent",
            backgroundImage: `linear-gradient(180deg, ${VANG}, ${CAM})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            display: "inline-block",
          }}
        >
          0346 032 032
        </div>
        <div style={{ ...dong(22), color: "rgba(255,255,255,0.92)", fontSize: 28, fontWeight: 400, letterSpacing: 0.5, marginTop: 4 }}>
          Tư vấn trực tiếp từ văn phòng bán hàng CĐT Vinhomes
        </div>
      </div>
    </div>
  );
};

const Logo: React.FC<{ cao: number; tuDoanh?: boolean }> = ({ cao, tuDoanh }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.88)",
      borderRadius: 14,
      padding: `${cao * 0.18}px ${cao * 0.3}px`,
      display: "flex",
      alignItems: "center",
      gap: cao * 0.3,
    }}
  >
    {tuDoanh ? (
      <>
        <Img src={staticFile("thuonghieu/tudoanh.png")} style={{ height: cao * 1.05, display: "block" }} />
        <div style={{ width: 2, height: cao * 0.85, background: "rgba(0,60,90,0.35)" }} />
      </>
    ) : null}
    <Img src={staticFile("thuonghieu/logo.png")} style={{ height: cao, display: "block" }} />
  </div>
);

// ===== Kết: hình nhòe dần, "LÂM OANH VINHOMES" hiện mờ mờ, rồi tối dần =====
const KetMoMo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: d } = useVideoConfig();
  const nen = interpolate(frame, [0, 0.6 * fps], [0, 1], { ...kep, easing: Easing.inOut(Easing.quad) });
  const chu = interpolate(frame, [0.2 * fps, 1.1 * fps], [0, 1], { ...kep, easing: Easing.out(Easing.cubic) });
  const toi = interpolate(frame, [d - 0.45 * fps, d], [0, 1], kep);
  const gian = interpolate(frame, [0, d], [26, 14]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backdropFilter: `blur(${nen * 14}px)`, background: `rgba(4,26,28,${nen * 0.55})` }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 26 }}>
        <div
          style={{
            fontSize: 104,
            fontWeight: 800,
            letterSpacing: gian,
            color: "rgba(255,255,255,0.9)",
            opacity: chu * 0.88,
            filter: `blur(${(1 - chu) * 16}px)`,
            textShadow: `0 0 30px rgba(30,203,225,0.65), 0 0 70px rgba(30,203,225,0.35)`,
          }}
        >
          LÂM OANH <span style={{ color: XANH }}>VINHOMES</span>
        </div>
        <div
          style={{
            marginTop: -6,
            fontSize: 34,
            fontWeight: 400,
            letterSpacing: 2,
            color: "rgba(255,255,255,0.92)",
            opacity: interpolate(frame, [0.45 * fps, 1.2 * fps], [0, 1], kep),
            transform: `translateY(${interpolate(frame, [0.45 * fps, 1.2 * fps], [16, 0], { ...kep, easing: Easing.out(Easing.cubic) })}px)`,
            textShadow: "0 2px 12px rgba(0,0,0,0.7)",
          }}
        >
          Tư vấn trực tiếp từ văn phòng bán hàng CĐT Vinhomes
        </div>
        <div style={{ opacity: chu * 0.8 }}>
          <Logo cao={70} tuDoanh />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "black", opacity: toi }} />
    </AbsoluteFill>
  );
};

export const Video3: React.FC<Props> = ({ thuMuc }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black", fontFamily: FONT }}>
      {data.canh.map((c, i) => (
        <Sequence key={`c${i}`} from={f(c.from)} durationInFrames={f(c.dur)}>
          <CanhChinh src={doiThuMuc(c.src, thuMuc)} vao={c.in} zoom={c.zoom} dai={f(c.dur)} />
        </Sequence>
      ))}
      {data.chen.map((c, i) => (
        <Sequence key={`b${i}`} from={f(c.from)} durationInFrames={f(c.dur)}>
          <CanhChen src={doiThuMuc(c.src, thuMuc)} mo={c.mo} ra={c.ra} vol={c.vol} />
        </Sequence>
      ))}
      <Sequence from={f(data.anhCuoi.from)} layout="none">
        <AbsoluteFill>
          <Img src={staticFile(doiThuMuc(data.anhCuoi.src, thuMuc))} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.06)" }} />
        </AbsoluteFill>
      </Sequence>
      {data.sfx.map((x, i) => (
        <Sequence key={`s${i}`} from={f(x.from)} layout="none">
          <Audio src={staticFile(`sfx/${x.ten}.wav`)} volume={x.vol} />
        </Sequence>
      ))}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, transparent 25%, transparent 70%, rgba(0,0,0,0.40) 100%)",
        }}
      />
      {data.chuKhoa.map((k, i) => (
        <Sequence key={`w${i}`} from={f(k.from)} durationInFrames={f(k.dur)} layout="none">
          <ChuKhoa dong={k.dong as Dong[]} vt={k.vt} co={k.co} cam={k.mau === "cam"} />
        </Sequence>
      ))}
      {data.the.map((x, i) => (
        <Sequence key={`t${i}`} from={f(x.from)} durationInFrames={f(x.dur)} layout="none">
          <TheNoiDung so={x.so} nho={x.nho} to={x.to} hang={x.hang} />
        </Sequence>
      ))}
      <PhuDe phuDe={data.phuDe as Caption[]} coToiDa={44} day={42} />
      {/* Thanh liên hệ (tên + số điện thoại) đã bỏ theo yêu cầu của chị Oanh */}
      <Sequence durationInFrames={f(data.logoCuoi.from)} layout="none">
        <div style={{ position: "absolute", top: 36, right: 46, opacity: 0.8 }}>
          <Logo cao={58} tuDoanh />
        </div>
      </Sequence>
      <Sequence from={f(data.logoCuoi.from)}>
        <KetMoMo />
      </Sequence>
    </AbsoluteFill>
  );
};
