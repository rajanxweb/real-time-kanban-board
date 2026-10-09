import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, apiRequest } from '../api/client';

type BoardCard = { id: string; title: string; description: string | null };
type BoardList = { id: string; title: string; cards: BoardCard[] };
type Board = { id: string; title: string; description: string | null; lists: BoardList[] };
type Toast = { id: number; message: string };
const boardKey = (id: string | undefined) => ['board', id];
const focusClass = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2';
const inputClass = `w-full border border-border bg-surface px-2.5 py-1.5 text-[13px] ${focusClass}`;
const buttonClass = `border border-border bg-surface px-3 py-1.5 text-[13px] hover:border-border-hover hover:bg-bg ${focusClass}`;

async function fetchBoard(boardId: string): Promise<Board> {
  const response = await apiRequest<{ board: Board }>(`/boards/${encodeURIComponent(boardId)}`);
  return response.board;
}

function BoardLoading() {
  return <div aria-busy="true" aria-label="Loading board" className="mt-6"><p className="mb-4 font-mono text-[11px] text-muted" role="status">Loading board canvas...</p><div className="flex gap-5 overflow-hidden">{[0, 1, 2].map((column) => <div aria-hidden="true" className="h-80 w-[280px] shrink-0 border border-border bg-surface-subtle p-3" key={column}><div className="h-4 w-2/3 animate-pulse bg-bg" /><div className="mt-5 space-y-2"><div className="h-16 animate-pulse border border-border bg-surface" /><div className="h-16 animate-pulse border border-border bg-surface" /></div></div>)}</div></div>;
}

function BoardUnavailable({ error, retry }: { error: unknown; retry: () => void }) {
  const denied = error instanceof ApiError && (error.status === 403 || error.status === 404);
  if (denied) return <section className="mt-8 border border-border bg-surface px-5 py-5" role="status"><p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">Board / unavailable</p><h1 className="mt-2 font-heading text-xl font-semibold">Board unavailable</h1><p className="mt-2 text-[13px] text-muted">{error.status === 404 ? 'This board was not found. It may have been deleted.' : 'You do not have permission to view this board.'}</p><Link className={`${buttonClass} mt-5 inline-block`} to="/boards">Return to dashboard</Link></section>;
  return <section className="mt-8 border border-danger bg-surface px-5 py-5" role="alert"><h1 className="font-heading text-xl font-semibold">Unable to load board.</h1><p className="mt-2 text-[13px] text-muted">Check your connection and try again.</p><button className={`${buttonClass} mt-5`} onClick={retry} type="button">Retry</button></section>;
}

function CardDialog({ card, onClose, onSave, onDelete }: { card: BoardCard; onClose: () => void; onSave: (title: string, description: string) => void; onDelete: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = dialog.current?.querySelector<HTMLElement>('input, textarea, button');
    focusable?.focus();
    return () => previousFocus.current?.focus();
  }, []);
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
    if (event.key !== 'Tab' || !dialog.current) return;
    const items = [...dialog.current.querySelectorAll<HTMLElement>('input, textarea, button')].filter((item) => !item.hasAttribute('disabled'));
    const first = items[0]; const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div aria-labelledby="card-dialog-title" aria-modal="true" className="w-full max-w-[540px] border border-border bg-surface p-5 shadow-[0_8px_24px_rgba(27,26,23,0.14)]" onKeyDown={onKeyDown} ref={dialog} role="dialog">
      <div className="flex items-center justify-between border-b border-border pb-3"><h2 className="font-heading text-xl font-semibold" id="card-dialog-title">Edit card</h2><button aria-label="Close card details" className={buttonClass} onClick={onClose} type="button">Close</button></div>
      <form className="space-y-4 py-4" onSubmit={(event: FormEvent) => { event.preventDefault(); onSave(title.trim(), description); }}>
        <label className="block space-y-1 text-[12px] text-muted">Title<input className={inputClass} maxLength={200} onChange={(event) => setTitle(event.target.value)} required value={title} /></label>
        <label className="block space-y-1 text-[12px] text-muted">Description<textarea className={`${inputClass} min-h-32`} onChange={(event) => setDescription(event.target.value)} placeholder="Add a description for this task..." value={description} /></label>
        <div className="flex justify-between border-t border-border pt-3"><button className={`${buttonClass} border-danger text-danger`} onClick={onDelete} type="button">Delete card</button><button className="border border-ink bg-ink px-3 py-1.5 text-[13px] text-surface hover:bg-ink/90" type="submit">Save changes</button></div>
      </form>
    </div>
  </div>;
}

