"use client";
import type { Post } from "@/app/_types/Post";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import { useAuth } from "@/app/_hooks/useAuth";

type Props = {
  post: Post;
  reloadAction: () => Promise<void>;
  setIsSubmitting: (isSubmitting: boolean) => void;
};

const PostSummary: React.FC<Props> = (props) => {
  const { post } = props;
  const dtFmt = "YYYY-MM-DD";
  const safeHTML = DOMPurify.sanitize(post.content, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br"],
  });
  // post.categories.map(function (Category) {
  //   console.log(Category.name);
  // });

  const router = useRouter();
  const { token } = useAuth(); // トークンの取得

  // 「削除」のボタンが押下されたときにコールされる関数
  const handleDelete = async () => {
    // prettier-ignore
    if (!window.confirm(`投稿記事「${post.title}」を本当に削除しますか？`)) {
      return;
    }
    try {
      if (!token) {
        window.alert("予期せぬ動作：トークンが取得できません。");
        return;
      }
      props.setIsSubmitting(true);
      const requestUrl = `/api/admin/posts/${post.id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
        headers: {
          Authorization: token, // ◀ 追加
        },
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      await props.reloadAction();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のDELETEリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
    } finally {
      props.setIsSubmitting(false);
    }
  };

  const handlePut = async () => {
    router.replace(`/admin/posts/${post.id}`);
  };

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
          className="my-2 line-clamp-3"
          dangerouslySetInnerHTML={{ __html: safeHTML }}
        />
      </Link>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className={twMerge(
            "rounded-md px-5 py-1 font-bold",
            "bg-red-500 text-white hover:bg-red-600",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          onClick={handleDelete}
        >
          記事を削除
        </button>
        <button
          type="submit"
          className={twMerge(
            "rounded-md px-5 py-1 font-bold",
            "bg-indigo-500 text-white hover:bg-indigo-600",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          onClick={handlePut}
        >
          記事を変更
        </button>
      </div>
    </div>
  );
};

export default PostSummary;
