"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Ring from "@/components/Ring";
import RingIcon from "@/components/RingIcon";
import {
  VERSION_CATEGORY_NAMES,
  VERSION_CATEGORY_COLORS,
  departments,
  isScienceDept,
} from "@/lib/departments";
import { departmentTexts } from "@/lib/result-texts";
import { careerTexts } from "@/lib/career-texts";
import { getPage7Content } from "@/lib/page7";
import { buildDemoData, type StoredResult } from "@/lib/demo-result";
import {
  getSchoolInfo,
  getStudentAge,
  getStudentInfo,
  isSchoolMode,
} from "@/lib/school-mode";

// 匿名集計エンドポイント（Google Apps Script v2、kazu39leo@gmail.com 所有）。
// マスタSheets（個人特定情報なし）と学校別Sheets（クラス・出席番号あり）に振り分けて記録する。
// 個人を識別する情報は送らない設計。プライバシーポリシー §2 / §3 に対応。
// 本番（/result）では匿名集計・納得感の送信を有効にする。
// result-v（デモ）側は true のまま＝デモでは送信しない。本番経路はこのページ。
const DEMO_NO_POST = false;

// ?demo= プレビュー判定。デモ表示中は本番集計・納得感を一切送信しない（偽データ混入防止）。
const isDemoView = () =>
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("demo");

