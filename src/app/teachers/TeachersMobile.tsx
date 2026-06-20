"use client";

import type { ReactNode } from "react";
import {
  HERO,
  SUMMARY_LABEL,
  SUMMARY_POINTS,
  TRUST_BADGES,
  DEVELOPER,
  MailLink,
  SECTIONS,
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
  type Paragraph,
  type ListItem,
  type FaqItem,
  type FaqGroup,
} from "./teachers-content";

/**
 * TeachersMobile.tsx
 *
 * /teachers のスマホ版レイアウト（<1024px 想定・片手縦スクロール最適）。
 * 文言・構造データは teachers-content.tsx を唯一の出所として import し、
 * このファイルは「見た目」のみを付与する。
 *
 * ブランド規約:
 * - box-shadow は使わない。
 * - 疑似要素 (::before/::after) での図形描画は使わない。色帯・ドットは実 <div>/<span>、
 *   面は bg tint、枠は hairline border で表現する。
 *
 * スマホ方針:
 * - 1カラム / max-w-md / 本文 text-sm 下限。
 * - 目次は折りたたみ (details/summary)。
 * - FAQ はアコーディオン (details/summary) でタップ開閉。
 * - CTA は全幅・大きめの押しやすいボタン。
 * - 比較表はカード化して破綻させない。
 */

/* ------------------------------------------------------------------
 * 小さな表示ヘルパー（このレイアウト専用）
 * ------------------------------------------------------------------ */

/** 章見出し（border-l-4 の色帯は実 div ではなく border で表現） */
function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">
      {children}
    </h2>
  );
}

/** 小見出し */
function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
      {children}
    </h3>
  );
}

/** 段落（variant=emphasis は rose tint の強調枠。改行 \n は whitespace-pre-line で保持） */
function Para({ p }: { p: Paragraph }) {
  if (p.variant === "emphasis") {
    return (
      <p className="mb-4 whitespace-pre-line rounded border border-rose-100 bg-rose-50/60 p-4 text-gray-800 [&_code]:rounded [&_code]:bg-rose-100/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.8em] [&_strong]:font-semibold [&_strong]:text-gray-900">
        {p.body}
      </p>
    );
  }
  return (
    <p className="mb-4 whitespace-pre-line [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.8em] [&_strong]:font-semibold [&_strong]:text-gray-900">
      {p.body}
    </p>
  );
}

/** 箇条書き（ul / ol を切り替え。strong を太字化） */
function List({
  items,
  ordered = false,
  small = false,
}: {
  items: ListItem[];
  ordered?: boolean;
  small?: boolean;
}) {
  const cls =
    "mb-4 ml-5 space-y-2 " +
    (ordered ? "list-decimal" : "list-disc") +
    (small ? " text-xs text-gray-700" : "") +
    " [&_strong]:font-semibold [&_strong]:text-gray-900";
  if (ordered) {
    return <ol className={cls}>{items.map((it, i) => <li key={i}>{it.body}</li>)}</ol>;
  }
  return <ul className={cls}>{items.map((it, i) => <li key={i}>{it.body}</li>)}</ul>;
}

