"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AnimatedRing from "@/components/AnimatedRing";
import RingIcon from "@/components/RingIcon";

// ============================================================================
// ring-map.com トップ = 先生向け玄関（ランディング）。2026-06-19 新設。
//
// 設計の根拠（UXの4ステージ議論・secretary/notes/2026-06-19-decisions.md）:
//   配布QRは /s（学校モード）＝生徒は素のルートを叩かない。素の ring-map.com に
//   来るのは「X・電話・口コミで聞いて検索/直打ちした"評価モードの先生"」。よって
//   ルートは先生（買い手）向けの玄関にする。生徒は下の「個人で診断する」で /start へ。
//
// 本質メッセージ（教員ニーズ×説得心理ワークフローで導出・オーナー確定）:
//   主役＝「データ主権」＝生徒の回答が御校所有のスプレッドシートに生のまま残る。
//   全レンズが「データ所有＝この層を動かす唯一無二の決定打」に収斂（自律性・継続性
//   不安の打ち消し・責任回避を所有の構造で同時に外す）。無料・個人情報・継続性・
//   個人開発はヒーロー一文では盛らず、要旨ボックス／信頼バッジに降ろす（盛ると逆に
//   "裏があるのでは"と警戒されるため）。誇張ゼロ・媚びを捨てる方針。
//
// 個人情報の表現は事実に厳密化:「運営側のマスタには個人を特定できる情報を残さない」
//   （学校別シートにはクラス・出席番号が残るため「持たない」と言い切らない）。
//
// ブランド規約: box-shadow / 疑似要素の図形描画は不使用（hairline border + 実要素）。
//   AnimatedRing(canvas) は二重生成回避のため 1 つだけレンダーし、サイズだけ isDesktop で変える。
// ============================================================================

const CONTACT_MAIL = "info@ring-map.com";