export function BoardPage() {
  const { boardId } = useParams();
  const queryClient = useQueryClient();
  const key = boardKey(boardId);
  const boardQuery = useQuery({ queryKey: key, queryFn: () => fetchBoard(boardId!), enabled: Boolean(boardId) });
  const [selectedCard, setSelectedCard] = useState<BoardCard | null>(null);
  const [newList, setNewList] = useState('');
  const [composer, setComposer] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [cardTitle, setCardTitle] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const announceFailure = (message: string) => { const id = ++toastId.current; setToasts((current) => [...current, { id, message }]); window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000); };
  async function optimistic(update: (board: Board) => Board, request: () => Promise<unknown>) {
    const previous = queryClient.getQueryData<Board>(key);
    if (previous) queryClient.setQueryData<Board>(key, update(previous));
    try { await request(); } catch { if (previous) queryClient.setQueryData(key, previous); announceFailure('Unable to save board changes. Check your network connection and retry.'); }
  }
  function runMutation(update: (board: Board) => Board, request: () => Promise<unknown>) { void optimistic(update, request); }

  return <main className="min-h-screen bg-bg px-5 py-5 text-ink sm:px-6 sm:py-6">
    <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-border pb-3"><p className="font-heading text-sm font-semibold tracking-tight">KANBAN / WORKSPACE</p><Link className={`text-[13px] text-muted hover:text-ink ${focusClass}`} to="/boards">Board list</Link></header>
    <div className="mx-auto max-w-6xl">
      {boardQuery.isPending && <BoardLoading />}
      {boardQuery.isError && <BoardUnavailable error={boardQuery.error} retry={() => void boardQuery.refetch()} />}
      {boardQuery.isSuccess && <>
        <section className="flex items-end justify-between gap-4 border-b border-border py-5"><div><p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">Workspace / board</p><h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">{boardQuery.data.title}</h1>{boardQuery.data.description && <p className="mt-1 text-[13px] text-muted">{boardQuery.data.description}</p>}</div>
          <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); const title = newList.trim(); if (!title || !boardId) return; const tempId = `new-${Date.now()}`; const board = boardQuery.data; setNewList(''); runMutation((current) => ({ ...current, lists: [...current.lists, { id: tempId, title, cards: [] }] }), async () => { const result = await apiRequest<{ list: BoardList }>(`/boards/${encodeURIComponent(boardId)}/lists`, { method: 'POST', body: JSON.stringify({ title }) }); queryClient.setQueryData<Board>(key, (current) => current ? { ...current, lists: current.lists.map((list) => list.id === tempId ? result.list : list) } : board); }); }}><label className="sr-only" htmlFor="new-list">New list name</label><input className="w-40 border border-border bg-surface px-2.5 py-1.5 text-[13px]" id="new-list" onChange={(event) => setNewList(event.target.value)} placeholder="List name" value={newList} /><button className={buttonClass} type="submit">Add list</button></form>
        </section>
        <section aria-label="Board lists" className="mt-5 flex min-h-[calc(100vh-12rem)] gap-5 overflow-x-auto overflow-y-hidden pb-3">
          {boardQuery.data.lists.map((list) => <section aria-label={`${list.title} list`} className="flex h-[calc(100vh-12rem)] min-h-[24rem] w-[280px] shrink-0 flex-col overflow-hidden border border-border bg-surface-subtle p-2.5" key={list.id}>
            <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-surface-subtle px-1 py-2">
              {renaming === list.id ? <form className="flex min-w-0 flex-1 gap-1" onSubmit={(event) => { event.preventDefault(); const title = renameValue.trim(); if (!title || !boardId) return; setRenaming(null); runMutation((board) => ({ ...board, lists: board.lists.map((item) => item.id === list.id ? { ...item, title } : item) }), () => apiRequest(`/boards/${encodeURIComponent(boardId)}/lists/${encodeURIComponent(list.id)}`, { method: 'PATCH', body: JSON.stringify({ title }) })); }}><label className="sr-only" htmlFor={`rename-${list.id}`}>List name</label><input autoFocus className="min-w-0 flex-1 border border-border bg-surface px-1 text-[13px]" id={`rename-${list.id}`} onChange={(event) => setRenameValue(event.target.value)} value={renameValue} /><button aria-label="Save list name" className={buttonClass} type="submit">Save</button></form> : <><h2 className="min-w-0 flex-1 truncate font-heading text-sm font-semibold">{list.title}</h2><button aria-label={`Rename ${list.title}`} className="text-[11px] text-muted hover:text-ink" onClick={() => { setRenaming(list.id); setRenameValue(list.title); }} type="button">Rename</button><button aria-label={`Delete ${list.title}`} className="text-[11px] text-danger" onClick={() => { if (!window.confirm(`Delete “${list.title}” and all its cards?` ) || !boardId) return; runMutation((board) => ({ ...board, lists: board.lists.filter((item) => item.id !== list.id) }), () => apiRequest(`/boards/${encodeURIComponent(boardId)}/lists/${encodeURIComponent(list.id)}`, { method: 'DELETE' })); }} type="button">Delete</button></>}
              <span className="shrink-0 font-mono text-[11px] text-muted">{list.cards.length}</span>
            </header>
            <div aria-label={`${list.title} cards`} className="min-h-0 flex-1 space-y-2 overflow-y-auto pt-2">
              {list.cards.length === 0 && <p className="px-1 py-2 text-[12px] text-muted">No cards in this list.</p>}
              {list.cards.map((card) => <button className="block w-full border border-border bg-surface p-3 text-left hover:border-border-hover" key={card.id} onClick={() => setSelectedCard(card)} type="button"><span className="break-words text-[14px] font-medium leading-5">{card.title}</span>{card.description && <span className="mt-2 block whitespace-pre-wrap break-words text-[13px] leading-5 text-muted">{card.description}</span>}</button>)}
            </div>
            {composer === list.id ? <form className="space-y-2 border-t border-border pt-2" onSubmit={(event) => { event.preventDefault(); const title = cardTitle.trim(); if (!title || !boardId) return; const tempId = `new-${Date.now()}`; setCardTitle(''); setComposer(null); runMutation((board) => ({ ...board, lists: board.lists.map((item) => item.id === list.id ? { ...item, cards: [...item.cards, { id: tempId, title, description: null }] } : item) }), async () => { const result = await apiRequest<{ card: BoardCard }>(`/boards/${encodeURIComponent(boardId)}/lists/${encodeURIComponent(list.id)}/cards`, { method: 'POST', body: JSON.stringify({ title }) }); queryClient.setQueryData<Board>(key, (current) => current ? { ...current, lists: current.lists.map((item) => item.id === list.id ? { ...item, cards: item.cards.map((card) => card.id === tempId ? result.card : card) } : item) } : current); }); }}><label className="sr-only" htmlFor={`new-card-${list.id}`}>Card title</label><input autoFocus className={inputClass} id={`new-card-${list.id}`} onChange={(event) => setCardTitle(event.target.value)} placeholder="Card title" value={cardTitle} /><div className="flex gap-2"><button className={buttonClass} type="submit">Add card</button><button className="text-[12px] text-muted" onClick={() => { setComposer(null); setCardTitle(''); }} type="button">Cancel</button></div></form> : <button className="mt-2 border-t border-border py-2 text-left text-[12px] text-muted hover:text-ink" onClick={() => setComposer(list.id)} type="button">+ Add card</button>}
          </section>)}
        </section>
      </>}
    </div>
    {selectedCard && boardId && <CardEditor boardId={boardId} card={selectedCard} onClose={() => setSelectedCard(null)} onFailure={announceFailure} onUpdate={(card) => { setSelectedCard(card); queryClient.setQueryData<Board>(key, (board) => board ? { ...board, lists: board.lists.map((list) => ({ ...list, cards: list.cards.map((item) => item.id === card.id ? card : item) })) } : board); }} onQueryClient={queryClient} />}
    <div aria-live="polite" className="fixed bottom-6 right-6 z-50 space-y-2">{toasts.map((toast) => <p className="border border-surface/20 bg-ink px-3.5 py-2.5 text-[13px] text-surface" key={toast.id} role="status">{toast.message}</p>)}</div>
  </main>;
}

