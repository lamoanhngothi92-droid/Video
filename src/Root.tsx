import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { BatDongSan, tinhThoiLuong } from "./BatDongSan";
import phuDeMau from "../public/test/video-thu-2.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BatDongSan"
        component={BatDongSan}
        calculateMetadata={tinhThoiLuong}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          video: "test/video-thu-2.mp4",
          // logo: "tainguyen/logo.png",  // bật khi đã có logo trong public/tainguyen/
          cauMoc: "Căn hộ view biển chỉ 2,5 tỷ?",
          tieuDe: "Vinhomes Hạ Long Xanh",
          diaChi: "Quảng Yên, Quảng Ninh",
          gia: "2,5 tỷ",
          thongTin: ["2 phòng ngủ", "70 m²", "Chiết khấu 12%"],
          giaHienTuGiay: 3.2,
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
