"use client";

import { useTheme } from "../theme-provider";
import { BackButton } from "../../components/BackButton";

export default function ThemePage() {
  const { toggleTheme } = useTheme();

  return (
    <div className="theme-container">
      <div
        className="theme-circle"
        onClick={toggleTheme}
        title="Click to toggle theme"
      />
      <div style={{ position: "fixed", top: "20px", left: "20px" }}>
        <BackButton />
      </div>
    </div>
  );
}