function CardEditor({ boardId, card, onClose, onFailure, onUpdate, onQueryClient }: { boardId: string; card: BoardCard; onClose: () => void; onFailure: (message: string) => void; onUpdate: (card: BoardCard) => void; onQueryClient: ReturnType<typeof useQueryClient> }) {
  const queryKey = boardKey(boardId);
  const save = useMutation({ mutationFn: (value: { title: string; description: string }) => apiRequest<{ card: BoardCard }>(`/boards/${encodeURIComponent(boardId)}/cards/${encodeURIComponent(card.id)}`, { method: 'PATCH', body: JSON.stringify(value) }), onMutate: async (value) => { await onQueryClient.cancelQueries({ queryKey }); const previous = onQueryClient.getQueryData<Board>(queryKey); const optimisticCard = { ...card, ...value, description: value.description || null }; onUpdate(optimisticCard); return { previous }; }, onError: (_error, _value, context) => { if (context?.previous) onQueryClient.setQueryData(queryKey, context.previous); onFailure('Unable to save card changes. Check your network connection and retry.'); }, onSuccess: (result) => { onUpdate(result.card); onClose(); } });
  const remove = useMutation({ mutationFn: () => apiRequest(`/boards/${encodeURIComponent(boardId)}/cards/${encodeURIComponent(card.id)}`, { method: 'DELETE' }), onMutate: async () => { await onQueryClient.cancelQueries({ queryKey }); const previous = onQueryClient.getQueryData<Board>(queryKey); onQueryClient.setQueryData<Board>(queryKey, (board) => board ? { ...board, lists: board.lists.map((list) => ({ ...list, cards: list.cards.filter((item) => item.id !== card.id) })) } : board); return { previous }; }, onError: (_error, _variables, context) => { if (context?.previous) onQueryClient.setQueryData(queryKey, context.previous); onFailure('Unable to delete card. Check your network connection and retry.'); }, onSuccess: onClose });
  return <CardDialog card={card} onClose={onClose} onDelete={() => remove.mutate()} onSave={(title, description) => save.mutate({ title, description })} />;
}
