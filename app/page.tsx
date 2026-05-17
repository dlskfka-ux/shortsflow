"use client";

import { useEffect, useMemo, useState } from "react";

const FREE_LIMIT = 5;
const HISTORY_KEY = "shortsflow_history";

const PRESETS = [
  "기본 조회수 코치",
  "MrBeast 스타일",
  "정보형 스타일",
  "돈/부업 스타일",
  "밈/유머 스타일",
  "책요약 스타일",
  "영화리뷰 스타일",
];

const LENGTHS = ["30초", "45초", "60초"];

const TONES = [
  "담백한 말투",
  "친구한테 말하는 느낌",
  "전문가 느낌",
  "웃긴 말투",
  "스토리텔링 느낌",
];

type HistoryItem = {
  id: string;
  topic: string;
  category: string;
  platform: string;
  style: string;
  preset: string;
  length: string;
  tone: string;
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

function extractDialogueOnly(sceneScript: string) {
  if (!sceneScript) return "";

  return sceneScript
    .split("\n")
    .filter((line) => line.trim().startsWith("대사:"))
    .map((line) => line.replace("대사:", "").trim())
    .filter(Boolean)
    .join("\n\n");
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
  const [preset, setPreset] = useState("기본 조회수 코치");
  const [length, setLength] = useState("45초");
  const [tone, setTone] = useState("친구한테 말하는 느낌");

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
    const sceneScript = extractSection(result, "CapCut/Vrew용 장면 대본");

    return {
      score: getScoreFromResult(result),
      hook: extractSection(result, "후킹 분석"),
      comment: extractSection(result, "댓글 유도 분석"),
      retention: extractSection(result, "리텐션 분석"),
      titles: extractSection(result, "쇼츠 제목"),
      thumbnails: extractSection(result, "썸네일 문구"),
      hashtags: extractSection(result, "해시태그"),
      sceneScript,
      dialogueOnly: extractDialogueOnly(sceneScript),
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
      preset,
      length,
      tone,
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
    setPreset(item.preset || "기본 조회수 코치");
    setLength(item.length || "45초");
    setTone(item.tone || "친구한테 말하는 느낌");
    setResult(item.result);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
          preset,
          length,
          tone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI 생성 실패");
      }

      setResult(data.result);

      increaseUsage();

      saveHistory(data.result);
    } catch {
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

  async function shareSite() {
    const url = window.location.href;

    const shareText = `🔥 ShortsFlow
AI가 쇼츠 제목, 썸네일, 해시태그, 장면 대본까지 만들어주는 무료 툴

${url}`;

    if (navigator.share) {
      await navigator.share({
        title: "ShortsFlow",
        text: shareText,
        url,
      });

      return;
    }

    await navigator.clipboard.writeText(shareText);

    alert("공유 링크가 복사되었습니다.");
  }

  async function shareResult() {
    const url = window.location.href;

    const shareText = `🔥 ShortsFlow 결과

주제: ${topic}
길이: ${length}
톤: ${tone}
프리셋: ${preset}

${parsed.titles || ""}

${url}`;

    if (navigator.share) {
      await navigator.share({
        title: "ShortsFlow 결과",
        text: shareText,
        url,
      });

      return;
    }

    await navigator.clipboard.writeText(shareText);

    alert("공유 결과가 복사되었습니다.");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050716] via-[#0b1020] to-[#111827] text-white">
      <header className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="flex items-center gap-3 text-xl font-black">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600">
            🔥
          </span>

          ShortsFlow
        </div>

        <div className="grid grid-cols-3 gap-2 sm:flex">
          <button
            onClick={shareSite}
            className="rounded-full bg-white/10 px-3 py-2 text-xs font-black sm:px-4 sm:text-sm"
          >
            공유
          </button>

          <button className="rounded-full bg-white/10 px-3 py-2 text-xs font-black sm:px-4 sm:text-sm">
            오늘 {usageCount}/{FREE_LIMIT}회
          </button>

          <button
            onClick={() => setShowProModal(true)}
            className="rounded-full bg-yellow-400 px-3 py-2 text-xs font-black text-black sm:px-5 sm:text-sm"
          >
            Pro 준비중
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur sm:rounded-[32px] sm:p-8">
          <div className="mb-4 inline-flex rounded-full bg-yellow-400/20 px-4 py-2 text-xs font-black text-yellow-200 sm:text-sm">
            ⚡ 하루 5회 무료 · 이후 광고 보고 계속 생성
          </div>

          <h1 className="mb-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
            당신의 첫 3초를
            <br />
            <span className="text-yellow-300">조회수로 바꾸세요</span>
          </h1>

          <p className="mb-6 text-sm leading-7 text-white/70 sm:mb-8 sm:text-base">
            실제 쇼츠 크리에이터 느낌의 대본을 AI가 자동으로 만들어줍니다.
          </p>

          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 돈 빨리 모으는 법 / 연애 심리 / 영화 리뷰 / 밈"
            className="mb-4 h-32 w-full resize-none rounded-3xl bg-white p-5 text-sm text-black outline-none sm:h-36 sm:text-base"
          />

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="rounded-2xl bg-white px-4 py-4 text-sm font-bold text-black outline-none sm:py-3"
            >
              <option>YouTube Shorts</option>
              <option>Instagram Reels</option>
              <option>TikTok</option>
            </select>

            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="rounded-2xl bg-white px-4 py-4 text-sm font-bold text-black outline-none sm:py-3"
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
              className="rounded-2xl bg-white px-4 py-4 text-sm font-bold text-black outline-none sm:py-3"
            >
              <option>돈/부업</option>
              <option>연애/심리</option>
              <option>뉴스/정보성</option>
              <option>책요약</option>
              <option>유머/밈</option>
              <option>제품 리뷰</option>
            </select>
          </div>

          <div className="mb-5 rounded-3xl bg-black/20 p-4">
            <div className="mb-3 text-sm font-black text-white/80">
              대본 길이
            </div>

            <div className="grid grid-cols-3 gap-2">
              {LENGTHS.map((item) => (
                <button
                  key={item}
                  onClick={() => setLength(item)}
                  className={
                    length === item
                      ? "rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-black text-black"
                      : "rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/20"
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 rounded-3xl bg-black/20 p-4">
            <div className="mb-3 text-sm font-black text-white/80">
              대본 톤
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
              {TONES.map((item) => (
                <button
                  key={item}
                  onClick={() => setTone(item)}
                  className={
                    tone === item
                      ? "shrink-0 rounded-full bg-yellow-400 px-4 py-3 text-xs font-black text-black sm:text-sm"
                      : "shrink-0 rounded-full bg-white/10 px-4 py-3 text-xs font-black text-white hover:bg-white/20 sm:text-sm"
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 rounded-3xl bg-black/20 p-4">
            <div className="mb-3 text-sm font-black text-white/80">
              AI 스타일 프리셋
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
              {PRESETS.map((item) => (
                <button
                  key={item}
                  onClick={() => setPreset(item)}
                  className={
                    preset === item
                      ? "shrink-0 rounded-full bg-yellow-400 px-4 py-3 text-xs font-black text-black sm:text-sm"
                      : "shrink-0 rounded-full bg-white/10 px-4 py-3 text-xs font-black text-white hover:bg-white/20 sm:text-sm"
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateClick}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 py-5 text-base font-black text-black transition hover:scale-[1.01] disabled:opacity-50 sm:py-4"
          >
            {loading
              ? "AI가 스토리텔링 대본 생성 중..."
              : "🔥 쇼츠 대본 생성"}
          </button>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[28px] bg-white p-5 text-slate-900 shadow-2xl sm:p-6">
            <h2 className="mb-2 text-2xl font-black">
              🔥 오늘 뜨는 주제
            </h2>

            <p className="mb-4 text-sm text-slate-500">
              클릭하면 바로 테스트할 수 있어요.
            </p>

            {[
              "월급 들어와도 돈이 안 남는 이유",
              "연애할 때 정 떨어지는 순간",
              "요즘 유튜버들이 조회수 뽑는 방식",
              "사람들이 은근 많이 하는 소비 습관",
              "친구 손절하게 되는 이유",
              "가성비 제품 리뷰 쇼츠",
            ].map((item) => (
              <button
                key={item}
                onClick={() => setTopic(item)}
                className="mb-3 w-full rounded-xl bg-slate-100 px-4 py-4 text-left text-sm font-bold hover:bg-slate-200 sm:py-3"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="rounded-[28px] bg-white p-5 text-slate-900 shadow-2xl sm:p-6">
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
                아직 생성 기록이 없습니다.
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
                      {item.length} · {item.tone} ·{" "}
                      {getScoreFromResult(item.result)}점
                    </div>

                    <div className="mt-1 text-xs font-bold text-slate-400">
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
        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <div className="rounded-[28px] border border-yellow-400/20 bg-yellow-400/10 p-5 shadow-2xl sm:rounded-[32px] sm:p-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-4 w-4 animate-pulse rounded-full bg-yellow-300" />

              <h2 className="text-xl font-black text-yellow-200 sm:text-2xl">
                AI가 몰입형 쇼츠 대본 생성 중...
              </h2>
            </div>

            <p className="text-sm font-bold text-yellow-100/80">
              {length} · {tone} · {preset} 기준으로 대본을 만들고 있습니다.
            </p>
          </div>
        </section>
      )}

      {result && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="mb-5 rounded-[28px] bg-gradient-to-r from-yellow-300 to-orange-400 p-5 text-slate-950 shadow-2xl sm:rounded-[32px] sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black opacity-70">
                  VIRAL SCORE
                </p>

                <h2 className="text-5xl font-black">
                  {parsed.score} / 100
                </h2>

                <p className="mt-3 max-w-2xl text-sm font-bold leading-6">
                  실제 쇼츠 스타일 기준으로 몰입감과 리텐션 흐름을 분석했습니다.
                </p>
              </div>

              <button
                onClick={shareResult}
                className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white sm:py-3"
              >
                결과 공유
              </button>
            </div>
          </div>

          <div className="mb-5 grid gap-5 md:grid-cols-3">
            <ResultCard
              title="🎣 후킹 분석"
              text={parsed.hook || "분석 결과 없음"}
            />

            <ResultCard
              title="💬 댓글 유도 분석"
              text={parsed.comment || "분석 결과 없음"}
            />

            <ResultCard
              title="⏱ 리텐션 분석"
              text={parsed.retention || "분석 결과 없음"}
            />
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

          <div className="mb-5 rounded-[28px] bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[32px] sm:p-8">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">
                  🎞 CapCut/Vrew용 장면 대본
                </h2>

                <p className="mt-2 text-sm font-bold text-slate-500">
                  실제 영상 녹음용 대사 중심으로 생성됩니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  onClick={() => copyText(parsed.sceneScript)}
                  className="rounded-xl bg-yellow-400 px-4 py-4 text-sm font-black text-black sm:py-2"
                >
                  장면 대본 복사
                </button>

                <button
                  onClick={() => copyText(parsed.dialogueOnly)}
                  className="rounded-xl bg-slate-900 px-4 py-4 text-sm font-black text-white sm:py-2"
                >
                  대사만 복사
                </button>
              </div>
            </div>

            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-100 p-5 text-sm leading-7 sm:p-6">
              {parsed.sceneScript || "장면 대본 결과 없음"}
            </pre>
          </div>

          {parsed.dialogueOnly && (
            <div className="mb-5 rounded-[28px] bg-yellow-50 p-5 text-slate-900 shadow-2xl sm:rounded-[32px] sm:p-8">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black sm:text-3xl">
                    🎙 녹음용 대사만 보기
                  </h2>

                  <p className="mt-2 text-sm font-bold text-slate-600">
                    장면 설명을 제외하고 실제 말할 대사만 정리했습니다.
                  </p>
                </div>

                <button
                  onClick={() => copyText(parsed.dialogueOnly)}
                  className="rounded-xl bg-slate-900 px-4 py-4 text-sm font-black text-white sm:py-2"
                >
                  대사만 복사
                </button>
              </div>

              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl bg-white p-5 text-sm font-bold leading-8 text-slate-800 sm:p-6">
                {parsed.dialogueOnly}
              </pre>
            </div>
          )}

          <div className="rounded-[28px] bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[32px] sm:p-8">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">
                  📄 전체 결과
                </h2>

                <p className="mt-2 text-sm font-bold text-slate-500">
                  전체 결과를 복사해서 바로 촬영할 수 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  onClick={() => copyText(result)}
                  className="rounded-xl bg-yellow-400 px-4 py-4 text-sm font-black text-black sm:py-2"
                >
                  전체 복사
                </button>

                <button
                  onClick={handleGenerateClick}
                  disabled={loading}
                  className="rounded-xl bg-slate-900 px-4 py-4 text-sm font-black text-white disabled:opacity-50 sm:py-2"
                >
                  다시 생성
                </button>
              </div>
            </div>

            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-100 p-5 text-sm leading-7 sm:p-6">
              {result}
            </pre>
          </div>
        </section>
      )}

      {showAdModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 text-slate-900 shadow-2xl sm:rounded-[32px] sm:p-8">
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 text-slate-900 shadow-2xl sm:rounded-[32px] sm:p-8">
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

      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs font-bold leading-6 text-white/40 sm:px-6 sm:text-sm">
        ShortsFlow · AI 쇼츠 스토리텔링 생성기
      </footer>
    </main>
  );
}

function ResultCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[28px] bg-white p-5 text-slate-900 shadow-2xl sm:p-6">
      <h3 className="mb-3 text-lg font-black sm:text-xl">
        {title}
      </h3>

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
          ? "rounded-[28px] bg-yellow-50 p-5 text-slate-900 shadow-2xl sm:p-6"
          : "rounded-[28px] bg-white p-5 text-slate-900 shadow-2xl sm:p-6"
      }
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-black sm:text-xl">
          {title}
        </h3>

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