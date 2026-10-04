import type { RowData } from '@tanstack/react-table';

/** The id `getRowId` returns for a row. */
export type RowId = string;

/** One row's worth of work in a save. */
export type ChangeSetOperation =
  | {
      op: 'update';
      id: RowId;
      /** The row version the user started from (`editing.getRowVersion`), for optimistic locking. */
      version?: number | string;
      /** Only the fields that changed, keyed by column id (= field name). */
      changes: Record<string, unknown>;
    }
  | {
      op: 'create';
      /** Temporary client id ("tmp_1"); the server returns the real id. Used from PR D. */
      tempId: string;
      values: Record<string, unknown>;
    };

/**
 * What the grid hands to `editing.onSave`. Backend-neutral: map it to whatever your
 * API expects (one batch request, several PATCH calls, a GraphQL mutation…).
 */
export type ChangeSet = { operations: ChangeSetOperation[] };

/**
 * What `onSave` resolves to. A discriminated union: `ok` (and `kind`) say which other
 * fields exist, so `switch (result.kind)` is checked by TypeScript.
 *
 * Resolving to nothing (`void`) also counts as success.
 */
export type SaveResult =
  | {
      ok: true;
      /** Real ids for rows created with a temp id. */
      created?: Array<{ tempId: string; id: RowId; version?: number | string }>;
    }
  | {
      ok: false;
      kind: 'validation';
      /** Messages per row id (or temp id): per field, and for the whole row. */
      rows: Record<
        RowId,
        { fields?: Record<string, string[]>; row?: string[] }
      >;
    }
  | {
      ok: false;
      kind: 'conflict';
      /** Rows someone else changed since the user's `version`. */
      rows: Array<{
        id: RowId;
        version: number | string;
        current: Record<string, unknown>;
        by?: string;
        at?: string;
      }>;
    };

/** Turns on edit mode. Pass it as `<DataGrid editing={…}>`. */
export type DataGridEditing<TData extends RowData> = {
  /**
   * Persist the changes. The grid keeps the draft until this resolves to success, so a
   * failed save never loses work. Your app owns the network call; the grid doesn't fetch.
   */
  onSave: (changes: ChangeSet) => Promise<SaveResult | void>;
  /** The row's version (e.g. a JPA `@Version`), sent with each update for conflict checks. */
  getRowVersion?: (row: TData) => number | string | undefined;
  /** Locked rows can't be edited at all (e.g. paid invoices). Receives the saved row, not the draft. */
  isRowLocked?: (row: TData) => boolean;
  /**
   * Shows a "Type here to add a row…" row at the bottom, and lets a paste run past the
   * last row (extra rows are added). New rows are sent as `create` operations.
   * @default false
   */
  allowAdd?: boolean;
  /** Starting values for a new row (e.g. `{ status: 'Draft' }`). Sent with the row. */
  newRow?: () => Partial<TData>;
};

/** One row the server says changed since the user's version (`SaveResult` kind `conflict`). */
export type SaveConflict = Extract<
  SaveResult,
  { kind: 'conflict' }
>['rows'][number];
