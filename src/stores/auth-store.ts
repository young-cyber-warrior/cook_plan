import type { Session } from '@supabase/supabase-js';
import { makeAutoObservable } from 'mobx';

import { toMessage } from '@/lib/errors';
import { log } from '@/lib/log';
import type { Scope } from '@/lib/scope';
import { supabase } from '@/lib/supabase';

import type { ErrorsStore } from './errors-store';

export type AuthResult = { ok: true } | { ok: false; message: string };

export class AuthStore {
  session: Session | null = null;
  sessionChecked = false;

  constructor(private errors: ErrorsStore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get userId(): string | null {
    return this.session?.user.id ?? null;
  }

  get email(): string | null {
    return this.session?.user.email ?? null;
  }
  
  private setSession(session: Session | null) {
    this.session = session;
  }

  private setSessionChecked() {
    this.sessionChecked = true;
  }

  async init(scope: Scope) {
    try {
      const { data, error } = await scope.wait(supabase.auth.getSession());
      if (error) throw error;
      this.setSession(data.session);
    } catch (error) {
      this.errors.notify('auth.init', error);
    } finally {
      if (!scope.closed) this.setSessionChecked();
    }

    const { data } = supabase.auth.onAuthStateChange((_event, next) => this.setSession(next));
    scope.add(() => data.subscription.unsubscribe());
  }
  private async request(
    source: string,
    send: () => Promise<{ error: unknown }>,
  ): Promise<AuthResult> {
    const started = Date.now();
    log.start(source);
    try {
      const { error } = await send();
      if (error) throw error;
      log.done(source, Date.now() - started);
      return { ok: true };
    } catch (cause) {
      log.fail(source, Date.now() - started, cause);
      return { ok: false, message: toMessage(cause) };
    }
  }

  signIn(email: string, password: string): Promise<AuthResult> {
    return this.request('auth.signIn', () => supabase.auth.signInWithPassword({ email, password }));
  }

  signUp(email: string, password: string): Promise<AuthResult> {
    return this.request('auth.signUp', () => supabase.auth.signUp({ email, password }));
  }

  signOut(): Promise<AuthResult> {
    return this.request('auth.signOut', () => supabase.auth.signOut());
  }
}