// 順位バッジ等で、学科カテゴリ色(slot色)の上に載せる文字色を背景輝度から自動選択する。
// 旧実装は全バッジ text-white 固定で、黄系カテゴリ(#F5EE42 等)では白文字が判読困難
// （コントラスト 1.2〜1.7:1）だった。相対輝度が高い背景には濃色(#1F2937)、低い背景には白。
function readableTextOn(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return "#ffffff";
  const lum = (hex6: string) => {
    const r = parseInt(hex6.slice(0, 2), 16) / 255;
    const g = parseInt(hex6.slice(2, 4), 16) / 255;
    const b = parseInt(hex6.slice(4, 6), 16) / 255;
    const lin = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const cr = (a: number, b: number) =>
    (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  // 白(#fff)と濃色(#1F2937)のうち、背景とのコントラストが高い方を選ぶ。
  // 黄系(#F5EE42 等)は濃色、青/紫/濃緑は白、緑/赤など中間色も「読める方」を選択。
  const Lbg = lum(h);
  return cr(Lbg, 1) >= cr(Lbg, lum("1F2937")) ? "#ffffff" : "#1F2937";
}

const ANALYTICS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxoGqyDg6ERed2B24LArJZACk5cI5IAoEgF5hmIHtIIvrF-koDoTSy8GNy_XxZznmhX/exec";

// 共有トークン。GAS 側（code.gs の SECURITY.SHARED_TOKEN）と一致させる。
// 真の秘密ではない（公開WebアプリなのでクライアントJSに同梱され抽出可能）。
// 目的は「エンドポイント直叩き・スクリプト濫用」をふるい落とすこと。
// 一致しない POST は GAS が門前払いし、シート生成も書き込みもされない。
// ローテーションするときは GAS 側と同時に差し替える。
const POST_TOKEN = "b24ea11b1ee94af10fd8c48bba0215225ce8ae22";

// type StoredResult / buildDemoData は共有モジュール @/lib/demo-result に移設済み
// （result と result-v の重複解消・学科単位リング化での長さズレ防止、2026-06-19）。

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
  // 「他の学科ランキング」で 16 位以降を隠すかどうか。
  // 全 36 学科だと縦に長すぎて視認性が落ちるため、デフォルトは 15 位まで表示。
  const [showAllRemaining, setShowAllRemaining] = useState(false);
  // PC版（≥1024px / lg）かどうか。SSR とクライアント初回で同じ DOM を返すため
  // null 初期化し、マウント後に matchMedia を評価して確定する（既存の data 同様の流儀）。
  // null の間はモバイルJSXを返す（SSRはモバイル前提）→ マウント後に PC幅なら切替。
  // CSS の hidden/lg:block 二枚出しだと canvas リングが二重生成・分析useEffectが
  // 二重発火するため、JSレベルで片方だけをレンダーする方式にする。
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    // デモモード：見た目確認用にダミーデータを注入する。
    //   ?demo=1         → 文系版（後方互換）
    //   ?demo=humanities → 文系版
    //   ?demo=sciences  → 理系版
    //   ?demo=mixed     → 全学科版（36学科すべて表示）
    // 送信状態もクリアして Page 8 の初期表示を見られるようにする。
    // 実データは別の sessionStorage キーには保存しない（あくまで一時的なプレビュー）。
    if (typeof window !== "undefined") {
      const demoParam = new URLSearchParams(window.location.search).get("demo");
      const dummy = demoParam ? buildDemoData(demoParam) : null;
      if (dummy) {
        // デモは本番キー(quizResult)へ保存しない。後で素の /result を開いても
        // デモが実データとして表示・送信されないようにする（プレビューは一時的）。
        sessionStorage.removeItem("satisfactionSent");
        sessionStorage.removeItem("satisfactionValue");
        setData(dummy);
        setSatisfactionSent(false);
        return;
      }
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

  // PC版判定。マウント後に matchMedia を評価し、ブレークポイントの変化にも追従する。
  // SSR では実行されない（useEffect）。breakpoint = Tailwind lg = 1024px。
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // 匿名集計を 1回だけ送信（同一結果の重複送信を防止）。
  // CORS preflight を避けるため text/plain で送る → Apps Script 側で JSON.parse。
  // mode: "no-cors" でレスポンスは opaque だが、リクエスト自体は成功する。
  // PC/モバイルどちらのビューでも data が入れば1回だけ走る（isDesktop に依存しない）。
  useEffect(() => {
    if (!data) return;
    if (DEMO_NO_POST || isDemoView()) return;
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
      token: POST_TOKEN,
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
      // 22軸スコア（マスタSheets側で改善分析に使う）
      // 2026-06-12 PURE/BIO/PROC 追加で 19→22 値。1セルCSVなので送信形式は不変だが、
      // Sheets側の分析が19列前提ならそちらの更新が必要
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
      token: POST_TOKEN,
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
    if (DEMO_NO_POST || isDemoView()) { setSatisfactionSent(true); return; }
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

  // ===== uni-finder（進学先マッチング）への導線 =====
  // 2026-06-16: 学部診断の質問文改修中につき、一旦 学部診断→大学診断 の送客を停止（混線防止）。
  // 大学診断側を独立した「重視軸マッチング」として固めてから、改めて結線する。再開は true に戻すだけ。
  const SHOW_UNIFINDER_LINK = false;
  // 結果上位のうち理系学科のみを ?dept= に渡す。uni-finder は理系のみ対応のため、
  // 文系学科は除外する。判定は【学科 ID 単位】(isScienceDept)で行う
  // ── 2026-06-18 mixed 9化で categoryIndex の意味が変わったため categoryIndex 判定は不可。
  // ID は uni-finder の ?dept= がそのまま受け取る同じ学科ID。最大3件・カンマ区切り。
  const UNI_FINDER_BASE = "https://uni-finder.pages.dev/score/";
  const scienceTopIds = data.results
    .filter((r) => isScienceDept(r.id))
    .slice(0, 3)
    .map((r) => r.id);
  const hasScienceTop = scienceTopIds.length > 0;
  const uniFinderUrl = hasScienceTop
    ? `${UNI_FINDER_BASE}?dept=${encodeURIComponent(scienceTopIds.join(","))}`
    : UNI_FINDER_BASE;

  // PC版（≥1024px）。状態・ハンドラ・データはモバイルと完全共有し、
  // レイアウトだけ 2 カラムに組み替える（ResultDesktop.jsx 準拠）。
  // isDesktop が null（マウント前）/ false のときは下のモバイルJSXを返す。
  if (isDesktop) {
    return (
      <ResultDesktopView
        data={data}
        top3={top3}
        remaining={remaining}
        totalCount={totalCount}
        colors={colors}
        names={names}
        page7={page7}
        desiredFieldOptions={desiredFieldOptions}
        showUniFinder={SHOW_UNIFINDER_LINK}
        hasScienceTop={hasScienceTop}
        uniFinderUrl={uniFinderUrl}
        satisfaction={satisfaction}
        setSatisfaction={setSatisfaction}
        reason={reason}
        setReason={setReason}
        desiredTypes={desiredTypes}
        setDesiredTypes={setDesiredTypes}
        desiredOthers={desiredOthers}
        setDesiredOthers={setDesiredOthers}
        desiredReason={desiredReason}
        setDesiredReason={setDesiredReason}
        satisfactionSent={satisfactionSent}
        submitSatisfaction={submitSatisfaction}
        showAllRemaining={showAllRemaining}
        setShowAllRemaining={setShowAllRemaining}
        expandedDept={expandedDept}
        setExpandedDept={setExpandedDept}
        onRestart={() => {
          sessionStorage.removeItem("quizResult");
          router.push("/start");
        }}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Page 1: 興味マップ（リング） + Top3 統合
          - overscroll-x-contain: 左端で左スワイプしてもブラウザ戻る等が発動しない
          - 単方向誘導: 「→ スワイプ」と右方向のみを示し、左戻りの混乱を防ぐ
          - リング 320px で画面幅いっぱい近くまで広げ、ブランド・ビジュアルの
            インパクトを最大化（リング型 = サービス名の由来） */}
      <section className="flex min-h-dvh w-full flex-col items-center justify-center px-4 pb-6 pt-4">
        <h2 className="mb-1 text-lg font-bold">あなたの興味マップ</h2>
        <p className="mb-1 text-[10px] text-gray-400">リングの形があなたの個性です</p>
        <Ring strengths={data.categoryStrengths} size={344} version={data.version} />

        {/* Top 3 一覧（旧 Page 2 から移植）。第一画面で答えが見える Primacy Effect 最大化。 */}
        <div className="mt-4 w-full max-w-sm">
          <p className="mb-2 text-center text-xs font-semibold text-gray-700">
            あなたに合う学科 Top 3
          </p>
          <div className="space-y-2">
            {top3.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: colors[r.slot], color: readableTextOn(colors[r.slot]) }}
                >
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium leading-tight">{r.name}</p>
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
                    <span className="w-8 text-right text-[10px] text-gray-500">
                      {r.score}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-1 text-gray-400">
          <p className="text-xs">スクロールして詳しく見る</p>
          {/* 下向き矢印を控えめに上下バウンスさせ "続きがある" 感を出す。
              prefers-reduced-motion オン時は globals.css 側で停止。 */}
          <span
            className="animate-scroll-bounce text-sm leading-none"
            aria-hidden="true"
          >
            ↓
          </span>
        </div>
      </section>

      {/* Pages 2-4: 学科詳細（旧 Page 3-5、Top3 一覧をP1に統合したため番号繰上げ）
          縦スクロールでは各詳細を1画面高に固定しない。min-h-dvh + 中央寄せだと
          内容が短い学科で上下に大きな空白が生まれ「説明の後が間延びする」(かずき指摘)。
          自然フロー + 上下 py-12 の一定リズムにし、隣との境界は天面 borderで示す。 */}
      {top3.map((r, i) => {
        const texts = departmentTexts[r.id];
        return (
          <section
            key={r.id}
            className="flex w-full flex-col items-center px-6 py-6"
          >
            {/* カード統一: FB欄・基準欄と同じ bg-gray-50/角丸/border のカードに寄せ、
                セクション間の区切りを border-t 細線からカード枠へ一本化。
                左端に学科カテゴリ色(colors[r.slot])の色帯(実 div)を入れ、
                「リングのこの山＝この学科」を視覚で結ぶ。box-shadow/疑似要素は不使用。 */}
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
              <div className="flex">
                <div
                  className="w-1.5 shrink-0"
                  style={{ backgroundColor: colors[r.slot] }}
                  aria-hidden="true"
                />
                <div className="flex-1 px-5 py-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: colors[r.slot], color: readableTextOn(colors[r.slot]) }}
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
                        <p className="text-sm leading-relaxed">
                          {texts.weeklyFlow}
                        </p>
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
              </div>
            </div>
          </section>
        );
      })}

      {/* Page 6: 4位以降の全学科ランキング
          - 各行クリックでモーダル展開: Top4以降の詳細も読める設計（案X）
          - 縦スクロール統一: min-h-dvh中央寄せをやめ自然フロー+py-12。
            項目数が可変（13〜36学科）なので1画面固定だと空白/見切れの両極に振れる。 */}
      <section className="flex w-full flex-col items-center px-6 py-6">
        {/* カード統一: Top3 詳細・FB欄と同じ bg-gray-50 カードに寄せる。 */}
        <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-gray-50 px-5 py-5">
          <h2 className="mb-1 text-lg font-bold">他の学科ランキング</h2>
          <p className="mb-2 text-xs text-gray-400">
            比較対象 全{totalCount}学科をスコア順で表示
          </p>
          <p className="mb-5 text-[10px] text-gray-400">
            気になる学科をタップすると詳細が見られます
          </p>
          {remaining.length > 0 ? (
            <div className="space-y-2">
              {/* 「さらに見る」UI は mixed / sciences の両方に適用。
                  デフォルトは 4-15 位（12項目）まで表示し、16 位以降は展開で見る。
                  humanities（13学科）は元から短いのでカットオフなし。 */}
              {((data.version === "mixed" || data.version === "sciences") &&
              !showAllRemaining
                ? remaining.slice(0, 12)
                : remaining
              ).map(
                (r, i) => (
                  <button
                    key={r.id}
                    onClick={() => setExpandedDept(r.id)}
                    className="flex w-full items-center gap-2.5 overflow-hidden rounded-lg bg-white pr-2 text-left transition-colors active:bg-gray-100"
                  >
                    {/* 左端に学科カテゴリ色の色帯(実 div)。リングの山と対応づける。 */}
                    <div
                      className="h-9 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: colors[r.slot] }}
                      aria-hidden="true"
                    />
                    <span className="w-5 text-right text-xs text-gray-400">
                      {i + 4}
                    </span>
                    <p className="flex-1 text-sm">{r.name}</p>
                    <div className="h-2 w-20 rounded-full bg-gray-100">
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
                ),
              )}

              {/* 16 位以降を展開するボタン。
                  mixed / sciences のみ表示（カットオフあり）。
                  humanities は元から全表示なのでボタン非表示。 */}
              {(data.version === "mixed" || data.version === "sciences") &&
                !showAllRemaining &&
                remaining.length > 12 && (
                  <button
                    onClick={() => setShowAllRemaining(true)}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white py-2.5 text-xs text-gray-600 transition-colors active:bg-gray-100"
                  >
                    さらに見る（16 位〜{remaining.length + 3} 位を表示）▼
                  </button>
                )}
              {(data.version === "mixed" || data.version === "sciences") &&
                showAllRemaining &&
                remaining.length > 12 && (
                  <button
                    onClick={() => setShowAllRemaining(false)}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white py-2.5 text-xs text-gray-600 transition-colors active:bg-gray-100"
                  >
                    15 位までに戻す ▲
                  </button>
                )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              あなたの興味はTop 3に集中しています！
            </p>
          )}
        </div>
      </section>

      {/* Page 7: 大学選びの基準（カード統一: Top3・ランキング・FBと同じカード） */}
      <section className="flex w-full flex-col items-center px-6 py-6">
        <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-gray-50 px-5 py-5">
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

          {/* uni-finder への導線（進学先マッチング・β）
              診断 → 「この学科がある大学を探す」で uni-finder へ送客し、
              ただの大学検索ではなく診断連携の差別化を活かす。
              理系上位学科のみ ?dept= に渡す（uni-finder は理系のみ対応）。
              文系診断（理系上位なし）でもボタンは出し、注記で案内＝クラッシュさせない。
              ブランド規約に従い box-shadow / 疑似要素の図形描画は使わず border + 実要素で構成。 */}
          {SHOW_UNIFINDER_LINK && (
            <div className="mt-8 rounded-2xl border border-[#1E40AF]/20 bg-[#E8EFFF] px-5 py-4">
              <p className="text-sm font-semibold text-[#1E40AF]">
                次は「行ける大学」を探そう
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                {hasScienceTop
                  ? "あなたに合う学科を扱う大学を、共通テスト得点率から探せます。"
                  : "学力から進学先を探せる姉妹サービスがあります。"}
              </p>
              <a
                href={uniFinderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block w-full rounded-full bg-[#1E40AF] py-3 text-center text-sm font-medium text-white transition-colors active:bg-[#16308a]"
              >
                この学科がある大学を探す →
              </a>
              {!hasScienceTop && (
                <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
                  ※ いまは理系の大学のみ対応しています
                </p>
              )}
              <p className="mt-2 text-[10px] text-gray-400">
                進学先マッチング（β）・無料 ／ 別タブで開きます
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Page 8: フィードバック（納得感 + 理由 + 気になっている学部）
          すべての結果を見終わってから書いてもらうことで、結果を踏まえた回答になる。
          学校モードでは先生の進路指導の核データ、個人モードでも改善・集計に使う。 */}
      <section className="flex w-full flex-col items-center px-6 pb-16 pt-6">
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
              router.push("/start");
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
  variant = "sheet",
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
  // "sheet"    = モバイル: 下から滑り上がるボトムシート（既存・不変更）
  // "centered" = PC版: 画面中央にフェードインするカード（ResultDesktop.jsx の DeptModalD）
  variant?: "sheet" | "centered";
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

  // PC版: 中央フェードインモーダル（ResultDesktop.jsx DeptModalD を忠実に再現）。
  // scrim rgba(0,0,0,.4)、中央配置、カード max-w-[560px]・max-h-full・overflow-y-auto・
  // 角丸 2xl・fade-in 200ms。外側クリック / × / ESC で閉じる。
  if (variant === "centered") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-8"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="animate-modal-fade max-h-full w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white px-8 py-7"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー（RankBadge 36 + 学科名 + カテゴリ適合度 + ×） */}
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: colors[dept.slot], color: readableTextOn(colors[dept.slot]) }}
              >
                {rank}
              </span>
              <div>
                <p className="text-lg font-bold">{dept.name}</p>
                <p className="text-xs text-gray-400">
                  {names[dept.slot]} ・ 適合度 {dept.score}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="閉じる"
              className="text-[26px] leading-none text-gray-400 transition-colors hover:text-gray-700"
            >
              ×
            </button>
          </div>

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
            <p className="text-sm text-gray-500">
              この学科の詳細情報はまだ準備中です。
            </p>
          )}
        </div>
      </div>
    );
  }

  // モバイル版（variant="sheet"・デフォルト）: 2026-06-18 改修。
  // かずき指示で「下から出るボトムシート → 画面中央に出るモーダル＋Top3 と同じ色帯カード見た目」へ。
  // - 配置: items-end → items-center（画面中央）。scrim bg-black/40 維持。
  // - アニメ: slideUp → animate-modal-fade（PC で足したトークンを再利用・reduced-motion 尊重）。
  // - 形: rounded-t-3xl → 全角丸 rounded-2xl。グラブハンドルは廃止。
  // - 見た目: Top3 カードと同一（overflow-hidden rounded-2xl border border-gray-100 bg-gray-50
  //   ＋ 左端 w-1.5 の色帯 colors[dept.slot]）。中身（学科について/1週間の流れ/主な進路）は不変。
  // - 小画面対応: p-5 で画面端に密着させない・max-w-sm（スマホ幅にフィット）・max-h-[85vh]＋内部スクロール。
  // - 閉じる: 外側タップ / × / ESC を維持。本文欠落時の「準備中」フォールバックも維持。
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-modal-fade max-h-[85vh] w-full max-w-sm overflow-hidden rounded-2xl border border-gray-100 bg-gray-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex max-h-[85vh]">
          {/* 左端の色帯（Top3 カードと同じ幅 w-1.5・同色 colors[dept.slot]）。 */}
          <div
            className="w-1.5 shrink-0"
            style={{ backgroundColor: colors[dept.slot] }}
            aria-hidden="true"
          />
          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
            {/* ヘッダー */}
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: colors[dept.slot], color: readableTextOn(colors[dept.slot]) }}
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
                className="text-2xl leading-none text-gray-400 transition-colors active:text-gray-700"
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
              <p className="text-sm text-gray-500">
                この学科の詳細情報はまだ準備中です。
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PC版（≥1024px / lg）の 2 カラム結果画面。
// デザイン正本: ui_kits/diagnostic-app-desktop/ResultDesktop.jsx を忠実に再現。
// - sticky ヘッダー(高さ64) / max-w-[1180px] flex
// - 左 aside(幅440・sticky top:64): 興味マップ + リング(size 300) + Top3
// - 右 main(flex-1・左 hairline): 4 セクションを上罫線 + p-12 で区切る
//   ①上位3学科の詳細(2カラムgrid) ②他の学科ランキング(行クリックで中央モーダル)
//   ③大学の選び方(3カラムカード) ④フィードバック(2カラムカード)
// 状態・ハンドラ・データはモバイルと完全共有（props で受け取るだけ）。
// 数値・判定式・色（colors[r.slot]）・本物の <Ring> はモバイルと同一のものを使う。
// box-shadow / 疑似要素図形は不使用（hairline border + tint fill のみ）。
// ============================================================================

type ResultRow = StoredResult["results"][number];

function DesktopBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-medium text-gray-400">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-900">{body}</p>
    </div>
  );
}

