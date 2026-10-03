import { useState, type FormEventHandler, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/useAuth';

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address.'));

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Enter your password.'),
});

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(100, 'Name must be 100 characters or fewer.'),
  email: emailField,
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type FormMode = 'login' | 'register';

function getSubmissionError(error: unknown, mode: FormMode): string {
  if (error instanceof ApiError) {
    if (mode === 'login' && error.status === 401) return 'Invalid email or password.';
    if (mode === 'register' && (error.status === 409 || error.code === 'EMAIL_ALREADY_EXISTS')) {
      return 'An account with this email already exists.';
    }
  }

  if (error instanceof TypeError) {
    return 'Unable to reach the server. Check your connection and try again.';
  }

  return mode === 'login'
    ? 'Unable to sign in. Try again.'
    : 'Unable to create your account. Try again.';
}

function AuthFrame({
  mode,
  children,
  error,
}: {
  mode: FormMode;
  children: ReactNode;
  error: string | null;
}) {
  const isRegister = mode === 'register';

  return (
    <main className="min-h-screen bg-bg px-5 py-5 text-ink sm:px-8 sm:py-7">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-border pb-3">
        <Link
          aria-label="Kanban account pages"
          className="font-heading text-sm font-semibold tracking-tight text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          to="/login"
        >
          KANBAN / WORKSPACE
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          Account desk
        </span>
      </header>

      <div className="mx-auto grid max-w-6xl items-center gap-8 py-8 sm:py-12 lg:grid-cols-[1fr_0.82fr] lg:gap-16 lg:py-16">
        <section className="max-w-lg">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
            {isRegister ? 'Account / 02' : 'Account / 01'}
          </p>
          <h1 className="mt-3 max-w-md font-heading text-2xl font-semibold leading-tight tracking-tight">
            {isRegister ? 'Put the work in order.' : 'Keep the work in view.'}
          </h1>
          <p className="mt-4 max-w-md text-[13px] leading-5 text-muted">
            {isRegister
              ? 'Create an account to organize work with your team.'
              : 'Sign in to open your boards and continue sorting the work.'}
          </p>
          <div aria-hidden="true" className="mt-8 flex max-w-xs items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              Paper / ink / tasks
            </span>
          </div>
        </section>

        <section className="relative isolate mx-auto w-full max-w-md before:absolute before:inset-x-1 before:inset-y-1 before:-z-10 before:rotate-[1deg] before:border before:border-border before:bg-surface-subtle">
          <div className="border border-border bg-surface p-5 sm:p-6">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                  {isRegister ? 'New record' : 'Access record'}
                </p>
                <h2 className="mt-1 font-heading text-xl font-semibold">
                  {isRegister ? 'Create account' : 'Sign in'}
                </h2>
              </div>
              <span className="border border-border px-2 py-1 font-mono text-[10px] text-muted">
                {isRegister ? '02' : '01'}
              </span>
            </div>

            {error && (
              <div
                className="mt-4 border border-danger bg-surface px-3 py-2 text-[13px] text-danger"
                role="alert"
              >
                {error}
              </div>
            )}

            {children}

            <p className="mt-5 border-t border-border pt-4 text-[13px] text-muted">
              {isRegister ? 'Already have an account?' : 'New to this workspace?'}{' '}
              <Link
                className="font-medium text-ink underline decoration-border underline-offset-4 hover:decoration-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                to={isRegister ? '/login' : '/register'}
              >
                {isRegister ? 'Sign in' : 'Create an account'}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const submit: FormEventHandler<HTMLFormElement> = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values);
    } catch (error) {
      setServerError(getSubmissionError(error, 'login'));
    }
  });

  return (
    <AuthFrame error={serverError} mode="login">
      <form className="mt-4 space-y-4" noValidate onSubmit={submit}>
        <fieldset className="space-y-4" disabled={isSubmitting}>
          <div>
            <label className="mb-1 block text-[13px] font-medium" htmlFor="login-email">
              Email
            </label>
            <input
              autoComplete="email"
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              aria-invalid={Boolean(errors.email)}
              className={`w-full rounded border bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-muted hover:border-border-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:bg-bg ${
                errors.email
                  ? 'border-danger focus-visible:outline-danger'
                  : 'border-border focus-visible:outline-accent'
              }`}
              id="login-email"
              placeholder="name@example.com"
              type="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-danger" id="login-email-error">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-medium" htmlFor="login-password">
              Password
            </label>
            <input
              autoComplete="current-password"
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              aria-invalid={Boolean(errors.password)}
              className={`w-full rounded border bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-muted hover:border-border-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:bg-bg ${
                errors.password
                  ? 'border-danger focus-visible:outline-danger'
                  : 'border-border focus-visible:outline-accent'
              }`}
              id="login-password"
              type="password"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-danger" id="login-password-error">
                {errors.password.message}
              </p>
            )}
          </div>
        </fieldset>

        <button
          className="w-full rounded border border-ink bg-ink px-3 py-2 text-[13px] font-medium text-surface hover:bg-[#33312B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-muted"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthFrame>
  );
}

function RegisterPage() {
  const { register: createAccount } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const submit: FormEventHandler<HTMLFormElement> = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await createAccount(values);
    } catch (error) {
      setServerError(getSubmissionError(error, 'register'));
    }
  });

  return (
    <AuthFrame error={serverError} mode="register">
      <form className="mt-4 space-y-4" noValidate onSubmit={submit}>
        <fieldset className="space-y-4" disabled={isSubmitting}>
          <div>
            <label className="mb-1 block text-[13px] font-medium" htmlFor="register-name">
              Name
            </label>
            <input
              autoComplete="name"
              aria-describedby={errors.name ? 'register-name-error' : undefined}
              aria-invalid={Boolean(errors.name)}
              className={`w-full rounded border bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-muted hover:border-border-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:bg-bg ${
                errors.name
                  ? 'border-danger focus-visible:outline-danger'
                  : 'border-border focus-visible:outline-accent'
              }`}
              id="register-name"
              placeholder="Your name"
              type="text"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-danger" id="register-name-error">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-medium" htmlFor="register-email">
              Email
            </label>
            <input
              autoComplete="email"
              aria-describedby={errors.email ? 'register-email-error' : undefined}
              aria-invalid={Boolean(errors.email)}
              className={`w-full rounded border bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-muted hover:border-border-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:bg-bg ${
                errors.email
                  ? 'border-danger focus-visible:outline-danger'
                  : 'border-border focus-visible:outline-accent'
              }`}
              id="register-email"
              placeholder="name@example.com"
              type="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-danger" id="register-email-error">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-medium" htmlFor="register-password">
              Password
            </label>
            <input
              autoComplete="new-password"
              aria-describedby={
                errors.password ? 'register-password-error' : 'register-password-hint'
              }
              aria-invalid={Boolean(errors.password)}
              className={`w-full rounded border bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-muted hover:border-border-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:bg-bg ${
                errors.password
                  ? 'border-danger focus-visible:outline-danger'
                  : 'border-border focus-visible:outline-accent'
              }`}
              id="register-password"
              type="password"
              {...register('password')}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-danger" id="register-password-error">
                {errors.password.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted" id="register-password-hint">
                Minimum 8 characters.
              </p>
            )}
          </div>
        </fieldset>

        <button
          className="w-full rounded border border-ink bg-ink px-3 py-2 text-[13px] font-medium text-surface hover:bg-[#33312B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-muted"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthFrame>
  );
}

export function AuthPages() {
  const { pathname } = useLocation();
  return pathname === '/register' ? <RegisterPage /> : <LoginPage />;
}
