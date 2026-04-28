import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 学部診断",
  description: "学部診断のプライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-10 text-sm leading-relaxed text-gray-700">
      <h1 className="mb-6 text-xl font-bold text-gray-900">
        プライバシーポリシー
      </h1>
      <p className="mb-4">
        本ポリシーは「学部診断」（以下「本サービス」）における情報の取り扱いについて定めるものです。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        1. 回答内容の取り扱い
      </h2>
      <p className="mb-4">
        質問への回答内容は、お使いのブラウザの localStorage 内でのみ保持され、外部のサーバーへ送信されることはありません。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        2. 診断結果の集計
      </h2>
      <p className="mb-4">
        診断結果（最終的に算出された上位の学科候補と適合度スコア）は、サービス改善および進学傾向の集計を目的として、個人を識別しない匿名情報として運営者が管理する集計システム（Google Workspace）に記録される場合があります。記録される情報には、利用者個人を特定し得る情報（氏名・メールアドレス・正確な位置情報等）は含まれません。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        3. 第三者への提供
      </h2>
      <p className="mb-4">
        集計後の統計情報（例：特定の期間に最も適合された学科の傾向など）は、進学指導の参考として大学・学校等の第三者と共有されることがあります。
        <strong>個別の利用者を識別する形での情報提供は行いません。</strong>
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        4. ホスティングサービスのアクセスログ
      </h2>
      <p className="mb-4">
        本サービスは Vercel Inc. のホスティング基盤上で稼働しています。Vercel は標準的なアクセスログ（IP アドレス・User-Agent・リクエスト日時等）を収集する場合があります。詳細は{" "}
        <a
          href="https://vercel.com/legal/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Vercel のプライバシーポリシー
        </a>
        をご確認ください。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        5. Cookie・トラッキング
      </h2>
      <p className="mb-4">
        本サービスは独自の Cookie や解析ツールを設置していません。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        6. お問い合わせ
      </h2>
      <p className="mb-4">
        本ポリシーに関するお問い合わせは{" "}
        <a
          href="mailto:ichikipingjing8@gmail.com"
          className="text-blue-600 underline"
        >
          ichikipingjing8@gmail.com
        </a>{" "}
        までお願いいたします。
      </p>

      <p className="mt-8 text-xs text-gray-500">
        運営: OLEO-star
      </p>
      <p className="mt-1 text-xs text-gray-400">最終更新日: 2026年4月28日</p>

      <Link
        href="/"
        className="mt-8 inline-block text-xs text-gray-500 underline"
      >
        ← トップに戻る
      </Link>
    </article>
  );
}
