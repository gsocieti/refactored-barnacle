import { login } from '../actions';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-5">
      <h1 className="font-display text-3xl font-extrabold">Masuk Admin Momiega</h1>
      {error && (
        <p role="alert" className="rounded-lg border-2 border-cabai bg-white p-3 text-sm">
          Email atau password salah, atau akun ini bukan admin.
        </p>
      )}
      <form action={login} className="space-y-4">
        <label className="block text-sm font-semibold">
          Email
          <input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-lg border-2 border-kuah px-3 py-2" />
        </label>
        <label className="block text-sm font-semibold">
          Password
          <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-lg border-2 border-kuah px-3 py-2" />
        </label>
        <button type="submit" className="btn w-full bg-cabai text-white">Masuk</button>
      </form>
    </main>
  );
}
