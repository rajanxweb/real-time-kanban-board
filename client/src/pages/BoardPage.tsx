import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ApiError, apiRequest } from '../api/client';

type BoardCard = {
  id: string;
  title: string;
  description: string | null;
};

type BoardList = {
  id: string;
  title: string;
  cards: BoardCard[];
};

type Board = {
  id: string;
  title: string;
  description: string | null;
  lists: BoardList[];
};

async function fetchBoard(boardId: string): Promise<Board> {
  const response = await apiRequest<{ board: Board }>(
    `/boards/${encodeURIComponent(boardId)}`,
  );
  return response.board;
}

function BoardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading board" className="mt-6">
      <p className="mb-4 font-mono text-[11px] text-muted" role="status">
        Loading board canvas...
      </p>
      <div className="flex gap-5 overflow-hidden">
        {[0, 1, 2].map((column) => (
          <div
            aria-hidden="true"
            className="h-80 w-[280px] shrink-0 border border-border bg-surface-subtle p-3"
            key={column}
          >
            <div className="h-4 w-2/3 animate-pulse bg-bg" />
            <div className="mt-5 space-y-2">
              <div className="h-16 animate-pulse border border-border bg-surface" />
              <div className="h-16 animate-pulse border border-border bg-surface" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoardUnavailable({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const isUnavailable =
    error instanceof ApiError && (error.status === 403 || error.status === 404);

  if (isUnavailable) {
    const message =
      error.status === 404
        ? 'This board was not found. It may have been deleted.'
        : 'You do not have permission to view this board.';

    return (
      <section
        aria-labelledby="board-unavailable-heading"
        className="mt-8 border border-border bg-surface px-5 py-5"
        role="status"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
          Board / unavailable
        </p>
        <h1
          className="mt-2 font-heading text-xl font-semibold"
          id="board-unavailable-heading"
        >
          Board unavailable
        </h1>
        <p className="mt-2 text-[13px] text-muted">{message}</p>
        <Link
          className="mt-5 inline-block border border-border px-3 py-2 text-[13px] font-medium hover:border-border-hover hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          to="/boards"
        >
          Return to dashboard
        </Link>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="board-error-heading"
      className="mt-8 border border-danger bg-surface px-5 py-5"
      role="alert"
    >
      <h1 className="font-heading text-xl font-semibold" id="board-error-heading">
        Unable to load board.
      </h1>
      <p className="mt-2 text-[13px] text-muted">
        Check your connection and try again.
      </p>
      <button
        className="mt-5 border border-border px-3 py-2 text-[13px] font-medium hover:border-border-hover hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        onClick={retry}
        type="button"
      >
        Retry
      </button>
    </section>
  );
}

export function BoardPage() {
  const { boardId } = useParams();
  const boardQuery = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => fetchBoard(boardId!),
    enabled: Boolean(boardId),
  });

  return (
    <main className="min-h-screen bg-bg px-5 py-5 text-ink sm:px-6 sm:py-6">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-border pb-3">
        <p className="font-heading text-sm font-semibold tracking-tight">
          KANBAN / WORKSPACE
        </p>
        <Link
          className="text-[13px] text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          to="/boards"
        >
          Board list
        </Link>
      </header>

      <div className="mx-auto max-w-6xl">
        {boardQuery.isPending && <BoardLoading />}

        {boardQuery.isError && (
          <BoardUnavailable
            error={boardQuery.error}
            retry={() => void boardQuery.refetch()}
          />
        )}

        {boardQuery.isSuccess && (
          <>
            <section className="border-b border-border py-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
                Workspace / board
              </p>
              <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                {boardQuery.data.title}
              </h1>
              {boardQuery.data.description && (
                <p className="mt-1 text-[13px] text-muted">
                  {boardQuery.data.description}
                </p>
              )}
            </section>

            {boardQuery.data.lists.length === 0 ? (
              <section
                aria-labelledby="empty-board-heading"
                className="mt-6 border border-dashed border-border bg-transparent px-6 py-6"
              >
                <h2
                  className="font-heading text-base font-semibold"
                  id="empty-board-heading"
                >
                  No lists on this board yet
                </h2>
                <p className="mt-1 text-[13px] text-muted">
                  Lists will appear here when they are added to the board.
                </p>
              </section>
            ) : (
              <section
                aria-label="Board lists"
                className="mt-5 flex min-h-[calc(100vh-12rem)] gap-5 overflow-x-auto overflow-y-hidden pb-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                tabIndex={0}
              >
                {boardQuery.data.lists.map((list) => (
                  <section
                    aria-labelledby={`list-${list.id}-heading`}
                    className="flex h-[calc(100vh-12rem)] min-h-[24rem] w-[280px] shrink-0 flex-col overflow-hidden border border-border bg-surface-subtle p-2.5"
                    key={list.id}
                  >
                    <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-surface-subtle px-1 py-2">
                      <h2
                        className="truncate font-heading text-sm font-semibold"
                        id={`list-${list.id}-heading`}
                      >
                        {list.title}
                      </h2>
                      <span
                        aria-label={`${list.cards.length} ${list.cards.length === 1 ? 'card' : 'cards'}`}
                        className="shrink-0 font-mono text-[11px] text-muted"
                      >
                        {list.cards.length}
                      </span>
                    </header>
                    <div
                      aria-label={`${list.title} cards`}
                      className="min-h-0 flex-1 space-y-2 overflow-y-auto pt-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                      tabIndex={0}
                    >
                      {list.cards.length === 0 ? (
                        <p className="px-1 py-2 text-[12px] text-muted">
                          No cards in this list.
                        </p>
                      ) : (
                        list.cards.map((card) => (
                          <article
                            className="border border-border bg-surface p-3"
                            key={card.id}
                          >
                            <h3 className="break-words text-[14px] font-medium leading-5">
                              {card.title}
                            </h3>
                            {card.description && (
                              <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-5 text-muted">
                                {card.description}
                              </p>
                            )}
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
