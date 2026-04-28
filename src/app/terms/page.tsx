import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "利用規約 | 学部診断",
  description: "学部診断の利用規約",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-10 text-sm leading-relaxed text-gray-700">
      <h1 className="mb-6 text-xl font-bold text-gray-900">利用規約</h1>
      <p className="mb-4">
        本規約は「学部診断」（以下「本サービス」）の利用条件を定めるものです。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        1. 本サービスの目的
      </h2>
      <p className="mb-4">
        本サービスは、進路選択における参考情報を提供することを目的とした個人開発のツールです。診断結果は学術的な根拠を保証するものではなく、進路決定の最終判断材料とすることを意図したものではありません。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        2. 利用上の注意
      </h2>
      <ul className="mb-4 ml-6 list-disc">
        <li className="mb-1">
          診断結果はあくまで参考情報です。最終的な進路選択はご自身の責任において行ってください。
        </li>
        <li>
          本サービスを利用したことによって生じたいかなる結果についても、運営者は一切の責任を負いません。
        </li>
      </ul>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        3. 知的財産権
      </h2>
      <p className="mb-4">
        本サービスのコンテンツに関する著作権、その他の知的財産権は運営者に帰属します。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        4. 禁止事項
      </h2>
      <p className="mb-4">
        本サービスの改変・再配布・商用利用、および本サービスを介した第三者への迷惑行為を禁止します。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        5. サービスの変更・停止
      </h2>
      <p className="mb-4">
        運営者は予告なく本サービスの内容を変更または停止する場合があります。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        6. 規約の変更
      </h2>
      <p className="mb-4">
        本規約は予告なく変更される場合があります。最新の規約は本ページにて公開いたします。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        7. お問い合わせ
      </h2>
      <p className="mb-4">
        本規約に関するお問い合わせは{" "}
        <a
          href="mailto:ichikipingjing8@gmail.com"
          className="text-blue-600 underline"
        >
          ichikipingjing8@gmail.com
        </a>{" "}
        までお願いいたします。
      </p>

      <p className="mt-8 text-xs text-gray-500">運営: OLEO-star</p>
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
