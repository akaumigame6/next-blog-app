"use client";
import { useState, useEffect, useCallback } from "react";
import type { Post } from "@/app/_types/Post";
import type { PostApiResponse } from "@/app/_types/PostApiResponse";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { Category } from "@/app/_types/Category";
import Link from "next/link";

// カテゴリをフェッチしたときのレスポンスのデータ型
type RawApiCategoryResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// カテゴリの一覧表示のページ
const Page: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

  // カテゴリ配列 (State)。取得中と取得失敗時は null、既存カテゴリが0個なら []
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);

  // ウェブAPI (/api/categories) からカテゴリの一覧をフェッチする関数の定義
  const fetchCategories = async () => {
    try {
      setIsLoading(true);

      // フェッチ処理の本体
      const requestUrl = "/api/categories";
      const res = await fetch(requestUrl, {
        method: "GET",
        cache: "no-store",
      });

      // レスポンスのステータスコードが200以外の場合 (カテゴリのフェッチに失敗した場合)
      if (!res.ok) {
        setCategories(null);
        throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
      }

      // レスポンスのボディをJSONとして読み取りカテゴリ配列 (State) にセット
      const apiResBody = (await res.json()) as RawApiCategoryResponse[];
      setCategories(
        apiResBody.map((body) => ({
          id: body.id,
          name: body.name,
        }))
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
          : `予期せぬエラーが発生しました ${error}`;
      console.error(errorMsg);
      setFetchErrorMsg(errorMsg);
    } finally {
      // 成功した場合も失敗した場合もローディング状態を解除
      setIsLoading(false);
    }
  };

  // コンポーネントがマウントされたとき (初回レンダリングのとき) に1回だけ実行
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const requestUrl = `/api/posts`;
      const response = await fetch(requestUrl, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("データの取得に失敗しました");
      }
      const postResponse: PostApiResponse[] = await response.json();
      setPosts(
        postResponse.map((rawPost) => ({
          id: rawPost.id,
          title: rawPost.title,
          content: rawPost.content,
          coverImage: {
            url: rawPost.coverImageURL,
            width: 1000,
            height: 1000,
          },
          createdAt: rawPost.createdAt,
          categories: rawPost.categories.map((category) => ({
            id: category.category.id,
            name: category.category.name,
          })),
        }))
      );
    } catch (e) {
      setFetchErrorMsg(
        e instanceof Error ? e.message : "予期せぬエラーが発生しました"
      );
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // カテゴリの使用数をカウントする関数
  const countPostPerCategory = (posts: Post[]) => {
    const categoryCount: { [key: string]: number } = {};

    posts.forEach((post) => {
      post.categories.forEach((category) => {
        if (categoryCount[category.id]) {
          categoryCount[category.id]++;
        } else {
          categoryCount[category.id] = 1;
        }
      });
    });

    return categoryCount;
  };

  // カテゴリの使用数をカウント
  const categoryUsageCounts = posts ? countPostPerCategory(posts) : {};

  // カテゴリをウェブAPIから取得中の画面
  if (isLoading) {
    return (
      <div className="text-slate-50">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  // 「削除」のボタンが押下されたときにコールされる関数
  const handleDelete = async (category: Category) => {
    // prettier-ignore
    if (!window.confirm(`カテゴリ「${category.name}」を本当に削除しますか？`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const requestUrl = `/api/admin/categories/${category.id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      await fetchCategories(); // カテゴリの一覧を再取得
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリのDELETEリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  // カテゴリをウェブAPIから取得することに失敗したときの画面
  if (!categories) {
    return <div className="text-red-500">{fetchErrorMsg}</div>;
  }

  // カテゴリ取得完了後の画面
  return (
    <main>
      <div className="text-2xl font-bold text-slate-50">カテゴリの管理</div>

      <div className="mb-3 flex items-end justify-end">
        <Link href="/admin/categories/new">
          <button
            type="submit"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-blue-500 text-white hover:bg-blue-600",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            カテゴリの新規作成
          </button>
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="text-slate-50">
          （カテゴリは1個も作成されていません）
        </div>
      ) : (
        <div>
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className={twMerge(
                  "border border-slate-400 p-3",
                  "flex items-center justify-between",
                  "font-bold",
                  "rounded-md",
                  "bg-slate-100"
                )}
              >
                <div>
                  <Link href={`/admin/categories/${category.id}`}>
                    {category.name}
                  </Link>
                </div>
                <div>記事数:{categoryUsageCounts[category.id] || 0}個</div>
                <div className="flex space-x-2">
                  <Link href={`/admin/categories/${category.id}`}>
                    <button
                      type="button"
                      className={twMerge(
                        "rounded-md px-5 py-1 font-bold",
                        "bg-indigo-500 text-white hover:bg-indigo-600"
                      )}
                    >
                      編集
                    </button>
                  </Link>
                  <button
                    type="button"
                    className={twMerge(
                      "rounded-md px-5 py-1 font-bold",
                      "bg-red-500 text-white hover:bg-red-600"
                    )}
                    onClick={() => {
                      handleDelete(category);
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
};

export default Page;
