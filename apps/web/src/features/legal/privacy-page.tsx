import { Link } from "react-router-dom";
import { FlaskConical, ArrowLeft } from "lucide-react";

export function PrivacyPage() {
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
          <h1 className="text-2xl font-bold">プライバシーポリシー</h1>

          <p>
            Chem Drill（以下「本サービス」）は、ユーザーのプライバシーを尊重し、
            個人情報の保護に努めています。本プライバシーポリシーは、
            本サービスにおける個人情報の取り扱いについて説明するものです。
          </p>

          <h2 className="text-xl font-semibold">1. 収集する情報</h2>
          <p>本サービスでは、以下の情報を収集します。</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>メールアドレス（ユーザー認証のため）</li>
            <li>ユーザー名・表示名（アカウント識別のため）</li>
          </ul>

          <h2 className="text-xl font-semibold">2. 情報の利用目的</h2>
          <p>収集した情報は、以下の目的でのみ使用します。</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>ユーザー認証（ワンタイムパスワード（OTP）の送信）</li>
            <li>アカウントの管理・識別</li>
          </ul>
          <p>
            マーケティング目的でのメール送信や、ニュースレターの配信は一切行いません。
          </p>

          <h2 className="text-xl font-semibold">3. 第三者への提供</h2>
          <p>
            ユーザーの個人情報は、原則として第三者に提供しません。
            ただし、以下の場合を除きます。
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>メールの送信に外部サービスを利用する場合があります</li>
            <li>法令に基づく開示要求があった場合</li>
          </ul>

          <h2 className="text-xl font-semibold">4. データの保持期間</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              ワンタイムパスワード（OTP）は発行から5分間のみ有効で、
              期限経過後に無効化されます
            </li>
            <li>
              アカウント情報は、ユーザーがアカウントを削除するまで保持されます
            </li>
          </ul>

          <h2 className="text-xl font-semibold">5. セキュリティ</h2>
          <p>
            本サービスでは、ユーザーの個人情報を保護するために、
            適切な技術的・組織的な安全対策を講じています。通信は SSL/TLS
            により暗号化されています。
          </p>

          <h2 className="text-xl font-semibold">6. Cookie の使用</h2>
          <p>
            本サービスでは、ユーザー認証セッションの管理のために Cookie
            を使用しています。これは本サービスの機能に
            必要なものであり、トラッキング目的では使用しません。
          </p>

          <h2 className="text-xl font-semibold">
            7. プライバシーポリシーの変更
          </h2>
          <p>
            本ポリシーは、必要に応じて変更されることがあります。
            重要な変更がある場合は、本サービス上でお知らせします。
          </p>

          <h2 className="text-xl font-semibold">8. お問い合わせ</h2>
          <p>
            プライバシーに関するお問い合わせは、以下のメールアドレスまでご連絡ください。
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
