// Frontend data models for kanban board display
// These mirror the DB schema but with nested relations for the UI

import type { BoardId, ColumnId, CardId } from "$types/ids";

export interface Card {
	id: CardId;
	columnId: ColumnId;
	content: string;
	order: number;
}

export interface Column {
	id: ColumnId;
	boardId: BoardId;
	name: string;
	order: number;
	cards: Card[];
}

export interface Board {
	id: BoardId;
	projectId: string;
	name: string;
	columns: Column[];
}
