"use client";

import { BackButton } from "../../components/BackButton";

export default function ClothesPage() {
  return (
    <div style={{ width: "100%", height: "100vh", position: "relative", backgroundColor: "#000" }}>
      <div style={{ position: "fixed", top: "20px", left: "20px", zIndex: 100 }}>
        <BackButton />
      </div>
    </div>
  );
}
