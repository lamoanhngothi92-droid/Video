import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const HelloWorld: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12 } });
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const lineWidth = interpolate(frame, [20, 50], [0, 600], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1e1b4b, #4c1d95)",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h1
        style={{
          color: "white",
          fontSize: 120,
          margin: 0,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        {title}
      </h1>
      <div
        style={{
          height: 8,
          width: lineWidth,
          background: "#facc15",
          borderRadius: 4,
          marginTop: 30,
        }}
      />
    </AbsoluteFill>
  );
};
