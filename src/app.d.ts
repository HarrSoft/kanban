import type { Session, UserFull } from "$types";

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  type Result<T, E> = { ok: T } | { err: E };

  namespace App {
    // backend-available data
    interface Locals {
      session: Session | null;
      user: UserFull | null;
    }

    // frontend-available data
    // (use optional values for data only on specific pages)
    interface PageData {
      session: Session | null;
      user: UserFull | null;
    }

    interface Error {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
