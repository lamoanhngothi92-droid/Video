import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { BatDongSan } from "./BatDongSan";
import phuDeMau from "../public/test/video-thu.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BatDongSan"
        component={BatDongSan}
        durationInFrames={202}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          video: "test/video-thu.mp4",
          tieuDe: "Căn hộ cao cấp Quận 7",
          diaChi: "Đường Nguyễn Hữu Thọ, TP. Hồ Chí Minh",
          gia: "4,2 tỷ",
          thongTin: ["3 phòng ngủ", "85 m²", "View sông"],
          hotline: "0909 xxx xxx",
          phuDe: phuDeMau,
        }}
      />
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ title: "Xin chào Remotion!" }}
      />
    </>
  );
};
