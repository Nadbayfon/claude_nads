import { signInWithGoogle, sendMagicLink } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md rounded-xl bg-white border border-muted-soft p-8 shadow-sm">
        <h1 className="font-display text-3xl text-charcoal">Crystal Events</h1>
        <p className="mt-2 text-sm text-muted">
          Planner sign-in. Allow-list applies.
        </p>

        <form action={signInWithGoogle} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-md bg-charcoal text-white py-2.5 hover:bg-gold-accent"
          >
            Continue with Google
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-muted-soft" />
          <span>or</span>
          <span className="h-px flex-1 bg-muted-soft" />
        </div>

        <SearchParamsBanner searchParams={searchParams} />

        <form action={sendMagicLink} className="space-y-3">
          <label className="block text-sm text-charcoal" htmlFor="email">
            Magic link
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@crystalevents.eu"
            className="w-full rounded-md border border-muted-soft px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-cream text-charcoal py-2.5 border border-muted-soft hover:bg-gold-tint"
          >
            Email me a link
          </button>
        </form>
      </div>
    </div>
  );
}

async function SearchParamsBanner({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  if (params.sent) {
    return (
      <p className="mb-4 rounded-md bg-ok-bg text-ok-green text-sm p-3">
        Magic link sent — check your inbox.
      </p>
    );
  }
  if (params.error) {
    return (
      <p className="mb-4 rounded-md bg-error-bg text-error-red text-sm p-3">
        {params.error}
      </p>
    );
  }
  return null;
}
