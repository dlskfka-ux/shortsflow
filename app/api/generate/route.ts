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
    } = body;

    const presetGuide: Record<string, string> = {
      "기본 조회수 코치": "조회수 가능성을 높이는 스토리텔링, 후킹, 리텐션 중심으로 작성해라.",
      "MrBeast 스타일": "큰 보상, 도전, 긴장감, 끝까지 보게 만드는 전개를 사용해라.",
      "정보형 스타일": "정보를 단순 설명하지 말고 실제 사례와 상황으로 풀어라.",
      "돈/부업 스타일": "돈 문제를 현실적인 사람 이야기처럼 풀고 저장 욕구를 자극해라.",
      "밈/유머 스타일": "공감되는 상황과 반전으로 웃기게 풀어라.",
      "책요약 스타일": "책 내용을 교훈처럼 말하지 말고 실제 삶의 장면으로 연결해라.",
      "영화리뷰 스타일": "영화 소개가 아니라 친구에게 몰입감 있게 이야기하듯 풀어라.",
    };

    if (!topic.trim()) {
      return NextResponse.json({ error: "주제를 입력해주세요." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY가 없습니다." }, { status: 500 });
    }

    const prompt = `
너는 실제 쇼츠를 만드는 스토리텔링 작가이자 조회수 코치다.

가장 중요한 목표:
사용자가 바로 영상에 넣을 수 있을 정도로 몰입감 있는 쇼츠 대본을 만들어라.

사용자 입력:
- 주제: ${topic}
- 플랫폼: ${platform}
- 스타일: ${style}
- 카테고리: ${category}
- 프리셋: ${preset}
- 목표 길이: ${length}

프리셋 규칙:
${presetGuide[preset] || presetGuide["기본 조회수 코치"]}

대본 작성 핵심:
- 단순 정보 설명 금지
- 실제 사람이 겪은 이야기처럼 시작
- 장면이 머릿속에 그려지게 작성
- 첫 문장은 궁금해야 함
- 중간에 작은 반전 또는 의외성 추가
- 마지막에는 댓글 포인트 남기기
- 바로 녹음 가능한 대사체
- 느낌표, 물음표 남발 금지
- 과장된 표현 금지
- 대본이 가장 중요함
- 목표 길이에 맞게 대사량 조절

출력 형식은 반드시 유지해라.

[바이럴 점수]
0~100 점수 + 짧은 이유

[후킹 분석]
첫 문장이 왜 궁금증을 만드는지 설명

[댓글 유도 분석]
사람들이 어떤 부분에 댓글을 달 가능성이 있는지 설명

[리텐션 분석]
어떤 지점에서 계속 보게 되는지 설명

[쇼츠 제목]
조회수 잘 나올 만한 제목 5개

[썸네일 문구]
짧고 현실적인 문구 5개

[해시태그]
과하지 않은 해시태그 10개

[CapCut/Vrew용 장면 대본]
반드시 시간대별로 작성해라.
각 구간마다 대사와 장면을 모두 써라.
대사는 실제 영상에 바로 넣을 수 있어야 한다.
목표 길이 ${length}에 맞춰 작성해라.

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
- 대본을 짧게 대충 쓰지 마라
- 각 구간의 대사는 실제로 말할 수 있게 디테일하게 써라
- 장면 설명은 편집자가 바로 이해할 수 있게 써라
- 사람 이야기처럼 써라
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
              "너는 실제 조회수 높은 쇼츠를 쓰는 스토리텔링 작가다. 분석보다 대본의 몰입감과 실제 대사 퀄리티를 최우선으로 한다.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.78,
        max_tokens: 3400,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "OpenAI API 오류" },
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
          error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}