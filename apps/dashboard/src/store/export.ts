import { create } from "zustand";

export type ExportType = "file" | "accounting";

interface ExportData {
	accessToken?: string;
	/** Type of export: "file" for vault storage, "accounting" for provider sync */
	exportType?: ExportType;
	/** Provider name for accounting exports (e.g., "Xero", "QuickBooks") */
	providerName?: string;
	runId?: string;
}

interface ExportState {
	exportData?: ExportData;
	exportingTransactionIds: string[];
	isExporting: boolean;
	setExportData: (exportData?: ExportData) => void;
	setExportingTransactionIds: (ids: string[]) => void;
	setIsExporting: (isExporting: boolean) => void;
}

export const useExportStore = create<ExportState>()((set) => ({
	exportData: undefined,
	isExporting: false,
	exportingTransactionIds: [],
	setExportData: (exportData) => set({ exportData }),
	setIsExporting: (isExporting) => set({ isExporting }),
	setExportingTransactionIds: (exportingTransactionIds) =>
		set({ exportingTransactionIds }),
}));
