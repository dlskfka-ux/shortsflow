"use client";

import { useEffect, useMemo, useState } from "react";

const FREE_LIMIT = 5;
const HISTORY_KEY = "shortsflow_history";

type HistoryItem = {
  id: string;
  topic: string;
  category: string;
  platform: string;
  style: string;
  result: string;
  createdAt: string;
};

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function usageKey() {
  return `shortsflow_usage_${todayKey()}`;
}

function extractSection(text: string, title: string) {
  const regex = new RegExp(`\\[${title}\\]\\s*([\\s\\S]*?)(?=\\n\\[|$)`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function getScoreFromResult(text: string) {
  const scoreText = extractSection(text, "바이럴 점수");
  const scoreNumber = Number(scoreText.replace(/[^0-9]/g, ""));

  if (Number.isNaN(scoreNumber)) return 78;
  return Math.min(100, Math.max(0, scoreNumber));
}

export default function HomePage() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("YouTube Shorts");
  const [style, setStyle] = useState("자극형");
  const [category, setCategory] = useState("돈/부업");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [showAdModal, setShowAdModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const count = Number(localStorage.getItem(usageKey()) || 0);
    setUsageCount(count);

    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      setHistory(Array.isArray(saved) ? saved : []);
    } catch {
      setHistory([]);
    }
  }, []);

  const parsed = useMemo(() => {
    return {
      score: getScoreFromResult(result),
      hook: extractSection(result, "후킹 분석"),
      comment: extractSection(result, "댓글 유도 분석"),
      retention: extractSection(result, "리텐션 분석"),
      titles: extractSection(result, "쇼츠 제목"),
      thumbnails: extractSection(result, "썸네일 문구"),
      hashtags: extractSection(result, "해시태그"),
      script: extractSection(result, "쇼츠 대본"),
    };
  }, [result]);

  function getUsageCount() {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem(usageKey()) || 0);
  }

  function increaseUsage() {
    const next = getUsageCount() + 1;
    localStorage.setItem(usageKey(), String(next));
    setUsageCount(next);
  }

  function saveHistory(newResult: string) {
    const item: HistoryItem = {
      id: String(Date.now()),
      topic,
      category,
      platform,
      style,
      result: newResult,
      createdAt: new Date().toLocaleString("ko-KR"),
    };

    const next = [item, ...history].slice(0, 5);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }

  function openHistoryItem(item: HistoryItem) {
    setTopic(item.topic);
    setCategory(item.category);
    setPlatform(item.platform);
    setStyle(item.style);
    setResult(item.result);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearHistory() {
    if (!confirm("최근 생성 기록을 모두 삭제할까요?")) return;
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }

  async function handleGenerateClick() {
    const current = getUsageCount();
    setUsageCount(current);

    if (current >= FREE_LIMIT) {
      setShowAdModal(true);
      return;
    }

    await generateScript();
  }

  async function continueAfterAd() {
    setShowAdModal(false);
    await generateScript();
  }

  async function generateScript() {
    if (!topic.trim()) {
      alert("주제를 입력해주세요.");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          platform,
          style,
          category,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI 생성 실패");
      }

      setResult(data.result);
      increaseUsage();
      saveHistory(data.result);
    } catch (error) {
      alert("AI 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    alert("복사되었습니다.");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050716] via-[#0b1020] to-[#111827] text-white">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3 text-xl font-black">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600">
            🔥
          </span>
          ShortsFlow
        </div>

        <div className="flex gap-2">
          <button className="rounded-full bg-white/10 px-4 py-2 text-sm font-black">
            오늘 {usageCount}/{FREE_LIMIT}회
          </button>

          <button
            onClick={() => setShowProModal(true)}
            className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-black text-black"
          >
            Pro 준비중
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
          <div className="mb-4 inline-flex rounded-full bg-yellow-400/20 px-4 py-2 text-sm font-black text-yellow-200">
            ⚡ 하루 5회 무료 · 이후 광고 보고 계속 생성
          </div>

          <h1 className="mb-5 text-5xl font-black leading-tight tracking-tight md:text-6xl">
            당신의 첫 3초를
            <br />
            <span className="text-yellow-300">조회수로 바꾸세요</span>
          </h1>

          <p className="mb-8 text-white/70">
            주제만 입력하면 AI가 썸네일 문구, 후킹, 제목, 해시태그,
            대본 흐름까지 한 번에 설계합니다.
          </p>

          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 돈 빨리 모으는 법 / 3분 책요약 / 유머 밈 / 제품 리뷰"
            className="mb-4 h-36 w-full resize-none rounded-3xl bg-white p-5 text-black outline-none"
          />

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="rounded-2xl bg-white px-4 py-3 font-bold text-black outline-none"
            >
              <option>YouTube Shorts</option>
              <option>Instagram Reels</option>
              <option>TikTok</option>
            </select>

            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="rounded-2xl bg-white px-4 py-3 font-bold text-black outline-none"
            >
              <option>자극형</option>
              <option>정보형</option>
              <option>감성형</option>
              <option>유머형</option>
              <option>리뷰형</option>
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-2xl bg-white px-4 py-3 font-bold text-black outline-none"
            >
              <option>돈/부업</option>
              <option>연애/심리</option>
              <option>뉴스/정보성</option>
              <option>책요약</option>
              <option>유머/밈</option>
              <option>제품 리뷰</option>
              <option>공포/스토리</option>
            </select>
          </div>

          <button
            onClick={handleGenerateClick}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 py-4 font-black text-black transition hover:scale-[1.01] disabled:opacity-50"
          >
            {loading ? "AI가 조회수 구조를 분석 중..." : "🔥 AI 조회수 설계 시작"}
          </button>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[28px] bg-white p-6 text-slate-900 shadow-2xl">
            <h2 className="mb-2 text-2xl font-black">🔥 오늘 뜨는 쇼츠</h2>

            <p className="mb-4 text-sm text-slate-500">
              무엇을 만들지 모르겠다면 아래 주제를 눌러 바로 시작하세요.
            </p>

            {[
              "AI 때문에 사라질 직업 5가지",
              "99%가 모르는 돈 버는 습관",
              "연애에서 정 떨어지는 말",
              "초보 유튜버가 조회수 안 나오는 이유",
              "요즘 유행하는 유머 밈 분석",
              "가성비 제품 리뷰 쇼츠",
            ].map((item) => (
              <button
                key={item}
                onClick={() => setTopic(item)}
                className="mb-3 w-full rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-bold hover:bg-slate-200"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="rounded-[28px] bg-white p-6 text-slate-900 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">최근 생성 기록</h2>

              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white"
                >
                  삭제
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-sm font-bold leading-6 text-slate-500">
                아직 저장된 생성 기록이 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openHistoryItem(item)}
                    className="w-full rounded-2xl bg-slate-100 p-4 text-left hover:bg-slate-200"
                  >
                    <div className="mb-1 text-sm font-black text-slate-900">
                      {item.topic}
                    </div>

                    <div className="text-xs font-bold text-slate-500">
                      {item.category} · {getScoreFromResult(item.result)}점 ·{" "}
                      {item.createdAt}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>

      {loading && (
        <section className="mx-auto max-w-6xl px-6 pb-10">
          <div className="rounded-[32px] border border-yellow-400/20 bg-yellow-400/10 p-8 shadow-2xl">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-4 w-4 animate-pulse rounded-full bg-yellow-300" />
              <h2 className="text-2xl font-black text-yellow-200">
                AI가 조회수 구조 분석 중...
              </h2>
            </div>

            <p className="text-sm font-bold text-yellow-100/80">
              제목, 썸네일, 해시태그, 후킹, 리텐션 구조를 분석하고 있습니다.
            </p>
          </div>
        </section>
      )}

      {result && (
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="mb-5 rounded-[32px] bg-gradient-to-r from-yellow-300 to-orange-400 p-6 text-slate-950 shadow-2xl">
            <p className="text-sm font-black opacity-70">VIRAL SCORE</p>
            <h2 className="text-5xl font-black">{parsed.score} / 100</h2>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-6">
              AI가 후킹, 댓글 유도, 리텐션 가능성을 기준으로 조회수 잠재력을
              점수화했습니다.
            </p>
          </div>

          <div className="mb-5 grid gap-5 md:grid-cols-3">
            <ResultCard title="🎣 후킹 분석" text={parsed.hook || "분석 결과 없음"} />
            <ResultCard title="💬 댓글 유도 분석" text={parsed.comment || "분석 결과 없음"} />
            <ResultCard title="⏱ 리텐션 분석" text={parsed.retention || "분석 결과 없음"} />
          </div>

          <div className="mb-5 grid gap-5 md:grid-cols-3">
            <CopyCard
              title="🧲 쇼츠 제목"
              text={parsed.titles || "제목 결과 없음"}
              onCopy={() => copyText(parsed.titles)}
            />

            <CopyCard
              title="🖼 썸네일 문구"
              text={parsed.thumbnails || "썸네일 결과 없음"}
              onCopy={() => copyText(parsed.thumbnails)}
              highlight
            />

            <CopyCard
              title="#️⃣ 해시태그"
              text={parsed.hashtags || "해시태그 결과 없음"}
              onCopy={() => copyText(parsed.hashtags)}
            />
          </div>

          <div className="rounded-[32px] bg-white p-8 text-slate-900 shadow-2xl">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-black">🎬 쇼츠 대본</h2>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  아래 대본을 복사해서 바로 촬영 또는 편집 메모로 사용할 수 있습니다.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => copyText(result)}
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black text-black"
                >
                  전체 복사
                </button>

                <button
                  onClick={handleGenerateClick}
                  disabled={loading}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
                >
                  다시 생성
                </button>
              </div>
            </div>

            <pre className="whitespace-pre-wrap rounded-2xl bg-slate-100 p-6 text-sm leading-7">
              {parsed.script || result}
            </pre>
          </div>
        </section>
      )}

      {showAdModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6">
          <div className="w-full max-w-md rounded-[32px] bg-white p-8 text-slate-900 shadow-2xl">
            <h2 className="mb-3 text-2xl font-black">
              무료 생성 횟수를 모두 사용했어요
            </h2>

            <p className="mb-5 text-sm font-bold leading-6 text-slate-600">
              하루 5회까지는 무료로 바로 생성할 수 있습니다.
              계속 사용하려면 광고를 보고 1회 더 생성할 수 있어요.
            </p>

            <div className="mb-5 rounded-2xl bg-slate-100 p-5 text-center text-sm font-black text-slate-500">
              광고 영역 준비중
              <br />
              나중에 실제 광고 SDK가 들어갈 자리입니다.
            </div>

            <button
              onClick={continueAfterAd}
              className="mb-3 w-full rounded-2xl bg-yellow-400 py-4 font-black text-black"
            >
              광고 보고 계속 생성하기
            </button>

            <button
              onClick={() => setShowAdModal(false)}
              className="w-full rounded-2xl bg-slate-900 py-4 font-black text-white"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {showProModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6">
          <div className="w-full max-w-md rounded-[32px] bg-white p-8 text-slate-900 shadow-2xl">
            <div className="mb-4 inline-flex rounded-full bg-yellow-100 px-4 py-2 text-sm font-black text-yellow-800">
              Pro 준비중
            </div>

            <h2 className="mb-3 text-3xl font-black">
              광고 없이 무제한으로 만들기
            </h2>

            <p className="mb-6 text-sm font-bold leading-6 text-slate-600">
              ShortsFlow Pro는 계속 쇼츠를 만드는 크리에이터를 위한 기능입니다.
              정식 출시 전까지는 무료 MVP로 먼저 테스트할 수 있습니다.
            </p>

            <div className="mb-6 space-y-3 rounded-2xl bg-slate-100 p-5 text-sm font-bold text-slate-700">
              <div>✅ 광고 없이 무제한 생성</div>
              <div>✅ 고급 바이럴 점수 분석</div>
              <div>✅ 생성 기록 저장 강화</div>
              <div>✅ 썸네일 문구 / 제목 A/B 테스트</div>
              <div>✅ 해시태그 / 대본 Export 기능</div>
            </div>

            <button
              onClick={() => setShowProModal(false)}
              className="mb-3 w-full rounded-2xl bg-yellow-400 py-4 font-black text-black"
            >
              알겠어요
            </button>

            <button
              onClick={() => setShowProModal(false)}
              className="w-full rounded-2xl bg-slate-900 py-4 font-black text-white"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm font-bold text-white/40">
        ShortsFlow · AI 조회수 설계 도구 · 무료 MVP 테스트 버전
      </footer>
    </main>
  );
}

function ResultCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[28px] bg-white p-6 text-slate-900 shadow-2xl">
      <h3 className="mb-3 text-xl font-black">{title}</h3>
      <p className="whitespace-pre-wrap text-sm font-bold leading-7 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function CopyCard({
  title,
  text,
  onCopy,
  highlight = false,
}: {
  title: string;
  text: string;
  onCopy: () => void;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-[28px] bg-yellow-50 p-6 text-slate-900 shadow-2xl"
          : "rounded-[28px] bg-white p-6 text-slate-900 shadow-2xl"
      }
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xl font-black">{title}</h3>

        <button
          onClick={onCopy}
          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white"
        >
          복사
        </button>
      </div>

      <p className="whitespace-pre-wrap text-sm font-bold leading-7 text-slate-600">
        {text}
      </p>
    </div>
  );
}