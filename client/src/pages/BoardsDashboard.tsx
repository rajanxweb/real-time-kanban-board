import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ApiError, apiRequest } from '../api/client';
import { useAuth } from '../auth/useAuth';

type Board = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  role: 'OWNER' | 'MEMBER';
};

type CreateBoardInput = {
  title: string;
  description?: string;
};

const BOARDS_QUERY_KEY = ['boards'];

async function fetchBoards(): Promise<Board[]> {
  const response = await apiRequest<{ boards: Board[] }>('/boards');
  return response.boards;
}

function getRequestError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) {
    return 'Unable to reach the server. Check your connection and try again.';
  }
  return 'The request could not be completed. Try again.';
}

function BoardLoadingRows() {
  return (
    <div aria-label="Loading boards" aria-busy="true" className="divide-y divide-border border-y border-border">
      {[0, 1, 2].map((row) => (
        <div className="flex items-center gap-4 py-4" key={row}>
          <span aria-hidden="true" className="h-4 w-48 animate-pulse bg-surface-subtle" />
          <span aria-hidden="true" className="hidden h-3 w-64 animate-pulse bg-surface-subtle sm:block" />
          <span aria-hidden="true" className="ml-auto h-3 w-16 animate-pulse bg-surface-subtle" />
        </div>
      ))}
      <span className="sr-only" role="status">Loading your boards...</span>
    </div>
  );
}

export function BoardsDashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const boardsQuery = useQuery({
    queryKey: BOARDS_QUERY_KEY,
    queryFn: fetchBoards,
  });
  const createBoard = useMutation({
    mutationFn: (input: CreateBoardInput) =>
      apiRequest<{ board: Board }>('/boards', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setTitle('');
      setDescription('');
      await queryClient.invalidateQueries({ queryKey: BOARDS_QUERY_KEY });
    },
  });
  const deleteBoard = useMutation({
    mutationFn: (boardId: string) =>
      apiRequest<void>(`/boards/${encodeURIComponent(boardId)}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BOARDS_QUERY_KEY });
    },
  });

  function handleCreateBoard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const trimmedDescription = description.trim();
    createBoard.mutate({
      title: trimmedTitle,
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
    });
  }

  function handleDeleteBoard(board: Board) {
    if (window.confirm(`Delete "${board.title}"? This also deletes its lists and cards.`)) {
      deleteBoard.mutate(board.id);
    }
  }

  return (
    <main className="min-h-screen bg-bg px-5 py-5 text-ink sm:px-8 sm:py-7">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-border pb-3">
        <p className="font-heading text-sm font-semibold tracking-tight">KANBAN / WORKSPACE</p>
        <div className="flex items-center gap-3">
          <span className="max-w-40 truncate text-[13px] text-muted sm:max-w-none">{user?.name}</span>
          <button
            className="border border-border px-2 py-1 text-[12px] font-medium hover:border-border-hover hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            onClick={logout}
            type="button"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl">
        <section className="flex flex-col justify-between gap-4 border-b border-border py-6 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
              Workspace / boards
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">Your boards</h1>
          </div>
          {boardsQuery.isSuccess && (
            <p className="font-mono text-[11px] text-muted">
              {boardsQuery.data.length} {boardsQuery.data.length === 1 ? 'board' : 'boards'}
            </p>
          )}
        </section>

        <section aria-labelledby="create-board-heading" className="border-b border-border py-5">
          <div className="mb-3">
            <h2 className="font-heading text-base font-semibold" id="create-board-heading">
              Create a board
            </h2>
            <p className="mt-1 text-[13px] text-muted">Start a shared space for a project or team.</p>
          </div>
          <form className="grid gap-3 sm:grid-cols-[minmax(12rem,0.8fr)_minmax(16rem,1.4fr)_auto] sm:items-end" onSubmit={handleCreateBoard}>
            <div>
              <label className="mb-1 block text-[12px] font-medium" htmlFor="board-title">Board name</label>
              <input
                autoComplete="off"
                className="w-full border border-border bg-surface px-3 py-2 text-[13px] placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                id="board-title"
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Product launch"
                required
                value={title}
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium" htmlFor="board-description">Description <span className="font-normal text-muted">(optional)</span></label>
              <input
                className="w-full border border-border bg-surface px-3 py-2 text-[13px] placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                id="board-description"
                maxLength={1000}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="A short note about this workspace"
                value={description}
              />
            </div>
            <button
              className="border border-ink bg-ink px-4 py-2 text-[13px] font-medium text-bg hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
              disabled={createBoard.isPending || !title.trim()}
              type="submit"
            >
              {createBoard.isPending ? 'Creating...' : 'Create board'}
            </button>
          </form>
          {createBoard.isError && (
            <p className="mt-3 text-[13px] text-danger" role="alert">
              {getRequestError(createBoard.error)}
            </p>
          )}
        </section>

        <section aria-labelledby="boards-heading" className="py-5">
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted" id="boards-heading">
            Board list
          </h2>

          {boardsQuery.isPending && <BoardLoadingRows />}

          {boardsQuery.isError && (
            <div className="border border-danger bg-surface px-4 py-4" role="alert">
              <p className="text-[13px] text-danger">{getRequestError(boardsQuery.error)}</p>
              <button
                className="mt-3 border border-border px-3 py-1.5 text-[12px] font-medium hover:border-border-hover hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                onClick={() => void boardsQuery.refetch()}
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {boardsQuery.isSuccess && boardsQuery.data.length === 0 && (
            <div className="border-y border-border bg-surface px-4 py-6">
              <h3 className="font-heading text-base font-semibold">No boards yet</h3>
              <p className="mt-1 text-[13px] text-muted">Create a board above to organize work with your team.</p>
            </div>
          )}

          {boardsQuery.isSuccess && boardsQuery.data.length > 0 && (
            <div className="divide-y divide-border border-y border-border">
              {boardsQuery.data.map((board) => (
                <article className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center" key={board.id}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="truncate font-heading text-base font-semibold">
                        <Link
                          aria-label={`Open board: ${board.title}`}
                          className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                          to={`/boards/${encodeURIComponent(board.id)}`}
                        >
                          {board.title}
                        </Link>
                      </h3>
                      <span className="border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                        {board.role === 'OWNER' ? 'Owner' : 'Member'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[13px] text-muted">
                      {board.description || 'No description'}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-[10px] text-muted">
                    Updated {new Date(board.updatedAt).toLocaleDateString()}
                  </p>
                  {board.role === 'OWNER' && (
                    <button
                      className="self-start border border-border px-2 py-1 text-[12px] font-medium text-danger hover:border-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 sm:self-auto"
                      disabled={deleteBoard.isPending}
                      onClick={() => handleDeleteBoard(board)}
                      type="button"
                    >
                      Delete
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}

          {deleteBoard.isError && (
            <p className="mt-3 text-[13px] text-danger" role="alert">
              {getRequestError(deleteBoard.error)}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
