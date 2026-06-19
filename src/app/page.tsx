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

  const ringSize = isDesktop ? 300 : 200;

  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-dvh bg-white text-gray-900">
      {/* ロゴ行 */}
      <header className="mx-auto flex max-w-5xl items-center gap-3 px-6 pt-7">
        <span className="inline-flex shrink-0">
          <RingIcon size={24} />
        </span>
        <span className="text-lg font-bold tracking-tight">ring-map</span>
        <span className="text-xs text-gray-400">学部診断</span>
      </header>

      {/* ヒーロー。PC は 2カラム（リング｜コピー）で画面幅を使う。モバイルは縦積み中央。
          AnimatedRing(canvas) は二重生成回避のため1つだけレンダー。 */}
      <section className="mx-auto max-w-5xl px-6 pb-6 pt-8">
        <div className="flex flex-col items-center gap-8 text-center lg:flex-row lg:items-center lg:gap-16 lg:text-left">
          {/* 左：揺らぐリング */}
          <div className="flex shrink-0 justify-center">
            <AnimatedRing version="mixed" size={ringSize} showLabels={false} />
          </div>

          {/* 右：コピー */}
          <div className="flex w-full flex-col items-center lg:items-start">
            <h1 className="text-2xl font-bold leading-snug text-gray-900 sm:text-3xl lg:text-4xl">
              生徒の回答は、
              <br />
              御校のスプレッドシートに
              <br />
              そのまま残ります。
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
              45〜66問・22軸で生徒の興味を可視化する進路診断です。
              加工レポートではなく生データなので、面談にも進路会議にも、
              御校がそのままお使いいただけます。
            </p>

            {/* 信頼バッジ3（文字を読める大きさに） */}
            <div className="mt-7 grid w-full max-w-xl grid-cols-3 gap-2.5">
              {[
                { t: "永続無料", s: "導入費・運用費 0円" },
                { t: "データは御校所有", s: "削除依頼で即時対応" },
                { t: "個人特定情報なし", s: "運営マスタに残さない" },
              ].map((b) => (
                <div
                  key={b.t}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-3 text-center"
                >
                  <p className="text-xs font-semibold text-emerald-800">{b.t}</p>
                  <p className="mt-0.5 text-[10px] leading-tight text-emerald-700">
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
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs lg:justify-start">
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
          </div>
        </div>
      </section>

      {/* 価値提案ブロック（マーケ改修・2026-06-20）。旧「要旨の小さい灰色●箇条書き」を撤去し、
          先生が"何のツールか＋仕事がどう楽になるか"を3秒で拾える4層階層へ。
          無料/データ主権/個人情報の再宣言はヒーローのバッジに集約済み＝ここでは二重看板にしない。
          本文最小14px・見出し20〜24px。box-shadow/疑似要素は不可（border＋実div色帯＋bg tint）。
          設計＝マーケ設計×敵対的批評ワークフロー(2026-06-20)の確定スペック。 */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        {/* 0) 小ラベル＝何のツールか（事務語「要旨」を置かない） */}
        <p className="mb-2 text-sm font-semibold tracking-wider text-emerald-800">
          先生の手元に残る進路診断｜22軸
        </p>

        {/* 1) 主役見出し（便益・動詞文）＋サブ */}
        <h2 className="text-xl font-bold leading-snug text-gray-900 sm:text-2xl">
          面談の前に、その生徒の回答が並んだ御校のシートを開くだけ。
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
          生徒の興味を22軸で見える化する進路診断です。回答は学年 → クラス → 出席番号の順に
          御校のスプレッドシートへ自動で並ぶので、面談の資料も進路会議の名簿も、
          並べ替えから始めずに済みます。
        </p>

        {/* 2) 実演カード2枚（工程削減／御校に残る継続性）。左に実div色帯・面はtint・枠はhairline。 */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
            <div
              className="w-1 shrink-0 rounded-full bg-emerald-600"
              aria-hidden="true"
            />
            <div>
              <p className="text-base font-semibold text-gray-900">
                担任ごとの抜き出し・並べ替えが要らない
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                回答は最初から学年 → クラス → 出席番号の順に御校のスプレッドシートへ並びます。担任ごとに行を抜き出す、面談の順に直す、といった下準備が不要です。気になる生徒の行をたどれば、その生徒に向いている上位の学科（Top3）と22軸の傾向まで、その場で確認できます。
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
            <div
              className="w-1 shrink-0 rounded-full bg-emerald-600"
              aria-hidden="true"
            />
            <div>
              <p className="text-base font-semibold text-gray-900">
                診断データは、最初から御校のシートに残る
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                回答は御校所有の Google スプレッドシートに直接記録されます。加工レポートだけを受け取る形ではなく、生のデータが御校の手元に蓄積され、運営側の都合で消えることはありません。御校が「削除してほしい」と言えば、即時削除します。
              </p>
            </div>
          </div>
        </div>

        {/* 3) 補足帯＝開発者の実名・所属・即応連絡先（透明性＝信頼の補完）＋CTA（ヒーローと文言を被らせない） */}
        <div className="mt-6 border-t border-gray-100 pt-5">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">開発：</span>
            平井 壱城（東京理科大学 理学部第一部 応用化学科 3年）
          </p>
          <p className="mt-1 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">連絡先：</span>
            <a
              href={`mailto:${CONTACT_MAIL}`}
              className="text-emerald-700 underline"
            >
              {CONTACT_MAIL}
            </a>
            （削除依頼・相談に直接対応）
          </p>
          <button
            onClick={scrollToDemo}
            className="mt-4 rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 active:bg-gray-700"
          >
            先生向けの出力を見てみる
          </button>
        </div>
      </section>

      {/* 診断結果のデモ（玄関の下部にインラインで“触れる”形）。同一オリジンの結果ページを
          生 iframe で埋め込む（XFO は SAMEORIGIN に緩和済・他サイトからの埋め込みは不可）。
          ?demo=mixed なのでデータ送信なし。iframe 内の matchMedia は iframe 自身の幅で
          評価されるので、広い枠＝PC版・狭い枠＝スマホ版の結果がそのまま描画される。
          ScaledFrame で実幅に合わせて縮小（スクロール・タップは生きたまま）。 */}
      <section id="demo" className="mx-auto max-w-5xl px-8 py-16 sm:px-12">
        <h2 className="text-center text-xl font-bold text-gray-900 sm:text-2xl">
          診断結果のデモ
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm leading-relaxed text-gray-600">
          生徒が答えると、こんな結果が出ます。下の画面はそのまま動きます——
          スクロールしたり、気になる学科をタップして詳しく見られます。
        </p>

        {/* デモ枠は小さめ＆中央寄せにし、画面いっぱいにはしない。左右に白の余白を広く残し、
            その白い部分でページをスクロールできるようにする（iframe 上はスクロールが
            iframe 内に吸われるため）。PC枠は flex-1 で広げず固定上限幅にする。 */}
        <div className="mt-10 flex flex-col items-center justify-center gap-10 lg:flex-row lg:items-start">
          {/* PC版（結果が PC レイアウトで描画。上限616pxの小さめプレビュー＝+10%） */}
          <div className="w-full max-w-[616px]">
            <p className="mb-2 text-center text-xs font-medium text-gray-500">
              PC版
            </p>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <ScaledFrame
                src="/result?demo=mixed"
                w={1180}
                displayHeight={440}
                title="診断結果デモ（PC版）"
              />
            </div>
          </div>

          {/* スマホ版（結果が スマホ レイアウトで描画） */}
          <div className="w-[220px] shrink-0">
            <p className="mb-2 text-center text-xs font-medium text-gray-500">
              スマホ版
            </p>
            <div className="overflow-hidden rounded-[1.6rem] border-[6px] border-gray-200 bg-white">
              <ScaledFrame
                src="/result?demo=mixed"
                w={390}
                displayHeight={440}
                title="診断結果デモ（スマホ版）"
              />
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-gray-400">
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
