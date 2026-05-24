// Frontend data models for kanban board display
// These mirror the DB schema but with nested relations for the UI

import type { BoardId, CardAssigneeId, CardId, ColumnId, UserId } from "$types/ids";

export interface CardAssignee {
	id: CardAssigneeId;
	cardId: CardId;
	userId: UserId;
	user: {
		id: UserId;
		name: string | null;
		imageUrl: string | null;
	};
}

export interface Card {
	id: CardId;
	columnId: ColumnId;
	content: string;
	order: number;
	dueDate: number | null;
	archived: boolean;
	updatedAt: number | null;
	assignees?: CardAssignee[];
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
	description: string | null;
	columns: Column[];
}

export interface ProjectMember {
	id: UserId;
	name: string | null;
	imageUrl: string | null;
}
