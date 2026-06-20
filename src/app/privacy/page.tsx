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
        質問への回答内容（個別の選択肢）は、お使いのブラウザの localStorage 内でのみ保持され、外部サーバーへは送信されません。診断完了時に算出される統計情報（後述）のみが運営者の集計システムへ送信されます。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        2. 診断完了時に送信される情報
      </h2>
      <p className="mb-2">
        本サービスはサービス改善および進路指導サポートを目的として、診断完了時に以下の情報を Google Workspace 上の集計システムへ送信します。
      </p>
      <p className="mb-2 font-medium text-gray-900">a. 全モード共通</p>
      <ul className="mb-3 list-inside list-disc">
        <li>診断結果（適合度上位の学科・適合度スコア・22軸スコア）</li>
        <li>選んだ診断バージョン（全学科 / 文系 / 理系）</li>
        <li>回答変更ログ（どの質問で選択をやり直したかの回数）— 質問文の分かりやすさを改善するための指標です</li>
        <li>匿名識別子（session_id）— 完全にランダムな文字列で、個人を特定する情報を含みません</li>
      </ul>
      <p className="mb-2 font-medium text-gray-900">b. 個人モードでの任意項目</p>
      <ul className="mb-3 list-inside list-disc">
        <li>年齢（入力した場合のみ）</li>
      </ul>
      <p className="mb-2 font-medium text-gray-900">c. 学校モードでの追加情報</p>
      <ul className="mb-3 list-inside list-disc">
        <li>学校名・学校コード（文部科学省 学校コード）</li>
        <li>学年・クラス・出席番号</li>
      </ul>
      <p className="mb-2 font-medium text-gray-900">d. 結果ページでの任意フィードバック</p>
      <ul className="mb-3 list-inside list-disc">
        <li>診断結果に対する納得感（ピッタリ / 微妙 / 違うかも）</li>
        <li>任意で入力した理由テキスト</li>
      </ul>
      <p className="mb-4">
        氏名・メールアドレス・電話番号・正確な位置情報など、利用者個人を直接特定する情報は一切収集しません。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        3. 学校モードで入力した情報の共有
      </h2>
      <p className="mb-2">
        学校から案内されて利用した場合（学校モード）、入力した情報は <strong>該当する学校の進路指導担当の先生</strong> に閲覧専用で共有されます。
      </p>
      <ul className="mb-3 list-inside list-disc">
        <li>共有される範囲：自校の生徒分のみ。他校の情報は共有されません。</li>
        <li>共有先：診断を案内した学校の進路指導担当教員</li>
        <li>利用目的：生徒の進路指導の参考としての利用に限定</li>
        <li>共有方法：Google Sheets の閲覧専用リンク</li>
      </ul>
      <p className="mb-4">
        個人モードで利用した場合は、診断結果が個別の生徒に紐付く形で第三者と共有されることはありません。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        4. 集計情報の第三者提供
      </h2>
      <p className="mb-4">
        集計後の統計情報（例：「○○校の中3で人気のあった学科の傾向」「年齢層別の関心分野」など、個人を識別しない数値）は、進路指導や教育改善の参考として大学・学校・教育関係者と共有されることがあります。<strong>個別の利用者を識別する形での情報提供は行いません。</strong>
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        5. ホスティングサービスのアクセスログ
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
        6. Cookie・トラッキング
      </h2>
      <p className="mb-4">
        本サービスは現時点で独自の Cookie や行動追跡ツールを設置していません。将来的にサイト改善のためのアクセス解析ツールを導入する場合は、本ポリシーを更新したうえで、個人を特定しない設定で運用します。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        7. データの保持と削除依頼
      </h2>
      <p className="mb-4">
        収集した情報は、本サービスの品質改善および進路指導サポートのために期限を定めず保管します。学校モードで送信したデータの削除をご希望の場合、または学校アカウントとの紐付けを解除したい場合は、後述のお問い合わせ先までご連絡ください。匿名識別子（session_id）と該当の学校・学年・出席番号をお知らせいただければ、可能な範囲で削除に対応します。
      </p>

      <h2 className="mb-2 mt-6 text-base font-semibold text-gray-900">
        8. お問い合わせ
      </h2>
      <p className="mb-4">
        本ポリシーに関するお問い合わせ・データ削除依頼は{" "}
        <a
          href="mailto:ichikipingjing8@gmail.com"
          className="text-blue-600 underline"
        >
          ichikipingjing8@gmail.com
        </a>{" "}
        までお願いいたします。
      </p>

      <p className="mt-8 text-xs text-gray-500">運営: OLEO-star</p>
      <p className="mt-1 text-xs text-gray-400">最終更新日: 2026年5月18日</p>

      <Link
        href="/"
        className="mt-8 inline-block text-xs text-gray-500 underline"
      >
        ← トップに戻る
      </Link>
    </article>
  );
}
