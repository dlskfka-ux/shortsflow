"use client";

import { useState } from "react";

export default function HomePage() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("YouTube Shorts");
  const [style, setStyle] = useState("자극형");
  const [category, setCategory] = useState("돈/부업");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function generateScript() {
    if (!topic.trim()) {
      alert("주제를 입력해주세요.");
      return;
    }

    setLoading(true);
    setResult("");
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, style, category }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "AI 생성 실패");
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    alert("결과가 복사되었습니다.");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050716] via-[#0b1020] to-[#111827] text-white">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3 text-xl font-black">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600">🔥</span>
          ShortsFlow
        </div>

        <div className="flex gap-2">
          <button className="rounded-full bg-white/10 px-4 py-2 text-sm font-black">무료 체험</button>
          <button className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-black text-black">Pro</button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
          <div className="mb-4 inline-flex rounded-full bg-yellow-400/20 px-4 py-2 text-sm font-black text-yellow-200">
            ⚡ 로그인 없이 1회 맛보기 가능
          </div>

          <h1 className="mb-5 text-5xl font-black leading-tight tracking-tight md:text-6xl">
            당신의 첫 3초를
            <br />
            <span className="text-yellow-300">조회수로 바꾸세요</span>
          </h1>

          <p className="mb-8 text-white/70">
            주제만 입력하면 AI가 썸네일 문구, 후킹, CTA, 대본 흐름, 리텐션 가이드까지 한 번에 설계합니다.
          </p>

          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 돈 빨리 모으는 법 / 3분 책요약 / 유머 밈 / 제품 리뷰"
            className="mb-4 h-36 w-full resize-none rounded-3xl bg-white p-5 text-black outline-none"
          />

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-2xl bg-white px-4 py-3 font-bold text-black outline-none">
              <option>YouTube Shorts</option>
              <option>Instagram Reels</option>
              <option>TikTok</option>
            </select>

            <select value={style} onChange={(e) => setStyle(e.target.value)} className="rounded-2xl bg-white px-4 py-3 font-bold text-black outline-none">
              <option>자극형</option>
              <option>정보형</option>
              <option>감성형</option>
              <option>유머형</option>
              <option>리뷰형</option>
            </select>

            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl bg-white px-4 py-3 font-bold text-black outline-none">
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
            onClick={generateScript}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 py-4 font-black text-black transition hover:scale-[1.01] disabled:opacity-50"
          >
            {loading ? "AI가 조회수 구조를 분석 중..." : "🔥 AI 조회수 설계 시작"}
          </button>

          {error && (
            <div className="mt-4 rounded-2xl bg-red-500/20 p-4 text-sm font-bold text-red-200">
              {error}
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[28px] bg-white p-6 text-slate-900 shadow-2xl">
            <h2 className="mb-2 text-2xl font-black">🔥 오늘 뜨는 쇼츠</h2>
            {[
              "AI 때문에 사라질 직업 5가지",
              "99%가 모르는 돈 버는 습관",
              "연애에서 정 떨어지는 말",
              "초보 유튜버가 조회수 안 나오는 이유",
              "요즘 유행하는 유머 밈 분석",
              "가성비 제품 리뷰 쇼츠",
            ].map((item) => (
              <button key={item} onClick={() => setTopic(item)} className="mb-3 w-full rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-bold hover:bg-slate-200">
                {item}
              </button>
            ))}
          </div>
        </aside>
      </section>

      {result && (
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="rounded-[32px] bg-white p-8 text-slate-900 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-3xl font-black">AI 조회수 설계 결과</h2>
              <button onClick={copyResult} className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black text-black">
                결과 복사
              </button>
            </div>

            <pre className="whitespace-pre-wrap rounded-2xl bg-slate-100 p-6 text-sm leading-7">
              {result}
            </pre>
          </div>
        </section>
      )}
    </main>
  );
}