"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isSchoolMode,
  setSchoolInfo,
  type Prefecture,
  type School,
  type SchoolType,
} from "@/lib/school-mode";

export default function SchoolSelectPage() {
  const router = useRouter();
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [schoolType, setSchoolType] = useState<SchoolType>("high");
  const [selectedPref, setSelectedPref] = useState<string>("");
  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [otherMode, setOtherMode] = useState(false);
  const [otherName, setOtherName] = useState("");
  // PC版（≥1024px / lg）かどうか。SSR とクライアント初回で同じ DOM を返すため
  // null 初期化し、マウント後に matchMedia を評価して確定する（result-v/page.tsx と同じ流儀）。
  // null の間はモバイルJSXを返す（SSRはモバイル前提）→ マウント後に PC幅なら2カラムへ切替。
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  // /s を経由していないアクセス（直リンク等）は入口へ戻す。
  // 学校モードの一貫性を保ち、個人モードの生徒が誤って学校情報を入力するのを防ぐ。
  useEffect(() => {
    if (!isSchoolMode()) router.replace("/s");
  }, [router]);

  useEffect(() => {
    fetch("/schools/prefectures.json")
      .then((r) => r.json())
      .then((data: Prefecture[]) => setPrefectures(data))
      .catch(() => setPrefectures([]));
  }, []);

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

  // 学校種または都道府県を変えたら学校リストを再ロード。選択状態は都度リセット。
  useEffect(() => {
    if (!selectedPref) {
      setSchools([]);
      return;
    }
    setLoadingSchools(true);
    setSelectedSchool(null);
    setOtherMode(false);
    setQuery("");
    const dir =
      schoolType === "junior" ? "junior-high-schools" : "high-schools";
    fetch(`/schools/${dir}/${selectedPref}.json`)
      .then((r) => r.json())
      .then((data: School[]) => setSchools(data))
      .catch(() => setSchools([]))
      .finally(() => setLoadingSchools(false));
  }, [selectedPref, schoolType]);

  const filtered = useMemo(() => {
    if (!query.trim()) return schools.slice(0, 20);
    const q = query.trim();
    return schools.filter((s) => s.name.includes(q)).slice(0, 30);
  }, [schools, query]);

  const canProceed =
    selectedSchool !== null || (otherMode && otherName.trim().length > 0);

  const currentPrefMeta = prefectures.find((p) => p.code === selectedPref);
  const currentCount =
    currentPrefMeta == null
      ? 0
      : schoolType === "junior"
        ? currentPrefMeta.junior_count
        : currentPrefMeta.high_count;

  const proceed = () => {
    if (!selectedPref) return;
    if (otherMode) {
      const name = otherName.trim();
      if (!name) return;
      setSchoolInfo({
        code: `OTHER_${name}`,
        name,
        pref: selectedPref,
        schoolType,
      });
    } else if (selectedSchool) {
      setSchoolInfo({
        code: selectedSchool.code,
        name: selectedSchool.name,
        pref: selectedPref,
        schoolType,
      });
    } else {
      return;
    }
    router.push("/s/info");
  };

  // PC版（≥1024px）。状態・ハンドラ・データはモバイルと完全共有し、
  // レイアウトだけ左=操作列300px / 右=学校リスト1fr + 下部フッターアクションバーに組み替える
  // （ui_kits/school-flow/SchoolSelectDesktop.jsx 準拠）。
  // isDesktop が null（マウント前）/ false のときは下のモバイルJSXを返す。
  if (isDesktop) {
    return (
      <SchoolSelectDesktopView
        prefectures={prefectures}
        schoolType={schoolType}
        setSchoolType={setSchoolType}
        selectedPref={selectedPref}
        setSelectedPref={setSelectedPref}
        loadingSchools={loadingSchools}
        query={query}
        setQuery={setQuery}
        filtered={filtered}
        selectedSchool={selectedSchool}
        setSelectedSchool={setSelectedSchool}
        otherMode={otherMode}
        setOtherMode={setOtherMode}
        otherName={otherName}
        setOtherName={setOtherName}
        currentCount={currentCount}
        canProceed={canProceed}
        proceed={proceed}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="mb-2 text-[11px] tracking-wider text-gray-400">
            STEP 2 / 3
          </p>
          <h1 className="text-2xl font-bold">学校を選んでください</h1>
        </div>

        {/* 学校種タブ（中学/高校） */}
        <div className="mb-5 flex rounded-full bg-gray-100 p-1">
          <button
            onClick={() => setSchoolType("junior")}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
              schoolType === "junior"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 active:text-gray-700"
            }`}
            aria-pressed={schoolType === "junior"}
          >
            中学校
          </button>
          <button
            onClick={() => setSchoolType("high")}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
              schoolType === "high"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 active:text-gray-700"
            }`}
            aria-pressed={schoolType === "high"}
          >
            高校
          </button>
        </div>

        {/* 都道府県 */}
        <label className="mb-1 block text-xs text-gray-500">都道府県</label>
        <select
          value={selectedPref}
          onChange={(e) => setSelectedPref(e.target.value)}
          className="mb-5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
        >
          <option value="">選択してください</option>
          {prefectures.map((p) => {
            const c = schoolType === "junior" ? p.junior_count : p.high_count;
            return (
              <option key={p.code} value={p.code}>
                {p.name}（{c}校）
              </option>
            );
          })}
        </select>

        {/* 学校名検索 or "その他" 入力 */}
        {selectedPref && !otherMode && (
          <>
            <label className="mb-1 block text-xs text-gray-500">
              学校名（{currentCount}校から一部入力で絞り込み）
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedSchool(null);
              }}
              placeholder="例：青山、学院、市立..."
              className="mb-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            />

            {loadingSchools ? (
              <p className="py-4 text-center text-xs text-gray-400">
                読み込み中...
              </p>
            ) : (
              <div className="mb-3 max-h-[165px] overflow-y-auto rounded-xl border border-gray-100">
                {filtered.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-gray-400">
                    該当する学校がありません
                  </p>
                ) : (
                  filtered.map((s) => (
                    <button
                      key={s.code}
                      onClick={() => setSelectedSchool(s)}
                      className={`block w-full border-b border-gray-100 px-4 py-3 text-left text-sm transition-colors last:border-b-0 ${
                        selectedSchool?.code === s.code
                          ? "bg-gray-900 text-white"
                          : "bg-white text-gray-700 active:bg-gray-50"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))
                )}
              </div>
            )}

            <button
              onClick={() => {
                setOtherMode(true);
                setSelectedSchool(null);
              }}
              className="mb-5 w-full rounded-xl border border-dashed border-gray-300 py-2.5 text-xs text-gray-500 transition-colors active:bg-gray-50"
            >
              学校が見つからない場合（その他）
            </button>
          </>
        )}

        {selectedPref && otherMode && (
          <>
            <label className="mb-1 block text-xs text-gray-500">
              学校名（手入力）
            </label>
            <input
              type="text"
              value={otherName}
              onChange={(e) => setOtherName(e.target.value)}
              placeholder={
                schoolType === "junior" ? "○○中学校" : "○○高等学校"
              }
              className="mb-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            />
            <button
              onClick={() => {
                setOtherMode(false);
                setOtherName("");
              }}
              className="mb-5 w-full rounded-xl border border-gray-200 py-2.5 text-xs text-gray-500 transition-colors active:bg-gray-50"
            >
              リストから選び直す
            </button>
          </>
        )}

        <button
          onClick={proceed}
          disabled={!canProceed}
          className="w-full rounded-full bg-gray-900 py-3.5 text-sm font-medium text-white transition-colors active:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400"
        >
          次へ
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// PC版（≥1024px / lg）の横型 2 カラム学校選択画面。
// デザイン正本: ui_kits/school-flow/SchoolSelectDesktop.jsx を Tailwind に移植。
// - 左 操作列(300px): 学校種タブ / 都道府県 / その他切替ボタン
// - 右 学校リスト(1fr): 検索 + リスト（高めパネル）/ その他手入力 / 都道府県未選択時のプレースホルダ
// - 下部フッターアクションバー: 選択中サマリ + 「次へ」ボタン（hairline border-t で区切る）
// 状態・ハンドラ・データはモバイルと完全共有（props で受け取るだけ）。
// 検索/選択ロジック・コピー・都道府県別校数は data 層由来でモバイルと同一。
// box-shadow / 疑似要素図形は不使用（hairline border + tint fill のみ・globals.css 不変更）。
// ============================================================================
function SchoolSelectDesktopView({
  prefectures,
  schoolType,
  setSchoolType,
  selectedPref,
  setSelectedPref,
  loadingSchools,
  query,
  setQuery,
  filtered,
  selectedSchool,
  setSelectedSchool,
  otherMode,
  setOtherMode,
  otherName,
  setOtherName,
  currentCount,
  canProceed,
  proceed,
}: {
  prefectures: Prefecture[];
  schoolType: SchoolType;
  setSchoolType: (t: SchoolType) => void;
  selectedPref: string;
  setSelectedPref: (code: string) => void;
  loadingSchools: boolean;
  query: string;
  setQuery: (q: string) => void;
  filtered: School[];
  selectedSchool: School | null;
  setSelectedSchool: (s: School | null) => void;
  otherMode: boolean;
  setOtherMode: (v: boolean) => void;
  otherName: string;
  setOtherName: (v: string) => void;
  currentCount: number;
  canProceed: boolean;
  proceed: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-10 py-12">
      <div className="w-full max-w-[860px]">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[11px] tracking-wider text-gray-400">
            STEP 2 / 3
          </p>
          <h1 className="text-2xl font-bold">学校を選んでください</h1>
        </div>

        <div className="grid grid-cols-[300px_1fr] items-start gap-10">
          {/* 左: 操作列（学校種タブ / 都道府県 / その他切替） */}
          <div>
            {/* 学校種タブ（中学/高校）— モバイルと同一トークン */}
            <div className="mb-5 flex rounded-full bg-gray-100 p-1">
              <button
                onClick={() => setSchoolType("junior")}
                className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                  schoolType === "junior"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                aria-pressed={schoolType === "junior"}
              >
                中学校
              </button>
              <button
                onClick={() => setSchoolType("high")}
                className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                  schoolType === "high"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                aria-pressed={schoolType === "high"}
              >
                高校
              </button>
            </div>

            {/* 都道府県 */}
            <label className="mb-1 block text-xs text-gray-500">都道府県</label>
            <select
              value={selectedPref}
              onChange={(e) => setSelectedPref(e.target.value)}
              className="mb-5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            >
              <option value="">選択してください</option>
              {prefectures.map((p) => {
                const c =
                  schoolType === "junior" ? p.junior_count : p.high_count;
                return (
                  <option key={p.code} value={p.code}>
                    {p.name}（{c}校）
                  </option>
                );
              })}
            </select>

            {/* その他切替（リスト⇔手入力） */}
            {selectedPref && !otherMode && (
              <button
                onClick={() => {
                  setOtherMode(true);
                  setSelectedSchool(null);
                }}
                className="w-full rounded-xl border border-dashed border-gray-300 py-2.5 text-xs text-gray-500 transition-colors hover:bg-gray-50"
              >
                学校が見つからない場合（その他）
              </button>
            )}
            {selectedPref && otherMode && (
              <button
                onClick={() => {
                  setOtherMode(false);
                  setOtherName("");
                }}
                className="w-full rounded-xl border border-gray-200 py-2.5 text-xs text-gray-500 transition-colors hover:bg-gray-50"
              >
                リストから選び直す
              </button>
            )}
          </div>

          {/* 右: 学校リスト / その他手入力 / 未選択プレースホルダ */}
          <div>
            {!selectedPref && (
              <div className="flex h-80 items-center justify-center rounded-2xl border border-gray-100 text-sm text-gray-400">
                まず都道府県を選んでください
              </div>
            )}

            {selectedPref && !otherMode && (
              <>
                <label className="mb-1 block text-xs text-gray-500">
                  学校名（{currentCount}校から一部入力で絞り込み）
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedSchool(null);
                  }}
                  placeholder="例：青山、学院、市立..."
                  className="mb-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                />

                {loadingSchools ? (
                  <p className="py-4 text-center text-xs text-gray-400">
                    読み込み中...
                  </p>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto rounded-xl border border-gray-100">
                    {filtered.length === 0 ? (
                      <p className="px-4 py-8 text-center text-xs text-gray-400">
                        該当する学校がありません
                      </p>
                    ) : (
                      filtered.map((s) => (
                        <button
                          key={s.code}
                          onClick={() => setSelectedSchool(s)}
                          className={`block w-full border-b border-gray-100 px-4 py-3 text-left text-sm transition-colors last:border-b-0 ${
                            selectedSchool?.code === s.code
                              ? "bg-gray-900 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {s.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}

            {selectedPref && otherMode && (
              <>
                <label className="mb-1 block text-xs text-gray-500">
                  学校名（手入力）
                </label>
                <input
                  type="text"
                  value={otherName}
                  onChange={(e) => setOtherName(e.target.value)}
                  placeholder={
                    schoolType === "junior" ? "○○中学校" : "○○高等学校"
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                />
                <p className="mt-2.5 text-xs text-gray-400">
                  リストに無い学校はこちらに入力してください。
                </p>
              </>
            )}
          </div>
        </div>

        {/* フッターアクションバー（選択中サマリ + 次へ） */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
          <p
            className={`text-sm ${
              canProceed ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {canProceed ? (
              <>
                選択中：
                <strong className="font-semibold">
                  {otherMode ? otherName.trim() : selectedSchool?.name}
                </strong>
              </>
            ) : (
              "学校を選択してください"
            )}
          </p>
          <button
            onClick={proceed}
            disabled={!canProceed}
            className="min-w-[200px] rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
