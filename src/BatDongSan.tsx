import { useMemo } from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { FONT } from "./fonts";

export type BatDongSanProps = {
  video: string; // file trong thư mục public/
  tieuDe: string;
  diaChi: string;
  gia: string;
  thongTin: string[]; // ví dụ ["3 PN", "85 m²", "View sông"]
  hotline: string;
  phuDe: Caption[]; // từ file .json do scripts/phude.py tạo ra
};

const VANG = "#facc15";

const KhungGia: React.FC<Pick<BatDongSanProps, "gia" | "thongTin">> = ({
  gia,
  thongTin,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vao = spring({ frame, fps, config: { damping: 14 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: 260,
        transform: `translateX(${(1 - vao) * -1200}px)`,
        background: "rgba(15, 23, 42, 0.82)",
        borderLeft: `14px solid ${VANG}`,
        borderRadius: 24,
        padding: "32px 40px",
      }}
    >
      <div style={{ color: "#cbd5e1", fontSize: 40, fontWeight: 600 }}>
        GIÁ CHỈ
      </div>
      <div style={{ color: VANG, fontSize: 120, fontWeight: 800, lineHeight: 1.1 }}>
        {gia}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
        {thongTin.map((t, i) => {
          const hien = spring({ frame: frame - 10 - i * 5, fps });
          return (
            <div
              key={t}
              style={{
                opacity: hien,
                transform: `scale(${hien})`,
                background: "white",
                color: "#0f172a",
                fontSize: 40,
                fontWeight: 600,
                padding: "8px 24px",
                borderRadius: 999,
              }}
            >
              {t}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PhuDe: React.FC<{ phuDe: Caption[] }> = ({ phuDe }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions: phuDe,
        combineTokensWithinMilliseconds: 900,
      }),
    [phuDe],
  );
  const trang = pages.find(
    (p) => ms >= p.startMs && ms < p.startMs + p.durationMs,
  );
  if (!trang) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 420,
        left: 60,
        right: 60,
        textAlign: "center",
        fontSize: 72,
        fontWeight: 800,
        lineHeight: 1.25,
        color: "white",
        textShadow: "0 4px 16px rgba(0,0,0,0.8)",
        WebkitTextStroke: "3px black",
        paintOrder: "stroke",
      }}
    >
      {trang.tokens.map((t) => (
        <span
          key={t.fromMs}
          style={{ color: ms >= t.fromMs && ms < t.toMs ? VANG : "white" }}
        >
          {t.text}
        </span>
      ))}
    </div>
  );
};

const ChuChay: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 300], [1080, -2400]);
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 110,
        background: VANG,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          transform: `translateX(${x}px)`,
          whiteSpace: "nowrap",
          fontSize: 52,
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const BatDongSan: React.FC<BatDongSanProps> = (p) => {
  const frame = useCurrentFrame();
  const tieuDeHien = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: "black", fontFamily: FONT }}>
      <OffthreadVideo src={staticFile(p.video)} />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 35%, transparent 60%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 90,
          left: 60,
          right: 60,
          opacity: tieuDeHien,
          color: "white",
        }}
      >
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.15 }}>
          {p.tieuDe}
        </div>
        <div style={{ fontSize: 40, fontWeight: 400, marginTop: 8 }}>
          📍 {p.diaChi}
        </div>
      </div>
      <Sequence from={15} layout="none">
        <KhungGia gia={p.gia} thongTin={p.thongTin} />
      </Sequence>
      <PhuDe phuDe={p.phuDe} />
      <ChuChay
        text={`☎ Hotline: ${p.hotline}   |   Hỗ trợ vay ngân hàng 70%   |   Sổ hồng riêng   |   Xem nhà miễn phí   |   ☎ ${p.hotline}`}
      />
    </AbsoluteFill>
  );
};
