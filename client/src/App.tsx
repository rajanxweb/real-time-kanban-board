import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/useAuth';
import { AuthPages } from './pages/AuthPages';
import { BoardPage } from './pages/BoardPage';
import { BoardsDashboard } from './pages/BoardsDashboard';

function SessionLoading() {
  return (
    <main className="min-h-screen bg-bg px-6 py-8 text-ink" aria-busy="true">
      <div className="mx-auto max-w-5xl border-b border-border pb-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          Kanban / account
        </p>
      </div>
      <p className="mx-auto mt-8 max-w-5xl text-[13px] text-muted" role="status">
        Checking your session...
      </p>
    </main>
  );
}

function SessionError() {
  const { retrySession } = useAuth();

  return (
    <main className="min-h-screen bg-bg px-6 py-8 text-ink">
      <section className="mx-auto max-w-lg border border-border bg-surface p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink">
          Session / unavailable
        </p>
        <h1 className="mt-3 font-heading text-xl font-semibold">Unable to verify your session.</h1>
        <p className="mt-2 text-[13px] text-muted">Check your connection and try again.</p>
        <button
          className="mt-5 rounded border border-border bg-surface px-3 py-2 text-[13px] font-medium hover:border-border-hover hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          onClick={() => void retrySession()}
          type="button"
        >
          Retry
        </button>
      </section>
    </main>
  );
}

function PublicRoute() {
  const { user, isLoading, sessionError } = useAuth();

  if (isLoading) return <SessionLoading />;
  if (sessionError) return <SessionError />;
  if (user) return <Navigate replace to="/boards" />;

  return <Outlet />;
}

function ProtectedRoute() {
  const { user, isLoading, sessionError } = useAuth();

  if (isLoading) return <SessionLoading />;
  if (sessionError) return <SessionError />;
  if (!user) return <Navigate replace to="/login" />;

  return <Outlet />;
}

function BoardsRoute() {
  return <BoardsDashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route element={<AuthPages />} path="/login" />
        <Route element={<AuthPages />} path="/register" />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<BoardsRoute />} path="/boards" />
        <Route element={<BoardPage />} path="/boards/:boardId" />
      </Route>
      <Route element={<Navigate replace to="/login" />} path="*" />
    </Routes>
  );
}
