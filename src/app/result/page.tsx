"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Ring from "@/components/Ring";
import {
  VERSION_CATEGORY_NAMES,
  VERSION_CATEGORY_COLORS,
} from "@/lib/departments";
import { departmentTexts } from "@/lib/result-texts";
import { careerTexts } from "@/lib/career-texts";
import { getPage7Content } from "@/lib/page7";
import type { Version } from "@/lib/questions";
import {
  getSchoolInfo,
  getStudentAge,
  getStudentInfo,
  isSchoolMode,
} from "@/lib/school-mode";

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
  // 質問ごとの回答変更回数。旧データには無いので optional。
  changeCounts?: number[];
};

export default function ResultPage() {
  const router = useRouter();
  // SSR とクライアント初回レンダーで同じ DOM を返すため null 初期化。
  // lazy initializer で sessionStorage を読むと SSR(null) と client(値あり) で
  // ハイドレーション不一致になるので、useEffect 内で読み込む。
  const [data, setData] = useState<StoredResult | null>(null);

  // Top3 への納得感スコア。1ヶ所に集中して回答率を最大化する設計（Phase 1）。
  // セッション中に1回だけ送信し、UI も「ありがとう」表示に切り替える。
  const [satisfaction, setSatisfaction] = useState<
    "pitari" | "fuzzy" | "different" | null
  >(null);
  const [reason, setReason] = useState("");
  const [satisfactionSent, setSatisfactionSent] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("quizResult");
    if (stored) {
      setData(JSON.parse(stored) as StoredResult);
    } else {
      router.replace("/");
    }
    // 既に送信済みなら UI を「回答済」状態にする（戻る/再読込ケース対応）。
    if (sessionStorage.getItem("satisfactionSent")) {
      setSatisfactionSent(true);
      const stored2 = sessionStorage.getItem("satisfactionValue");
      if (
        stored2 === "pitari" ||
        stored2 === "fuzzy" ||
        stored2 === "different"
      ) {
        setSatisfaction(stored2);
      }
    }
  }, [router]);

  // 匿名集計を 1回だけ送信（同一結果の重複送信を防止）。
  // CORS preflight を避けるため text/plain で送る → Apps Script 側で JSON.parse。
  // mode: "no-cors" でレスポンスは opaque だが、リクエスト自体は成功する。
  useEffect(() => {
    if (!data) return;
    if (sessionStorage.getItem("quizResultSent")) return;

    const r = data.results;
    // 学校モード時のみ学校・生徒情報を含める。Apps Script 側で school_mode を見て
    // マスタSheets（個人特定なし）と学校別Sheets（クラス・出席番号あり）に振り分ける。
    // session_id は両モード共通で生成し、PostHog の操作ログと突き合わせるための匿名IDとして使う。
    const schoolMode = isSchoolMode();
    const schoolInfo = schoolMode ? getSchoolInfo() : null;
    const studentInfo = schoolMode ? getStudentInfo() : null;
    const sessionId =
      sessionStorage.getItem("sessionId") ?? crypto.randomUUID();
    sessionStorage.setItem("sessionId", sessionId);

    const payload = {
      version: data.version,
      session_id: sessionId,
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
      // 19軸スコア（マスタSheets側で改善分析に使う）
      axis_scores: data.axisScores.join(","),
      // 回答変更ログ：変更があった質問のみ "1始まり質問番号:変更回数" のCSV。
      // 変更が多い質問 = 文言が分かりにくい可能性。改善ターゲット特定に使う。
      change_log: (data.changeCounts ?? [])
        .map((count, idx) => (count > 0 ? `${idx + 1}:${count}` : null))
        .filter((s): s is string => s !== null)
        .join(","),
      // 学校モード関連（個人モードでは空文字列で送る）
      school_mode: schoolMode ? "true" : "false",
      school_code: schoolInfo?.code ?? "",
      school_name: schoolInfo?.name ?? "",
      school_pref: schoolInfo?.pref ?? "",
      school_type: schoolInfo?.schoolType ?? "",
      grade: studentInfo?.grade ?? "",
      klass: studentInfo?.klass ?? "",
      student_number: studentInfo?.number ?? "",
      // 年齢は両モード共通の任意項目（個人モードでも傾向データ集計に使う）
      student_age: getStudentAge(),
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

  // Top3 への納得感スコア送信。session_id で診断データ行と結合できるよう、
  // 同じ ANALYTICS_ENDPOINT に type="satisfaction" として後追い送信する。
  // 理由（reason）は任意。返信があれば改善に直接効くので欄だけ用意する。
  const submitSatisfaction = () => {
    if (satisfactionSent || !satisfaction) return;
    setSatisfactionSent(true);
    sessionStorage.setItem("satisfactionSent", "1");
    sessionStorage.setItem("satisfactionValue", satisfaction);
    const trimmedReason = reason.trim();
    const sessionId = sessionStorage.getItem("sessionId") ?? "";
    const payload = {
      type: "satisfaction",
      session_id: sessionId,
      satisfaction,
      reason: trimmedReason,
    };
    fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // 集計失敗はユーザー体験に影響させない（無視）。
    });
  };

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

        {/* 納得感スコア（Phase 1：診断全体への1問評価）+ 任意の理由欄。
            選択 → 理由欄表示 → 送信、の段階的フロー。回答後は感謝表示に切替。 */}
        <div className="mt-10 w-full max-w-sm rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
          {!satisfactionSent ? (
            <>
              <p className="mb-3 text-center text-sm font-medium text-gray-800">
                この結果、自分にピンときましたか？
              </p>
              <div className="mb-3 flex justify-center gap-2">
                {(
                  [
                    { value: "pitari", emoji: "👍", label: "ピッタリ" },
                    { value: "fuzzy", emoji: "😐", label: "微妙" },
                    { value: "different", emoji: "👎", label: "違うかも" },
                  ] as const
                ).map((opt) => {
                  const active = satisfaction === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSatisfaction(opt.value)}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-xl border px-3 py-2.5 text-xs transition-colors ${
                        active
                          ? "border-gray-900 bg-white text-gray-900 ring-2 ring-gray-900/10"
                          : "border-gray-200 bg-white text-gray-700 active:bg-gray-100"
                      }`}
                      aria-pressed={active}
                    >
                      <span className="text-xl leading-none">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* 選択後に理由欄と送信ボタンを表示。理由は任意。 */}
              {satisfaction && (
                <>
                  <label className="mb-1 block text-xs text-gray-500">
                    理由があれば教えてください（任意）
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="例：Top1の○○学科は興味あるけど、Top3 の□□は違う気がした"
                    rows={3}
                    maxLength={500}
                    className="mb-3 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                  />
                  <button
                    onClick={submitSatisfaction}
                    className="w-full rounded-full bg-gray-900 py-2.5 text-sm font-medium text-white transition-colors active:bg-gray-700"
                  >
                    送信する
                  </button>
                </>
              )}
            </>
          ) : (
            <p className="text-center text-sm text-gray-600">
              <span className="mr-2 text-lg leading-none">
                {satisfaction === "pitari"
                  ? "👍"
                  : satisfaction === "fuzzy"
                    ? "😐"
                    : "👎"}
              </span>
              ありがとうございます！
            </p>
          )}
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
                  {careerTexts[r.id] && (
                    <div>
                      <h3 className="mb-1.5 text-xs font-medium text-gray-400">
                        主な進路
                      </h3>
                      <p className="text-sm leading-relaxed">
                        {careerTexts[r.id]}
                      </p>
                    </div>
                  )}
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
