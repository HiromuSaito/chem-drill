import { Link } from "react-router-dom";
import { FlaskConical, ArrowLeft } from "lucide-react";

export function TermsPage() {
  return (
    <div className="min-h-svh bg-muted/40">
      <header className="sticky top-0 z-10 flex items-center border-b bg-background px-6 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <FlaskConical className="size-5 text-primary" />
          Chem Drill
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          トップに戻る
        </Link>

        <article className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <h1 className="text-2xl font-bold">利用規約</h1>

          <p>
            この利用規約（以下「本規約」）は、Chem Drill（以下「本サービス」）の
            利用条件を定めるものです。本サービスをご利用いただく前に、
            本規約をよくお読みください。
          </p>

          <h2 className="text-xl font-semibold">1. サービスの概要</h2>
          <p>
            本サービスは、化学に関する学習を支援するためのクイズプラットフォームです。
            ユーザーは、化学物質に関する問題に取り組むことができます。
          </p>

          <h2 className="text-xl font-semibold">2. アカウント</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>本サービスの利用にはアカウント登録が必要です</li>
            <li>
              ユーザーは正確な情報を提供し、アカウントの安全を
              管理する責任を負います
            </li>
            <li>1人のユーザーが複数のアカウントを作成することは禁止します</li>
          </ul>

          <h2 className="text-xl font-semibold">3. 禁止事項</h2>
          <p>以下の行為を禁止します。</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>本サービスの不正利用・悪用</li>
            <li>他のユーザーへの嫌がらせや迷惑行為</li>
            <li>本サービスのセキュリティを侵害する行為</li>
            <li>自動化されたアクセスやスクレイピング</li>
            <li>法令に違反する行為</li>
          </ul>

          <h2 className="text-xl font-semibold">4. 知的財産権</h2>
          <p>
            本サービスのコンテンツ（問題、解説、デザイン等）に関する
            知的財産権は、本サービスの運営者に帰属します。
          </p>

          <h2 className="text-xl font-semibold">5. 免責事項</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>本サービスは「現状のまま」提供されます</li>
            <li>
              問題の正確性について最善を尽くしますが、
              誤りが含まれる可能性があります
            </li>
            <li>
              本サービスの利用により生じた損害について、
              運営者は法令上許容される範囲で責任を負いません
            </li>
          </ul>

          <h2 className="text-xl font-semibold">6. サービスの変更・停止</h2>
          <p>
            運営者は、事前の通知なく本サービスの内容を変更、
            または一時的もしくは永久に停止する場合があります。
          </p>

          <h2 className="text-xl font-semibold">7. 規約の変更</h2>
          <p>
            本規約は、必要に応じて変更されることがあります。
            変更後の規約は、本サービス上に掲載した時点で効力を生じるものとします。
          </p>

          <h2 className="text-xl font-semibold">8. お問い合わせ</h2>
          <p>
            本規約に関するお問い合わせは、以下のメールアドレスまでご連絡ください。
          </p>
          <p>
            <a
              href="mailto:support@chem-drill.com"
              className="text-primary underline underline-offset-4"
            >
              support@chem-drill.com
            </a>
          </p>
        </article>
      </main>
    </div>
  );
}
