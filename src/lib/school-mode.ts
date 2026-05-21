// 学校配布モード状態管理。
// 個人モードと学校モードを localStorage で切り替え、診断完了時の送信先を分岐する。
// /s から入った生徒だけ学校情報を持ち、/quiz・/result では mode を読んで挙動を変える。

export type SchoolType = "junior" | "high";

export type SchoolInfo = {
  code: string; // 文科省学校コード13桁、またはフォールバック "OTHER_<手入力名>"
  name: string;
  pref: string; // 都道府県コード "01"〜"47"
  schoolType: SchoolType; // 中学(C1)/高校(D1) の区別
};

export type StudentInfo = {
  grade: string; // "1" | "2" | "3"
  klass: string; // 自由入力（"A" "1組" "理系1" 等）
  number: string; // 出席番号
};

const KEYS = {
  mode: "schoolMode",
  code: "schoolCode",
  name: "schoolName",
  pref: "schoolPref",
  schoolType: "schoolType",
  grade: "studentGrade",
  klass: "studentClass",
  number: "studentNumber",
  age: "studentAge",
} as const;

// 個人モードでも使う独立の年齢ストア。学校モードでは grade があるので不要だが、
// 個人モードからのデータも年齢層で集計したいので localStorage に保持する。
export function setStudentAge(age: string): void {
  if (age) localStorage.setItem(KEYS.age, age);
  else localStorage.removeItem(KEYS.age);
}

export function getStudentAge(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEYS.age) ?? "";
}

// 希望進路（任意・自由入力）。先生が個別生徒の進路指導で「希望と診断結果のズレ」を
// 把握するのに使う。表記揺れがあっても自由入力のメリット（強制せず気軽に書ける）を優先。
const DESIRED_FIELD_KEY = "desiredField";

export function setDesiredField(value: string): void {
  if (value) localStorage.setItem(DESIRED_FIELD_KEY, value);
  else localStorage.removeItem(DESIRED_FIELD_KEY);
}

export function getDesiredField(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(DESIRED_FIELD_KEY) ?? "";
}

export function enableSchoolMode(): void {
  localStorage.setItem(KEYS.mode, "true");
}

export function isSchoolMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEYS.mode) === "true";
}

export function setSchoolInfo(info: SchoolInfo): void {
  localStorage.setItem(KEYS.code, info.code);
  localStorage.setItem(KEYS.name, info.name);
  localStorage.setItem(KEYS.pref, info.pref);
  localStorage.setItem(KEYS.schoolType, info.schoolType);
}

export function getSchoolInfo(): SchoolInfo | null {
  if (typeof window === "undefined") return null;
  const code = localStorage.getItem(KEYS.code);
  const name = localStorage.getItem(KEYS.name);
  const pref = localStorage.getItem(KEYS.pref);
  const schoolType = localStorage.getItem(KEYS.schoolType) as SchoolType | null;
  if (!code || !name || !pref || !schoolType) return null;
  return { code, name, pref, schoolType };
}

export function setStudentInfo(info: StudentInfo): void {
  localStorage.setItem(KEYS.grade, info.grade);
  localStorage.setItem(KEYS.klass, info.klass);
  localStorage.setItem(KEYS.number, info.number);
}

export function getStudentInfo(): StudentInfo | null {
  if (typeof window === "undefined") return null;
  const grade = localStorage.getItem(KEYS.grade);
  const klass = localStorage.getItem(KEYS.klass);
  const number = localStorage.getItem(KEYS.number);
  if (!grade || !klass || !number) return null;
  return { grade, klass, number };
}

export function clearSchoolMode(): void {
  for (const k of Object.values(KEYS)) localStorage.removeItem(k);
}

export type Prefecture = {
  code: string;
  name: string;
  junior_count: number;
  high_count: number;
};

export type School = {
  code: string;
  name: string;
  type: string; // "1"=国 / "2"=公 / "3"=私
};
