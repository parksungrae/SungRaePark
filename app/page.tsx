import Link from "next/link";

export default function Home() {
  const dots = Array.from({ length: 40 }, (_, i) => i);

  return (
    <main className="dots-container">
      {dots.map((i) =>
        i === 2 ? (
          <Link
            key={i}
            href="/make"
            className="dot"
            style={{ display: "block", cursor: "pointer" }}
          />
        ) : i === 3 ? (
          <Link
            key={i}
            href="/aquarium"
            className="dot"
            style={{ display: "block", cursor: "pointer" }}
          />
        ) : i === 38 ? (
          <Link
            key={i}
            href="/theme"
            className="dot"
            style={{ display: "block", cursor: "pointer" }}
          />
        ) : (
          <div key={i} className="dot" />
        ),
      )}

      <div className="dot half" title="60% blinking dot" />
    </main>
  );
}
