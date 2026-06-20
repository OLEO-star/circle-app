import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "教員の皆様へ",
  description:
    "ring-map 学部診断の導入をご検討の進路指導の先生方へ。約45〜66問・22軸・36学科の根拠、データの扱い、導入の流れをまとめています。",
  alternates: { canonical: "https://ring-map.com/teachers" },
  openGraph: {
    title: "教員の皆様へ | ring-map 学部診断",
    description:
      "ring-map 学部診断の導入をご検討の進路指導の先生方へ。約45〜66問・22軸・36学科の根拠、データの扱い、導入の流れをまとめています。",
    url: "https://ring-map.com/teachers",
    type: "article",
    locale: "ja_JP",
  },
};

const SECTIONS = [
  { id: "why", label: "1. なぜこのサービスを作ったか" },
  { id: "developer", label: "2. 開発者について" },
  { id: "design", label: "3. 設計の考え方" },
  { id: "data", label: "4. データの扱い・プライバシー" },
  { id: "compare", label: "5. 既存サービスとの違い" },
  { id: "flow", label: "6. 導入の流れ" },
  { id: "paid", label: "7. 将来の有料オプション" },
  { id: "faq", label: "8. よくある質問" },
  { id: "contact", label: "9. お問い合わせ" },
];

export default function TeachersPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-10 text-sm leading-relaxed text-gray-700">
      {/* ヒーロー */}
      <header className="mb-10 border-b border-gray-200 pb-8">
        <p className="mb-2 text-xs font-semibold tracking-widest text-rose-700">
          FOR TEACHERS
        </p>
        <h1 className="mb-4 text-2xl font-bold text-gray-900">
          教員の皆様へ
        </h1>
        <p className="mb-6 text-gray-700">
          学部診断 ring-map について、よくご質問いただく内容をまとめました。
          導入のご検討にお役立てください。
        </p>

        {/* 要旨 - F パターン読みで最初に視認される位置に3行サマリを置く */}
        <div className="mb-6 rounded border border-slate-200 bg-slate-50 p-5">
          <p className="mb-3 text-xs font-semibold tracking-wider text-slate-700">
            要旨
          </p>
          <ul className="space-y-2 text-xs leading-relaxed text-gray-700">
            <li className="flex gap-2">
              <span className="text-rose-600">●</span>
              <span>
                約45〜66問（学部選択により異なる）の質問で、生徒の興味を{" "}
                <strong>22軸 × 36学科</strong>{" "}
                で可視化する無料の進路診断ツールです
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-rose-600">●</span>
              <span>
                回答データは{" "}
                <strong>御校所有の Google スプレッドシート</strong>{" "}
                でお渡しし、進路面談の判断材料になります
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
        </div>

        {/* 信頼バッジ - Prevention 思考層への視覚的安心シグナル(Dual coding theory) */}
        <div className="mb-6 grid grid-cols-3 gap-2">
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-semibold text-emerald-800">
              永続無料
            </p>
            <p className="mt-0.5 text-[9px] text-emerald-700">
              導入費・運用費 0円
            </p>
          </div>
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-semibold text-emerald-800">
              データは学校所有
            </p>
            <p className="mt-0.5 text-[9px] text-emerald-700">
              削除依頼で即時対応
            </p>
          </div>
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-semibold text-emerald-800">
              個人特定情報なし
            </p>
            <p className="mt-0.5 text-[9px] text-emerald-700">
              マスタDBに非保存
            </p>
          </div>
        </div>

        <div className="rounded border border-gray-200 bg-white p-4 text-xs">
          <p className="mb-1 text-gray-600">
            <span className="font-semibold text-gray-900">開発者：</span>
            平井 壱城（東京理科大学 理学部第一部 応用化学科 3年）
          </p>
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">連絡先：</span>
            <a
              href="mailto:info@ring-map.com"
              className="text-rose-700 underline"
            >
              info@ring-map.com
            </a>
          </p>
        </div>
      </header>

      {/* 目次 */}
      <nav aria-label="目次" className="mb-12 rounded border border-gray-200 bg-gray-50 p-5">
        <p className="mb-3 text-xs font-semibold text-gray-900">目次</p>
        <ol className="space-y-1.5 text-xs">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-rose-700 hover:underline">
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* 1. なぜこのサービスを作ったか */}
      <section id="why" className="mb-12 scroll-mt-6">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">
          1. なぜこのサービスを作ったか
        </h2>

        <h3 className="mb-2 mt-2 text-base font-semibold text-gray-900">
          「偶然」を「必然」にしたい
        </h3>
        <p className="mb-4">
          私は青山学院横浜英和高等学校の出身で、附属校という性質上、学校の成績がそのまま進学先の学部選択に直結する高校生活を送っていました。多くの生徒にとって「成績で決まる」が事実上のデフォルトで、自分から進路を能動的に選ぶ機会は少なかったと振り返っています。
        </p>
        <p className="mb-4">
          そんな中、塾で出会った東京理科大学 応用化学科の塾講師の方から、応用化学科の魅力を熱量を持って教えていただきました。その出会いをきっかけに「自分は応用化学科に行きたい」と思うようになり、一般受験を選び、現在に至っています。
        </p>
        <p className="mb-4">
          ただ、それは <strong>完全に「偶然」の出会い</strong> でした。あの塾講師の方に出会わなければ、私は附属校のレールにそのまま乗り、別の学部に進んでいたはずです。
        </p>
        <p className="rounded bg-rose-50/60 p-4 text-gray-800">
          自分のように偶然に頼って学部を見つけるのではなく、
          <strong>すべての中高生が「必然」として自分に合う学部に出会える状態</strong>
          を作りたい。これが ring-map を作った最初の動機です。
        </p>

        <h3 className="mb-2 mt-8 text-base font-semibold text-gray-900">
          入学後のギャップを減らしたい
        </h3>
        <p className="mb-4">
          応用化学科に進学した後、実際に体験して初めて気づいたことがあります。「思っていたものと違う」というギャップです。
        </p>
        <p className="mb-4">
          受験前、私は応用化学科がどんなところなのかをほとんど知りませんでした。授業の頻度、実験の頻度、1 週間の生活リズム、レポートの量 ── 大学生活の具体的な姿を知る機会が、高校生にはほぼ無いのです。
        </p>
        <p className="mb-4">
          結果として、応用化学科に対する <strong>「覚悟」のないまま大学生になりました</strong>。授業や実験は今でも面白く、学問自体は楽しいと感じています。しかし、それでも「本当にこの学部で良かったのか」と思う瞬間は何度もあります。
        </p>
        <p className="mb-4">
          これは私個人の話ではなく、<strong>大学に進学した多くの学生に共通する悩み</strong>だと感じています。
        </p>

        <h3 className="mb-2 mt-8 text-base font-semibold text-gray-900">
          そのギャップの原因
        </h3>
        <p className="mb-3">高校時代に進路を選ぶ際、足りていない情報は主に 3 つあると考えました。</p>
        <ol className="mb-4 ml-6 list-decimal space-y-2">
          <li>
            <strong className="text-gray-900">多角的な比較ができていない</strong>：
            「得意な科目」だけで絞ってしまい、他にどんな選択肢があるかを比べきれていない。
          </li>
          <li>
            <strong className="text-gray-900">学部の中身を知らない</strong>：
            授業頻度・実験頻度・1 週間の流れなど、具体的な大学生活のイメージが持てない。
          </li>
          <li>
            <strong className="text-gray-900">将来との繋がりが見えない</strong>：
            この学部に行くと、どんな職業に繋がるのかが分からない。将来の就職先から逆算したい人もいるはず。
          </li>
        </ol>

        <h3 className="mb-2 mt-8 text-base font-semibold text-gray-900">
          ring-map がやろうとしていること
        </h3>
        <p className="mb-3">上記 3 つの不足を、それぞれの設計で埋めようとしました。</p>
        <ul className="mb-4 ml-6 list-disc space-y-2">
          <li>
            <strong className="text-gray-900">① 多角的な比較：</strong>
            36 学科 × 22 軸で「得意」とは別の物差しを提供。「やりたいこと」「興味の方向」で比較できるようにしました。
          </li>
          <li>
            <strong className="text-gray-900">② 学部の中身を可視化：</strong>
            各学科の「1 週間の流れ」を、現実的で少し厳しめのトーンで記述。授業頻度・実験頻度・レポート量まで含めています。
          </li>
          <li>
            <strong className="text-gray-900">③ 将来との繋がり：</strong>
            各学科の「主な進路（就職先）」を、厚生労働省編職業分類と O*NET をもとに掲載。将来から逆算する人にも使えるようにしました。
          </li>
        </ul>

        <p className="rounded bg-rose-50/60 p-4 text-gray-800">
          ring-map は、「あなたは○○学科に行くべき」と断言するツールではありません。生徒が
          <strong>「何をしたいから、この学部に行きたい」</strong>
          と言えるようになるための、対話のきっかけと判断材料を提供するツールです。
        </p>

        <div className="mt-8 rounded border border-gray-200 bg-gray-50 p-5">
          <p className="mb-3 text-sm font-semibold text-gray-900">
            ✋ このツールが「できないこと」も明示します
          </p>
          <ul className="ml-4 list-disc space-y-1 text-xs text-gray-700">
            <li>「あなたは○○学科に行くべき」と断言すること</li>
            <li>進路を1つに絞ること</li>
            <li>偏差値や合格可能性を予測すること</li>
            <li>生徒の人生の責任を肩代わりすること</li>
          </ul>
          <p className="mt-3 text-xs text-gray-600">
            これらは ring-map の役割ではありません。生徒・先生・保護者の対話によって決めていただくものです。
          </p>
        </div>
      </section>

      {/* 2. 開発者について */}
      <section id="developer" className="mb-12 scroll-mt-6">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">
          2. 開発者について
        </h2>
        <p className="mb-2 font-semibold text-gray-900">平井 壱城（ひらい かずき）</p>
        <ul className="mb-4 ml-6 list-disc">
          <li className="mb-1">東京理科大学 理学部第一部 応用化学科 3年</li>
          <li className="mb-1">出身：青山学院横浜英和高等学校</li>
          <li className="mb-1">
            このサービスを 2026 年春に個人開発、現在母校で先行展開準備中
          </li>
        </ul>
        <p className="mb-3 font-semibold text-gray-900">
          なぜ大学 3 年生が作っているのか？
        </p>
        <p className="mb-4">
          学部選びでの「偶然」と、入学後に感じた「ギャップ」── 自分自身がこの問題の当事者だったからです。
        </p>
        <p className="mb-4">
          大学に進学してから、同世代の友人と話しても「自分の学部で本当に良かったのかな」と口にする人は多くいました。これは特殊な悩みではなく、進学したほぼ全員が一度は通る感覚だと感じています。
        </p>
        <p className="mb-4">
          社会人になってから「あの時の自分」の感覚を再現するのは難しい。迷いの渦中にいた時の感覚を、まだ覚えているうちに形にしたいと思って、在学中に作りました。
        </p>
      </section>

      {/* 3. 設計の考え方 */}
      <section id="design" className="mb-12 scroll-mt-6">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">
          3. 設計の考え方：質問・22軸・36学科
        </h2>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          基盤となる心理学モデル
        </h3>
        <p className="mb-4">
          ring-map は、Holland Code（職業興味理論）と Big Five（性格特性）の 2 つの心理学モデルを基盤に、独自に設計したツールです。
        </p>
        <p className="mb-4">
          世界的には、米国 Truity 社が提供する進路適性検査が、同じく Holland + Big Five を採用したサービスとして知られています。ただし Truity は英語のみで、職業中心、米国の進学制度が前提です。
        </p>
        <p className="mb-4">
          ring-map は「日本の学部選択」「中高生」「日本語」という、Truity がカバーしない領域を対象に、ゼロから設計しました。
        </p>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          採用した 2 つの心理学モデル
        </h3>
        <ul className="mb-4 ml-6 list-disc">
          <li className="mb-2">
            <strong className="text-gray-900">Holland Code（RIASEC）</strong>：
            1959 年に提唱された職業興味理論。世界で最も広く使われており、進路適性検査の事実上の標準。6 つの興味タイプ（現実的・研究的・芸術的・社会的・企業的・慣習的）。
          </li>
          <li className="mb-2">
            <strong className="text-gray-900">Big Five（ビッグファイブ性格特性）</strong>：
            心理学で最も実証研究が蓄積されている性格モデル。5 つの性格次元（開放性・誠実性・外向性・協調性・神経症傾向）。
          </li>
        </ul>
        <p className="mb-4">
          ring-map では、Holland で「興味の方向」を、Big Five で「働き方の好み・耐性」を測ります。
        </p>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          22 軸の作り方
        </h3>
        <p className="mb-4">
          RIASEC（6 軸）と Big Five（5 軸）だけでは日本の細かい学科の差を表現できないため、両モデルを基盤としつつ、中高生に「好き・やりたい」で聞ける具体的な行為・状態に翻訳した独自の 22 軸を設計しました。
        </p>
        <p className="mb-3">
          <strong className="text-gray-900">最初に設計した 16 軸：</strong>
          数学・暗記・実験・フィールド・プログラミング・ものづくり・語学・対人ケア・ビジネス・アート・抽象思考・チーム・資格・院進志向・生命関与・動物志向。
        </p>
        <p className="mb-4">
          <strong className="text-gray-900">偏り調査の結果、追加した 3 軸：</strong>
          開発途中で「法学・文学・スポーツ科学を狙い撃つ質問が不足している」ことが判明し、物語・文学（NARRATIVE）／正義・制度（JUSTICE）／身体性・運動（BODY）の 3 軸を追加。結果、合計 19 軸となりました。
        </p>
        <p className="mb-4">
          <strong className="text-gray-900">化学・情報の分離のために追加した 3 軸：</strong>
          化学系・情報系の細かい違いを見分けるため、純粋⇄応用志向（PURE）／生体・生命現象（BIO）／量産・プロセス設計（PROC）の 3 軸を追加し、現在は合計 22 軸です。
        </p>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          質問の設計方針
        </h3>
        <p className="mb-3">質問は「好き・興味」と「耐性・覚悟」の 2 タイプで構成しています。</p>
        <ul className="mb-4 ml-6 list-disc">
          <li className="mb-1">
            <strong>「好き・興味」例：</strong>
            「数式を使って法則を導き出す作業にワクワクする」
          </li>
          <li className="mb-1">
            <strong>「耐性・覚悟」例：</strong>
            「実験が失敗しても原因を探してやり直すことに抵抗がない」
          </li>
        </ul>
        <p className="mb-4">
          回答形式は 5 段階リッカート（1：まったく当てはまらない 〜 5：とても当てはまる）。質問の約 4 分の 1（12 問）を「逆転項目」（否定文）とし、「何でも『はい』と答える」傾向（黙従バイアス）を抑えています。
        </p>
        <p className="mb-4 rounded bg-rose-50/60 p-4 text-gray-800">
          【質問の聞き方の哲学】
          「数学が得意ですか」とは聞きません。「数式をいじる時間が楽しいですか」と聞きます。日本の進路指導の最大の欠陥は「得意 = 向いてる」の同一視。続ける力は「好き」から生まれます。
        </p>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          バージョンと質問数
        </h3>
        <p className="mb-3">
          中高生の負担を減らすため、生徒が事前に「文系・理系・どちらも」を選べる 3 バージョン構成にしています。
        </p>
        <ul className="mb-4 ml-6 list-disc">
          <li className="mb-1">文系版：45 問</li>
          <li className="mb-1">理系版：51 問</li>
          <li className="mb-1">混合版（どちらも）：66 問</li>
        </ul>
        <p className="mb-4">所要時間は 10〜15 分程度です。</p>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          スコアリングの仕組み（プラスとマイナス）
        </h3>
        <p className="mb-3">
          質問への回答は 5 段階（1〜5）で答えてもらい、軸ごとに集計して 0.0〜1.0 のスコアに正規化します。
        </p>
        <ul className="mb-4 ml-6 list-disc">
          <li className="mb-2">
            <strong className="text-gray-900">興味を測る質問（プラス加算）：</strong>
            当てはまるほど軸スコアが上がる。回答 1 → +1 点、回答 5 → +5 点。
          </li>
          <li className="mb-2">
            <strong className="text-gray-900">覚悟を測る逆転質問（マイナス加算）：</strong>
            「その分野のきつい部分」への拒否反応を聞く質問。当てはまるほどスコアを下げる設計。回答 1 → +3 点、回答 3 → 0 点、回答 5 → −3 点。
          </li>
        </ul>
        <p className="mb-4">
          この「マイナスを許容する設計」により、「興味はある、でも続けられない領域」を識別できます。たとえば「動物は好き」と答えても「動物の解剖は無理」と答えた生徒は、獣医学科の上位順位から自動的に外れます。
        </p>
        <p className="mb-4">
          軸ごとに集計した合計点を、その軸の取りうる最小値・最大値で
          <code className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs">
            (合計 − 最小) / (最大 − 最小)
          </code>
          により 0.0〜1.0 に変換します。負値・1.0 超もそのまま許容し、強い否定を結果に反映します。
        </p>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          36 学科の選び方
        </h3>
        <p className="mb-4">
          混合版（文系・理系どちらも）のリングでは、36 学科を 9 つの大カテゴリに分けて配置しています。カテゴリは「リング」のビジュアルで時計方向に並べています。
        </p>
        <ul className="mb-4 ml-6 list-disc text-xs">
          <li className="mb-1">数理・情報</li>
          <li className="mb-1">物理・化学</li>
          <li className="mb-1">機械・材料</li>
          <li className="mb-1">建設・環境</li>
          <li className="mb-1">生命・医療</li>
          <li className="mb-1">健康・こころ</li>
          <li className="mb-1">教育・人文</li>
          <li className="mb-1">法・政治・社会</li>
          <li className="mb-1">経済・経営</li>
        </ul>
        <p className="mb-4">合計 36 学科。</p>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          学科の軸スコアの決め方（6 偏差値帯のシラバス横断検証）
        </h3>
        <p className="mb-3">
          各学科 × 各軸のスコア（0.0〜1.0）は、「6 つの偏差値帯」のシラバスを横断的に読み比べて決めました。
        </p>
        <ul className="mb-4 ml-6 list-disc text-xs">
          <li className="mb-1">旧帝大（東大・京大・東北・名古屋・大阪・北大・九大）</li>
          <li className="mb-1">早慶</li>
          <li className="mb-1">MARCH</li>
          <li className="mb-1">成成明学獨國武</li>
          <li className="mb-1">日東駒専</li>
          <li className="mb-1">大東亜帝国</li>
        </ul>
        <p className="mb-4">
          各学科について、この 6 帯から代表校を選び、必修科目構成・実験量・レポート・研究室活動・卒業要件を総合的に評価して、「日本における各学科の標準像」として軸スコアを定義しました。
        </p>
        <p className="mb-4 rounded bg-rose-50/60 p-4 text-gray-800">
          【6 帯横断を採用した理由】
          旧帝だけ見ると研究志向に偏り、大東亜帝国だけ見ると就職志向に偏るため、両極を含めた集約値を取っています。
        </p>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          「主な進路（就職先）」の作り方
        </h3>
        <p className="mb-3">
          結果ページで各学科ごとに表示している「主な進路」一覧は、2 つの公的な職業分類データベースに基づいて作成しています。
        </p>
        <ul className="mb-4 ml-6 list-disc">
          <li className="mb-2">
            <strong className="text-gray-900">厚生労働省編職業分類：</strong>
            日本の公的職業分類。約 7,800 職業を網羅した標準分類。
          </li>
          <li className="mb-2">
            <strong className="text-gray-900">
              O*NET（Occupational Information Network）：
            </strong>
            米国労働省が運営する世界最大級の職業情報データベース。約 900 職業、Holland Code との対応も明確。
          </li>
        </ul>
        <p className="mb-3">
          上記 2 つから「卒業生が実際に就く職業」を抽出し、学科との関連度順（中心的な進路 → よくある進路 → 周辺進路）に並べて、各学科 100 字以内に要約しています。
        </p>
        <p className="mb-3 font-semibold text-gray-900">意図的に含めていないもの：</p>
        <ul className="mb-4 ml-6 list-disc text-xs">
          <li className="mb-1">個別企業名（変動が激しい・公平性を欠く）</li>
          <li className="mb-1">平均年収・初任給（職業内格差が大きく、誤解を招く）</li>
          <li className="mb-1">就職率（大学差が大きく、学科の特性を表さない）</li>
        </ul>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          「1 週間の流れ」は少し厳しめに設計
        </h3>
        <p className="mb-3">
          結果ページで各学科ごとに表示している「1 週間の流れ」は、意図的に
          <strong>偏差値の高い大学のシラバスに寄せて</strong>
          制作しています。
        </p>
        <p className="mb-3">
          このアプリで最も避けたいのは、診断結果を信じて進学した生徒が、入学後に「こんなに大変だと思わなかった」と後悔することです。そのため、勉強量が多く課題が重い大学（旧帝・早慶レベル）のシラバスを参照し、「現実味のある、少し厳しめ」のトーンで描いています。
        </p>
        <p className="mb-4 rounded bg-rose-50/60 p-4 text-gray-800">
          「もっと楽だと思った」より「思ったより大変だけど、覚悟できていた」の方が、生徒にとって幸せだと考えているからです。
        </p>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          マッチングロジック
        </h3>
        <ol className="mb-4 ml-6 list-decimal">
          <li className="mb-1">
            生徒の回答を集計し、22 軸スコア（0.0〜1.0、負値・1.0 超もあり）を算出
          </li>
          <li className="mb-1">
            36 学科それぞれの「学科ベクトル」との距離を計算（軸ごとのばらつきで重み付けし、その学科に不可欠な軸が極端に低い場合は減点）
          </li>
          <li className="mb-1">類似度が高い順にランキング表示</li>
        </ol>
        <p className="mb-4">
          カテゴリの枠を超えて、生徒のベクトルに近い学科を並べます。たとえば「文系っぽいけど数学も好き」な生徒には、経済学科・心理学科・データサイエンス学科のように複数カテゴリにまたがる結果が出ることもあります。
        </p>

        <p className="mt-6 rounded bg-rose-50/60 p-4 text-gray-800">
          ring-map は、進路を「決める」ためのツールではありません。診断結果はあくまで「現時点での興味の傾向」のスナップショットです。生徒の興味は 3 年で変わりますし、22 軸で全てを測れるわけでもありません。それでも「自分はこういう傾向があるのか」「先生はこの結果をどう見るか」という対話のきっかけになることを狙っています。
        </p>
      </section>

      {/* 4. データの扱い */}
      <section id="data" className="mb-12 scroll-mt-6">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">
          4. データの扱い・プライバシー
        </h2>
        <p className="mb-4">ご質問が一番多い領域です。誠実にお答えします。</p>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          学校配布モード（ring-map.com/s）で集まるデータ
        </h3>
        <ul className="mb-4 ml-6 list-disc">
          <li className="mb-1">学年・クラス・出席番号</li>
          <li className="mb-1">22 軸のスコア</li>
          <li className="mb-1">36 学科ランキング</li>
          <li className="mb-1">所要時間</li>
          <li className="mb-1">回答変更ログ（迷った質問の特定）</li>
          <li className="mb-1">結果ページでの納得感（任意回答）</li>
          <li className="mb-1">気になる学部 Top3（任意回答）</li>
        </ul>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">保存先</h3>
        <p className="mb-4">
          御校専用の Google スプレッドシートに保存されます。このスプレッドシートは、御校の進路担当者の方に閲覧権限を付与してお渡しします。
        </p>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">データの権利</h3>
        <p className="mb-3 font-semibold text-gray-900">御校のデータは御校のものです。</p>
        <ul className="mb-4 ml-6 list-disc">
          <li className="mb-1">開発者は、改善目的での集計分析以外には使用しません</li>
          <li className="mb-1">第三者への提供は一切しません</li>
          <li className="mb-1">御校が「削除してほしい」と言えば、即時削除します</li>
        </ul>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          マスタスプレッドシート
        </h3>
        <p className="mb-4">
          開発者側にもマスタ DB がありますが、そこに保存されるのは「22 軸スコア」のみで、個人を特定できる情報（学年・クラス・番号）は保存されません。
        </p>
        <p className="mb-4">
          詳細は{" "}
          <Link href="/privacy" className="text-rose-700 underline">
            プライバシーポリシー
          </Link>
          {" "}をご覧ください。
        </p>
      </section>

      {/* 5. 既存サービスとの違い */}
      <section id="compare" className="mb-12 scroll-mt-6">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">
          5. 既存サービスとの違い
        </h2>
        <p className="mb-4">
          進路適性検査・進路情報サービスは数多くありますが、ring-map は以下の点で異なります。
        </p>
        <div className="mb-4 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-300 text-left">
                <th className="py-2 pr-2 font-semibold text-gray-900"></th>
                <th className="py-2 pr-2 font-semibold text-gray-900">
                  既存サービス
                </th>
                <th className="py-2 font-semibold text-gray-900">ring-map</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b border-gray-200">
                <td className="py-2 pr-2 font-semibold">価格</td>
                <td className="py-2 pr-2">年 5 万〜30 万</td>
                <td className="py-2">基本永続無料</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 pr-2 font-semibold">データの権利</td>
                <td className="py-2 pr-2">サービス側保有</td>
                <td className="py-2">学校・生徒側</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 pr-2 font-semibold">生データ提供</td>
                <td className="py-2 pr-2">集計後のレポート</td>
                <td className="py-2">Sheets で生開示</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 pr-2 font-semibold">質問数</td>
                <td className="py-2 pr-2">100〜300 問</td>
                <td className="py-2">約 45〜66 問（約 10 分）</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 pr-2 font-semibold">軸の数</td>
                <td className="py-2 pr-2">6〜10 軸</td>
                <td className="py-2">22 軸</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 pr-2 font-semibold">大学広告</td>
                <td className="py-2 pr-2">あり</td>
                <td className="py-2">一切なし</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 pr-2 font-semibold">運営</td>
                <td className="py-2 pr-2">大企業</td>
                <td className="py-2">個人開発・在学生</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mb-2 text-xs text-gray-500">
          ※ 既存サービス側の数値は業界の一般的な目安です。サービスごとに条件は異なります。
        </p>
        <p className="mb-4">
          最大の違いは「データを生のまま学校にお渡しする」点です。他社サービスでは、生徒の回答データはサービス側のサーバーに吸い上げられ、加工されたレポートだけが学校に返ってきます。ring-map では、Google スプレッドシートで生データそのものをお渡しします。先生方が独自に Excel で集計したり、進路指導会議の資料に貼り付けたりするのが自由です。
        </p>
      </section>

      {/* 6. 導入の流れ */}
      <section id="flow" className="mb-12 scroll-mt-6">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">6. 導入の流れ</h2>
        <p className="mb-4 font-semibold text-gray-900">
          所要時間：合計 1 時間ほど。費用は 0 円です。
        </p>
        <ol className="mb-4 ml-6 list-decimal space-y-3">
          <li>
            <strong className="text-gray-900">お問い合わせ：</strong>
            <a href="mailto:info@ring-map.com" className="ml-1 text-rose-700 underline">
              info@ring-map.com
            </a>
            {" "}にご連絡ください。
          </li>
          <li>
            <strong className="text-gray-900">学校コード発行（無料・即日）：</strong>
            貴校の文部科学省学校コード（13 桁）を確認して開発者側で設定します。
          </li>
          <li>
            <strong className="text-gray-900">専用スプレッドシート発行（即日）：</strong>
            貴校専用のスプレッドシートを作成し、ご担当者様のメールアドレスに閲覧権限をお送りします。
          </li>
          <li>
            <strong className="text-gray-900">配布 QR 受け取り：</strong>
            貴校専用の配布 URL（ring-map.com/s）と印刷用 QR コードをお渡しします。
          </li>
          <li>
            <strong className="text-gray-900">生徒への配布：</strong>
            ホームルーム・進路ガイダンス・LHR などで QR をスキャンしていただきます。1 回の所要時間は 10〜15 分程度。
          </li>
          <li>
            <strong className="text-gray-900">データ確認：</strong>
            生徒が完答するたびに、貴校専用スプレッドシートに自動でデータが追加されます。学年 → クラス → 出席番号順に自動ソートされます。
          </li>
        </ol>

        {/* 中段 CTA - ページ中盤で離脱しようとしている読者を捕まえる */}
        <div className="mt-8 rounded border border-rose-200 bg-rose-50 p-5 text-center">
          <p className="mb-3 text-sm font-semibold text-gray-900">
            ここまで読んでいただきありがとうございます
          </p>
          <p className="mb-4 text-xs leading-relaxed text-gray-700">
            導入のご相談・デモのご希望、お気軽にどうぞ。
            <br />
            1 営業日以内にご返信します。
          </p>
          <a
            href="mailto:info@ring-map.com?subject=ring-map%20%E5%B0%8E%E5%85%A5%E7%9B%B8%E8%AB%87"
            className="inline-block rounded bg-rose-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-800"
          >
            メールでお問い合わせ
          </a>
          <p className="mt-3 text-[10px] text-gray-500">
            info@ring-map.com
          </p>
        </div>
      </section>

      {/* 7. 有料オプション */}
      <section id="paid" className="mb-12 scroll-mt-6">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">
          7. 将来の有料オプション
        </h2>
        <p className="mb-4">
          基本機能（診断 + Google スプレッドシートでの生データ提供）は今後も
          <strong>永続無料</strong>の予定です。
        </p>
        <p className="mb-4">
          将来的に、教員の業務負担をさらに軽減するため、以下のオプション機能を有料でご提供する予定です。
        </p>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          Standard プラン候補（年 7 万円程度）
        </h3>
        <ul className="mb-4 ml-6 list-disc">
          <li className="mb-2">
            <strong className="text-gray-900">進路面談サポートシート：</strong>
            生徒 1 人ごとに、22 軸チャート + Top3 学科 +「面談で聞くべきこと」を 1 ページ PDF で自動生成。三者面談・進路面談の準備時間を 50 時間/年削減。
          </li>
          <li className="mb-2">
            <strong className="text-gray-900">教員ダッシュボード：</strong>
            クラス別・学年別の傾向グラフ、22 軸分布ヒートマップ、Top3 学科集計などを Looker Studio で自動表示。
          </li>
        </ul>

        <h3 className="mb-2 mt-6 text-base font-semibold text-gray-900">
          Pro プラン候補（年 12 万円程度）
        </h3>
        <p className="mb-4">
          上記に加えて、<strong>AI 解釈レポート</strong>（Claude API 使用）：「3 年 A 組は理系志向強め、特に医療系に偏り」のような解釈テキストを自動生成し、PDF 配信。
        </p>
        <p className="mb-4">
          ご興味のある御校には、開発が完了次第ご案内します。基本機能のみのご利用でも、もちろん永続無料です。
        </p>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="mb-12 scroll-mt-6">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">8. よくある質問</h2>
        <p className="mb-6 text-xs text-gray-500">
          質問をクリックすると詳細が開きます。
        </p>

        {/* グループ 1: 安心・信頼 */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            <h3 className="text-sm font-semibold text-gray-900">
              安心・信頼について
            </h3>
          </div>
          <Faq
            q="本当に無料ですか？"
            short="はい、基本機能は永続無料です。"
            a="2026 年現在は実証フェーズで、できるだけ多くの学校で使っていただきフィードバックをもとに改善することを優先しています。将来的に有料オプションは追加されますが、基本機能（診断 + 学校用スプレッドシート）の課金化は予定していません。"
          />
          <Faq
            q="個人開発者が運営しているということは、卒業後はどうなりますか？"
            short="現在 大学3年。卒業後も継続運営の前提で設計しています。"
            a="ring-map は卒業後も継続する前提で設計しています（卒業予定は2028年3月）。万一サービス終了の判断をする場合は、半年以上前に通知し、それまでに集まったデータは各学校のスプレッドシートに残るため、サービス終了後も学校側で参照可能です。"
          />
          <Faq
            q="生徒の個人情報の扱いは保護者にどう説明すればよいですか？"
            short="保護者向け説明文サンプルをお送りします。"
            a="開発者側で「保護者向け説明文サンプル」をご用意しています。お問い合わせいただければお送りします。学校データ・年齢収集について明示する内容です。"
          />
          <Faq
            q="他校との比較データは他校に見られませんか？"
            short="個別学校の集計データを他校に開示することはありません。"
            a="将来的に「全国平均との比較」機能を匿名化ベースで提供する可能性はありますが、提供前に必ず各校に確認します。"
          />
          <Faq
            q="導入をやめたくなった時、データはどうなりますか？"
            short="削除依頼で即時削除します。"
            a="御校のスプレッドシートは御校がオーナーですので、御校でいつでも削除可能です。開発者側のマスタ DB に残る個人特定不可なスコアデータも、ご希望があれば削除します。"
          />
        </div>

        {/* グループ 2: 仕組み・使い方 */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-sky-500"></span>
            <h3 className="text-sm font-semibold text-gray-900">
              仕組み・使い方について
            </h3>
          </div>
          <Faq
            q="導入にどれくらい時間がかかりますか？"
            short="合計 1 時間程度、費用は無料です。"
            a="お問い合わせ → 学校コード発行 → 専用スプレッドシート発行 → 配布 QR 受け取り、までで実質 1 時間ほど。生徒への配布は QR スキャンだけです。"
          />
          <Faq
            q="中学校でも使えますか？"
            short="はい、中学校用学校コード（C1 始まり）に対応済みです。"
            a="中高一貫校の場合は、中学と高校で 1 つのスプレッドシートに集約することもできます。"
          />
          <Faq
            q="インターナショナルスクールでも使えますか？"
            short="英語版ランディングを準備中、日本の大学進学を視野に入れる生徒さん向けです。"
            a={
              <>
                診断本体は日本語ですが、日本の大学進学を考えるインター校の生徒さんからのアクセスを想定しています。2026 年 8 月新学期からの導入をご検討の場合、6 月中にご連絡ください。英語の概要は{" "}
                <Link href="/en" className="text-rose-700 underline">
                  ring-map.com/en
                </Link>
                {" "}にあります。
              </>
            }
          />
          <Faq
            q="文科省学校コードがわかりません。"
            short="お問い合わせいただければ検索してお伝えします。"
            a="13 桁の学校コードがご不明でも、貴校名をお伝えいただければ開発者側で検索します。"
          />
          <Faq
            q="質問内容を学校独自にカスタマイズできますか？"
            short="現バージョンは全校共通の質問です。"
            a="将来的にカスタム質問追加（有料オプション）を検討中です。御校での導入要件に独自質問が必須な場合は、ご相談ください。"
          />
          <Faq
            q="操作デモを見せてもらえますか？"
            short="はい、Zoom 等でオンラインデモを承ります。"
            a="info@ring-map.com にご連絡ください。30 分程度で全機能をデモできます。"
          />
        </div>

        {/* グループ 3: 結果ページの見方 */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
            <h3 className="text-sm font-semibold text-gray-900">
              結果ページの表示について
            </h3>
          </div>
          <Faq
            q="各学科の紹介文はどうやって作りましたか？"
            short="AI（Claude）で初稿、開発者が全 36 学科を校閲・修正しています。"
            a="AI には「6 偏差値帯のシラバス情報」と「学科の典型的な活動内容」をインプットとして与え、学生視点で 2〜3 文に要約させました。その後、不自然な表現や誇張、誤りを人の目で校正しています。完全に自動生成ではなく、最終的な責任は開発者が負っています。"
          />
          <Faq
            q="リング図は何を表しているのですか？"
            short="分野カテゴリへの興味の強さを「線の長さ」で示したイコライザー型ビジュアルです。"
            a="混合版では 9 つのカテゴリ（数理・情報、物理・化学、機械・材料、建設・環境、生命・医療、健康・こころ、教育・人文、法・政治・社会、経済・経営）を時計方向に配置し、12 時 = 数理・情報から並んでいます。サービス名「ring-map」（リング型の進路マップ）の由来でもあります。"
          />
          <Faq
            q="「マッチング○○%」という数字は何を意味していますか？"
            short="学科ベクトルとの距離の近さを 0〜100% に変換した値で、「合格する確率」ではありません。"
            a="「生徒の 22 軸スコア」と「その学科の 22 軸スコア」がどれだけ近いかを百分率化したものです（軸ごとのばらつきで重み付けし、その学科に不可欠な軸が満たされない場合は控えめになります）。1 位と 2 位の差が小さい場合は「両方に適性がある」と読んでいただくのが正しい解釈です。"
          />
          <Faq
            q="「あなたは〜なタイプです」という特徴文はどう決まりますか？"
            short="15 種類の文を、軸スコアが閾値を超えた時のみ機械的に表示します。"
            a="例：抽象思考（ABS）軸が 0.7 以上 → 「目に見えないものの仕組みをじっくり考えるタイプです」を表示。占いや人格診断ではなく、回答結果から再現性のあるルールで選ばれます。同じ回答なら必ず同じ文が出ます。"
          />
          <Faq
            q="「大学を選ぶときに見てほしいポイント」はどう決まりますか？"
            short="20 種類の基準を、軸スコアに応じて 3〜4 個機械的に選びます。"
            a="例：院進志向（GRAD）が高い → 「大学院進学率」、資格志向（CERT）が高い → 「資格の合格率」。偏差値・難易度・立地・学費は意図的に含めていません（既存サービスに委ねる、または親子で判断すべき情報のため）。"
          />
        </div>
      </section>

      {/* 9. 連絡先 */}
      <section id="contact" className="mb-12 scroll-mt-6">
        <h2 className="mb-4 border-l-4 border-rose-600 pl-3 text-lg font-bold text-slate-900">
          9. お問い合わせ
        </h2>
        <p className="mb-4">
          ご質問・導入相談・デモのご希望、お気軽にどうぞ。1 営業日以内にご返信します。
        </p>
        <div className="mb-6 rounded border border-rose-100 bg-rose-50/50 p-5">
          <p className="mb-2 text-xs text-gray-600">
            <span className="font-semibold text-gray-900">開発者：</span>
            平井 壱城（東京理科大学 理学部第一部 応用化学科 3 年）
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-gray-900">メール：</span>
            <a
              href="mailto:info@ring-map.com"
              className="text-rose-700 underline"
            >
              info@ring-map.com
            </a>
          </p>
        </div>
        <a
          href="mailto:info@ring-map.com"
          className="inline-block rounded bg-rose-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-800"
        >
          お問い合わせフォーム（メール）
        </a>
      </section>

      <Link
        href="/"
        className="mt-12 inline-block text-xs text-gray-500 underline"
      >
        ← トップに戻る
      </Link>
    </article>
  );
}

function Faq({
  q,
  short,
  a,
}: {
  q: string;
  short: string;
  a: React.ReactNode;
}) {
  return (
    <details className="group mb-3 rounded border border-gray-200 bg-white open:border-rose-200 open:bg-rose-50/30">
      <summary className="cursor-pointer list-none p-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block text-xs font-bold text-rose-700 group-open:rotate-90 transition-transform">
            ▶
          </span>
          <div className="flex-1">
            <p className="mb-1 font-semibold text-gray-900">Q. {q}</p>
            <p className="text-xs text-gray-600">{short}</p>
          </div>
        </div>
      </summary>
      <div className="border-t border-gray-200 px-4 py-3 pl-11 text-gray-700">
        {a}
      </div>
    </details>
  );
}
