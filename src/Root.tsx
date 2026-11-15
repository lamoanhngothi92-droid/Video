import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { BatDongSan, FPS, tinhThoiLuong } from "./BatDongSan";
import phuDeMau from "../public/test/vinh-xanh.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BatDongSan"
        component={BatDongSan}
        calculateMetadata={tinhThoiLuong}
        durationInFrames={FPS * 60}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          // Đoạn thử: copy 1 video từ goc/ vào public/test/vinh-xanh.mp4
          video: "test/vinh-xanh.mp4",
          logo: "thuonghieu/logo.png",
          cauMoc: "Mỗi nhà một hồ cá Koi ngay trước cửa?",
          tieuDe: "Vinhomes Vịnh Xanh",
          diaChi: "Ocean City",
          gia: "23 tỷ",
          thongTin: ["Song lập 144 m²", "Vay 70%", "Hỗ trợ lãi suất 18 tháng"],
          giaHienTuGiay: 3.5,
          ten: "Lâm Oanh",
          soDienThoai: "0346032032",
          cauKetThuc: "Liên hệ trực tiếp từ văn phòng bán hàng CĐT Vinhomes",
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