/** プレーンテキスト配列の箇条書き */
function PlainList({
  items,
  small = false,
}: {
  items: readonly string[];
  small?: boolean;
}) {
  return (
    <ul
      className={
        "mb-4 ml-5 list-disc space-y-1 " + (small ? "text-xs text-gray-700" : "")
      }
    >
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

const FAQ_DOT: Record<FaqGroup["tone"], string> = {
  trust: "bg-emerald-500",
  howto: "bg-sky-500",
  result: "bg-amber-500",
};

/** FAQ アコーディオン 1 件（details/summary でタップ開閉） */
function FaqAccordion({ item }: { item: FaqItem }) {
  return (
    <details className="group mb-3 rounded border border-gray-200 bg-white open:border-rose-200 open:bg-rose-50/30">
      <summary className="cursor-pointer list-none p-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block text-xs font-bold text-rose-700 transition-transform group-open:rotate-90">
            ▶
          </span>
          <div className="flex-1">
            <p className="mb-1 font-semibold text-gray-900">Q. {item.q}</p>
            <p className="text-xs text-gray-600">{item.short}</p>
          </div>
        </div>
      </summary>
      <div className="border-t border-gray-200 px-4 py-3 text-gray-700 [&_a]:text-rose-700 [&_a]:underline">
        {item.a}
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------
 * メインコンポーネント
 * ------------------------------------------------------------------ */
export default function TeachersMobile() {
  return (
    <article className="mx-auto max-w-md px-4 py-8 text-sm leading-relaxed text-gray-700">
      {/* ヒーロー */}
      <header className="mb-8 border-b border-gray-200 pb-6">
        <p className="mb-2 text-xs font-semibold tracking-widest text-rose-700">
          {HERO.eyebrow}
        </p>
        <h1 className="mb-3 text-2xl font-bold text-gray-900">{HERO.title}</h1>
        <p className="mb-6 whitespace-pre-line text-gray-700">{HERO.lead}</p>

        {/* 要旨 */}
        <div className="mb-6 rounded border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-xs font-semibold tracking-wider text-slate-700">
            {SUMMARY_LABEL}
          </p>
          <ul className="space-y-2 text-sm leading-relaxed text-gray-700 [&_strong]:font-semibold [&_strong]:text-gray-900">
            {SUMMARY_POINTS.map((pt, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="text-rose-600">
                  ●
                </span>
                <span>{pt.body}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 信頼バッジ（スマホは縦積みで改行崩れを防ぐ） */}
        <div className="mb-6 space-y-2">
          {TRUST_BADGES.map((b, i) => (
            <div
              key={i}
              className="flex items-baseline justify-between gap-3 rounded border border-emerald-200 bg-emerald-50 px-4 py-2.5"
            >
              <p className="text-sm font-semibold text-emerald-800">{b.title}</p>
              <p className="text-xs text-emerald-700">{b.note}</p>
            </div>
          ))}
        </div>

        {/* 開発者カード */}
        <div className="rounded border border-gray-200 bg-white p-4 text-xs">
          <p className="mb-1 text-gray-600">
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

      {/* 目次（スマホは折りたたみ） */}
      <details className="mb-10 rounded border border-gray-200 bg-gray-50 open:bg-gray-50">
        <summary className="cursor-pointer list-none p-4 text-xs font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between">
            目次
            <span aria-hidden className="text-gray-500">
              ＋
            </span>
          </span>
        </summary>
        <ol className="space-y-2 border-t border-gray-200 p-4 text-sm">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-rose-700 hover:underline">
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </details>

      {/* 1. なぜこのサービスを作ったか */}
      <section id="why" className="mb-12 scroll-mt-6">
        <SectionHeading>{SECTIONS[0].label}</SectionHeading>

        <H3>{WHY.sub1.heading}</H3>
        {WHY.sub1.paras.map((p, i) => (
          <Para key={i} p={p} />
        ))}

        <H3>{WHY.sub2.heading}</H3>
        {WHY.sub2.paras.map((p, i) => (
          <Para key={i} p={p} />
        ))}

        <H3>{WHY.sub3.heading}</H3>
        <p className="mb-3">{WHY.sub3.intro}</p>
        <List items={WHY.sub3.items} ordered />

        <H3>{WHY.sub4.heading}</H3>
        <p className="mb-3">{WHY.sub4.intro}</p>
        <List items={WHY.sub4.items} />
        <Para p={WHY.sub4.closing} />

        {/* できないこと ボックス */}
        <div className="mt-8 rounded border border-gray-200 bg-gray-50 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-900">
            {WHY_CANNOT.title}
          </p>
          <ul className="ml-4 list-disc space-y-1 text-xs text-gray-700">
            {WHY_CANNOT.items.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-600">{WHY_CANNOT.footer}</p>
        </div>
      </section>

      {/* 2. 開発者について */}
      <section id="developer" className="mb-12 scroll-mt-6">
        <SectionHeading>{SECTIONS[1].label}</SectionHeading>
        <p className="mb-3 font-semibold text-gray-900">{DEVELOPER_SECTION.name}</p>
        <PlainList items={DEVELOPER_SECTION.facts} />
        <H3>{DEVELOPER_SECTION.reasonHeading}</H3>
        {DEVELOPER_SECTION.reasonParas.map((p, i) => (
          <Para key={i} p={p} />
        ))}
      </section>

      {/* 3. 設計の考え方 */}
      <section id="design" className="mb-12 scroll-mt-6">
        <SectionHeading>{DESIGN.heading}</SectionHeading>

        <H3>{DESIGN.modelHeading}</H3>
        {DESIGN.modelParas.map((p, i) => (
          <Para key={i} p={p} />
        ))}

        <H3>{DESIGN.twoModelsHeading}</H3>
        <List items={DESIGN.twoModelsItems} />
        <Para p={DESIGN.twoModelsClosing} />

        <H3>{DESIGN.axesHeading}</H3>
        {DESIGN.axesParas.map((p, i) => (
          <Para key={i} p={p} />
        ))}

        <H3>{DESIGN.questionHeading}</H3>
        <p className="mb-3">{DESIGN.questionIntro}</p>
        <List items={DESIGN.questionItems} />
        <Para p={DESIGN.questionAfter} />
        <Para p={DESIGN.questionPhilosophy} />

        <H3>{DESIGN.versionHeading}</H3>
        <p className="mb-3">{DESIGN.versionIntro}</p>
        <PlainList items={DESIGN.versionItems} />
        <p className="mb-4">{DESIGN.versionAfter}</p>

        <H3>{DESIGN.scoringHeading}</H3>
        <p className="mb-3">{DESIGN.scoringIntro}</p>
        <List items={DESIGN.scoringItems} />
        <Para p={DESIGN.scoringAfter1} />
        <Para p={DESIGN.scoringAfter2} />

        <H3>{DESIGN.departmentsHeading}</H3>
        <p className="mb-3">{DESIGN.departmentsIntro}</p>
        <PlainList items={DESIGN.departmentsCategories} small />
        <p className="mb-4">{DESIGN.departmentsAfter}</p>

        <H3>{DESIGN.axisScoreHeading}</H3>
        <p className="mb-3">{DESIGN.axisScoreIntro}</p>
        <PlainList items={DESIGN.axisScoreTiers} small />
        <Para p={DESIGN.axisScoreAfter} />
        <Para p={DESIGN.axisScoreReason} />

        <H3>{DESIGN.careerHeading}</H3>
        <p className="mb-3">{DESIGN.careerIntro}</p>
        <List items={DESIGN.careerItems} />
        <p className="mb-4">{DESIGN.careerAfter}</p>
        <p className="mb-2 text-sm font-semibold text-gray-900">
          {DESIGN.careerExcludeHeading}
        </p>
        <PlainList items={DESIGN.careerExcludeItems} small />

        <H3>{DESIGN.weekHeading}</H3>
        {DESIGN.weekParas.map((p, i) => (
          <Para key={i} p={p} />
        ))}
        <Para p={DESIGN.weekClosing} />

        <H3>{DESIGN.matchHeading}</H3>
        <List items={DESIGN.matchItems} ordered />
        <p className="mb-4">{DESIGN.matchAfter}</p>
        <Para p={DESIGN.matchClosing} />
      </section>

      {/* 4. データの扱い・プライバシー */}
      <section id="data" className="mb-12 scroll-mt-6">
        <SectionHeading>{SECTIONS[3].label}</SectionHeading>
        <p className="mb-4">{DATA.intro}</p>

        <H3>{DATA.collectedHeading}</H3>
        <PlainList items={DATA.collectedItems} />

        <H3>{DATA.storageHeading}</H3>
        <p className="mb-4">{DATA.storageBody}</p>

        <H3>{DATA.rightsHeading}</H3>
        <p className="mb-3 font-semibold text-gray-900">{DATA.rightsLead}</p>
        <PlainList items={DATA.rightsItems} />

        <H3>{DATA.masterHeading}</H3>
        <p className="mb-4">{DATA.masterBody}</p>
        <p className="mb-4 [&_a]:text-rose-700 [&_a]:underline">{DATA.privacyLink}</p>
      </section>

      {/* 5. 既存サービスとの違い（スマホはカード化） */}
      <section id="compare" className="mb-12 scroll-mt-6">
        <SectionHeading>{SECTIONS[4].label}</SectionHeading>
        <p className="mb-4">{COMPARE.intro}</p>

        <div className="mb-4 space-y-3">
          {COMPARE.rows.map((r, i) => (
            <div key={i} className="rounded border border-gray-200 bg-white p-3">
              <p className="mb-2 text-xs font-semibold text-gray-900">{r.row}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-gray-100 bg-gray-50 p-2">
                  <p className="mb-0.5 text-[10px] font-semibold text-gray-500">
                    {COMPARE.header.existing}
                  </p>
                  <p className="text-gray-700">{r.existing}</p>
                </div>
                <div className="rounded border border-rose-100 bg-rose-50/60 p-2">
                  <p className="mb-0.5 text-[10px] font-semibold text-rose-700">
                    {COMPARE.header.ringmap}
                  </p>
                  <p className="text-gray-800">{r.ringmap}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mb-2 text-xs text-gray-500">{COMPARE.note}</p>
        <p className="mb-4">{COMPARE.closing}</p>
      </section>

      {/* 6. 導入の流れ */}
      <section id="flow" className="mb-12 scroll-mt-6">
        <SectionHeading>{SECTIONS[5].label}</SectionHeading>
        <p className="mb-4 font-semibold text-gray-900">{FLOW.lead}</p>
        <ol className="mb-4 ml-5 list-decimal space-y-3 [&_a]:text-rose-700 [&_a]:underline [&_strong]:font-semibold [&_strong]:text-gray-900">
          {FLOW.steps.map((s, i) => (
            <li key={i}>{s.body}</li>
          ))}
        </ol>

        {/* 中段 CTA（全幅ボタン） */}
        <div className="mt-8 rounded border border-rose-200 bg-rose-50 p-5 text-center">
          <p className="mb-3 text-sm font-semibold text-gray-900">
            {MID_CTA.title}
          </p>
          <p className="mb-4 text-xs leading-relaxed text-gray-700">
            {MID_CTA.body}
          </p>
          <a
            href={MID_CTA.buttonHref}
            className="block w-full rounded bg-rose-700 px-5 py-3.5 text-center text-sm font-semibold text-white hover:bg-rose-800"
          >
            {MID_CTA.buttonLabel}
          </a>
          <p className="mt-3 text-[11px] text-gray-500">{MID_CTA.emailNote}</p>
        </div>
      </section>

      {/* 7. 将来の有料オプション */}
      <section id="paid" className="mb-12 scroll-mt-6">
        <SectionHeading>{SECTIONS[6].label}</SectionHeading>
        {PAID.intro.map((p, i) => (
          <Para key={i} p={p} />
        ))}

        <H3>{PAID.standardHeading}</H3>
        <List items={PAID.standardItems} />

        <H3>{PAID.proHeading}</H3>
        {PAID.proParas.map((p, i) => (
          <Para key={i} p={p} />
        ))}

        {/* 大学別カスタマイズプラン（特定大学専用）。rose tint のカードで区別
            （box-shadow/疑似要素は使わず border＋bg tint）。 */}
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50/60 p-4 [&_strong]:font-semibold [&_strong]:text-gray-900">
          <h3 className="mb-2 text-sm font-semibold text-rose-900">
            {PAID.customHeading}
          </h3>
          {PAID.customParas.map((p, i) => (
            <Para key={i} p={p} />
          ))}
        </div>
      </section>

      {/* 8. よくある質問（アコーディオン） */}
      <section id="faq" className="mb-12 scroll-mt-6">
        <SectionHeading>{SECTIONS[7].label}</SectionHeading>
        <p className="mb-6 text-xs text-gray-500">{FAQ_INTRO}</p>

        {FAQ_GROUPS.map((group) => (
          <div key={group.tone} className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <span
                aria-hidden
                className={
                  "inline-block h-2 w-2 rounded-full " + FAQ_DOT[group.tone]
                }
              ></span>
              <h3 className="text-sm font-semibold text-gray-900">
                {group.title}
              </h3>
            </div>
            {group.items.map((item, i) => (
              <FaqAccordion key={i} item={item} />
            ))}
          </div>
        ))}
      </section>

      {/* 9. お問い合わせ */}
      <section id="contact" className="mb-12 scroll-mt-6">
        <SectionHeading>{SECTIONS[8].label}</SectionHeading>
        <p className="mb-4">{CONTACT.intro}</p>
        <div className="mb-6 rounded border border-rose-100 bg-rose-50/50 p-5">
          <p className="mb-2 text-xs text-gray-600">
            <span className="font-semibold text-gray-900">
              {CONTACT.cardDeveloperLabel}
            </span>
            {CONTACT.cardDeveloper}
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-gray-900">
              {CONTACT.cardEmailLabel}
            </span>
            <a href={`mailto:${CONTACT.email}`} className="text-rose-700 underline">
              {CONTACT.email}
            </a>
          </p>
        </div>
        <a
          href={CONTACT.buttonHref}
          className="block w-full rounded bg-rose-700 px-5 py-3.5 text-center text-sm font-semibold text-white hover:bg-rose-800"
        >
          {CONTACT.buttonLabel}
        </a>
      </section>

      <BackToTopLink className="mt-12 inline-block text-xs text-gray-500 underline" />
    </article>
  );
}
