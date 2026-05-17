import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      topic = "",
      platform = "YouTube Shorts",
      style = "자극형",
      category = "정보형",
    } = body;

    const prompt = `
너는 세계 최고 수준의 쇼츠 바이럴 기획자다.

목표:
조회수 잘 나오는 쇼츠 구조를 설계한다.

조건:
- 플랫폼: ${platform}
- 스타일: ${style}
- 카테고리: ${category}
- 주제: ${topic}

출력 형식 반드시 유지:

[바이럴 점수]
0~100 사이 숫자와 이유

[후킹 분석]
왜 첫 3초가 강한지 설명

[댓글 유도 분석]
댓글이 달릴 포인트 설명

[리텐션 분석]
시청 지속 시간 유지 전략 설명

[쇼츠 제목]
조회수 잘 나오는 제목 5개

[썸네일 문구]
짧고 강한 문구 5개

[해시태그]
조회수용 해시태그 10개

[쇼츠 대본]
실제 쇼츠용 대본 작성

규칙:
- 짧은 문장
- 첫 줄 강한 후킹
- 중간 이탈 방지
- 마지막 CTA 포함
- 실제 조회수 잘 나오는 느낌
- 너무 AI스럽지 않게
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
              role: "system",
              content:
                "너는 쇼츠 조회수 분석 전문가이며 유튜브 알고리즘 전문가다.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.9,
          max_tokens: 2200,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.log(data);

      return NextResponse.json(
        {
          error: data.error?.message || "OpenAI API 오류",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      result:
        data.choices?.[0]?.message?.content || "AI 결과 생성 실패",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}