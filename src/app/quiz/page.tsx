"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getQuestionsForVersion,
  getSetSizes,
  type Version,
} from "@/lib/questions";
import {
  calcAxisScores,
  rankDepartments,
  getTop3Categories,
  calcCategoryStrengths,
} from "@/lib/scoring";
import { getSlot } from "@/lib/departments";

// 進捗保存に localStorage を使う理由：
// sessionStorage はタブ kill / iOS Safari の低メモリ時に消えるため、
// 10分の入力を守れない。localStorage はページ閉じ・OS 再起動でも残るので、
// /quiz を再度開いただけで自動復元できる。完了時にクリアする。
const STORAGE_KEYS = {
  version: "quizVersion",
  answers: "quizAnswers",
  currentSet: "quizCurrentSet",
} as const;

const SCROLL_DELAY_MS = 200;
const SCROLL_DURATION_MS = 700;

function smoothScrollTo(targetY: number, duration: number) {
  const startY = window.scrollY;
  const distance = targetY - startY;
  if (Math.abs(distance) < 1) return;
  const startTime = performance.now();
  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    window.scrollTo(0, startY + distance * ease);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function smoothScrollElementToCenter(element: HTMLElement, duration: number) {
  const rect = element.getBoundingClientRect();
  const targetY =
    window.scrollY + rect.top - (window.innerHeight - rect.height) / 2;
  smoothScrollTo(targetY, duration);
}

const CIRCLE_OPTIONS = [
  { value: 1, size: "w-10 h-10", color: "bg-[#7B9BB5]" },
  { value: 2, size: "w-8 h-8", color: "bg-[#B0C4D8]" },
  { value: 3, size: "w-6 h-6", color: "bg-[#C8C8C8]" },
  { value: 4, size: "w-8 h-8", color: "bg-[#A8D5BA]" },
  { value: 5, size: "w-10 h-10", color: "bg-[#5BAB7B]" },
];

export default function QuizPage() {
  const router = useRouter();

  // SSR とクライアント初回レンダーで同じ DOM を返すため初期値は固定。
  // 実際の version / 保存済み回答は useEffect で復元する。
  const [version, setVersion] = useState<Version>("mixed");
  const [hydrated, setHydrated] = useState(false);
  const [currentSet, setCurrentSet] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const questions = useMemo(() => getQuestionsForVersion(version), [version]);
  const setSizes = useMemo(() => getSetSizes(version), [version]);

  // クライアントマウント時に localStorage から復元
  useEffect(() => {
    const storedVersion = localStorage.getItem(STORAGE_KEYS.version);
    const v: Version =
      storedVersion === "humanities" ||
      storedVersion === "sciences" ||
      storedVersion === "mixed"
        ? storedVersion
        : "mixed";
    const qs = getQuestionsForVersion(v);
    const sizes = getSetSizes(v);

    let savedAnswers: (number | null)[] | null = null;
    const rawAnswers = localStorage.getItem(STORAGE_KEYS.answers);
    if (rawAnswers) {
      try {
        const parsed = JSON.parse(rawAnswers);
        // 質問数が一致するときだけ復元（version 切り替え後の不整合を防ぐ）
        if (Array.isArray(parsed) && parsed.length === qs.length) {
          savedAnswers = parsed as (number | null)[];
        }
      } catch {}
    }

    let savedSet = 0;
    const rawSet = localStorage.getItem(STORAGE_KEYS.currentSet);
    if (rawSet) {
      const num = parseInt(rawSet, 10);
      if (Number.isFinite(num) && num >= 0 && num < sizes.length) {
        savedSet = num;
      }
    }

    setVersion(v);
    setAnswers(savedAnswers ?? new Array(qs.length).fill(null));
    setCurrentSet(savedSet);
    setHydrated(true);
  }, []);

  // 回答を localStorage に都度保存（hydrate 完了後のみ）
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.answers, JSON.stringify(answers));
  }, [answers, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.currentSet, String(currentSet));
  }, [currentSet, hydrated]);

  // 現在のセットの質問範囲
  const setStart = setSizes.slice(0, currentSet).reduce((a, b) => a + b, 0);
  const setEnd = setStart + (setSizes[currentSet] ?? 0);
  const currentQuestions = questions.slice(setStart, setEnd);

  const allAnswered =
    hydrated &&
    currentQuestions.length > 0 &&
    currentQuestions.every((_, i) => answers[setStart + i] !== null);

  const answeredCount = answers.filter((a) => a !== null).length;
  const totalQuestions = questions.length;
  const progress = totalQuestions ? (answeredCount / totalQuestions) * 100 : 0;
  const progressPercent = Math.round(progress);

  // セット切り替わり時にトップへスクロール
  useEffect(() => {
    if (!hydrated) return;
    requestAnimationFrame(() => {
      smoothScrollTo(0, SCROLL_DURATION_MS);
    });
  }, [currentSet, hydrated]);

  const handleAnswer = useCallback(
    (questionIndex: number, value: number) => {
      setAnswers((prev) => {
        const next = [...prev];
        next[questionIndex] = value;
        return next;
      });
      const setStartIdx = setSizes.slice(0, currentSet).reduce((a, b) => a + b, 0);
      const setEndIdx = setStartIdx + setSizes[currentSet];
      const nextIdx = questionIndex + 1;
      window.setTimeout(() => {
        if (nextIdx < setEndIdx) {
          const nextEl = document.getElementById(`question-${nextIdx}`);
          if (nextEl) smoothScrollElementToCenter(nextEl, SCROLL_DURATION_MS);
        } else {
          const nextBtn = document.getElementById("next-button");
          if (nextBtn) {
            smoothScrollElementToCenter(nextBtn, SCROLL_DURATION_MS);
            window.setTimeout(() => {
              nextBtn.focus({ preventScroll: true });
            }, SCROLL_DURATION_MS + 100);
          }
        }
      }, SCROLL_DELAY_MS);
    },
    [currentSet, setSizes]
  );

  const handleNext = () => {
    if (currentSet + 1 < setSizes.length) {
      setCurrentSet(currentSet + 1);
    } else {
      const finalAnswers = answers as number[];
      const axisScores = calcAxisScores(finalAnswers, questions);
      const results = rankDepartments(axisScores, version);
      const top3Categories = getTop3Categories(results);
      const categoryStrengths = calcCategoryStrengths(results, version);

      const resultData = {
        version,
        axisScores,
        results: results.map((r) => ({
          id: r.department.id,
          name: r.department.name,
          categoryIndex: r.department.categoryIndex,
          slot: getSlot(r.department, version) ?? r.department.categoryIndex,
          score: r.score,
          similarity: r.similarity,
        })),
        categoryStrengths,
        top3Categories,
      };
      sessionStorage.setItem("quizResult", JSON.stringify(resultData));
      // 完了したので途中保存をクリア
      localStorage.removeItem(STORAGE_KEYS.answers);
      localStorage.removeItem(STORAGE_KEYS.currentSet);
      router.push("/result");
    }
  };

  const handlePrevSet = useCallback(() => {
    if (currentSet > 0) {
      setCurrentSet(currentSet - 1);
    }
  }, [currentSet]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-gray-400">読み込み中...</p>
      </div>
    );
  }

  const isLastSet = currentSet + 1 >= setSizes.length;
  const remainingSets = setSizes.length - currentSet - 1;

  return (
    <div className="min-h-dvh bg-white">
      {/* ヘッダー（固定）：プログレスバー＋ X / Y 問の数値表示 */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white">
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-gray-900 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={handlePrevSet}
            disabled={currentSet === 0}
            className="text-sm text-gray-400 disabled:invisible"
          >
            ← 前のセット
          </button>
          <span className="text-xs text-gray-500">
            <span className="font-semibold text-gray-900">{answeredCount}</span>
            <span className="text-gray-300"> / </span>
            {totalQuestions} 問
            <span className="ml-1.5 text-gray-300">（{progressPercent}%）</span>
          </span>
        </div>
      </div>

      {/* 質問リスト */}
      <div className="px-6 pb-24 pt-4">
        {/* セット境界の達成感バナー（2セット目以降） */}
        {currentSet > 0 && (
          <div className="mb-5 rounded-xl bg-[#F0F7F2] px-4 py-3 text-center text-xs leading-relaxed text-[#3F7B59]">
            <span className="font-semibold">✓ セット{currentSet} 完了！</span>
            <span className="ml-2 text-[#5A8C72]">
              {isLastSet
                ? `あと ${setSizes[currentSet]} 問で結果が見られます`
                : `残り ${remainingSets + 1} セット`}
            </span>
          </div>
        )}

        {currentQuestions.map((q, i) => {
          const globalIndex = setStart + i;
          const selected = answers[globalIndex];
          return (
            <div
              key={q.id}
              id={`question-${globalIndex}`}
              className="border-b border-gray-50 py-5"
            >
              <p className="mb-4 text-sm leading-relaxed">
                <span className="mr-2 text-xs text-gray-300">
                  {globalIndex + 1}.
                </span>
                {q.text}
              </p>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="whitespace-nowrap text-[10px] text-[#7B9BB5] sm:text-xs">
                  そう思わない
                </span>
                <div className="flex items-center gap-2 sm:gap-3">
                  {CIRCLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(globalIndex, opt.value)}
                      className={`${opt.size} rounded-full transition-all ${
                        selected === opt.value
                          ? `${opt.color} scale-110 ring-2 ring-offset-2 ring-gray-300`
                          : selected !== null
                            ? "bg-gray-200"
                            : `${opt.color} opacity-80`
                      }`}
                      aria-label={`${opt.value}点`}
                    />
                  ))}
                </div>
                <span className="whitespace-nowrap text-[10px] text-[#5BAB7B] sm:text-xs">
                  そう思う
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 次のセットボタン（固定フッター） */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-4">
        <button
          id="next-button"
          onClick={handleNext}
          disabled={!allAnswered}
          className="w-full rounded-full bg-gray-900 py-3 text-sm font-medium text-white transition-colors disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isLastSet
            ? "結果を見る"
            : `セット${currentSet + 1}を完了する（次：${setSizes[currentSet + 1]}問）`}
        </button>
      </div>
    </div>
  );
}
