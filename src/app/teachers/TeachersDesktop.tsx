import type { Paragraph } from "./teachers-content";
import {
  HERO,
  SECTIONS,
  SUMMARY_LABEL,
  SUMMARY_POINTS,
  TRUST_BADGES,
  DEVELOPER,
  MailLink,
  WHY,
  WHY_CANNOT,
  DEVELOPER_SECTION,
  DESIGN,
  DATA,
  COMPARE,
  FLOW,
  MID_CTA,
  PAID,
  FAQ_INTRO,
  FAQ_GROUPS,
  CONTACT,
  BackToTopLink,
} from "./teachers-content";

/**
 * TeachersDesktop.tsx
 *
 * /teachers の PC 版（≥1024px）レイアウト。
 * 文言・構造データは teachers-content.tsx から import し、ここでは「見た目」だけを付与する。
 *
 * レイアウト方針:
 * - 左に sticky な目次サイドバー（SECTIONS）＋右に本文の 2 カラム
 *   （grid-cols-[240px_1fr]、max-w-6xl 中央寄せ、広い余白・行間）。
 * - ヒーローの要旨 3 点・信頼バッジ 3 は横並び（横長）で配置。
 * - 比較表はワイドに、FAQ は 2 カラム、導入フローは横ステップ。
 *
 * ブランド規約の順守:
 * - box-shadow 禁止 → border（hairline）＋ bg tint ＋ 実 <div> で面・帯・枠を表現。
 * - 疑似要素(::before/::after)での図形描画禁止 → 色帯・色ドットは実 <div>/<span> として描画。
 *   （<details> の webkit マーカーは list-none / hidden で「消す」だけ＝描画ではないので可。）
 *
 * client/server:
 * - <details>/<summary> のネイティブ開閉のみで JS 不要、next/link は本バージョン(16.2.4)で
 *   server/client 両対応のため "use client" は付けない（client から import しても安全）。
 */

/* FAQ グループの種別 → ドット色（配色はレイアウト側の責務） */
const FAQ_TONE_DOT: Record<string, string> = {
  trust: "bg-emerald-500",
  howto: "bg-sky-500",
  result: "bg-amber-500",
};

/* 強調(emphasis)段落の枠＋tint（box-shadow/疑似要素を使わず border + bg で表現） */
function ParagraphBlock({
  para,
  className = "",
}: {
  para: Paragraph;
  className?: string;
}) {
  if (para.variant === "emphasis") {
    return (
      <p
        className={`whitespace-pre-line rounded-md border border-rose-200 bg-rose-50/60 p-5 leading-relaxed text-gray-800 [&_strong]:font-semibold [&_strong]:text-gray-900 ${className}`}
      >
        {para.body}
      </p>
    );
  }
  return (
    <p
      className={`whitespace-pre-line leading-relaxed text-gray-700 [&_strong]:font-semibold [&_strong]:text-gray-900 ${className}`}
    >
      {para.body}
    </p>
  );
}

/* セクション見出し（h2）：border-l hairline + 余白で階層を明確化 */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 border-l-4 border-rose-600 pl-4 text-2xl font-bold text-slate-900">
      {children}
    </h2>
  );
}

function Heading3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 mt-8 text-lg font-semibold text-gray-900">{children}</h3>
  );
}

