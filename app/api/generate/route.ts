import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      topic = "",
      platform = "YouTube Shorts",
      style = "자극형",
      category = "돈/부업",
      preset = "기본 조회수 코치",
      length = "45초",
      tone = "친구한테 말하는 느낌",
    } = body;

    const presetGuide: Record<string, string> = {
      "기본 조회수 코치":
        "조회수 가능성을 높이는 스토리텔링, 후킹, 리텐션 중심으로 작성해라.",

      "MrBeast 스타일":
        "긴장감과 몰입감을 유지하면서 끝까지 보게 만들어라.",

      "정보형 스타일":
        "정보를 설명하지 말고 상황과 사례로 자연스럽게 전달해라.",

      "돈/부업 스타일":
        "현실적인 돈 문제와 공감 포인트를 강조해라.",

      "밈/유머 스타일":
        "실제 사람들이 공감할 만한 상황으로 웃기게 풀어라.",

      "책요약 스타일":
        "책 내용을 실제 삶의 장면처럼 풀어라.",

      "영화리뷰 스타일":
        "친구에게 영화 설명하듯 몰입감 있게 말해라.",
    };

    const toneGuide: Record<string, string> = {
      "담백한 말투":
        "오버하지 말고 차분하고 자연스럽게 말해라.",

      "친구한테 말하는 느낌":
        "친구랑 대화하듯 편하게 말해라.",

      "전문가 느낌":
        "신뢰감 있게 말하되 딱딱하지 않게 설명해라.",

      "웃긴 말투":
        "공감과 타이밍 중심으로 자연스럽게 웃기게 말해라.",

      "스토리텔링 느낌":
        "사람 이야기를 들려주듯 몰입감 있게 말해라.",
    };

    if (!topic.trim()) {
      return NextResponse.json(
        { error: "주제를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 없습니다." },
        { status: 500 }
      );
    }

    const prompt = `
너는 실제 조회수 높은 쇼츠를 만드는 스토리텔링 작가다.

가장 중요한 목표:
사용자가 바로 녹음해서 영상에 넣을 수 있을 정도로 자연스럽고 몰입감 있는 대본을 만들어라.

사용자 입력:
- 주제: ${topic}
- 플랫폼: ${platform}
- 스타일: ${style}
- 카테고리: ${category}
- 프리셋: ${preset}
- 목표 길이: ${length}
- 원하는 말투: ${tone}

프리셋 규칙:
${presetGuide[preset] || presetGuide["기본 조회수 코치"]}

말투 규칙:
${toneGuide[tone] || toneGuide["친구한테 말하는 느낌"]}

중요:
- AI처럼 설명하지 마라
- 분석 리포트처럼 쓰지 마라
- 실제 사람이 말하는 느낌 유지
- 장면이 머릿속에 그려지게 써라
- 첫 문장은 궁금증을 만들어야 한다
- 중간에는 작은 반전이나 의외성을 넣어라
- 마지막에는 댓글 포인트를 남겨라
- 실제 쇼츠 크리에이터 말투처럼 작성
- 느낌표, 물음표 남발 금지
- 과장된 표현 금지
- "충격", "소름", "무조건", "인생 바뀜" 같은 표현 금지
- 정보보다 몰입감이 중요하다
- 바로 영상 녹음 가능한 수준이어야 한다

좋은 예시:

"내 친구 중에 월급 들어오면 항상 행복해하는 애가 있었거든."

"근데 신기한 게 일주일만 지나면 항상 돈이 없대."

"처음엔 그냥 많이 쓰는 줄 알았는데, 카드 내역 보니까 진짜 문제는 다른 데 있었어."

출력 형식:

[바이럴 점수]
0~100 점수 + 짧은 이유

[후킹 분석]
왜 첫 문장이 궁금증을 만드는지 설명

[댓글 유도 분석]
사람들이 어떤 부분에 댓글을 달 가능성이 있는지 설명

[리텐션 분석]
어떤 흐름 때문에 끝까지 보게 되는지 설명

[쇼츠 제목]
실제 쇼츠 느낌 제목 5개

[썸네일 문구]
짧고 현실적인 문구 5개

[해시태그]
과하지 않은 해시태그 10개

[CapCut/Vrew용 장면 대본]

반드시 시간대별로 작성해라.

형식:

[0~3초]
대사:
장면:

[3~7초]
대사:
장면:

[7~15초]
대사:
장면:

[15~25초]
대사:
장면:

[25~40초]
대사:
장면:

[40초~마무리]
대사:
장면:

중요:
- 대본이 가장 중요하다
- 각 구간 대사를 짧게 대충 쓰지 마라
- 실제 사람이 말하는 수준으로 디테일하게 써라
- 장면 설명은 편집자가 바로 이해할 수 있게 써라
- 정보 전달보다 흐름과 몰입감이 중요하다
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
                "너는 실제 조회수 높은 쇼츠를 쓰는 스토리텔링 작가다. 가장 중요한 건 자연스러운 대사와 몰입감이다.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 3600,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
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