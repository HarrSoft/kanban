import type { ProjectId, ProjectInfo, ProjectFull, Session } from "$types";

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // backend-available data
    interface Locals {
      session: Session | null;
    }

    // frontend-available data
    // (use optional values for data only on specific pages)
    //interface PageData {}

    //interface Error {}
    //interface PageState {}
    //interface Platform {}
  }
}

export {};
