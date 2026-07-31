"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

type LuggageItem = {
  id: string;
  label: string;
};

type SavedPackage = {
  id: string;
  title: string;
  items: string[];
  savedAt: string;
};

type PackageStoragePanelProps = {
  selectedItems: string[];
  onSelectedItemsChange: (items: string[]) => void;
};

const STORAGE_KEY = "package-storage-panel-packages";
const STORAGE_EVENT = "package-storage-panel-updated";
const EMPTY_PACKAGES: SavedPackage[] = [];

let cachedStorageValue: string | null = null;
let cachedPackages: SavedPackage[] = EMPTY_PACKAGES;

const LUGGAGE_ITEMS: LuggageItem[] = [
  { id: "mini-keyboard", label: "미니건반 (USB-B to C)" },
  { id: "macbook", label: "맥북 (맥북충전기, C to 8)" },
  { id: "snorkel", label: "스노클" },
  { id: "aqua-shoes", label: "아쿠아슈즈" },
  { id: "long-fins", label: "롱핀" },
  { id: "swim-cap", label: "수영모" },
  { id: "swim-shorts", label: "수영바지" },
  { id: "sun-kit", label: "선꾸림" },
  { id: "cleansing-foam", label: "클렌징폼" },
  { id: "lotion", label: "로션" },
  { id: "camera", label: "카메라" },
];

function readSavedPackages(): SavedPackage[] {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter((item): item is SavedPackage => {
      return (
        typeof item?.id === "string" &&
        typeof item?.title === "string" &&
        Array.isArray(item?.items) &&
        item.items.every((selectedItem: unknown) => typeof selectedItem === "string") &&
        typeof item?.savedAt === "string"
      );
    });
  } catch {
    return [];
  }
}

function formatSavedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function subscribeToSavedPackages(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(STORAGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(STORAGE_EVENT, onStoreChange);
  };
}

function getSavedPackagesSnapshot() {
  const storageValue = window.localStorage.getItem(STORAGE_KEY);

  if (storageValue === cachedStorageValue) {
    return cachedPackages;
  }

  cachedStorageValue = storageValue;
  cachedPackages = readSavedPackages();
  return cachedPackages;
}

function getSavedPackagesServerSnapshot() {
  return EMPTY_PACKAGES;
}

