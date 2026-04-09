"use client";

import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@faworra-new/ui/components/dropdown-menu";
import { Icons } from "@faworra-new/ui/components/icons";
import { Input } from "@faworra-new/ui/components/input";
import { cn } from "@faworra-new/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTransactionFilterParams } from "@/hooks/use-transaction-filter-params";
import { useTransactionTab } from "@/hooks/use-transaction-tab";
import { useTRPC } from "@/trpc/client";
import { formatAccountName } from "@/utils/format";
import { DateRangeFilter } from "./date-range-filter";
import { FilterList } from "./filter-list";
import { SelectCategory } from "./select-category";

type StatusFilter =
	| "blank"
	| "receipt_match"
	| "in_review"
	| "export_error"
	| "archived"
	| "excluded"
	| "exported";
type AttachmentFilter = "include" | "exclude";
type RecurringFilter = "all" | "weekly" | "monthly" | "annually";
type ManualFilter = "include" | "exclude";

type BaseFilterItem = { name: string };
type FilterItem<T extends string> = BaseFilterItem & { id: T };

type FilterMenuItemProps = {
	icon: (typeof Icons)[keyof typeof Icons];
	label: string;
	children: React.ReactNode;
};

type FilterCheckboxItemProps = {
	id: string;
	name: string;
	checked?: boolean;
	className?: string;
	onCheckedChange: () => void;
};

const defaultSearch = {
	q: null,
	attachments: null,
	start: null,
	end: null,
	categories: null,
	accounts: null,
	assignees: null,
	statuses: null,
	recurring: null,
	tags: null,
	amount_range: null,
	manual: null,
	type: null,
};

const statusFilters: FilterItem<StatusFilter>[] = [
	{ id: "blank", name: "No receipt" },
	{ id: "receipt_match", name: "Receipt found" },
	{ id: "in_review", name: "Ready to export" },
	{ id: "export_error", name: "Export failed" },
	{ id: "exported", name: "Exported" },
	{ id: "excluded", name: "Excluded" },
	{ id: "archived", name: "Archived" },
];

const attachmentsFilters: FilterItem<AttachmentFilter>[] = [
	{ id: "include", name: "Has attachments" },
	{ id: "exclude", name: "No attachments" },
];

const recurringFilters: FilterItem<RecurringFilter>[] = [
	{ id: "all", name: "All recurring" },
	{ id: "weekly", name: "Weekly recurring" },
	{ id: "monthly", name: "Monthly recurring" },
	{ id: "annually", name: "Annually recurring" },
];

const manualFilters: FilterItem<ManualFilter>[] = [
	{ id: "include", name: "Manual" },
	{ id: "exclude", name: "Bank connection" },
];

function FilterMenuItem({ icon: Icon, label, children }: FilterMenuItemProps) {
	return (
		<DropdownMenuGroup>
			<DropdownMenuSub>
				<DropdownMenuSubTrigger>
					<Icon className="mr-2 size-4" />
					<span>{label}</span>
				</DropdownMenuSubTrigger>
				<DropdownMenuPortal>
					<DropdownMenuSubContent
						alignOffset={-4}
						className="p-0"
						sideOffset={14}
					>
						{children}
					</DropdownMenuSubContent>
				</DropdownMenuPortal>
			</DropdownMenuSub>
		</DropdownMenuGroup>
	);
}

function FilterCheckboxItem({
	id,
	name,
	checked = false,
	onCheckedChange,
	className,
}: FilterCheckboxItemProps) {
	return (
		<DropdownMenuCheckboxItem
			checked={checked}
			className={className}
			key={id}
			onCheckedChange={onCheckedChange}
			onSelect={(event) => event.preventDefault()}
		>
			{name}
		</DropdownMenuCheckboxItem>
	);
}