export default function TeachersDesktop() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-14 text-[15px] text-gray-700">
      {/* ============================================================
       * ヒーロー（横長レイアウト）
       * ============================================================ */}
      <header className="mb-14 border-b border-gray-200 pb-12">
        <p className="mb-3 text-xs font-semibold tracking-widest text-rose-700">
          {HERO.eyebrow}
        </p>
        <h1 className="mb-5 text-4xl font-bold text-gray-900">{HERO.title}</h1>
        <p className="mb-10 max-w-3xl whitespace-pre-line text-lg leading-relaxed text-gray-700">
          {HERO.lead}
        </p>

        {/* 要旨 3 点 ＋ 信頼バッジ 3：広い画面で横並び 2 カラム */}
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* 要旨 */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
            <p className="mb-4 text-xs font-semibold tracking-wider text-slate-700">
              {SUMMARY_LABEL}
            </p>
            <ul className="space-y-3 text-sm leading-relaxed text-gray-700">
              {SUMMARY_POINTS.map((point, i) => (
                <li key={i} className="flex gap-3">
                  {/* 色ドットは実 <span>（疑似要素を使わない） */}
                  <span
                    aria-hidden
                    className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600"
                  />
                  <span className="[&_strong]:font-semibold [&_strong]:text-gray-900">
                    {point.body}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 信頼バッジ 3：縦並びカード（広い右カラムで読みやすく） */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {TRUST_BADGES.map((badge, i) => (
              <div
                key={i}
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"
              >
                <p className="text-sm font-semibold text-emerald-800">
                  {badge.title}
                </p>
                <p className="mt-1 text-xs text-emerald-700">{badge.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 開発者情報 */}
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-5 text-sm">
          <p className="mb-1.5 text-gray-600">
            <span className="font-semibold text-gray-900">
              {DEVELOPER.labelDeveloper}
            </span>
            {DEVELOPER.affiliation}
          </p>
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">
              {DEVELOPER.labelContact}
            </span>
            <MailLink className="text-rose-700 underline" />
          </p>
        </div>
      </header>

      {/* ============================================================
       * 2 カラム：左 sticky 目次サイドバー + 右 本文
       * ============================================================ */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[240px_1fr]">
        {/* 目次サイドバー */}
        <aside className="hidden lg:block">
          <nav
            aria-label="目次"
            className="sticky top-8 rounded-lg border border-gray-200 bg-gray-50 p-5"
          >
            <p className="mb-3 text-xs font-semibold text-gray-900">目次</p>
            <ol className="space-y-2 text-sm">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block text-rose-700 hover:underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        {/* 本文 */}
        <div className="min-w-0 max-w-3xl">
          {/* ----------------------------------------------------------
           * 1. なぜこのサービスを作ったか
           * ---------------------------------------------------------- */}
          <section id="why" className="mb-16 scroll-mt-8">
            <SectionHeading>{SECTIONS[0].label}</SectionHeading>

            {/* sub1 */}
            <Heading3>{WHY.sub1.heading}</Heading3>
            <div className="space-y-4">
              {WHY.sub1.paras.map((p, i) => (
                <ParagraphBlock key={i} para={p} />
              ))}
            </div>

            {/* sub2 */}
            <Heading3>{WHY.sub2.heading}</Heading3>
            <div className="space-y-4">
              {WHY.sub2.paras.map((p, i) => (
                <ParagraphBlock key={i} para={p} />
              ))}
            </div>

            {/* sub3 */}
            <Heading3>{WHY.sub3.heading}</Heading3>
            <p className="mb-3 leading-relaxed">{WHY.sub3.intro}</p>
            <ol className="ml-6 list-decimal space-y-2 leading-relaxed [&_strong]:font-semibold [&_strong]:text-gray-900">
              {WHY.sub3.items.map((item, i) => (
                <li key={i}>{item.body}</li>
              ))}
            </ol>

            {/* sub4 */}
            <Heading3>{WHY.sub4.heading}</Heading3>
            <p className="mb-3 leading-relaxed">{WHY.sub4.intro}</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed [&_strong]:font-semibold [&_strong]:text-gray-900">
              {WHY.sub4.items.map((item, i) => (
                <li key={i}>{item.body}</li>
              ))}
            </ul>
            <ParagraphBlock para={WHY.sub4.closing} className="mt-5" />

            {/* できないこと ボックス */}
            <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
              <p className="mb-3 text-base font-semibold text-gray-900">
                {WHY_CANNOT.title}
              </p>
              <ul className="ml-5 list-disc space-y-1.5 text-sm text-gray-700">
                {WHY_CANNOT.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-gray-600">{WHY_CANNOT.footer}</p>
            </div>
          </section>

          {/* ----------------------------------------------------------
           * 2. 開発者について
           * ---------------------------------------------------------- */}
          <section id="developer" className="mb-16 scroll-mt-8">
            <SectionHeading>{SECTIONS[1].label}</SectionHeading>
            <p className="mb-3 text-base font-semibold text-gray-900">
              {DEVELOPER_SECTION.name}
            </p>
            <ul className="mb-5 ml-6 list-disc space-y-1 leading-relaxed">
              {DEVELOPER_SECTION.facts.map((fact, i) => (
                <li key={i}>{fact}</li>
              ))}
            </ul>
            <p className="mb-4 text-base font-semibold text-gray-900">
              {DEVELOPER_SECTION.reasonHeading}
            </p>
            <div className="space-y-4">
              {DEVELOPER_SECTION.reasonParas.map((p, i) => (
                <ParagraphBlock key={i} para={p} />
              ))}
            </div>
          </section>

          {/* ----------------------------------------------------------
           * 3. 設計の考え方
           * ---------------------------------------------------------- */}
          <section id="design" className="mb-16 scroll-mt-8">
            <SectionHeading>{DESIGN.heading}</SectionHeading>

            {/* 基盤となる心理学モデル */}
            <Heading3>{DESIGN.modelHeading}</Heading3>
            <div className="space-y-4">
              {DESIGN.modelParas.map((p, i) => (
                <ParagraphBlock key={i} para={p} />
              ))}
            </div>

            {/* 採用した 2 つの心理学モデル */}
            <Heading3>{DESIGN.twoModelsHeading}</Heading3>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed [&_strong]:font-semibold [&_strong]:text-gray-900">
              {DESIGN.twoModelsItems.map((item, i) => (
                <li key={i}>{item.body}</li>
              ))}
            </ul>
            <ParagraphBlock para={DESIGN.twoModelsClosing} className="mt-4" />

            {/* 22 軸の作り方 */}
            <Heading3>{DESIGN.axesHeading}</Heading3>
            <div className="space-y-4">
              {DESIGN.axesParas.map((p, i) => (
                <ParagraphBlock key={i} para={p} />
              ))}
            </div>

            {/* 質問の設計方針 */}
            <Heading3>{DESIGN.questionHeading}</Heading3>
            <p className="mb-3 leading-relaxed">{DESIGN.questionIntro}</p>
            <ul className="ml-6 list-disc space-y-1.5 leading-relaxed [&_strong]:font-semibold [&_strong]:text-gray-900">
              {DESIGN.questionItems.map((item, i) => (
                <li key={i}>{item.body}</li>
              ))}
            </ul>
            <ParagraphBlock para={DESIGN.questionAfter} className="mt-4" />
            <ParagraphBlock para={DESIGN.questionPhilosophy} className="mt-4" />

            {/* バージョンと質問数 */}
            <Heading3>{DESIGN.versionHeading}</Heading3>
            <p className="mb-3 leading-relaxed">{DESIGN.versionIntro}</p>
            <ul className="ml-6 list-disc space-y-1 leading-relaxed">
              {DESIGN.versionItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p className="mt-3 leading-relaxed">{DESIGN.versionAfter}</p>

            {/* スコアリングの仕組み */}
            <Heading3>{DESIGN.scoringHeading}</Heading3>
            <p className="mb-3 leading-relaxed">{DESIGN.scoringIntro}</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed [&_strong]:font-semibold [&_strong]:text-gray-900">
              {DESIGN.scoringItems.map((item, i) => (
                <li key={i}>{item.body}</li>
              ))}
            </ul>
            <ParagraphBlock para={DESIGN.scoringAfter1} className="mt-4" />
            {/* code 要素を含む段落：インラインコードに見た目を付与 */}
            <ParagraphBlock
              para={DESIGN.scoringAfter2}
              className="mt-4 [&_code]:mx-1 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm"
            />

            {/* 36 学科の選び方 */}
            <Heading3>{DESIGN.departmentsHeading}</Heading3>
            <p className="mb-3 leading-relaxed">{DESIGN.departmentsIntro}</p>
            {/* 広い画面ではカテゴリを多列で（横長活用） */}
            <ul className="ml-6 grid list-disc grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-3">
              {DESIGN.departmentsCategories.map((cat, i) => (
                <li key={i}>{cat}</li>
              ))}
            </ul>
            <p className="mt-3 leading-relaxed">{DESIGN.departmentsAfter}</p>

            {/* 学科の軸スコアの決め方 */}
            <Heading3>{DESIGN.axisScoreHeading}</Heading3>
            <p className="mb-3 leading-relaxed">{DESIGN.axisScoreIntro}</p>
            <ul className="ml-6 grid list-disc grid-cols-1 gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
              {DESIGN.axisScoreTiers.map((tier, i) => (
                <li key={i}>{tier}</li>
              ))}
            </ul>
            <ParagraphBlock para={DESIGN.axisScoreAfter} className="mt-4" />
            <ParagraphBlock para={DESIGN.axisScoreReason} className="mt-4" />

            {/* 主な進路の作り方 */}
            <Heading3>{DESIGN.careerHeading}</Heading3>
            <p className="mb-3 leading-relaxed">{DESIGN.careerIntro}</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed [&_strong]:font-semibold [&_strong]:text-gray-900">
              {DESIGN.careerItems.map((item, i) => (
                <li key={i}>{item.body}</li>
              ))}
            </ul>
            <p className="mt-3 leading-relaxed">{DESIGN.careerAfter}</p>
            <p className="mb-3 mt-4 font-semibold text-gray-900">
              {DESIGN.careerExcludeHeading}
            </p>
            <ul className="ml-6 list-disc space-y-1 text-sm leading-relaxed">
              {DESIGN.careerExcludeItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            {/* 1 週間の流れ */}
            <Heading3>{DESIGN.weekHeading}</Heading3>
            <div className="space-y-4">
              {DESIGN.weekParas.map((p, i) => (
                <ParagraphBlock key={i} para={p} />
              ))}
            </div>
            <ParagraphBlock para={DESIGN.weekClosing} className="mt-4" />

            {/* マッチングロジック */}
            <Heading3>{DESIGN.matchHeading}</Heading3>
            <ol className="ml-6 list-decimal space-y-1.5 leading-relaxed">
              {DESIGN.matchItems.map((item, i) => (
                <li key={i}>{item.body}</li>
              ))}
            </ol>
            <p className="mt-3 leading-relaxed">{DESIGN.matchAfter}</p>
            <ParagraphBlock para={DESIGN.matchClosing} className="mt-5" />
          </section>

          {/* ----------------------------------------------------------
           * 4. データの扱い・プライバシー
           * ---------------------------------------------------------- */}
          <section id="data" className="mb-16 scroll-mt-8">
            <SectionHeading>{SECTIONS[3].label}</SectionHeading>
            <p className="mb-4 leading-relaxed">{DATA.intro}</p>

            <Heading3>{DATA.collectedHeading}</Heading3>
            <ul className="ml-6 grid list-disc grid-cols-1 gap-x-8 gap-y-1 leading-relaxed sm:grid-cols-2">
              {DATA.collectedItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <Heading3>{DATA.storageHeading}</Heading3>
            <p className="leading-relaxed">{DATA.storageBody}</p>

            <Heading3>{DATA.rightsHeading}</Heading3>
            <p className="mb-3 font-semibold text-gray-900">{DATA.rightsLead}</p>
            <ul className="ml-6 list-disc space-y-1 leading-relaxed">
              {DATA.rightsItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <Heading3>{DATA.masterHeading}</Heading3>
            <p className="mb-4 leading-relaxed">{DATA.masterBody}</p>
            <p className="leading-relaxed [&_a]:text-rose-700 [&_a]:underline">
              {DATA.privacyLink}
            </p>
          </section>

          {/* ----------------------------------------------------------
           * 5. 既存サービスとの違い（ワイド比較表）
           * ---------------------------------------------------------- */}
          <section id="compare" className="mb-16 scroll-mt-8">
            <SectionHeading>{SECTIONS[4].label}</SectionHeading>
            <p className="mb-5 leading-relaxed">{COMPARE.intro}</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 text-left">
                    <th className="py-3 pr-4 font-semibold text-gray-900">
                      {COMPARE.header.label}
                    </th>
                    <th className="py-3 pr-4 font-semibold text-gray-900">
                      {COMPARE.header.existing}
                    </th>
                    <th className="py-3 font-semibold text-rose-700">
                      {COMPARE.header.ringmap}
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {COMPARE.rows.map((r, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-3 pr-4 font-semibold text-gray-900">
                        {r.row}
                      </td>
                      <td className="py-3 pr-4">{r.existing}</td>
                      <td className="bg-rose-50/40 py-3 font-medium text-gray-900">
                        {r.ringmap}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mb-4 mt-3 text-sm text-gray-500">{COMPARE.note}</p>
            <p className="leading-relaxed">{COMPARE.closing}</p>
          </section>

          {/* ----------------------------------------------------------
           * 6. 導入の流れ（横ステップ風）
           * ---------------------------------------------------------- */}
          <section id="flow" className="mb-16 scroll-mt-8">
            <SectionHeading>{SECTIONS[5].label}</SectionHeading>
            <p className="mb-5 font-semibold text-gray-900">{FLOW.lead}</p>
            {/* 番号付きステップ：番号を実 <div> のチップで描画（疑似要素を使わない） */}
            <ol className="space-y-3">
              {FLOW.steps.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-sm font-bold text-rose-700"
                  >
                    {i + 1}
                  </div>
                  <div className="leading-relaxed [&_a]:text-rose-700 [&_a]:underline [&_strong]:font-semibold [&_strong]:text-gray-900">
                    {step.body}
                  </div>
                </li>
              ))}
            </ol>

            {/* 中段 CTA */}
            <div className="mt-10 rounded-lg border border-rose-200 bg-rose-50 p-8 text-center">
              <p className="mb-3 text-lg font-semibold text-gray-900">
                {MID_CTA.title}
              </p>
              <p className="mb-5 text-sm leading-relaxed text-gray-700">
                {MID_CTA.body}
              </p>
              <a
                href={MID_CTA.buttonHref}
                className="inline-block rounded-md bg-rose-700 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-800"
              >
                {MID_CTA.buttonLabel}
              </a>
              <p className="mt-3 text-xs text-gray-500">{MID_CTA.emailNote}</p>
            </div>
          </section>

          {/* ----------------------------------------------------------
           * 7. 将来の有料オプション
           * ---------------------------------------------------------- */}
          <section id="paid" className="mb-16 scroll-mt-8">
            <SectionHeading>{SECTIONS[6].label}</SectionHeading>
            <div className="space-y-4">
              {PAID.intro.map((p, i) => (
                <ParagraphBlock key={i} para={p} />
              ))}
            </div>

            {/* Standard / Pro を広い画面では 2 カラムに */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                <h3 className="mb-4 text-base font-semibold text-gray-900">
                  {PAID.standardHeading}
                </h3>
                <ul className="ml-5 list-disc space-y-2 leading-relaxed [&_strong]:font-semibold [&_strong]:text-gray-900">
                  {PAID.standardItems.map((item, i) => (
                    <li key={i}>{item.body}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                <h3 className="mb-4 text-base font-semibold text-gray-900">
                  {PAID.proHeading}
                </h3>
                <div className="space-y-4">
                  {PAID.proParas.map((p, i) => (
                    <ParagraphBlock key={i} para={p} />
                  ))}
                </div>
              </div>
            </div>

            {/* 大学別カスタマイズプラン（特定大学専用＝本命オプション）。全幅・rose tint で
                Standard/Pro と差別化（box-shadow/疑似要素は使わず border＋bg tint）。 */}
            <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50/60 p-6">
              <h3 className="mb-4 text-base font-semibold text-rose-900">
                {PAID.customHeading}
              </h3>
              <div className="space-y-4 [&_strong]:font-semibold [&_strong]:text-gray-900">
                {PAID.customParas.map((p, i) => (
                  <ParagraphBlock key={i} para={p} />
                ))}
              </div>
            </div>
          </section>

          {/* ----------------------------------------------------------
           * 8. よくある質問（2 カラム配置）
           * ---------------------------------------------------------- */}
          <section id="faq" className="mb-16 scroll-mt-8">
            <SectionHeading>{SECTIONS[7].label}</SectionHeading>
            <p className="mb-6 text-sm text-gray-500">{FAQ_INTRO}</p>

            <div className="space-y-10">
              {FAQ_GROUPS.map((group) => (
                <div key={group.tone}>
                  <div className="mb-4 flex items-center gap-2">
                    {/* 種別 → ドット色（実 <span>） */}
                    <span
                      aria-hidden
                      className={`inline-block h-2.5 w-2.5 rounded-full ${
                        FAQ_TONE_DOT[group.tone] ?? "bg-gray-400"
                      }`}
                    />
                    <h3 className="text-base font-semibold text-gray-900">
                      {group.title}
                    </h3>
                  </div>
                  {/* 広い画面では FAQ を 2 カラム */}
                  <div className="grid gap-3 lg:grid-cols-2">
                    {group.items.map((item, i) => (
                      <details
                        key={i}
                        className="group rounded-lg border border-gray-200 bg-white open:border-rose-200 open:bg-rose-50/30"
                      >
                        <summary className="cursor-pointer list-none p-4 [&::-webkit-details-marker]:hidden">
                          <div className="flex items-start gap-3">
                            {/* 開閉インジケータは実テキスト（疑似要素ではない） */}
                            <span
                              aria-hidden
                              className="mt-0.5 inline-block text-xs font-bold text-rose-700 transition-transform group-open:rotate-90"
                            >
                              ▶
                            </span>
                            <div className="flex-1">
                              <p className="mb-1 font-semibold text-gray-900">
                                Q. {item.q}
                              </p>
                              <p className="text-sm text-gray-600">
                                {item.short}
                              </p>
                            </div>
                          </div>
                        </summary>
                        <div className="border-t border-gray-200 px-4 py-3 pl-11 text-sm leading-relaxed text-gray-700 [&_a]:text-rose-700 [&_a]:underline">
                          {item.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ----------------------------------------------------------
           * 9. お問い合わせ
           * ---------------------------------------------------------- */}
          <section id="contact" className="mb-12 scroll-mt-8">
            <SectionHeading>{SECTIONS[8].label}</SectionHeading>
            <p className="mb-5 leading-relaxed">{CONTACT.intro}</p>
            <div className="mb-6 rounded-lg border border-rose-100 bg-rose-50/50 p-6">
              <p className="mb-2 text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  {CONTACT.cardDeveloperLabel}
                </span>
                {CONTACT.cardDeveloper}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  {CONTACT.cardEmailLabel}
                </span>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="text-rose-700 underline"
                >
                  {CONTACT.email}
                </a>
              </p>
            </div>
            <a
              href={CONTACT.buttonHref}
              className="inline-block rounded-md bg-rose-700 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-800"
            >
              {CONTACT.buttonLabel}
            </a>
          </section>

          <BackToTopLink className="mt-12 inline-block text-sm text-gray-500 underline" />
        </div>
      </div>
    </div>
  );
}
