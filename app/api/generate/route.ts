import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const topic = body.topic || "주제 없음";
    const platform = body.platform || "YouTube Shorts";
    const style = body.style || "자극형";

    const prompt = `
너는 조회수가 잘 나오는 쇼츠 대본 전문가다.

주제:
${topic}

플랫폼:
${platform}

스타일:
${style}

아래 형식으로 작성해줘.

[썸네일 문구]
강한 클릭 유도 문구

[후킹]
첫 3초 대사

[리텐션 포인트]
언제 반전을 넣어야 하는지

[CTA]
구독/댓글 유도 문구

[전체 대본]
30~60초 쇼츠용 대본
`;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.error?.message || "OpenAI API 오류",
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json({
      result:
        data.choices?.[0]?.message?.content ||
        "AI 결과가 비어있습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "서버 오류 발생",
      },
      {
        status: 500,
      }
    );
  }
}