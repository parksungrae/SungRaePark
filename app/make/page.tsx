import Link from "next/link";
import { posts } from "./data";

export default function MakePage() {
  return (
    <div className="make-container">
      <header className="make-header">
        <Link href="/" className="back-link">
          ←
        </Link>
        <h1>叙事</h1>
      </header>

      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.id} className="post-item">
            <Link href={`/make/${post.id}`} className="post-link">
              <span className="post-date">{post.date}</span>
              <h2 className="post-title">{post.title}</h2>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
