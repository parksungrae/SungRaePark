"use client";

import { Camera, Heart, MessageCircle, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { newId, resizeImage, type Pet, type Post } from "./store";
import s from "./pet.module.css";

interface CommunityTabProps {
  pet: Pet;
  posts: Post[];
  nickname: string;
  onPosts: (posts: Post[]) => void;
  onNickname: (nickname: string) => void;
}

function timeAgo(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function PostCard({
  post,
  nickname,
  onChange,
  onDelete,
}: {
  post: Post;
  nickname: string;
  onChange: (post: Post) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");

  function addComment(e: React.FormEvent) {
    e.preventDefault();
    const body = comment.trim();
    if (!body) return;
    onChange({
      ...post,
      comments: [...post.comments, { id: newId(), nickname, body, createdAt: new Date().toISOString() }],
    });
    setComment("");
  }

  return (
    <article className={`${s.card} ${s.post}`}>
      <div className={s.postHead}>
        <span className={s.postAvatar}>{post.petName.slice(0, 1) || post.nickname.slice(0, 1)}</span>
        <div className={s.postMeta}>
          <b>{post.nickname}</b>
          <span>
            {post.petName && `${post.petName} · `}
            {timeAgo(post.createdAt)}
          </span>
        </div>
        {post.mine && (
          <button
            className={s.iconBtn}
            onClick={() => window.confirm("이 글을 지울까요?") && onDelete()}
            aria-label="글 지우기"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <p className={s.postBody}>{post.body}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {post.photo && <img className={s.postPhoto} src={post.photo} alt="" />}

      <div className={s.postActions}>
        <button
          className={`${s.iconBtn} ${post.liked ? s.liked : ""}`}
          onClick={() => onChange({ ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) })}
          aria-pressed={post.liked}
        >
          <Heart size={16} /> {post.likes}
        </button>
        <button className={s.iconBtn} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <MessageCircle size={16} /> {post.comments.length}
        </button>
      </div>

      {open && (
        <div className={s.comments}>
          {post.comments.map((c) => (
            <div key={c.id} className={s.comment}>
              <b>{c.nickname}</b>
              {c.body}
            </div>
          ))}
          <form className={s.composer} style={{ marginTop: 4 }} onSubmit={addComment}>
            <input
              className={s.input}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="따뜻한 한마디"
              maxLength={300}
            />
            <button type="submit" className={s.btn} disabled={!comment.trim()}>
              등록
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

export function CommunityTab({ pet, posts, nickname, onPosts, onNickname }: CommunityTabProps) {
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);
  const name = nickname || `${pet.name}집사`;

  async function pickPhoto(file: File | undefined) {
    if (file) setPhoto(await resizeImage(file).catch(() => undefined));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    const post: Post = {
      id: newId(),
      nickname: name,
      petName: pet.name,
      body: text,
      photo,
      createdAt: new Date().toISOString(),
      likes: 0,
      liked: false,
      mine: true,
      comments: [],
    };
    onPosts([post, ...posts]);
    setBody("");
    setPhoto(undefined);
  }

  const sorted = [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className={s.stagger}>
      <form className={s.card} onSubmit={submit}>
        <div className={s.cardTitle}>
          이야기 나누기
          <small>데모: 내 브라우저에만 보여요</small>
        </div>
        <label className={s.field}>
          닉네임
          <input
            className={s.input}
            value={nickname}
            onChange={(e) => onNickname(e.target.value)}
            placeholder={`${pet.name}집사`}
            maxLength={20}
          />
        </label>
        <label className={s.field}>
          내용
          <textarea
            className={s.textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`${pet.name} 이야기, 궁금한 점, 꿀팁을 나눠 주세요`}
            maxLength={1000}
          />
        </label>
        <div className={s.attach}>
          <button type="button" className={s.btn} onClick={() => fileRef.current?.click()}>
            <Camera size={16} /> 사진
          </button>
          {photo && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" />
              <button type="button" className={s.iconBtn} onClick={() => setPhoto(undefined)} aria-label="사진 빼기">
                <X size={14} />
              </button>
            </>
          )}
          <button type="submit" className={`${s.btn} ${s.primary}`} style={{ marginLeft: "auto" }} disabled={!body.trim()}>
            올리기
          </button>
        </div>
        <input
          ref={fileRef}
          className={s.hidden}
          type="file"
          accept="image/*"
          onChange={(e) => pickPhoto(e.target.files?.[0])}
        />
      </form>

      {sorted.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          nickname={name}
          onChange={(next) => onPosts(posts.map((p) => (p.id === next.id ? next : p)))}
          onDelete={() => onPosts(posts.filter((p) => p.id !== post.id))}
        />
      ))}
    </div>
  );
}
