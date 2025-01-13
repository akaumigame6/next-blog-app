"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PostApiResponse } from "@/app/_types/PostApiResponse";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { Category } from "@/app/_types/Category";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

// カテゴリをフェッチしたときのレスポンスのデータ型
type CategoryApiResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// 投稿記事のカテゴリ選択用のデータ型
type SelectableCategory = {
  id: string;
  name: string;
  isSelect: boolean;
};

//  記事の新規作成 (追加) のページ
const Page: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostTitleError, setNewPostTitleError] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImageURL, setNewPostImageURL] = useState("");

  //  動的ルートパラメータから id を取得 （URL:/admin/categories/[id]）
  const { id } = useParams() as { id: string };

  const router = useRouter();

  // カテゴリ配列 (State)。取得中と取得失敗時は null、既存カテゴリが0個なら []
  const [checkableCategories, setCheckableCategories] = useState<
    SelectableCategory[] | null
  >(null);

  //編集前の記事データ
  const [currentPost, setCurrentPost] = useState<PostApiResponse | null>(null);

  // カテゴリの一覧の取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const requestUrl = "/api/categories";
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          setCheckableCategories(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        const apiResBody = (await res.json()) as CategoryApiResponse[];
        setCheckableCategories(
          apiResBody.map((body) => ({
            id: body.id,
            name: body.name,
            isSelect: false,
          }))
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      }
    };
    fetchCategories();
  }, []);

  // 投稿記事の取得
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const requestUrl = `/api/posts/${id}`;
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          setCurrentPost(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        const apiResBody = (await res.json()) as PostApiResponse;
        setCurrentPost(apiResBody);
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `投稿記事の取得に失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      }
    };

    fetchPost();
  }, [id]);

  // コンポーネントがマウントされたとき (初回レンダリングのとき) に1回だけ実行
  useEffect(() => {
    // 初期化済みなら戻る
    if (isInitialized) return;

    // 投稿記事 または カテゴリ一覧 が取得できていないなら戻る
    if (!currentPost || !checkableCategories) return;

    // 投稿記事のタイトル、本文、カバーイメージURLを更新
    setNewPostTitle(currentPost.title);
    setNewPostContent(currentPost.content);
    setNewPostImageURL(currentPost.coverImageURL);

    // カテゴリの選択状態を更新
    const selectedIds = new Set(
      currentPost.categories.map((c) => c.category.id)
    );
    setCheckableCategories(
      checkableCategories.map((category) => ({
        ...category,
        isSelect: selectedIds.has(category.id),
      }))
    );
    setIsInitialized(true);
  }, [isInitialized, currentPost, checkableCategories]);

  // チェックボックスの状態 (State) を更新する関数
  const switchCategoryState = (categoryId: string) => {
    if (!checkableCategories) return;

    setCheckableCategories(
      checkableCategories.map((category) =>
        category.id === categoryId
          ? { ...category, isSelect: !category.isSelect }
          : category
      )
    );
  };

  // 投稿記事のタイトルのバリデーション
  const isValidPostTitle = (title: string): string => {
    if (title.length < 1) {
      return "1文字以上入力してください。";
    }
    // if (posts && posts.some((c) => c.title === title)) {
    //   return "同じ名前の記事が既に存在します。";
    // }
    return "";
  };

  // テキストボックス(title)の値が変更されたときにコールされる関数
  const updateNewPostTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPostTitleError(isValidPostTitle(e.target.value));
    setNewPostTitle(e.target.value);
  };

  // テキストボックス(content)の値が変更されたときにコールされる関数
  const updateNewPostContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewPostContent(e.target.value);
  };

  // テキストボックス(url)の値が変更されたときにコールされる関数
  const updateNewPostImageURL = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPostImageURL(e.target.value);
  };

  // フォームのボタン (type="submit") がクリックされたときにコールされる関数
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // これを実行しないと意図せずページがリロードされるので注意
    setIsSubmitting(true);

    //ウェブAPI (/api/admin/posts) にPUTリクエストを送信する処理
    try {
      const requestBody = {
        title: newPostTitle,
        content: newPostContent,
        coverImageURL: newPostImageURL,
        categoryIds: checkableCategories
          ? checkableCategories.filter((c) => c.isSelect).map((c) => c.id)
          : [],
      };
      const requestUrl = `/api/admin/posts/${id}`;
      console.log(`${requestUrl} => ${JSON.stringify(requestBody, null, 2)}`);
      const res = await fetch(requestUrl, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
      }
      setIsSubmitting(false);
      router.push(`/posts/${id}`); // 投稿記事の詳細ページに移動
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のPUTリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  // 「削除」のボタンが押下されたときにコールされる関数
  const handleDelete = async () => {
    // prettier-ignore
    if (!window.confirm(`投稿記事「${currentPost?.title}」を本当に削除しますか？`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const requestUrl = `/api/admin/posts/${id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      // カテゴリの一覧ページに移動
      router.replace("/admin/posts");
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のDELETEリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  // カテゴリをウェブAPIから取得中の画面
  if (!isInitialized) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  // カテゴリをウェブAPIから取得することに失敗したときの画面
  if (!checkableCategories) {
    return <div className="text-red-500">{fetchErrorMsg}</div>;
  }

  // カテゴリ取得完了後の画面
  return (
    <main>
      <div className="mb-4 text-2xl font-bold">投稿記事の編集</div>

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center rounded-lg bg-white px-8 py-4 shadow-lg">
            <FontAwesomeIcon
              icon={faSpinner}
              className="mr-2 animate-spin text-gray-500"
            />
            <div className="flex items-center text-gray-500">処理中...</div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={twMerge("mb-4 space-y-4", isSubmitting && "opacity-50")}
      >
        <div className="space-y-1">
          <label htmlFor="title" className="block font-bold">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="w-full rounded-md border-2 px-2 py-1"
            placeholder="タイトルを記入してください"
            value={newPostTitle}
            onChange={updateNewPostTitle}
            required
          />
          {newPostTitleError && (
            <div className="flex items-center space-x-1 text-sm font-bold text-red-500">
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="mr-0.5"
              />
              <div>{newPostTitleError}</div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="block font-bold">
            本文
          </label>
          <textarea
            id="content"
            name="content"
            className="h-48 w-full rounded-md border-2 px-2 py-1"
            placeholder="本文を記入してください"
            value={newPostContent}
            onChange={updateNewPostContent}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="url" className="block font-bold">
            カバーイメージ(URL)
          </label>
          <input
            type="text"
            id="url"
            name="url"
            className="w-full rounded-md border-2 px-2 py-1"
            placeholder="カバーイメージのURLを記入してください"
            value={newPostImageURL}
            onChange={updateNewPostImageURL}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="name" className="block font-bold">
            カテゴリ
          </label>
          <div className="flex flex-wrap gap-x-3.5">
            {checkableCategories.length > 0 ? (
              checkableCategories.map((c) => (
                <label key={c.id} className="flex space-x-1">
                  <input
                    id={c.id}
                    type="checkbox"
                    checked={c.isSelect}
                    className="mt-0.5 cursor-pointer"
                    onChange={() => switchCategoryState(c.id)}
                  />
                  <span className="cursor-pointer">{c.name}</span>
                </label>
              ))
            ) : (
              <div>選択可能なカテゴリが存在しません。</div>
            )}
          </div>
        </div>

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
            disabled={
              isSubmitting || newPostTitleError !== "" || newPostTitle === ""
            }
          >
            記事を変更
          </button>
        </div>
      </form>
    </main>
  );
};

export default Page;
