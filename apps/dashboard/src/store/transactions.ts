import type {
	Column,
	RowSelectionState,
	Updater,
	VisibilityState,
} from "@tanstack/react-table";
import { create } from "zustand";

export type TransactionTab = "all" | "review";

interface RowSelectionByTab {
	all: Record<string, boolean>;
	review: Record<string, boolean>;
}

interface TransactionsState {
	canDelete?: boolean;
	// Clear selection for a specific tab
	clearRowSelection: (tab: TransactionTab) => void;
	columns: Column<any, unknown>[];
	columnVisibility: VisibilityState;
	// Helper to get row selection for a specific tab
	getRowSelection: (tab: TransactionTab) => Record<string, boolean>;
	lastClickedIndex: number | null;
	// Per-tab row selection
	rowSelectionByTab: RowSelectionByTab;
	setCanDelete: (canDelete?: boolean) => void;
	setColumns: (columns?: Column<any, unknown>[]) => void;
	setColumnVisibility: (visibility: VisibilityState) => void;
	setLastClickedIndex: (index: number | null) => void;
	setRowSelection: (
		tab: TransactionTab,
		updater: Updater<RowSelectionState>
	) => void;
	setTransactionIds: (ids: string[]) => void;
	transactionIds: string[];
}

export const useTransactionsStore = create<TransactionsState>()((set, get) => ({
	columns: [],
	canDelete: false,
	columnVisibility: {},
	transactionIds: [],
	rowSelectionByTab: {
		all: {},
		review: {},
	},
	lastClickedIndex: null,
	setCanDelete: (canDelete) => set({ canDelete }),
	setColumnVisibility: (columnVisibility) => set({ columnVisibility }),
	setColumns: (columns) => set({ columns: columns || [] }),
	setTransactionIds: (ids) => set({ transactionIds: ids }),
	setRowSelection: (tab: TransactionTab, updater: Updater<RowSelectionState>) =>
		set((state) => {
			const currentSelection = state.rowSelectionByTab[tab];
			const newSelection =
				typeof updater === "function" ? updater(currentSelection) : updater;
			return {
				rowSelectionByTab: {
					...state.rowSelectionByTab,
					[tab]: newSelection,
				},
			};
		}),
	getRowSelection: (tab: TransactionTab) => get().rowSelectionByTab[tab],
	clearRowSelection: (tab: TransactionTab) =>
		set((state) => ({
			rowSelectionByTab: {
				...state.rowSelectionByTab,
				[tab]: {},
			},
		})),
	setLastClickedIndex: (index) => set({ lastClickedIndex: index }),
}));
