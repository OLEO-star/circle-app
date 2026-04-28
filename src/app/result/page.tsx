"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Ring from "@/components/Ring";
import {
  VERSION_CATEGORY_NAMES,
  VERSION_CATEGORY_COLORS,
} from "@/lib/departments";
import { departmentTexts } from "@/lib/result-texts";
import { getPage7Content } from "@/lib/page7";
import type { Version } from "@/lib/questions";

// 匿名集計エンドポイント（Google Apps Script）。
// 個人を識別する情報は送らない。プライバシーポリシー §2 / §3 に対応。
const ANALYTICS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxRg1rECyqBc0KfcQ4qUOCIikHsegF3TyFOpqrpnI6Qa4oWfM4kErTM6CGW6VRhtpaS/exec";

type StoredResult = {
  version: Version;
  axisScores: number[];
  results: {
    id: string;
    name: string;
    categoryIndex: number;
    slot: number;
    score: number;
    similarity: number;
  }[];
  categoryStrengths: number[];
  top3Categories: number[];
};

export default function ResultPage() {
  const router = useRouter();
  // SSR とクライアント初回レンダーで同じ DOM を返すため null 初期化。
  // lazy initializer で sessionStorage を読むと SSR(null) と client(値あり) で
  // ハイドレーション不一致になるので、useEffect 内で読み込む。
  const [data, setData] = useState<StoredResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("quizResult");
    if (stored) {
      setData(JSON.parse(stored) as StoredResult);
    } else {
      router.replace("/");
    }
  }, [router]);

  // 匿名集計を 1回だけ送信（同一結果の重複送信を防止）。
  // CORS preflight を避けるため text/plain で送る → Apps Script 側で JSON.parse。
  // mode: "no-cors" でレスポンスは opaque だが、リクエスト自体は成功する。
  useEffect(() => {
    if (!data) return;
    if (sessionStorage.getItem("quizResultSent")) return;

    const r = data.results;
    const payload = {
      version: data.version,
      top1_id: r[0]?.id ?? "",
      top1_name: r[0]?.name ?? "",
      top1_score: r[0]?.score ?? "",
      top2_id: r[1]?.id ?? "",
      top2_name: r[1]?.name ?? "",
      top2_score: r[1]?.score ?? "",
      top3_id: r[2]?.id ?? "",
      top3_name: r[2]?.name ?? "",
      top3_score: r[2]?.score ?? "",
      categories: data.top3Categories.join(","),
    };

    fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    })
      .then(() => {
        sessionStorage.setItem("quizResultSent", "1");
      })
      .catch(() => {
        // 集計失敗はユーザー体験に影響させない（無視）。
      });
  }, [data]);

  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-gray-400">読み込み中...</p>
      </div>
    );
  }

  const top3 = data.results.slice(0, 3);
  // ユーザーから「特定の学科が見当たらない」という指摘があり、全学科を表示する。
  // 比較対象に含まれていれば必ずこのリストで見つかる。
  const remaining = data.results.slice(3);
  const totalCount = data.results.length;
  const page7 = getPage7Content(data.axisScores);
  const colors = VERSION_CATEGORY_COLORS[data.version];
  const names = VERSION_CATEGORY_NAMES[data.version];

  return (
    <div className="flex min-h-dvh snap-x snap-mandatory overflow-x-auto">
      {/* Page 1: 興味マップ（リング） */}
      <section className="flex min-w-full snap-center flex-col items-center justify-center px-6">
        <h2 className="mb-2 text-lg font-bold">あなたの興味マップ</h2>
        <p className="mb-6 text-xs text-gray-400">リングの形があなたの個性です</p>
        <Ring strengths={data.categoryStrengths} size={340} version={data.version} />
        <p className="mt-6 text-xs text-gray-400">← スワイプして結果を見る →</p>
      </section>

      {/* Page 2: Top 3 一覧 */}
      <section className="flex min-w-full snap-center flex-col items-center justify-center px-6">
        <h2 className="mb-8 text-lg font-bold">あなたに合う学科 Top 3</h2>
        <div className="w-full max-w-sm space-y-4">
          {top3.map((r, i) => (
            <div key={r.id} className="flex items-center gap-4">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: colors[r.slot] }}
              >
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{r.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${r.score}%`,
                        backgroundColor: colors[r.slot],
                      }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs text-gray-500">
                    適合度 {r.score}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pages 3-5: 学科詳細 */}
      {top3.map((r, i) => {
        const texts = departmentTexts[r.id];
        return (
          <section
            key={r.id}
            className="flex min-w-full snap-center flex-col items-center justify-center px-6"
          >
            <div className="w-full max-w-sm">
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: colors[r.slot] }}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-base font-bold">{r.name}</p>
                  <p className="text-xs text-gray-400">
                    {names[r.slot]} ・ 適合度 {r.score}
                  </p>
                </div>
              </div>

              {texts && (
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-1.5 text-xs font-medium text-gray-400">
                      学科について
                    </h3>
                    <p className="text-sm leading-relaxed">{texts.intro}</p>
                  </div>
                  <div>
                    <h3 className="mb-1.5 text-xs font-medium text-gray-400">
                      1週間の流れ
                    </h3>
                    <p className="text-sm leading-relaxed">{texts.weeklyFlow}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* Page 6: 4位以降の全学科ランキング */}
      <section className="flex min-w-full snap-center flex-col items-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h2 className="mb-1 text-lg font-bold">他の学科ランキング</h2>
          <p className="mb-6 text-xs text-gray-400">
            比較対象 全{totalCount}学科をスコア順で表示
          </p>
          {remaining.length > 0 ? (
            <div className="space-y-3">
              {remaining.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs text-gray-400">
                    {i + 4}
                  </span>
                  <p className="flex-1 text-sm">{r.name}</p>
                  <div className="h-2 w-24 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${r.score}%`,
                        backgroundColor: colors[r.slot],
                      }}
                    />
                  </div>
                  <span className="w-6 text-right text-[10px] text-gray-400">
                    {r.score}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              あなたの興味はTop 3に集中しています！
            </p>
          )}
        </div>
      </section>

      {/* Page 7: 大学選びの基準 */}
      <section className="flex min-w-full snap-center flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h2 className="mb-4 text-lg font-bold">
            あなたに合った大学の選び方
          </h2>

          {page7.traits.length > 0 && (
            <p className="mb-6 text-sm leading-relaxed text-gray-600">
              {page7.traits.join("。また、")}。
            </p>
          )}

          <h3 className="mb-3 text-xs font-medium text-gray-400">
            大学を選ぶときに見てほしいポイント
          </h3>
          <div className="space-y-3">
            {page7.criteria.map((c, i) => (
              <div key={i}>
                <p className="text-sm font-medium">{c.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                  {c.description}
                </p>
              </div>
            ))}
          </div>

          {/* 最終ページ: もう一度ボタン */}
          <button
            onClick={() => {
              sessionStorage.removeItem("quizResult");
              router.push("/");
            }}
            className="mt-8 w-full rounded-full border border-gray-200 py-3 text-sm text-gray-600 transition-colors active:bg-gray-50"
          >
            もう一度診断する
          </button>
        </div>
      </section>
    </div>
  );
}
