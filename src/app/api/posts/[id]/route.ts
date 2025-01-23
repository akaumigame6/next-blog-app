import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Post } from "@prisma/client";
import { error } from "console";

type RouteParams = {
  params: {
    id: string;
  };
};

export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化する設定

export const GET = async (req: NextRequest, routeParams: RouteParams) => {
  try {
    const id = routeParams.params.id;
    const post = await prisma.post.findUnique({
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      where: {
        id,
      },
    });
    if (!post) {
      return NextResponse.json(
        {
          error:
            "id='" +
            routeParams.params.id +
            "'の投稿記事は見つかりませんでした",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "投稿記事の取得に失敗しました",
      },
      { status: 500 }
    );
  }
};
