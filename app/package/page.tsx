"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { BackButton } from "../../components/BackButton";
import PackageScene from "./PackageScene";
import { PackageStoragePanel } from "./PackageStoragePanel";

export default function PackagePage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDropActive, setIsDropActive] = useState(false);
  const [dropFeedback, setDropFeedback] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showDropFeedback = (label: string) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    setDropFeedback(`${label} 배치됨`);
    feedbackTimeoutRef.current = setTimeout(() => {
      setDropFeedback(null);
      feedbackTimeoutRef.current = null;
    }, 1200);
  };

  const hasPackageDragData = (event: DragEvent<HTMLElement>) => {
    return Array.from(event.dataTransfer.types).includes("application/x-package-item");
  };

  const packItem = (itemId: string, itemLabel: string) => {
    setSelectedItems((currentItems) =>
      currentItems.includes(itemId) ? currentItems : [...currentItems, itemId],
    );
    showDropFeedback(itemLabel);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData("application/x-package-item");
    const itemLabel = event.dataTransfer.getData("text/plain") || "짐";

    setIsDropActive(false);
    if (!itemId) {
      return;
    }

    packItem(itemId, itemLabel);
  };

  return (
    <main className="package-page">
      <div className="package-back">
        <BackButton />
      </div>

      <section className="package-layout" aria-label="Package planner">
        <div
          className={`package-visual ${isDropActive ? "package-visual-drop-active" : ""} ${
            dropFeedback ? "package-visual-packed" : ""
          }`}
          onDragEnter={(event) => {
            if (hasPackageDragData(event)) {
              setIsDropActive(true);
            }
          }}
          onDragOver={(event) => {
            if (!hasPackageDragData(event)) {
              return;
            }

            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            setIsDropActive(true);
          }}
          onDragLeave={(event) => {
            const nextTarget = event.relatedTarget;
            if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
              return;
            }

            setIsDropActive(false);
          }}
          onDrop={handleDrop}
        >
          <PackageScene selectedItems={selectedItems} onItemPacked={packItem} />
          <div className="package-drop-target" aria-hidden="true">
            <span className="package-drop-ring" />
            <span className="package-drop-text">
              {dropFeedback ?? (isDropActive ? "가운데에 놓기" : "짐을 가운데로 드래그")}
            </span>
          </div>
        </div>

        <div className="package-controls">
          <PackageStoragePanel
            selectedItems={selectedItems}
            onSelectedItemsChange={setSelectedItems}
          />
        </div>
      </section>

      <style jsx global>{`
        .package-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 16% 18%, rgba(246, 211, 95, 0.12), transparent 30%),
            linear-gradient(135deg, #101311 0%, #171b17 44%, #0b0d0c 100%);
          color: #f4f1e7;
          overflow-x: hidden;
        }

        .package-back {
          left: clamp(16px, 2.6vw, 32px);
          position: fixed;
          top: clamp(16px, 2.6vw, 30px);
          z-index: 20;
        }

        .package-layout {
          display: grid;
          gap: clamp(18px, 2.5vw, 34px);
          grid-template-columns: minmax(0, 1fr) minmax(360px, 430px);
          min-height: 100vh;
          padding: clamp(72px, 8vw, 96px) clamp(16px, 3vw, 44px) clamp(20px, 3vw, 44px);
        }

        .package-visual {
          border: 1px solid rgba(244, 241, 231, 0.14);
          border-radius: 8px;
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.38);
          min-height: min(760px, calc(100vh - 132px));
          overflow: hidden;
          position: relative;
        }

        .package-visual-drop-active {
          border-color: rgba(246, 211, 95, 0.72);
        }

        .package-visual::after {
          border: 1px solid rgba(246, 211, 95, 0.16);
          content: "";
          inset: 14px;
          pointer-events: none;
          position: absolute;
          transition:
            border-color 0.18s ease,
            inset 0.18s ease,
            opacity 0.18s ease;
        }

        .package-visual-drop-active::after,
        .package-visual-packed::after {
          border-color: rgba(246, 211, 95, 0.78);
          inset: 10px;
          opacity: 0.9;
        }

        .package-visual .package-scene {
          height: 100% !important;
          min-height: min(760px, calc(100vh - 132px)) !important;
        }

        .package-drop-target {
          align-items: center;
          display: grid;
          inset: 0;
          justify-items: center;
          pointer-events: none;
          position: absolute;
          z-index: 4;
        }

        .package-drop-ring {
          border: 1px dashed rgba(246, 211, 95, 0.34);
          border-radius: 50%;
          height: clamp(150px, 22vw, 260px);
          opacity: 0;
          position: absolute;
          transform: scale(0.92);
          transition:
            opacity 0.18s ease,
            transform 0.18s ease,
            border-color 0.18s ease;
          width: clamp(150px, 22vw, 260px);
        }

        .package-drop-text {
          background: rgba(17, 20, 17, 0.72);
          border: 1px solid rgba(246, 211, 95, 0.28);
          border-radius: 999px;
          color: #f4f1e7;
          font-size: 12px;
          letter-spacing: 0.08em;
          opacity: 0;
          padding: 10px 14px;
          text-transform: uppercase;
          transform: translateY(8px);
          transition:
            opacity 0.18s ease,
            transform 0.18s ease;
        }

        .package-visual-drop-active .package-drop-ring,
        .package-visual-packed .package-drop-ring {
          opacity: 1;
          transform: scale(1);
        }

        .package-visual-drop-active .package-drop-text,
        .package-visual-packed .package-drop-text {
          opacity: 1;
          transform: translateY(0);
        }

        .package-visual-packed .package-drop-ring {
          animation: package-packed-pulse 0.65s ease-out;
          border-color: rgba(246, 211, 95, 0.84);
        }

        .package-controls {
          align-self: stretch;
          display: flex;
          min-width: 0;
        }

        .package-controls .package-panel {
          align-content: start;
          color: #f4f1e7;
          grid-template-columns: 1fr;
        }

        .package-controls .package-editor,
        .package-controls .package-saved {
          background: rgba(244, 241, 231, 0.055);
          border-color: rgba(244, 241, 231, 0.16);
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.2);
        }

        .package-controls .package-title-input,
        .package-controls .package-item,
        .package-controls .package-list-button,
        .package-controls .package-delete-button,
        .package-controls .package-count {
          border-color: rgba(244, 241, 231, 0.18);
        }

        .package-controls .package-title-input:focus,
        .package-controls .package-item:hover,
        .package-controls .package-item-selected,
        .package-controls .package-list-button-active,
        .package-controls .package-list-button:hover,
        .package-controls .package-delete-button:hover {
          border-color: rgba(246, 211, 95, 0.58);
        }

        .package-controls .package-item-selected,
        .package-controls .package-list-button-active {
          background: rgba(246, 211, 95, 0.1);
        }

        .package-controls .package-item {
          cursor: grab;
        }

        .package-controls .package-item:active {
          cursor: grabbing;
        }

        .package-controls .package-item-selected .package-checkbox {
          background: #f6d35f;
          border-color: #f6d35f;
          color: #111411;
        }

        .package-controls .package-save-button {
          background: #f4f1e7;
          border-color: #f4f1e7;
          color: #111411;
          width: 100%;
        }

        @media (max-width: 1080px) {
          .package-layout {
            grid-template-columns: 1fr;
          }

          .package-visual,
          .package-visual .package-scene {
            min-height: 58vh !important;
          }
        }

        @media (max-width: 640px) {
          .package-layout {
            padding-left: 12px;
            padding-right: 12px;
          }

          .package-visual,
          .package-visual .package-scene {
            min-height: 420px !important;
          }

          .package-visual::after {
            inset: 8px;
          }
        }

        @keyframes package-packed-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(246, 211, 95, 0.5);
            transform: scale(0.88);
          }
          100% {
            box-shadow: 0 0 0 38px rgba(246, 211, 95, 0);
            transform: scale(1.08);
          }
        }
      `}</style>
    </main>
  );
}
