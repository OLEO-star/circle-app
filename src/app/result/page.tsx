"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Ring from "@/components/Ring";
import {
  VERSION_CATEGORY_NAMES,
  VERSION_CATEGORY_COLORS,
  departments,
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

// 匿名集計エンドポイント（Google Apps Script v2、kazu39leo@gmail.com 所有）。
// マスタSheets（個人特定情報なし）と学校別Sheets（クラス・出席番号あり）に振り分けて記録する。
// 個人を識別する情報は送らない設計。プライバシーポリシー §2 / §3 に対応。
const ANALYTICS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxoGqyDg6ERed2B24LArJZACk5cI5IAoEgF5hmIHtIIvrF-koDoTSy8GNy_XxZznmhX/exec";

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
  // 所要時間集計用。quiz/page.tsx が sessionStorage 経由で渡す。
  startTime?: string;
  endTime?: string;
  durationSec?: string;
};

export default function ResultPage() {
  const router = useRouter();
  // SSR とクライアント初回レンダーで同じ DOM を返すため null 初期化。
  // lazy initializer で sessionStorage を読むと SSR(null) と client(値あり) で
  // ハイドレーション不一致になるので、useEffect 内で読み込む。
  const [data, setData] = useState<StoredResult | null>(null);

  // Top3 への納得感スコア。1ヶ所に集中して回答率を最大化する設計（Phase 1）。
  // セッション中に1回だけ送信し、UI も「ありがとう」表示に切り替える。
  // 希望進路（desired）は結果を見てから書いてもらう設計で、納得感と一緒に送信する。
  const [satisfaction, setSatisfaction] = useState<
    "pitari" | "fuzzy" | "different" | null
  >(null);
  const [reason, setReason] = useState("");
  // 結果を踏まえて気になっている学部（Top3、優先順位順、任意）。
  // 各要素は学科ID / "none" / "other"。
  const [desiredTypes, setDesiredTypes] = useState<string[]>(["", "", ""]);
  const [desiredOthers, setDesiredOthers] = useState<string[]>(["", "", ""]);
  // 上記3つを選んだ理由（共通、任意）。
  const [desiredReason, setDesiredReason] = useState("");
  const [satisfactionSent, setSatisfactionSent] = useState(false);
  // モーダルで詳細展開する学科ID。null = 非表示。
  // Top4以降の学科の詳細を、ページ遷移せずに読めるようにする UI（案X）。
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  useEffect(() => {
    // デモモード（?demo=1）：見た目確認用にダミーデータを注入する。
    // 送信状態もクリアして Page 8 の初期表示を見られるようにする。
    // 実データは別の sessionStorage キーには保存しない（あくまで一時的なプレビュー）。
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("demo") === "1"
    ) {
      const dummy: StoredResult = {
        version: "humanities",
        axisScores: [
          0.65, 0.55, 0.5, 0.75, 0, 0, 0.55, 0.55, 0.55, 0.4, 0.6, 0.45,
          0.35, 0.45, 0, 0, 0.6, 0.55, 0.3,
        ],
        results: [
          { id: "sociology", name: "社会学科", categoryIndex: 2, slot: 3, score: 88, similarity: 0.88 },
          { id: "intl-relations", name: "国際関係学科", categoryIndex: 2, slot: 3, score: 85, similarity: 0.85 },
          { id: "psychology", name: "心理学科", categoryIndex: 4, slot: 6, score: 82, similarity: 0.82 },
          { id: "politics", name: "政治学科", categoryIndex: 2, slot: 2, score: 78, similarity: 0.78 },
          { id: "education", name: "教育学科", categoryIndex: 4, slot: 7, score: 75, similarity: 0.75 },
          { id: "economics", name: "経済学科", categoryIndex: 1, slot: 0, score: 72, similarity: 0.72 },
          { id: "law", name: "法学科", categoryIndex: 2, slot: 2, score: 70, similarity: 0.7 },
          { id: "philosophy", name: "哲学科", categoryIndex: 3, slot: 5, score: 68, similarity: 0.68 },
          { id: "foreign-lang", name: "外国語学科", categoryIndex: 3, slot: 4, score: 65, similarity: 0.65 },
          { id: "business", name: "経営学科", categoryIndex: 1, slot: 1, score: 62, similarity: 0.62 },
          { id: "commerce", name: "商学科", categoryIndex: 1, slot: 1, score: 60, similarity: 0.6 },
          { id: "literature", name: "文学科", categoryIndex: 3, slot: 4, score: 58, similarity: 0.58 },
          { id: "sports-sci", name: "スポーツ科学科", categoryIndex: 4, slot: 7, score: 55, similarity: 0.55 },
        ],
        categoryStrengths: [0.5, 0.4, 0.7, 0.5, 0.4, 0.3, 0.4, 0.6],
        top3Categories: [2, 4, 1],
      };
      sessionStorage.setItem("quizResult", JSON.stringify(dummy));
      sessionStorage.removeItem("satisfactionSent");
      sessionStorage.removeItem("satisfactionValue");
      setData(dummy);
      setSatisfactionSent(false);
      return;
    }

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
      // 開始/終了時刻と所要時間（quiz/page.tsx で計算済み）
      start_time: data.startTime ?? "",
      end_time: data.endTime ?? "",
      duration_sec: data.durationSec ?? "",
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
    // 納得感 or 学部のどちらか入力されていれば送信可能。両方未入力なら何もしない。
    if (satisfactionSent) return;
    const hasDesired = desiredTypes.some((t) => t !== "");
    if (satisfaction === null && !hasDesired) return;
    setSatisfactionSent(true);
    sessionStorage.setItem("satisfactionSent", "1");
    if (satisfaction) sessionStorage.setItem("satisfactionValue", satisfaction);
    const trimmedReason = reason.trim();
    // 各位置の desired 値を決定。教員が Sheets で読みやすいよう、
    // 学科IDではなく学科名（日本語）に解決してから送る。
    //   ""              → 空文字
    //   "none"          → "特にない・分からない"
    //   学科ID（"math"等） → 学科名（"数学科"等）
    //   "other" + 入力  → "その他: <入力>"
    const computeDesired = (type: string, other: string): string => {
      if (type === "") return "";
      if (type === "none") return "特にない・分からない";
      if (type === "other") {
        const o = other.trim();
        return o ? `その他: ${o}` : "";
      }
      const dept = departments.find((d) => d.id === type);
      return dept?.name ?? type;
    };
    // 学校モードなら学校別 feedback シートにも振り分けるための情報を含める。
    // session_id だけだと Apps Script から学校が引けないので、school_code 等も同送する。
    const schoolModeNow = isSchoolMode();
    const schoolInfoNow = schoolModeNow ? getSchoolInfo() : null;
    const studentInfoNow = schoolModeNow ? getStudentInfo() : null;
    // 教員が Sheets で読みやすいよう、納得感も日本語ラベルに解決する。
    const satisfactionLabel: Record<"pitari" | "fuzzy" | "different", string> = {
      pitari: "ピッタリ",
      fuzzy: "微妙",
      different: "違うかも",
    };
    const sessionId = sessionStorage.getItem("sessionId") ?? "";
    const payload = {
      type: "satisfaction",
      session_id: sessionId,
      satisfaction: satisfaction ? satisfactionLabel[satisfaction] : "",
      reason: trimmedReason,
      desired_field1: computeDesired(desiredTypes[0], desiredOthers[0]),
      desired_field2: computeDesired(desiredTypes[1], desiredOthers[1]),
      desired_field3: computeDesired(desiredTypes[2], desiredOthers[2]),
      desired_reason: desiredReason.trim(),
      // 学校別 feedback への振り分け用（個人モードでは空文字）
      school_mode: schoolModeNow ? "true" : "false",
      school_code: schoolInfoNow?.code ?? "",
      grade: studentInfoNow?.grade ?? "",
      klass: studentInfoNow?.klass ?? "",
      student_number: studentInfoNow?.number ?? "",
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
  // Page 8 の希望学部プルダウンは、選択した版に出てくる学科だけに絞る。
  // 文系を選んだ生徒に医学科などを見せても選択肢として現実的ではないため。
  const desiredFieldOptions = departments.filter(
    (d) => !d.versions || d.versions.includes(data.version),
  );

  return (
    <div className="flex min-h-dvh snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
      {/* Page 1: 興味マップ（リング） + Top3 統合
          - overscroll-x-contain: 左端で左スワイプしてもブラウザ戻る等が発動しない
          - 単方向誘導: 「→ スワイプ」と右方向のみを示し、左戻りの混乱を防ぐ */}
      <section className="flex min-w-full snap-center flex-col items-center justify-center px-6 py-8">
        <h2 className="mb-1 text-base font-bold">あなたの興味マップ</h2>
        <p className="mb-3 text-[10px] text-gray-400">リングの形があなたの個性です</p>
        <Ring strengths={data.categoryStrengths} size={240} version={data.version} />

        {/* Top 3 一覧（旧 Page 2 から移植）。第一画面で答えが見える Primacy Effect 最大化。 */}
        <div className="mt-6 w-full max-w-sm">
          <p className="mb-3 text-center text-xs font-semibold text-gray-700">
            あなたに合う学科 Top 3
          </p>
          <div className="space-y-2.5">
            {top3.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: colors[r.slot] }}
                >
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium">{r.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${r.score}%`,
                          backgroundColor: colors[r.slot],
                        }}
                      />
                    </div>
                    <span className="w-10 text-right text-[10px] text-gray-500">
                      {r.score}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-400">スワイプして詳しく見る →</p>
      </section>

      {/* Pages 2-4: 学科詳細（旧 Page 3-5、Top3 一覧をP1に統合したため番号繰上げ） */}
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

      {/* Page 6: 4位以降の全学科ランキング
          - justify-center で他ページと一貫した縦位置（ヘッダー切れを防ぐ）
          - 各行クリックでモーダル展開: Top4以降の詳細も読める設計（案X）
          - py-12 → py-8 で項目数が多くても画面に収まる余地を増やす */}
      <section className="flex min-w-full snap-center flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <h2 className="mb-1 text-lg font-bold">他の学科ランキング</h2>
          <p className="mb-2 text-xs text-gray-400">
            比較対象 全{totalCount}学科をスコア順で表示
          </p>
          <p className="mb-5 text-[10px] text-gray-400">
            気になる学科をタップすると詳細が見られます
          </p>
          {remaining.length > 0 ? (
            <div className="space-y-2.5">
              {remaining.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setExpandedDept(r.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors active:bg-gray-50"
                >
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
                  <span className="text-xs text-gray-300">›</span>
                </button>
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
        </div>
      </section>

      {/* Page 8: フィードバック（納得感 + 理由 + 気になっている学部）
          すべての結果を見終わってから書いてもらうことで、結果を踏まえた回答になる。
          学校モードでは先生の進路指導の核データ、個人モードでも改善・集計に使う。 */}
      <section className="flex min-w-full snap-center flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h2 className="mb-1 text-lg font-bold text-center">
            最後にひとこと聞かせてください
          </h2>
          <p className="mb-6 text-center text-xs text-gray-400">
            すべて任意です
          </p>

          {!satisfactionSent ? (
            <>
              {/* カード1: 納得感（理由は選択後に表示） */}
              <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
                <p className="mb-3 text-center text-sm font-medium text-gray-800">
                  この結果、自分にピンときましたか？
                </p>
                <div className="flex justify-center gap-2">
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

                {satisfaction && (
                  <div className="mt-3">
                    <label className="mb-1 block text-xs text-gray-500">
                      その理由
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="例：Top1の○○学科は興味あるけど、Top3 の□□は違う気がした"
                      rows={3}
                      maxLength={500}
                      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* カード2: 気になっている学部 Top3 + 共通理由欄（最初から表示） */}
              <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
                <p className="mb-1 text-center text-sm font-medium text-gray-800">
                  結果を踏まえて、気になっている学部
                </p>
                <p className="mb-3 text-center text-[10px] text-gray-400">
                  優先順位の順で 最大3つ・任意
                </p>

                {[0, 1, 2].map((i) => (
                  <div key={i} className="mb-3">
                    <label className="mb-1 block text-xs text-gray-500">
                      {i + 1}番目
                    </label>
                    <select
                      value={desiredTypes[i]}
                      onChange={(e) => {
                        const next = [...desiredTypes];
                        next[i] = e.target.value;
                        setDesiredTypes(next);
                      }}
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                    >
                      <option value="">選んでください</option>
                      <option value="none">特にない・分からない</option>
                      {desiredFieldOptions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                      <option value="other">その他（自由入力）</option>
                    </select>

                    {desiredTypes[i] === "other" && (
                      <input
                        type="text"
                        value={desiredOthers[i]}
                        onChange={(e) => {
                          const next = [...desiredOthers];
                          next[i] = e.target.value;
                          setDesiredOthers(next);
                        }}
                        placeholder="例：医療系、起業 など"
                        maxLength={50}
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                      />
                    )}
                  </div>
                ))}

                <label className="mb-1 mt-3 block text-xs text-gray-500">
                  上記を選んだ理由（任意）
                </label>
                <textarea
                  value={desiredReason}
                  onChange={(e) => setDesiredReason(e.target.value)}
                  placeholder="例：医療系に進みたいけど、看護か医師か迷っている"
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                />
              </div>

              {/* 送信ボタン：納得感 or 学部のどれか1つでも入力されれば有効 */}
              {(() => {
                const hasDesired = desiredTypes.some((t) => t !== "");
                const canSubmit = satisfaction !== null || hasDesired;
                return (
                  <button
                    onClick={submitSatisfaction}
                    disabled={!canSubmit}
                    className={`w-full rounded-full py-3 text-sm font-medium transition-colors ${
                      canSubmit
                        ? "bg-gray-900 text-white active:bg-gray-700"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    送信する
                  </button>
                );
              })()}
            </>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-6 text-center">
              <p className="text-sm text-gray-700">
                <span className="mr-2 text-lg leading-none">
                  {satisfaction === "pitari"
                    ? "👍"
                    : satisfaction === "fuzzy"
                      ? "😐"
                      : satisfaction === "different"
                        ? "👎"
                        : "🙏"}
                </span>
                ありがとうございます！
              </p>
            </div>
          )}

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

      {/* 学科詳細モーダル（案X）
          Top4以降をタップした時に下から滑り上がる詳細パネル。
          - 背景タップ or × ボタンで閉じる
          - 横スワイプ UI を維持したまま、追加情報を提供できる
          - intro / weeklyFlow / careerTexts を Page 2-4 と同じ構造で表示 */}
      {expandedDept && (
        <DeptDetailModal
          deptId={expandedDept}
          onClose={() => setExpandedDept(null)}
          allRanked={data.results}
          colors={colors}
          names={names}
        />
      )}
    </div>
  );
}

function DeptDetailModal({
  deptId,
  onClose,
  allRanked,
  colors,
  names,
}: {
  deptId: string;
  onClose: () => void;
  allRanked: Array<{
    id: string;
    name: string;
    score: number;
    slot: number;
    categoryIndex: number;
  }>;
  colors: readonly string[];
  names: readonly string[];
}) {
  const dept = allRanked.find((r) => r.id === deptId);
  const texts = dept ? departmentTexts[dept.id] : null;
  const career = dept ? careerTexts[dept.id] : null;
  const rank = dept ? allRanked.findIndex((r) => r.id === dept.id) + 1 : null;

  // ESCキーで閉じる + body スクロールロック
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!dept) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white px-6 pb-8 pt-3 animate-[slideUp_250ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ハンドル */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300" />

        {/* ヘッダー */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: colors[dept.slot] }}
            >
              {rank}
            </span>
            <div>
              <p className="text-base font-bold">{dept.name}</p>
              <p className="text-xs text-gray-400">
                {names[dept.slot]} ・ 適合度 {dept.score}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="text-2xl text-gray-400 transition-colors active:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* 内容（Page 2-4 と同じ構造） */}
        {texts ? (
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
            {career && (
              <div>
                <h3 className="mb-1.5 text-xs font-medium text-gray-400">
                  主な進路
                </h3>
                <p className="text-sm leading-relaxed">{career}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">この学科の詳細情報はまだ準備中です。</p>
        )}
      </div>
    </div>
  );
}
