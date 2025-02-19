"use client";
import type { Post } from "@/app/_types/Post";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";

type Props = {
  post: Post;
};

const PostSummary: React.FC<Props> = (props) => {
  const { post } = props;
  const dtFmt = "YYYY-MM-DD";
  const safeHTML = DOMPurify.sanitize(post.content, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br"],
  });
  post.categories.map(function (Category) {
    console.log(Category.name);
  });
  return (
    <div className="rounded-md border border-slate-400 bg-slate-100 p-3">
      <div className="flex items-center justify-between">
        <div className="flex space-x-1.5">
          <FontAwesomeIcon icon={faPenToSquare} className="mr-1" />
          <div>{dayjs(post.createdAt).format(dtFmt)}</div>
        </div>
        <div className="flex max-w-64 flex-wrap space-x-1">
          {post.categories.map((Category) => (
            <div
              key={Category.id}
              className={twMerge(
                "my-0.5 rounded-md px-2 py-0.5",
                "text-xs font-bold",
                "border border-slate-400 text-slate-500"
              )}
            >
              {Category.name}
            </div>
          ))}
        </div>
      </div>
      <Link href={`/posts/${post.id}`}>
        <div className="mb-1 text-lg font-bold">{post.title}</div>
        <div
          className="line-clamp-3"
          dangerouslySetInnerHTML={{ __html: safeHTML }}
        />
      </Link>
    </div>
  );
};

export default PostSummary;