function updateArrayFilter(
	value: string,
	currentValues: string[] | null | undefined,
	setFilter: (update: Record<string, unknown>) => void,
	key: string
) {
	const normalizedValues = currentValues ?? null;
	const newValues = normalizedValues?.includes(value)
		? normalizedValues.filter((currentValue) => currentValue !== value).length >
			0
			? normalizedValues.filter((currentValue) => currentValue !== value)
			: null
		: [...(normalizedValues ?? []), value];

	setFilter({ [key]: newValues });
}

export function TransactionsSearchFilter() {
	const trpc = useTRPC();
	const { tab } = useTransactionTab();
	const inputRef = useRef<HTMLInputElement>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [isFocused, setIsFocused] = useState(false);
	const { filter = defaultSearch, setFilter } = useTransactionFilterParams();
	const [input, setInput] = useState(filter.q ?? "");

	const shouldFetch = isOpen || isFocused;
	const { data: tagsData } = useQuery({
		...trpc.tags.get.queryOptions(),
		enabled: shouldFetch || Boolean(filter.tags?.length),
	});
	const { data: bankAccountsData } = useQuery({
		...trpc.bankAccounts.list.queryOptions(),
		enabled: shouldFetch || Boolean(filter.accounts?.length),
	});
	const { data: categoriesData } = useQuery({
		...trpc.transactions.categories.queryOptions(),
		enabled: shouldFetch || Boolean(filter.categories?.length),
	});
	const { data: membersData } = useQuery({
		...trpc.team.members.queryOptions(),
		enabled: shouldFetch || Boolean(filter.assignees?.length),
	});

	const tags = tagsData?.map((tag) => ({ id: tag.id, name: tag.name }));
	const accounts = bankAccountsData?.map((bankAccount) => ({
		id: bankAccount.id,
		name: bankAccount.name ?? "",
		currency: bankAccount.currency ?? "",
	}));
	const categories = categoriesData?.map((category) => ({
		id: category.id,
		name: category.name,
		slug: category.slug,
	}));
	const members = membersData?.map((member) => ({
		id: member.id,
		name: member.user.fullName,
	}));

	useHotkeys(
		"esc",
		() => {
			setInput("");
			setFilter(defaultSearch);
			setIsOpen(false);
		},
		{
			enableOnFormTags: true,
			enabled: Boolean(input) && isFocused,
		}
	);

	useHotkeys("meta+s", (event) => {
		event.preventDefault();
		inputRef.current?.focus();
	});

	if (tab === "review") {
		return <h2 className="font-serif text-lg tracking-tight">Export</h2>;
	}

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		if (value) {
			setInput(value);
		} else {
			setFilter({ q: null });
			setInput("");
		}
	};

	const handleSubmit = (event?: React.FormEvent) => {
		event?.preventDefault();
		setFilter({ q: input.length > 0 ? input : null });
	};

	const validFilters = Object.fromEntries(
		Object.entries(filter).filter(([key]) => key !== "q")
	);
	const hasValidFilters = Object.values(validFilters).some(
		(value) => value !== null
	);
	const amountRange =
		filter.amount_range && filter.amount_range.length >= 2
			? ([filter.amount_range[0], filter.amount_range[1]] as [number, number])
			: undefined;

	return (
		<DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
			<div className="flex w-full flex-col gap-3">
				<div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex min-w-0 flex-1 flex-col gap-3">
						<form
							className="relative w-full sm:max-w-[350px]"
							onSubmit={(event) => {
								event.preventDefault();
								handleSubmit();
							}}
						>
							<Icons.Search className="pointer-events-none absolute top-[11px] left-3" />
							<Input
								autoCapitalize="none"
								autoComplete="off"
								autoCorrect="off"
								className="w-full pr-8 pl-9"
								onBlur={() => setIsFocused(false)}
								onChange={handleSearch}
								onFocus={() => setIsFocused(true)}
								placeholder="Search transactions..."
								ref={inputRef}
								spellCheck="false"
								value={input}
							/>

							<DropdownMenuTrigger asChild>
								<button
									className={cn(
										"absolute top-[10px] right-3 z-10 opacity-50 transition-opacity duration-300 hover:opacity-100",
										hasValidFilters && "opacity-100",
										isOpen && "opacity-100"
									)}
									onClick={() => setIsOpen((previous) => !previous)}
									type="button"
								>
									<Icons.Filter className="size-4" />
								</button>
							</DropdownMenuTrigger>
						</form>

						<FilterList
							accounts={accounts}
							amountRange={amountRange}
							attachmentsFilters={attachmentsFilters}
							categories={categories}
							filters={validFilters}
							manualFilters={manualFilters}
							members={members}
							onRemove={(updates) => setFilter(updates)}
							recurringFilters={recurringFilters}
							statusFilters={statusFilters}
							tags={tags}
						/>
					</div>

					<div className="flex items-center gap-2 self-start sm:self-auto">
						{hasValidFilters ? (
							<button
								className="text-[#878787] text-sm hover:text-foreground"
								onClick={() => {
									setInput("");
									setFilter(defaultSearch);
									setIsOpen(false);
								}}
								type="button"
							>
								Clear filters
							</button>
						) : null}
					</div>
				</div>

				<DropdownMenuContent
					align="start"
					className="w-[320px] p-1"
					sideOffset={10}
				>
					<FilterMenuItem icon={Icons.CalendarMonth} label="Date">
						<DateRangeFilter
							end={filter.end}
							onSelect={setFilter}
							start={filter.start}
						/>
					</FilterMenuItem>

					<FilterMenuItem icon={Icons.Currency} label="Amount">
						<div className="min-w-[250px] space-y-3 p-3">
							<div className="grid grid-cols-2 gap-2">
								<Input
									onChange={(event) => {
										const min = event.target.value
											? Math.round(Number(event.target.value) * 100)
											: null;
										const max = filter.amount_range?.[1] ?? null;
										setFilter({
											amount_range:
												min === null && max === null
													? null
													: [min ?? 0, max ?? 0],
										});
									}}
									placeholder="Min"
									step="0.01"
									type="number"
									value={
										filter.amount_range?.[0] !== undefined
											? filter.amount_range[0] / 100
											: ""
									}
								/>
								<Input
									onChange={(event) => {
										const min = filter.amount_range?.[0] ?? null;
										const max = event.target.value
											? Math.round(Number(event.target.value) * 100)
											: null;
										setFilter({
											amount_range:
												min === null && max === null
													? null
													: [min ?? 0, max ?? 0],
										});
									}}
									placeholder="Max"
									step="0.01"
									type="number"
									value={
										filter.amount_range?.[1] !== undefined
											? filter.amount_range[1] / 100
											: ""
									}
								/>
							</div>
						</div>
					</FilterMenuItem>

					<FilterMenuItem icon={Icons.Category} label="Category">
						<div className="min-w-[260px] p-3">
							<SelectCategory
								headless
								onChange={(selected) =>
									setFilter({ categories: [selected.slug ?? ""] })
								}
								selected={
									categories?.find(
										(category) => category.slug === filter.categories?.[0]
									)
										? {
												id: categories.find(
													(category) => category.slug === filter.categories?.[0]
												)!.id,
												name: categories.find(
													(category) => category.slug === filter.categories?.[0]
												)!.name,
												slug:
													categories.find(
														(category) =>
															category.slug === filter.categories?.[0]
													)!.slug ?? "",
											}
										: undefined
								}
							/>
						</div>
					</FilterMenuItem>

					<FilterMenuItem icon={Icons.Accounts} label="Account">
						<div className="max-h-[280px] min-w-[260px] overflow-auto py-1">
							{accounts?.map((account) => (
								<FilterCheckboxItem
									checked={filter.accounts?.includes(account.id)}
									id={account.id}
									key={account.id}
									name={formatAccountName({
										name: account.name,
										currency: account.currency,
									})}
									onCheckedChange={() =>
										updateArrayFilter(
											account.id,
											filter.accounts,
											setFilter,
											"accounts"
										)
									}
								/>
							))}
						</div>
					</FilterMenuItem>

					<FilterMenuItem icon={Icons.Face} label="Assignee">
						<div className="max-h-[280px] min-w-[220px] overflow-auto py-1">
							{members?.map((member) => (
								<FilterCheckboxItem
									checked={filter.assignees?.includes(member.id)}
									id={member.id}
									key={member.id}
									name={member.name}
									onCheckedChange={() =>
										updateArrayFilter(
											member.id,
											filter.assignees,
											setFilter,
											"assignees"
										)
									}
								/>
							))}
						</div>
					</FilterMenuItem>

					<FilterMenuItem icon={Icons.Repeat} label="Recurring">
						<div className="min-w-[220px] py-1">
							{recurringFilters.map((currentFilter) => (
								<FilterCheckboxItem
									checked={filter.recurring?.includes(currentFilter.id)}
									id={currentFilter.id}
									key={currentFilter.id}
									name={currentFilter.name}
									onCheckedChange={() =>
										updateArrayFilter(
											currentFilter.id,
											filter.recurring,
											setFilter,
											"recurring"
										)
									}
								/>
							))}
						</div>
					</FilterMenuItem>

					<FilterMenuItem icon={Icons.ReceiptLong} label="Attachment">
						<div className="min-w-[220px] py-1">
							{attachmentsFilters.map((currentFilter) => (
								<FilterCheckboxItem
									checked={filter.attachments === currentFilter.id}
									id={currentFilter.id}
									key={currentFilter.id}
									name={currentFilter.name}
									onCheckedChange={() =>
										setFilter({
											attachments:
												filter.attachments === currentFilter.id
													? null
													: currentFilter.id,
										})
									}
								/>
							))}
						</div>
					</FilterMenuItem>

					<FilterMenuItem icon={Icons.Filter} label="Status">
						<div className="min-w-[220px] py-1">
							{statusFilters.map((currentFilter) => (
								<FilterCheckboxItem
									checked={filter.statuses?.includes(currentFilter.id)}
									id={currentFilter.id}
									key={currentFilter.id}
									name={currentFilter.name}
									onCheckedChange={() =>
										updateArrayFilter(
											currentFilter.id,
											filter.statuses,
											setFilter,
											"statuses"
										)
									}
								/>
							))}
						</div>
					</FilterMenuItem>

					<FilterMenuItem icon={Icons.Tag} label="Tag">
						<div className="max-h-[280px] min-w-[220px] overflow-auto py-1">
							{tags?.map((tag) => (
								<FilterCheckboxItem
									checked={filter.tags?.includes(tag.id)}
									id={tag.id}
									key={tag.id}
									name={tag.name}
									onCheckedChange={() =>
										updateArrayFilter(tag.id, filter.tags, setFilter, "tags")
									}
								/>
							))}
						</div>
					</FilterMenuItem>

					<FilterMenuItem icon={Icons.SyncAlt} label="Type">
						<div className="min-w-[220px] py-1">
							<FilterCheckboxItem
								checked={filter.type === "income"}
								id="income"
								name="In"
								onCheckedChange={() =>
									setFilter({
										type: filter.type === "income" ? null : "income",
									})
								}
							/>
							<FilterCheckboxItem
								checked={filter.type === "expense"}
								id="expense"
								name="Out"
								onCheckedChange={() =>
									setFilter({
										type: filter.type === "expense" ? null : "expense",
									})
								}
							/>
						</div>
					</FilterMenuItem>

					<FilterMenuItem icon={Icons.Block} label="Source">
						<div className="min-w-[220px] py-1">
							{manualFilters.map((currentFilter) => (
								<FilterCheckboxItem
									checked={filter.manual === currentFilter.id}
									id={currentFilter.id}
									key={currentFilter.id}
									name={currentFilter.name}
									onCheckedChange={() =>
										setFilter({
											manual:
												filter.manual === currentFilter.id
													? null
													: currentFilter.id,
										})
									}
								/>
							))}
						</div>
					</FilterMenuItem>
				</DropdownMenuContent>
			</div>
		</DropdownMenu>
	);
}