export function PackageStoragePanel({
  selectedItems,
  onSelectedItemsChange,
}: PackageStoragePanelProps) {
  const [title, setTitle] = useState("");
  const [activePackageId, setActivePackageId] = useState<string | null>(null);
  const savedPackages = useSyncExternalStore(
    subscribeToSavedPackages,
    getSavedPackagesSnapshot,
    getSavedPackagesServerSnapshot,
  );

  const activePackage = useMemo(
    () =>
      savedPackages.find((savedPackage) => savedPackage.id === activePackageId) ??
      savedPackages[0] ??
      null,
    [activePackageId, savedPackages],
  );

  const selectedLabels = useMemo(() => {
    return new Map(LUGGAGE_ITEMS.map((item) => [item.id, item.label]));
  }, []);

  const savePackages = (packages: SavedPackage[]) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  };

  const toggleItem = (itemId: string) => {
    const nextItems = selectedItems.includes(itemId)
      ? selectedItems.filter((selectedItem) => selectedItem !== itemId)
      : [...selectedItems, itemId];

    onSelectedItemsChange(nextItems);
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || selectedItems.length === 0) {
      return;
    }

    const packageToSave: SavedPackage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: trimmedTitle,
      items: selectedItems,
      savedAt: new Date().toISOString(),
    };
    const nextPackages = [packageToSave, ...savedPackages];

    savePackages(nextPackages);
    setActivePackageId(packageToSave.id);
    setTitle("");
  };

  const handleDelete = (packageId: string) => {
    const nextPackages = savedPackages.filter((savedPackage) => savedPackage.id !== packageId);

    savePackages(nextPackages);
    if (activePackageId === packageId) {
      setActivePackageId(nextPackages[0]?.id ?? null);
    }
  };

  return (
    <section className="package-panel" aria-label="Package storage">
      <div className="package-editor">
        <div className="package-field">
          <label className="package-label" htmlFor="package-title">
            짐 제목
          </label>
          <input
            id="package-title"
            className="package-title-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="서울 주말 짐"
            type="text"
          />
        </div>

        <div className="package-items" aria-label="짐 항목">
          {LUGGAGE_ITEMS.map((item) => {
            const isSelected = selectedItems.includes(item.id);

            return (
              <button
                key={item.id}
                className={`package-item ${isSelected ? "package-item-selected" : ""}`}
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "copy";
                  event.dataTransfer.setData("application/x-package-item", item.id);
                  event.dataTransfer.setData("text/plain", item.label);
                }}
                onClick={() => toggleItem(item.id)}
                aria-pressed={isSelected}
              >
                <span className="package-checkbox" aria-hidden="true">
                  {isSelected ? "✓" : ""}
                </span>
                <span className="package-item-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          className="package-save-button"
          type="button"
          onClick={handleSave}
          disabled={!title.trim() || selectedItems.length === 0}
        >
          저장
        </button>
      </div>

      <aside className="package-saved" aria-label="저장된 짐">
        <div className="package-saved-header">
          <h2 className="package-saved-title">저장된 짐</h2>
          <span className="package-count">{savedPackages.length}</span>
        </div>

        <div className="package-saved-layout">
          <ul className="package-list">
            {savedPackages.map((savedPackage) => (
              <li key={savedPackage.id} className="package-list-item">
                <button
                  className={`package-list-button ${
                    savedPackage.id === activePackageId ? "package-list-button-active" : ""
                  }`}
                  type="button"
                  onClick={() => setActivePackageId(savedPackage.id)}
                >
                  <span className="package-list-title">{savedPackage.title}</span>
                  <span className="package-list-meta">
                    {savedPackage.items.length}개 - {formatSavedDate(savedPackage.savedAt)}
                  </span>
                </button>
                <button
                  className="package-delete-button"
                  type="button"
                  onClick={() => handleDelete(savedPackage.id)}
                  aria-label={`${savedPackage.title} 삭제`}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>

          <div className="package-detail">
            {activePackage ? (
              <>
                <h3 className="package-detail-title">{activePackage.title}</h3>
                <ul className="package-detail-list">
                  {activePackage.items.map((itemId) => (
                    <li key={itemId} className="package-detail-item">
                      {selectedLabels.get(itemId) ?? itemId}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="package-empty">저장된 짐이 없습니다.</p>
            )}
          </div>
        </div>
      </aside>

      <style jsx global>{`
        .package-panel {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.8fr);
          gap: 24px;
          width: 100%;
          color: var(--foreground);
        }

        .package-editor,
        .package-saved {
          border: 1px solid rgba(128, 128, 128, 0.22);
          border-radius: 8px;
          padding: 20px;
          background: rgba(128, 128, 128, 0.04);
        }

        .package-field {
          margin-bottom: 18px;
        }

        .package-label,
        .package-saved-title {
          display: block;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          margin: 0 0 10px;
          opacity: 0.58;
          text-transform: uppercase;
        }

        .package-title-input {
          width: 100%;
          border: 1px solid rgba(128, 128, 128, 0.28);
          border-radius: 6px;
          background: transparent;
          color: inherit;
          font: inherit;
          min-height: 44px;
          outline: none;
          padding: 0 12px;
        }

        .package-title-input:focus {
          border-color: rgba(128, 128, 128, 0.7);
        }

        .package-items {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }

        .package-item,
        .package-save-button,
        .package-list-button,
        .package-delete-button {
          font: inherit;
        }

        .package-item {
          align-items: center;
          background: transparent;
          border: 1px solid rgba(128, 128, 128, 0.2);
          border-radius: 6px;
          color: inherit;
          cursor: pointer;
          display: flex;
          gap: 10px;
          min-height: 48px;
          padding: 8px 10px;
          text-align: left;
          transition:
            background-color 0.2s,
            border-color 0.2s;
        }

        .package-item:hover,
        .package-item-selected {
          background: rgba(128, 128, 128, 0.1);
          border-color: rgba(128, 128, 128, 0.48);
        }

        .package-checkbox {
          align-items: center;
          border: 1px solid rgba(128, 128, 128, 0.45);
          border-radius: 4px;
          display: inline-flex;
          flex: 0 0 18px;
          height: 18px;
          justify-content: center;
          line-height: 1;
        }

        .package-item-label {
          font-size: 14px;
          line-height: 1.35;
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .package-save-button {
          border: 1px solid var(--foreground);
          border-radius: 6px;
          background: var(--foreground);
          color: var(--background);
          cursor: pointer;
          min-height: 44px;
          padding: 0 18px;
        }

        .package-save-button:disabled {
          cursor: not-allowed;
          opacity: 0.35;
        }

        .package-saved-header {
          align-items: center;
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .package-count {
          border: 1px solid rgba(128, 128, 128, 0.25);
          border-radius: 999px;
          font-size: 12px;
          min-width: 28px;
          padding: 3px 8px;
          text-align: center;
        }

        .package-saved-layout {
          display: grid;
          gap: 16px;
        }

        .package-list,
        .package-detail-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .package-list {
          display: grid;
          gap: 8px;
          max-height: 260px;
          overflow: auto;
        }

        .package-list-item {
          align-items: stretch;
          display: grid;
          gap: 8px;
          grid-template-columns: minmax(0, 1fr) auto;
        }

        .package-list-button {
          background: transparent;
          border: 1px solid rgba(128, 128, 128, 0.18);
          border-radius: 6px;
          color: inherit;
          cursor: pointer;
          display: grid;
          gap: 4px;
          min-width: 0;
          padding: 10px;
          text-align: left;
        }

        .package-list-button-active,
        .package-list-button:hover {
          border-color: rgba(128, 128, 128, 0.5);
          background: rgba(128, 128, 128, 0.09);
        }

        .package-list-title {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .package-list-meta {
          font-size: 11px;
          opacity: 0.48;
        }

        .package-delete-button {
          background: transparent;
          border: 1px solid rgba(128, 128, 128, 0.18);
          border-radius: 6px;
          color: inherit;
          cursor: pointer;
          font-size: 12px;
          padding: 0 10px;
        }

        .package-delete-button:hover {
          border-color: rgba(128, 128, 128, 0.5);
        }

        .package-detail {
          border-top: 1px solid rgba(128, 128, 128, 0.15);
          min-height: 120px;
          padding-top: 14px;
        }

        .package-detail-title {
          font-size: 18px;
          font-weight: 500;
          margin: 0 0 10px;
        }

        .package-detail-list {
          display: grid;
          gap: 8px;
        }

        .package-detail-item {
          border-bottom: 1px solid rgba(128, 128, 128, 0.08);
          font-size: 14px;
          padding-bottom: 8px;
        }

        .package-empty {
          font-size: 14px;
          margin: 0;
          opacity: 0.48;
        }

        @media (max-width: 900px) {
          .package-panel {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}

export default PackageStoragePanel;
