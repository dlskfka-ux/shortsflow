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
    } = body;

    const presetGuide: Record<string, string> = {
      "기본 조회수 코치":
        "조회수 가능성을 높이는 후킹, 리텐션, 댓글 유도 중심으로 설계해라.",
      "MrBeast 스타일":
        "강한 보상심리, 큰 숫자, 극적인 반전, 끝까지 보게 만드는 도전형 구조로 작성해라.",
      "정보형 스타일":
        "짧고 명확하게 지식을 전달하되 첫 3초에 강한 궁금증을 만들어라.",
      "돈/부업 스타일":
        "돈, 절약, 부업, 현실적인 이득을 강조하고 저장 욕구를 자극해라.",
      "밈/유머 스타일":
        "가볍고 빠른 템포, 반전, 공감, 웃긴 상황을 중심으로 작성해라.",
      "책요약 스타일":
        "책의 핵심 메시지를 30~60초 안에 강한 깨달음처럼 전달해라.",
      "영화리뷰 스타일":
        "스포일러를 조심하면서 궁금증, 감정, 반전 포인트를 중심으로 작성해라.",
    };

    if (!topic.trim()) {
      return NextResponse.json(
        { error: "주제가 비어있습니다." },
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
너는 세계 최고 수준의 쇼츠 바이럴 기획자이자 조회수 코치다.

목표:
사용자가 입력한 주제로 실제 제작 가능한 쇼츠 콘텐츠를 설계해라.

사용자 입력:
- 주제: ${topic}
- 플랫폼: ${platform}
- 스타일: ${style}
- 카테고리: ${category}
- AI 프리셋: ${preset}

프리셋 적용 규칙:
${presetGuide[preset] || presetGuide["기본 조회수 코치"]}

출력 형식 반드시 유지:

[바이럴 점수]
0~100 점수 + 이유

[후킹 분석]
첫 3초가 왜 강한지 설명

[댓글 유도 분석]
댓글 유도 포인트 설명

[리텐션 분석]
시청 지속 전략 설명

[쇼츠 제목]
조회수 잘 나오는 제목 5개

[썸네일 문구]
짧고 강한 문구 5개

[해시태그]
조회수용 해시태그 10개

[CapCut/Vrew용 장면 대본]
시간대별 장면 구분

예시 형식:
[0~3초]
대사:
장면:

[3~7초]
대사:
장면:

[7~15초]
대사:
장면:

[15~30초]
대사:
장면:

규칙:
- 실제 쇼츠 스타일
- 짧은 문장
- 빠른 템포
- 첫 문장 강한 후킹
- 중간 반전
- 마지막 CTA 포함
- AI스럽지 않게
- 설명문보다 실제 제작 가능한 결과 중심
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
              "너는 쇼츠 조회수 분석 전문가이며 유튜브 알고리즘 전문가다. 반드시 지정된 형식으로 한국어 답변을 작성해라.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.95,
        max_tokens: 2600,
      }),
    });

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
      result: data.choices?.[0]?.message?.content || "AI 결과 생성 실패",
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