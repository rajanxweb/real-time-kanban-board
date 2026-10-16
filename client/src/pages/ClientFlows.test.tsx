import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { AuthContextValue } from '../auth/useAuth';
import { AuthContext } from '../auth/useAuth';
import { ApiError, apiRequest } from '../api/client';
import { AuthPages } from './AuthPages';
import { BoardPage } from './BoardPage';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return { ...actual, apiRequest: vi.fn() };
});

vi.mock('../socket/SocketProvider', () => ({
  BoardPresence: () => null,
  SocketProvider: ({ children }: { children: ReactNode }) => children,
}));

const requestMock = vi.mocked(apiRequest);

function renderBoard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/boards/board-1']}>
        <Routes><Route element={<BoardPage />} path="/boards/:boardId" /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('client flows', () => {
  beforeEach(() => requestMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it('shows login validation and does not submit invalid credentials', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    const auth: AuthContextValue = {
      user: null,
      isLoading: false,
      sessionError: null,
      login,
      register: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      retrySession: vi.fn().mockResolvedValue(undefined),
    };

    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={['/login']}><AuthPages /></MemoryRouter>
      </AuthContext.Provider>,
    );
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('creates a card from the inline composer', async () => {
    requestMock.mockImplementation(async (path) => {
      if (path === '/boards/board-1') {
        return { board: { id: 'board-1', title: 'Board', description: null, lists: [{ id: 'list-1', title: 'To do', cards: [] }] } } as never;
      }
      return { card: { id: 'card-1', title: 'Draft task', description: null, listId: 'list-1', position: 1000 } } as never;
    });

    renderBoard();
    fireEvent.click(await screen.findByRole('button', { name: '+ Add card' }));
    fireEvent.change(screen.getByLabelText('Card title'), { target: { value: 'Draft task' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add card' }));

    expect(screen.getByText('Draft task')).toBeInTheDocument();
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith(
      '/boards/board-1/lists/list-1/cards',
      expect.objectContaining({ method: 'POST' }),
    ));
  });

  it('shows the empty state when a board has no lists', async () => {
    requestMock.mockResolvedValue({ board: { id: 'board-1', title: 'Board', description: null, lists: [] } } as never);

    renderBoard();

    expect(await screen.findByText('No lists on this board yet')).toBeInTheDocument();
    expect(screen.getByText('Create a list to begin organizing tasks.')).toBeInTheDocument();
  });

  it('lets the board owner invite and remove members', async () => {
    let invited = false;
    requestMock.mockImplementation(async (path, init) => {
      if (path === '/boards/board-1') {
        return { board: { id: 'board-1', title: 'Board', description: null, currentUserRole: 'OWNER', lists: [] } } as never;
      }
      if (path === '/boards/board-1/members' && init?.method === 'POST') {
        invited = true;
        return { member: { id: 'member-3', userId: 'user-3', name: 'Casey Jones', email: 'casey@example.com', role: 'MEMBER' } } as never;
      }
      if (path === '/boards/board-1/members') {
        const members = [
          { id: 'member-1', userId: 'user-1', name: 'Alice Cooper', email: 'alice@example.com', role: 'OWNER' },
          { id: 'member-2', userId: 'user-2', name: 'Bob Vance', email: 'bob@example.com', role: 'MEMBER' },
        ];
        return { members: invited ? [...members, { id: 'member-3', userId: 'user-3', name: 'Casey Jones', email: 'casey@example.com', role: 'MEMBER' }] : members } as never;
      }
      return { message: 'Member removed successfully' } as never;
    });

    renderBoard();
    fireEvent.click(await screen.findByRole('button', { name: 'Members' }));

    expect(await screen.findByText('Alice Cooper')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Alice Cooper' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Bob Vance' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Invite by email'), { target: { value: 'casey@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Invite member' }));

    expect(await screen.findByText('Casey Jones')).toBeInTheDocument();
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith(
      '/boards/board-1/members',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'casey@example.com' }) }),
    ));
    fireEvent.click(screen.getByRole('button', { name: 'Remove Bob Vance' }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith(
      '/boards/board-1/members/user-2',
      expect.objectContaining({ method: 'DELETE' }),
    ));
  });

  it('shows the API error when an invite email has no matching user', async () => {
    requestMock.mockImplementation(async (path, init) => {
      if (path === '/boards/board-1') {
        return { board: { id: 'board-1', title: 'Board', description: null, currentUserRole: 'OWNER', lists: [] } } as never;
      }
      if (path === '/boards/board-1/members' && init?.method === 'POST') {
        throw new ApiError('No user found with this email', 400, 'USER_NOT_FOUND');
      }
      return { members: [] } as never;
    });

    renderBoard();
    fireEvent.click(await screen.findByRole('button', { name: 'Members' }));
    fireEvent.change(await screen.findByLabelText('Invite by email'), { target: { value: 'unknown@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Invite member' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No user found with this email');
  });
});
