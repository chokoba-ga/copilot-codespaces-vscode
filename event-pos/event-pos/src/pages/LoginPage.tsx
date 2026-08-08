import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn, ReceiptText } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button, TextField } from '@/components/common';

export function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const signIn = useAuthStore((s) => s.signIn);
  const error = useAuthStore((s) => s.error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (status === 'signed-in') return <Navigate to="/events" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      // エラーメッセージは authStore 側で state に反映済み
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-6 dark:from-neutral-950 dark:to-neutral-950">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-brand-600 text-white shadow-[var(--shadow-soft-lg)]">
          <ReceiptText size={30} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-black text-neutral-900 dark:text-neutral-50">Event POS</h1>
          <p className="text-sm font-semibold text-neutral-400">学校イベント専用の会計アプリ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <TextField
          label="メールアドレス"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@school.example.com"
          required
        />
        <TextField
          label="パスワード"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}
        <Button type="submit" size="xl" fullWidth loading={submitting}>
          <LogIn size={20} />
          ログイン
        </Button>
      </form>

      <p className="mt-8 max-w-xs text-center text-xs leading-relaxed text-neutral-400">
        アカウントをお持ちでない場合は、担当の先生・管理者に発行を依頼してください。
      </p>
    </div>
  );
}