export default function Landing() {
  const router = useRouter();
  // PC版（≥1024px / lg）かどうか。canvas 二重生成を避けるため AnimatedRing は 1 つだけ置き、
  // サイズだけここで変える（レイアウトは Tailwind の responsive クラスで吸収）。
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const ringSize = isDesktop ? 240 : 196;

  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-dvh bg-white text-gray-900">
      {/* ロゴ行 */}
      <header className="mx-auto flex max-w-3xl items-center gap-3 px-6 pt-7">
        <span className="inline-flex shrink-0">
          <RingIcon size={24} />
        </span>
        <span className="text-lg font-bold tracking-tight">ring-map</span>
        <span className="text-xs text-gray-400">学部診断</span>
      </header>

      {/* ヒーロー */}
      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-4 pt-8 text-center">
        <AnimatedRing version="mixed" size={ringSize} showLabels={false} />

        <h1 className="mt-7 text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">
          生徒の回答は、
          <br className="sm:hidden" />
          御校のスプレッドシートに
          <br />
          そのまま残ります。
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-600">
          45〜66問・22軸で生徒の興味を可視化する進路診断です。
          加工レポートではなく生データなので、面談にも進路会議にも、
          御校がそのままお使いいただけます。
        </p>

        {/* 信頼バッジ3（恐怖＝無料の裏／個人情報／は煽らず"見れば分かる"形で先回りで外す） */}
        <div className="mt-7 grid w-full max-w-lg grid-cols-3 gap-2.5">
          {[
            { t: "永続無料", s: "導入費・運用費 0円" },
            { t: "データは御校所有", s: "削除依頼で即時対応" },
            { t: "個人特定情報なし", s: "運営マスタに残さない" },
          ].map((b) => (
            <div
              key={b.t}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-3 text-center"
            >
              <p className="text-[11px] font-semibold text-emerald-800">{b.t}</p>
              <p className="mt-0.5 text-[9px] leading-tight text-emerald-700">
                {b.s}
              </p>
            </div>
          ))}
        </div>

        {/* 主CTA 2つ（先生＝デモで出力を即見る／生徒・試したい先生＝個人で診断） */}
        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <button
            onClick={scrollToDemo}
            className="flex-1 rounded-full bg-gray-900 py-3.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 active:bg-gray-700"
          >
            診断結果のデモを見る
          </button>
          <button
            onClick={() => router.push("/start")}
            className="flex-1 rounded-full border border-gray-300 bg-white py-3.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 active:bg-gray-50"
          >
            個人で診断する
          </button>
        </div>

        {/* 副リンク（テキストリンク級の軽さ） */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
          <Link
            href="/teachers"
            className="font-medium text-gray-600 underline underline-offset-2 hover:text-gray-900"
          >
            先生・学校の方へ（詳しく）
          </Link>
          <a
            href={`mailto:${CONTACT_MAIL}`}
            className="font-medium text-gray-600 underline underline-offset-2 hover:text-gray-900"
          >
            導入を相談する
          </a>
        </div>
      </section>

      {/* 要旨ボックス（恐怖4つ＝無料の裏／個人情報／継続性／個人開発 を事実で外す） */}
      <section className="mx-auto max-w-2xl px-6 py-8">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="mb-3 text-xs font-semibold tracking-wider text-slate-700">
            要旨
          </p>
          <ul className="space-y-2 text-xs leading-relaxed text-gray-700">
            <li className="flex gap-2">
              <span className="text-rose-600">●</span>
              <span>
                約45〜66問（学部選択により異なる）の質問で、生徒の興味を{" "}
                <strong>22軸 × 36学科</strong>{" "}
                のリングで可視化する無料の進路診断ツールです
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-rose-600">●</span>
              <span>
                回答データは{" "}
                <strong>御校所有の Google スプレッドシート</strong>{" "}
                に学年 → クラス → 出席番号順で自動で整い、進路面談・進路会議の判断材料になります
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-rose-600">●</span>
              <span>
                運営側のマスタには{" "}
                <strong>個人を特定できる情報を残しません</strong>
                。万一サービスを終了する場合も、データは御校のスプレッドシートに残ります
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-rose-600">●</span>
              <span>
                現役大学生による個人開発、{" "}
                <strong>基本機能は永続無料</strong>{" "}
                の運営方針です
              </span>
            </li>
          </ul>

          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-xs">
            <p className="mb-1 text-gray-600">
              <span className="font-semibold text-gray-900">開発者：</span>
              平井 壱城（東京理科大学 理学部第一部 応用化学科 3年）
            </p>
            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">連絡先：</span>
              <a
                href={`mailto:${CONTACT_MAIL}`}
                className="text-rose-700 underline"
              >
                {CONTACT_MAIL}
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* 診断結果のデモ（玄関の下部にインラインで“触れる”形）。同一オリジンの結果ページを
          生 iframe で埋め込む（XFO は SAMEORIGIN に緩和済・他サイトからの埋め込みは不可）。
          ?demo=mixed なのでデータ送信なし。iframe 内の matchMedia は iframe 自身の幅で
          評価されるので、広い枠＝PC版・狭い枠＝スマホ版の結果がそのまま描画される。
          ScaledFrame で実幅に合わせて縮小（スクロール・タップは生きたまま）。 */}
      <section id="demo" className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="text-center text-xl font-bold text-gray-900">
          診断結果のデモ
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm leading-relaxed text-gray-600">
          生徒が答えると、こんな結果が出ます。下の画面はそのまま動きます——
          スクロールしたり、気になる学科をタップして詳しく見られます。
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-10 lg:flex-row lg:items-start">
          {/* PC版（広い枠＝結果が PC レイアウトで描画） */}
          <div className="w-full lg:flex-1">
            <p className="mb-2 text-center text-xs font-medium text-gray-500">
              PC版
            </p>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <ScaledFrame
                src="/result?demo=mixed"
                w={1180}
                displayHeight={560}
                title="診断結果デモ（PC版）"
              />
            </div>
          </div>

          {/* スマホ版（狭い枠＝結果が スマホ レイアウトで描画） */}
          <div className="w-[280px] shrink-0">
            <p className="mb-2 text-center text-xs font-medium text-gray-500">
              スマホ版
            </p>
            <div className="overflow-hidden rounded-[1.75rem] border-[6px] border-gray-200 bg-white">
              <ScaledFrame
                src="/result?demo=mixed"
                w={390}
                displayHeight={560}
                title="診断結果デモ（スマホ版）"
              />
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] text-gray-400">
          サンプルデータの結果です（このデモではデータは送信されません）
        </p>
      </section>

      {/* フッター */}
      <footer className="mx-auto max-w-3xl px-6 pb-10 pt-2">
        <div className="flex justify-center gap-5 text-[10px] text-gray-400">
          <Link href="/teachers" className="hover:text-gray-600">
            教員の皆様へ
          </Link>
          <Link href="/terms" className="hover:text-gray-600">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:text-gray-600">
            プライバシーポリシー
          </Link>
        </div>
      </footer>
    </div>
  );
}

// 同一オリジンの結果ページを“縮小して埋め込む”インタラクティブプレビュー。
// iframe を論理サイズ(w×h)で描かせ、枠の実幅に合わせて transform:scale で縮小する
// （CSS transform はクリック判定・内部スクロールを保つ＝触れるまま縮む）。
// iframe 内の matchMedia は iframe 自身の幅(w)で評価されるので、w=1180→PC版／
// w=390→スマホ版の結果がそのまま出る。loading="lazy" で可視域に入るまで読み込まない。
function ScaledFrame({
  src,
  w,
  displayHeight,
  title,
}: {
  src: string;
  w: number;
  displayHeight: number; // 枠の表示高さ(px)。PC版/スマホ版で同値にすると縦が揃う。
  title: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setScale(el.clientWidth / w);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);

  // 枠の高さは displayHeight 固定（両版で揃える）。iframe の論理高さは scale で逆算し、
  // displayHeight に収まる分だけ結果ページを見せる（幅は列いっぱいに広がる）。
  const logicalH = scale
    ? Math.round(displayHeight / scale)
    : Math.round(displayHeight * 2);

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden"
      style={{ height: displayHeight }}
    >
      <iframe
        src={src}
        title={title}
        loading="lazy"
        width={w}
        height={logicalH}
        className="origin-top-left border-0"
        style={{ transform: `scale(${scale || 0.5})` }}
      />
    </div>
  );
}
