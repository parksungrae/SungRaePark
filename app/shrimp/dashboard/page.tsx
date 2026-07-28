"use client";

import { useState } from "react";
import { BackButton } from "@/components/BackButton";

const initialParams = [
  { label: "pH", value: 7.1, unit: "", min: 6.5, max: 7.5, decimals: 1 },
  { label: "수온", value: 23.4, unit: "°C", min: 20, max: 26, decimals: 1 },
  { label: "TDS", value: 198, unit: "ppm", min: 150, max: 250, decimals: 0 },
  { label: "GH", value: 7, unit: "dGH", min: 6, max: 10, decimals: 0 },
  { label: "KH", value: 4, unit: "dKH", min: 2, max: 6, decimals: 0 },
  { label: "NO₃", value: 12, unit: "mg/L", min: 0, max: 20, decimals: 0 },
];

const tankStats = [
  { label: "수조 용량", value: "30L" },
  { label: "새우 개체수", value: "47마리" },
  { label: "수초 종류", value: "3종" },
  { label: "사육 일수", value: "142일" },
  { label: "마지막 환수", value: "3일 전" },
  { label: "마지막 급여", value: "오늘" },
];

const activityLog = [
  { date: "03.23", action: "10% 환수 실시, 수온 23.2°C 확인", tag: "환수" },
  { date: "03.22", action: "새우 사료 0.2g 급여, 잔여물 제거", tag: "급여" },
  { date: "03.21", action: "pH 7.3 → 7.1 조정 (소량 RO수 추가)", tag: "수질" },
  { date: "03.20", action: "암컷 2마리 포란 확인", tag: "번식" },
  { date: "03.19", action: "새우 사료 급여, 뽕잎 1장 추가", tag: "급여" },
  { date: "03.18", action: "TDS 측정 198ppm, 정상 범위 확인", tag: "수질" },
  { date: "03.16", action: "10% 환수 실시", tag: "환수" },
  { date: "03.15", action: "새끼 새우 5마리 이상 확인", tag: "번식" },
];

const tagColors: Record<string, string> = {
  환수: "rgba(96, 165, 250, 0.5)",
  급여: "rgba(74, 222, 128, 0.5)",
  수질: "rgba(251, 191, 36, 0.5)",
  번식: "rgba(216, 180, 254, 0.5)",
};

function getStatus(value: number, min: number, max: number) {
  const margin = (max - min) * 0.1;
  if (value < min - margin || value > max + margin) return "#f87171";
  if (value < min + margin || value > max - margin) return "#fbbf24";
  return "#4ade80";
}

export default function DashboardPage() {
  const [params] = useState(initialParams);

  return (
    <div className="shrimp-page">
      <div className="shrimp-back">
        <BackButton href="/shrimp" />
      </div>

      <div className="shrimp-main">
        <div className="shrimp-page-header">
          <p className="shrimp-hero-label">live monitoring</p>
          <h1 className="shrimp-hero-title">대시보드</h1>
          <p className="shrimp-hero-desc">
            수질 현황과 사육 일지를 한눈에.
          </p>
        </div>

        {/* Water Parameters */}
        <p className="dashboard-section-label">수질 파라미터</p>
        <div className="dashboard-params-grid" style={{ marginTop: "16px" }}>
          {params.map((p) => (
            <div key={p.label} className="param-card">
              <div
                className="param-card-dot"
                style={{ background: getStatus(p.value, p.min, p.max) }}
              />
              <p className="param-card-label">{p.label}</p>
              <p className="param-card-value">
                {p.decimals === 0 ? p.value.toFixed(0) : p.value.toFixed(p.decimals)}
              </p>
              <p className="param-card-unit">
                {p.unit || ""}
                <span style={{ display: "block", marginTop: "4px", fontSize: "10px", opacity: 0.3 }}>
                  적정 {p.min} – {p.max}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* Tank Stats */}
        <p className="dashboard-section-label">수조 현황</p>
        <div className="dashboard-tank-grid" style={{ marginTop: "16px" }}>
          {tankStats.map((s) => (
            <div key={s.label} className="dashboard-tank-stat">
              <p className="dashboard-tank-stat-label">{s.label}</p>
              <p className="dashboard-tank-stat-value">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Activity Log */}
        <p className="dashboard-section-label">사육 일지</p>
        <ul className="dashboard-log" style={{ marginTop: "0" }}>
          {activityLog.map((item, i) => (
            <li key={i} className="dashboard-log-item">
              <span className="dashboard-log-date">{item.date}</span>
              <span className="dashboard-log-action">{item.action}</span>
              <span
                className="dashboard-log-tag"
                style={{ borderColor: tagColors[item.tag] }}
              >
                {item.tag}
              </span>
            </li>
          ))}
        </ul>

        {/* Legend */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "48px" }}>
          {[
            { color: "#4ade80", label: "정상" },
            { color: "#fbbf24", label: "주의" },
            { color: "#f87171", label: "위험" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
              <span style={{ fontSize: "11px", opacity: 0.4 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
