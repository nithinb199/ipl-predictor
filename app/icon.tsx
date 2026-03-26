import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.45), transparent 32%), linear-gradient(180deg, #08111d 0%, #030913 100%)",
          color: "#eef4ff",
          fontSize: 120,
          fontWeight: 800,
          fontFamily: "Inter, sans-serif",
          letterSpacing: "-0.06em"
        }}
      >
        IPL
      </div>
    ),
    size
  );
}