function ResultDesktopView({
  data,
  top3,
  remaining,
  totalCount,
  colors,
  names,
  page7,
  desiredFieldOptions,
  showUniFinder,
  hasScienceTop,
  uniFinderUrl,
  satisfaction,
  setSatisfaction,
  reason,
  setReason,
  desiredTypes,
  setDesiredTypes,
  desiredOthers,
  setDesiredOthers,
  desiredReason,
  setDesiredReason,
  satisfactionSent,
  submitSatisfaction,
  showAllRemaining,
  setShowAllRemaining,
  expandedDept,
  setExpandedDept,
  onRestart,
}: {
  data: StoredResult;
  top3: ResultRow[];
  remaining: ResultRow[];
  totalCount: number;
  colors: readonly string[];
  names: readonly string[];
  page7: { traits: string[]; criteria: { title: string; description: string }[] };
  desiredFieldOptions: { id: string; name: string }[];
  showUniFinder: boolean;
  hasScienceTop: boolean;
  uniFinderUrl: string;
  satisfaction: "pitari" | "fuzzy" | "different" | null;
  setSatisfaction: (v: "pitari" | "fuzzy" | "different") => void;
  reason: string;
  setReason: (v: string) => void;
  desiredTypes: string[];
  setDesiredTypes: (v: string[]) => void;
  desiredOthers: string[];
  setDesiredOthers: (v: string[]) => void;
  desiredReason: string;
  setDesiredReason: (v: string) => void;
  satisfactionSent: boolean;
  submitSatisfaction: () => void;
  showAllRemaining: boolean;
  setShowAllRemaining: (v: boolean) => void;
  expandedDept: string | null;
  setExpandedDept: (v: string | null) => void;
  onRestart: () => void;
}) {
  // 「さらに見る」のカットオフはモバイルと同じく mixed / sciences のみ・先頭8件表示。
  // （デザイン正本 ResultDesktop.jsx は 8 件カットオフ + remaining.length>8 で展開）
  const hasCutoff = data.version === "mixed" || data.version === "sciences";
  const shown = hasCutoff && !showAllRemaining ? remaining.slice(0, 8) : remaining;
  const hasDesired = desiredTypes.some((t) => t !== "");
  const canSubmit = satisfaction !== null || hasDesired;

  return (
    <div className="relative min-h-dvh bg-white text-gray-900">
      {/* sticky ヘッダー(高さ64): 左にロゴ+「ring-map / 学部診断」、右に「もう一度診断する」 */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white px-10">
        <div className="flex items-center gap-3">
          {/* ロゴ: アプリにロゴ画像アセットを新規に持ち込まず、リング型の小マークを
              実 div の二重円(border)で表現（box-shadow/疑似要素は不使用）。 */}
          <span className="inline-flex shrink-0">
            <RingIcon size={24} />
          </span>
          <span className="text-base font-bold tracking-tight">ring-map</span>
          <span className="text-xs text-gray-400">学部診断</span>
        </div>
        <button
          onClick={onRestart}
          className="rounded-full border border-gray-200 px-4 py-2 text-xs text-gray-500 transition-colors hover:bg-gray-50"
        >
          もう一度診断する
        </button>
      </header>

      <div className="mx-auto flex max-w-[1180px] items-start">
        {/* 左 aside: sticky な興味マップ + リング(300) + Top3 */}
        <aside className="sticky top-16 flex w-[440px] shrink-0 flex-col items-center px-10 py-12 text-center">
          <h1 className="mb-0.5 text-lg font-bold">あなたの興味マップ</h1>
          <p className="mb-3 text-xs text-gray-400">リングの形があなたの個性です</p>
          <Ring strengths={data.categoryStrengths} size={300} version={data.version} />
          <div className="mt-5 w-full max-w-[320px]">
            <p className="mb-2.5 text-sm font-semibold text-gray-500">
              あなたに合う学科 Top 3
            </p>
            <div className="flex flex-col gap-3">
              {top3.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: colors[r.slot], color: readableTextOn(colors[r.slot]) }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium leading-tight">{r.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${r.score}%`,
                            backgroundColor: colors[r.slot],
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-[10px] text-gray-500">
                        {r.score}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* 右 main: 4 セクション（上罫線 + p-12 で区切る） */}
        <main className="min-w-0 flex-1 border-l border-gray-100">
          {/* ① 上位3学科の詳細 */}
          <section className="p-12">
            <p className="mb-7 text-xs font-medium uppercase tracking-[0.06em] text-gray-400">
              上位3学科の詳細
            </p>
            <div className="flex flex-col gap-10">
              {top3.map((r, i) => {
                const texts = departmentTexts[r.id];
                const career = careerTexts[r.id];
                return (
                  <div key={r.id} className="flex gap-5">
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: colors[r.slot], color: readableTextOn(colors[r.slot]) }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-lg font-bold">{r.name}</p>
                      <p className="mb-4 text-xs text-gray-400">
                        {names[r.slot]} ・ 適合度 {r.score}
                      </p>
                      {texts && (
                        <div className="grid grid-cols-2 gap-x-7 gap-y-[18px]">
                          <div className="col-span-2">
                            <DesktopBlock title="学科について" body={texts.intro} />
                          </div>
                          <DesktopBlock title="1週間の流れ" body={texts.weeklyFlow} />
                          {career && (
                            <DesktopBlock title="主な進路" body={career} />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ② 他の学科ランキング（行クリックで中央モーダル） */}
          <section className="border-t border-gray-100 p-12">
            <h2 className="text-xl font-bold">他の学科ランキング</h2>
            <p className="mt-1.5 text-sm text-gray-400">
              比較対象 全{totalCount}学科をスコア順で表示 ・ 行をクリックで詳細
            </p>
            {remaining.length > 0 ? (
              <div className="mt-6 flex flex-col gap-1">
                {shown.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => setExpandedDept(r.id)}
                    className="flex w-full items-center gap-4 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                  >
                    <span className="w-6 text-right text-sm text-gray-400">
                      {i + 4}
                    </span>
                    <p className="flex-1 text-sm">{r.name}</p>
                    <span className="text-[10px] text-gray-400">
                      {names[r.slot]}
                    </span>
                    <div className="h-2 w-[180px] rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${r.score}%`,
                          backgroundColor: colors[r.slot],
                        }}
                      />
                    </div>
                    <span className="w-[26px] text-right text-xs text-gray-500">
                      {r.score}
                    </span>
                    <span className="text-sm text-gray-300">›</span>
                  </button>
                ))}
                {hasCutoff && !showAllRemaining && remaining.length > 8 && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowAllRemaining(true)}
                      className="rounded-full border border-gray-200 px-[18px] py-2 text-xs text-gray-500 transition-colors hover:bg-gray-50"
                    >
                      さらに見る（12 位〜{remaining.length + 3} 位を表示）▼
                    </button>
                  </div>
                )}
                {hasCutoff && showAllRemaining && remaining.length > 8 && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowAllRemaining(false)}
                      className="rounded-full border border-gray-200 px-[18px] py-2 text-xs text-gray-500 transition-colors hover:bg-gray-50"
                    >
                      11 位までに戻す ▲
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-6 text-sm text-gray-500">
                あなたの興味はTop 3に集中しています！
              </p>
            )}
          </section>

          {/* ③ あなたに合った大学の選び方（3カラムカード） */}
          <section className="border-t border-gray-100 p-12">
            <h2 className="text-xl font-bold">あなたに合った大学の選び方</h2>
            {page7.traits.length > 0 && (
              <p className="mb-7 mt-4 max-w-[620px] text-sm leading-relaxed text-gray-500">
                {page7.traits.join("。また、")}。
              </p>
            )}
            <h3 className="mb-4 text-xs font-medium text-gray-400">
              大学を選ぶときに見てほしいポイント
            </h3>
            <div className="grid grid-cols-3 gap-5">
              {page7.criteria.map((c, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-100 bg-white px-5 py-[18px]"
                >
                  <p className="text-sm font-semibold">{c.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                    {c.description}
                  </p>
                </div>
              ))}
            </div>

            {/* uni-finder への導線（進学先マッチング・β）
                モバイル Page 7 と同一の挙動・文言。PC では幅を抑えた CTA バナーとして配置。
                理系上位学科のみ ?dept= に渡す（uni-finder は理系のみ対応）。
                box-shadow / 疑似要素の図形描画は使わず border + 実要素で構成。 */}
            {showUniFinder && (
              <div className="mt-8 max-w-md rounded-2xl border border-[#1E40AF]/20 bg-[#E8EFFF] px-5 py-4">
                <p className="text-sm font-semibold text-[#1E40AF]">
                  次は「行ける大学」を探そう
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  {hasScienceTop
                    ? "あなたに合う学科を扱う大学を、共通テスト得点率から探せます。"
                    : "学力から進学先を探せる姉妹サービスがあります。"}
                </p>
                <a
                  href={uniFinderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block w-full rounded-full bg-[#1E40AF] py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#16308a]"
                >
                  この学科がある大学を探す →
                </a>
                {!hasScienceTop && (
                  <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
                    ※ いまは理系の大学のみ対応しています
                  </p>
                )}
                <p className="mt-2 text-[10px] text-gray-400">
                  進学先マッチング（β）・無料 ／ 別タブで開きます
                </p>
              </div>
            )}
          </section>

          {/* ④ フィードバック（2カラムカード + 右寄せ送信） */}
          <section className="border-t border-gray-100 px-12 pb-[72px] pt-12">
            <h2 className="text-xl font-bold">最後にひとこと聞かせてください</h2>
            <p className="mt-1.5 text-sm text-gray-400">すべて任意です</p>
            {!satisfactionSent ? (
              <div className="mt-6 grid grid-cols-2 items-start gap-4">
                {/* カード1: 納得感（理由は選択後に表示） */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-6 py-5">
                  <p className="mb-3.5 text-sm font-medium text-gray-900">
                    この結果、自分にピンときましたか？
                  </p>
                  <div className="flex gap-2">
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
                          aria-pressed={active}
                          className={`flex flex-1 flex-col items-center gap-1 rounded-xl border px-3 py-2.5 text-xs transition-colors ${
                            active
                              ? "border-gray-900 bg-white text-gray-900 ring-2 ring-gray-900/10"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-lg leading-none">{opt.emoji}</span>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {satisfaction && (
                    <div className="mt-3.5">
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

                {/* カード2: 気になっている学部 Top3 + 共通理由欄 */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-6 py-5">
                  <p className="mb-0.5 text-sm font-medium text-gray-900">
                    結果を踏まえて、気になっている学部
                  </p>
                  <p className="mb-3.5 text-[10px] text-gray-400">
                    優先順位の順で 最大3つ・任意
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i}>
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
                    <div>
                      <label className="mb-1 mt-1 block text-xs text-gray-500">
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
                  </div>
                </div>

                {/* 送信ボタン（右寄せ・全幅col） */}
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={submitSatisfaction}
                    disabled={!canSubmit}
                    className={`min-w-[200px] rounded-full py-3 text-sm font-medium transition-colors ${
                      canSubmit
                        ? "bg-gray-900 text-white hover:bg-gray-700"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    送信する
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 px-6 py-7 text-center">
                <p className="text-base text-gray-700">
                  <span className="mr-2 text-xl leading-none">
                    {satisfaction === "pitari"
                      ? "👍"
                      : satisfaction === "fuzzy"
                        ? "😐"
                        : satisfaction === "different"
                          ? "👎"
                          : "🙏"}
                  </span>
                  ありがとうございます！フィードバックを受け取りました。
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* 中央モーダル（PC版・ResultDesktop.jsx DeptModalD 準拠）。
          モバイルと同じ DeptDetailModal を variant="centered" で使う。 */}
      {expandedDept && (
        <DeptDetailModal
          deptId={expandedDept}
          onClose={() => setExpandedDept(null)}
          allRanked={data.results}
          colors={colors}
          names={names}
          variant="centered"
        />
      )}
    </div>
  );
}
