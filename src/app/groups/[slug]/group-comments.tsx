"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createGroupCommentAction } from "./actions";
import type { GroupCommentView } from "@/modules/groups/contracts";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Stockholm",
});

export function GroupComments({
  groupSlug,
  comments,
  isAuthenticated,
  isMember,
}: {
  groupSlug: string;
  comments: GroupCommentView[];
  isAuthenticated: boolean;
  isMember: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function postComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPosting(true);

    try {
      const result = await createGroupCommentAction(groupSlug, body);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setBody("");
      router.refresh();
    } catch {
      setError("We could not post your comment. Please try again.");
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <section aria-labelledby="discussion-title" className="mt-16 border-t border-[var(--line)] pt-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-4xl font-black tracking-[-0.065em]" id="discussion-title">Discussion</h2>
          <p className="mt-2 text-[var(--muted)]">Share plans, questions, and good energy with the group.</p>
        </div>
        <span className="text-sm font-bold text-[var(--muted)]">{comments.length} {comments.length === 1 ? "message" : "messages"}</span>
      </div>

      <div className="mt-7 space-y-3">
        {comments.length > 0 ? comments.map((comment) => (
          <article className="rounded-2xl bg-[var(--surface-muted)] p-4" key={comment.id}>
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-extrabold">{comment.authorName}</p>
              <time className="shrink-0 text-xs font-bold text-[var(--muted)]" dateTime={comment.createdAt}>{dateFormatter.format(new Date(comment.createdAt))}</time>
            </div>
            <p className="mt-2 whitespace-pre-wrap leading-7 text-[var(--muted)]">{comment.body}</p>
          </article>
        )) : <p className="rounded-2xl border border-dashed border-[var(--line-strong)] px-5 py-8 text-center text-[var(--muted)]">No messages yet. Start the conversation.</p>}
      </div>

      {isMember ? <form className="mt-6" onSubmit={postComment}>
        <label className="sr-only" htmlFor="group-comment">Join the conversation</label>
        <textarea className="min-h-28 w-full resize-y rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-4 leading-7 outline-none transition focus:border-[var(--ink)] focus:ring-2 focus:ring-[var(--accent)]" id="group-comment" maxLength={500} onChange={(event) => setBody(event.target.value)} placeholder="Ask a question or share a plan…" value={body} />
        <div className="mt-3 flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-[var(--muted)]">{body.length}/500</span>
          <button className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-extrabold text-[var(--accent-foreground)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" disabled={isPosting || body.trim().length === 0} type="submit">{isPosting ? "Posting…" : "Post comment"}</button>
        </div>
        {error ? <p className="mt-3 text-sm text-[var(--accent-strong)]" role="alert">{error}</p> : null}
      </form> : isAuthenticated ? <p className="mt-6 rounded-2xl bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)]">Join the group to comment.</p> : <p className="mt-6 rounded-2xl bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)]"><Link className="font-extrabold text-[var(--accent-strong)] underline underline-offset-4" href="/sign-in">Sign in to join the conversation</Link>.</p>}
    </section>
  );
}
