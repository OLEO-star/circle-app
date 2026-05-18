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
