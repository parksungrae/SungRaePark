import { notFound } from "next/navigation";
import { posts } from "../data";
import { BackButton } from "../../../components/BackButton";

export default async function PostDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = posts.find((p) => p.id === id);

  if (!post) {
    notFound();
  }

  return (
    <div className="post-detail-container">
      <header className="post-header">
        <BackButton href="/make" />
        <span className="post-date">{post.date}</span>
        <h1 className="detail-title">{post.title}</h1>
      </header>

      <article className="post-content">
        {post.content.split("\n").map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </article>
    </div>
  );
}
