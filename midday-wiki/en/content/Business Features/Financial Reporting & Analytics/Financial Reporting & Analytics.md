# Financial Reporting & Analytics

<cite>
**Referenced Files in This Document**
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts)
- [insights.ts](file://midday/apps/api/src/schemas/insights.ts)
- [widgets.ts](file://midday/apps/api/src/schemas/widgets.ts)
- [runway-burn-rate-analysis.md](file://midday/docs/runway-burn-rate-analysis.md)
- [weekly-insights.md](file://midday/docs/weekly-insights.md)
- [reports.ts](file://midday/apps/api/src/rest/routers/reports.ts)
- [reports.ts](file://midday/apps/api/src/trpc/routers/reports.ts)
- [insights.ts](file://midday/apps/api/src/rest/routers/insights.ts)
- [insights.ts](file://midday/apps/api/src/trpc/routers/insights.ts)
- [widgets.ts](file://midday/apps/api/src/rest/routers/widgets.ts)
- [widgets.ts](file://midday/apps/api/src/trpc/routers/widgets.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document describes Faworra’s financial reporting and analytics capabilities. It covers the comprehensive reporting suite (profit and loss, balance sheet, cash flow), custom and shared reports, AI-powered insights generation, trend analysis, predictive forecasting, the metrics dashboard with customizable widgets, KPI tracking, automated report generation and distribution, financial analytics (revenue trends, expense analysis, profitability), export capabilities, business health scoring, runway analysis, and financial stress testing. It also provides examples of report creation, dashboard customization, and automated reporting workflows.

## Project Structure
Faworra’s financial reporting and analytics span three layers:
- REST and tRPC routers expose endpoints for reports, insights, and widgets.
- Schemas define request/response contracts for robust API design.
- Documentation explains financial calculations, data flows, and troubleshooting for runway, burn rate, and balance sheet reporting.

```mermaid
graph TB
subgraph "API Layer"
R["REST Routers<br/>reports.ts, insights.ts, widgets.ts"]
T["tRPC Routers<br/>reports.ts, insights.ts, widgets.ts"]
end
subgraph "Schemas"
RS["Reports Schemas<br/>reports.ts"]
IS["Insights Schemas<br/>insights.ts"]
WS["Widgets Schemas<br/>widgets.ts"]
end
subgraph "Docs"
RD["Runway & Burn Rate Docs<br/>runway-burn-rate-analysis.md"]
WD["Weekly Insights Docs<br/>weekly-insights.md"]
end
R --> RS
T --> RS
R --> IS
T --> IS
R --> WS
T --> WS
RS --> RD
IS --> WD
```

**Diagram sources**
- [reports.ts](file://midday/apps/api/src/rest/routers/reports.ts)
- [reports.ts](file://midday/apps/api/src/trpc/routers/reports.ts)
- [insights.ts](file://midday/apps/api/src/rest/routers/insights.ts)
- [insights.ts](file://midday/apps/api/src/trpc/routers/insights.ts)
- [widgets.ts](file://midday/apps/api/src/rest/routers/widgets.ts)
- [widgets.ts](file://midday/apps/api/src/trpc/routers/widgets.ts)
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts)
- [insights.ts](file://midday/apps/api/src/schemas/insights.ts)
- [widgets.ts](file://midday/apps/api/src/schemas/widgets.ts)
- [runway-burn-rate-analysis.md](file://midday/docs/runway-burn-rate-analysis.md)
- [weekly-insights.md](file://midday/docs/weekly-insights.md)

**Section sources**
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts#L1-L776)
- [insights.ts](file://midday/apps/api/src/schemas/insights.ts#L1-L290)
- [widgets.ts](file://midday/apps/api/src/schemas/widgets.ts#L1-L130)
- [runway-burn-rate-analysis.md](file://midday/docs/runway-burn-rate-analysis.md#L1-L352)
- [weekly-insights.md](file://midday/docs/weekly-insights.md#L1-L425)

## Core Components
- Reports API: Defines endpoints and schemas for revenue, profit, burn rate, runway, expenses, spending, cash flow, balance sheet, revenue forecasts, growth rates, and profit margins. Supports shared report creation and retrieval via link identifiers.
- Insights API: Provides paginated listing, latest, and period-specific retrieval of AI-generated insights, including metrics, content, and audio URLs. Includes dismissal and read tracking.
- Widgets API: Supplies schemas for dashboard widgets such as revenue, profit margin, cash flow, outstanding invoices, account balances, recurring expenses, tax summary, category expenses, billable hours, and more. Includes preferences for primary and available widgets.

**Section sources**
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts#L1-L776)
- [insights.ts](file://midday/apps/api/src/schemas/insights.ts#L1-L290)
- [widgets.ts](file://midday/apps/api/src/schemas/widgets.ts#L1-L130)

## Architecture Overview
The reporting and analytics architecture integrates REST and tRPC routers with strongly typed schemas. Data flows from backend queries to frontend dashboards and shared report views. AI-driven insights are generated asynchronously and surfaced through dedicated endpoints.

```mermaid
sequenceDiagram
participant Client as "Client App"
participant REST as "REST Router<br/>reports.ts"
participant TRPC as "tRPC Router<br/>reports.ts"
participant DB as "Database Queries"
Client->>REST : GET /reports/revenue?from&to&currency
REST->>DB : Execute revenue query
DB-->>REST : Revenue data
REST-->>Client : JSON response
Client->>TRPC : trpc.reports.revenue.fetch({from,to,currency})
TRPC->>DB : Execute revenue query
DB-->>TRPC : Revenue data
TRPC-->>Client : JSON response
```

**Diagram sources**
- [reports.ts](file://midday/apps/api/src/rest/routers/reports.ts)
- [reports.ts](file://midday/apps/api/src/trpc/routers/reports.ts)
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts#L1-L220)

## Detailed Component Analysis

### Reporting Suite
The reporting suite supports:
- Profit and Loss: Revenue, profit, profit margin, growth rate, and revenue forecasts.
- Balance Sheet: As-of-date asset and liability positions.
- Cash Flow: Aggregated monthly or quarterly cash flow.
- Expenses and Spending: Periodic totals, recurring expenses, and category spending breakdowns.
- Runway and Burn Rate: Runway in months and burn rate series.
- Shared Reports: Create and retrieve shared report links with expiration.

```mermaid
erDiagram
REPORT_SCHEMA {
enum type
date from
date to
string currency
date expireAt
}
REVENUE_RESPONSE {
number currentTotal
number prevTotal
string currency
array result
}
PROFIT_RESPONSE {
number currentTotal
number prevTotal
string currency
array result
}
FORECAST_RESPONSE {
object summary
array historical
array forecast
array combined
object meta
}
BALANCE_SHEET_SCHEMA {
date asOf
string currency
}
CASH_FLOW_SCHEMA {
date from
date to
string currency
enum period
}
EXPENSES_RESPONSE {
object summary
object meta
array result
}
RUNWAY_BURN_RATE {
number runwayMonths
array burnRateSeries
}
REPORT_SCHEMA ||--o{ REVENUE_RESPONSE : "generates"
REPORT_SCHEMA ||--o{ PROFIT_RESPONSE : "generates"
REPORT_SCHEMA ||--o{ FORECAST_RESPONSE : "generates"
REPORT_SCHEMA ||--o{ BALANCE_SHEET_SCHEMA : "generates"
REPORT_SCHEMA ||--o{ CASH_FLOW_SCHEMA : "generates"
REPORT_SCHEMA ||--o{ EXPENSES_RESPONSE : "generates"
REPORT_SCHEMA ||--o{ RUNWAY_BURN_RATE : "generates"
```

**Diagram sources**
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts#L1-L776)

**Section sources**
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts#L1-L776)

### AI-Powered Insights Generation
The insights system:
- Orchestrates data fetching, metric calculation, anomaly detection, and content generation.
- Produces structured insights with metrics, content, and recommended actions.
- Supports pagination, latest retrieval, period-based lookup, dismissal, and read tracking.
- Provides audio URLs for accessibility.

```mermaid
sequenceDiagram
participant Job as "Scheduler/Worker"
participant Service as "InsightsService"
participant DB as "Database"
participant Calc as "MetricsCalculator"
participant Analyzer as "MetricsAnalyzer"
participant Gen as "ContentGenerator"
participant AI as "OpenAI"
Job->>Service : generate(teamId, periodType, date)
Service->>DB : Fetch metrics, transactions, invoices
Service->>Calc : Calculate current & previous period
Calc-->>Service : MetricData with changes
Service->>Analyzer : Select top metrics & detect anomalies
Analyzer-->>Service : Top metrics
Service->>Gen : Generate content (title, summary, actions, story)
Gen->>AI : Parallel prompts (title, summary, actions)
AI-->>Gen : Generated content parts
Gen->>AI : Story prompt with context
AI-->>Gen : Final story
Gen-->>Service : InsightContent
Service->>DB : Store insight
```

**Diagram sources**
- [weekly-insights.md](file://midday/docs/weekly-insights.md#L18-L54)
- [insights.ts](file://midday/apps/api/src/schemas/insights.ts#L1-L290)

**Section sources**
- [weekly-insights.md](file://midday/docs/weekly-insights.md#L1-L425)
- [insights.ts](file://midday/apps/api/src/schemas/insights.ts#L1-L290)

### Predictive Forecasting
Revenue forecasting uses a bottom-up methodology incorporating recurring invoices, recurring transactions, scheduled invoices, expected collections, billable hours, and new business projections. The forecast includes base, optimistic, and pessimistic scenarios with confidence scores and warnings.

```mermaid
flowchart TD
Start(["Start Forecast"]) --> LoadData["Load historical revenue<br/>and team metrics"]
LoadData --> BuildBreakdown["Build revenue breakdown:<br/>recurring invoices, transactions,<br/>scheduled, collections, billable hours,<br/>new business"]
BuildBreakdown --> ComputeBase["Compute base forecast value"]
ComputeBase --> Bounds["Compute optimistic/pessimistic bounds"]
Bounds --> Confidence["Compute confidence score"]
Confidence --> Aggregate["Aggregate historical + forecast"]
Aggregate --> Summary["Build summary:<br/>next month projection,<br/>avg growth rate, total projected revenue,<br/>peak month, unpaid invoices,<br/>billable hours"]
Summary --> Meta["Attach meta:<br/>historical months, forecast months,<br/>avg growth rate, currency,<br/>warnings, source totals"]
Meta --> End(["Forecast Ready"])
```

**Diagram sources**
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts#L420-L611)

**Section sources**
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts#L420-L611)

### Metrics Dashboard and Customizable Widgets
The dashboard exposes numerous widgets for KPIs and performance indicators:
- Revenue, revenue summary, growth rate, profit margin
- Cash flow, outstanding invoices, account balances, net position
- Monthly spending, recurring expenses, tax summary, category expenses
- Billable hours, customer lifetime value
- Preferences allow selecting primary and available widgets.

```mermaid
classDiagram
class WidgetPreferences {
+widgetTypeSchema
+primaryWidgets
+availableWidgets
}
class WidgetSchemas {
+getRunwaySchema
+getRevenueSchema
+getRevenueSummarySchema
+getGrowthRateSchema
+getProfitMarginSchema
+getCashFlowSchema
+getOutstandingInvoicesSchema
+getAccountBalancesSchema
+getNetPositionSchema
+getMonthlySpendingSchema
+getRecurringExpensesSchema
+getTaxSummarySchema
+getCategoryExpensesSchema
+getBillableHoursSchema
+getCustomerLifetimeValueSchema
}
WidgetPreferences --> WidgetSchemas : "validates"
```

**Diagram sources**
- [widgets.ts](file://midday/apps/api/src/schemas/widgets.ts#L1-L130)

**Section sources**
- [widgets.ts](file://midday/apps/api/src/schemas/widgets.ts#L1-L130)

### Automated Report Generation, Scheduling, and Distribution
Shared reports can be created with optional expiration dates and retrieved via link identifiers. While the repository documentation focuses on schemas and flows, the presence of shared report schemas indicates a framework for automated generation and distribution.

```mermaid
sequenceDiagram
participant Creator as "Report Creator"
participant API as "Reports API"
participant Storage as "Storage"
participant Viewer as "Report Viewer"
Creator->>API : POST createReport {type,from,to,currency,expireAt}
API->>Storage : Persist report metadata
API-->>Creator : {linkId}
Viewer->>API : GET report by linkId
API->>Storage : Retrieve report data
API-->>Viewer : Report payload
```

**Diagram sources**
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts#L624-L666)

**Section sources**
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts#L624-L666)

### Financial Analytics: Revenue Trends, Expense Analysis, Profitability
- Revenue trends: Period-over-period revenue with percentage change and currency-aware values.
- Expense analysis: Average expenses, recurring vs total, and category breakdowns.
- Profitability: Profit totals, profit margin, and growth rates across periods.

```mermaid
flowchart TD
A["Select period (from,to)"] --> B["Fetch revenue & expenses"]
B --> C{"Has revenue?"}
C --> |Yes| D["Compute profit = revenue - expenses"]
C --> |No| E["Derive revenue if profit/expenses known"]
D --> F["Compute profit margin"]
E --> F
F --> G["Compute growth rates (monthly/quarterly/yearly)"]
G --> H["Return analytics results"]
```

**Diagram sources**
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts#L1-L776)

**Section sources**
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts#L1-L776)

### Export Capabilities
The repository defines shared report schemas and widgets but does not include explicit export endpoints in the referenced files. Teams can integrate export functionality by extending the reports router to support PDF, Excel, and CSV generation using the existing schemas and data.

[No sources needed since this section provides general guidance]

### Business Health Score, Runway Analysis, and Financial Stress Testing
- Runway: Months of operation based on cash and average monthly burn rate.
- Burn Rate: Excludes internal transfers and credit card payments to avoid double counting.
- Net Position: Cash minus credit card debt.
- Balance Sheet: Assets and liabilities including accounts receivable and loans.
- Stress testing: Use forecast scenarios (optimistic/pessimistic) and sensitivity analysis around key assumptions.

```mermaid
flowchart TD
SB["Start"] --> CB["Compute Cash Balance<br/>(depository + other_asset)"]
CB --> BR["Compute Burn Rate<br/>(expenses/month)<br/>Exclude internal & credit-card-payment"]
BR --> RW["Runway = Cash / Burn Rate"]
RW --> NP["Net Position = Cash - Credit Card Debt"]
NP --> BS["Balance Sheet<br/>Assets + Liabilities"]
BS --> ST["Stress Tests:<br/>Scenario analysis, sensitivity"]
ST --> END["END"]
```

**Diagram sources**
- [runway-burn-rate-analysis.md](file://midday/docs/runway-burn-rate-analysis.md#L68-L168)

**Section sources**
- [runway-burn-rate-analysis.md](file://midday/docs/runway-burn-rate-analysis.md#L1-L352)

### Examples
- Report Creation: Use the shared report schema to create a report with type, date range, currency, and optional expiration. Retrieve via link identifier.
- Dashboard Customization: Update widget preferences to set primary widgets and available widgets.
- Automated Reporting Workflow: Schedule periodic generation of forecasts or runways and distribute via shared links.

**Section sources**
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts#L624-L666)
- [widgets.ts](file://midday/apps/api/src/schemas/widgets.ts#L122-L130)
- [weekly-insights.md](file://midday/docs/weekly-insights.md#L1-L425)

## Dependency Analysis
The reporting and analytics stack depends on:
- Strongly typed schemas to enforce request/response contracts.
- REST and tRPC routers to expose endpoints consistently.
- Documentation to guide financial calculations and troubleshooting.

```mermaid
graph LR
RS["Reports Schemas"] --> RR["REST Routers"]
RS --> TR["tRPC Routers"]
IS["Insights Schemas"] --> IR["REST Routers"]
IS --> IT["tRPC Routers"]
WS["Widgets Schemas"] --> WR["REST Routers"]
WS --> WT["tRPC Routers"]
RR --> RD["Runway Docs"]
TR --> RD
IR --> WD["Weekly Insights Docs"]
IT --> WD
```

**Diagram sources**
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts#L1-L776)
- [insights.ts](file://midday/apps/api/src/schemas/insights.ts#L1-L290)
- [widgets.ts](file://midday/apps/api/src/schemas/widgets.ts#L1-L130)
- [runway-burn-rate-analysis.md](file://midday/docs/runway-burn-rate-analysis.md#L1-L352)
- [weekly-insights.md](file://midday/docs/weekly-insights.md#L1-L425)

**Section sources**
- [reports.ts](file://midday/apps/api/src/schemas/reports.ts#L1-L776)
- [insights.ts](file://midday/apps/api/src/schemas/insights.ts#L1-L290)
- [widgets.ts](file://midday/apps/api/src/schemas/widgets.ts#L1-L130)
- [runway-burn-rate-analysis.md](file://midday/docs/runway-burn-rate-analysis.md#L1-L352)
- [weekly-insights.md](file://midday/docs/weekly-insights.md#L1-L425)

## Performance Considerations
- Use appropriate aggregation periods (monthly/quarterly) to reduce payload sizes.
- Cache frequently accessed metrics and leverage widget polling configurations.
- Apply filters (date ranges, currencies) to minimize dataset size.
- For AI insights, batch generation and parallel prompt execution improve throughput.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Runway shows zero or incorrect values: verify cash accounts, currency alignment, and transaction availability.
- Credit card balance appears positive: expected behavior; stored as positive values representing amounts owed.
- Net position cash mismatch: confirm only depository and other_asset accounts are counted and accounts are enabled.
- Double-counted expenses in burn rate: ensure credit-card-payment and internal-transfer categories are excluded.
- Provider sync issues: ingestion-time normalization and query-time Math.abs() handle provider differences.

**Section sources**
- [runway-burn-rate-analysis.md](file://midday/docs/runway-burn-rate-analysis.md#L226-L352)

## Conclusion
Faworra’s financial reporting and analytics provide a robust foundation for revenue and profit tracking, cash flow monitoring, forecasting, and AI-driven insights. The schema-first design, dashboard widgets, and shared reporting capabilities enable teams to build custom dashboards, automate reporting, and drive data-informed decisions. Extending export and advanced stress-testing features can further enhance the platform’s analytical depth.

## Appendices
- API Endpoints: Reports, insights, and widgets routers expose endpoints for all major financial views.
- Financial Calculations: Runway, burn rate, net position, and balance sheet definitions are documented with data flow diagrams and troubleshooting steps.

**Section sources**
- [reports.ts](file://midday/apps/api/src/rest/routers/reports.ts)
- [reports.ts](file://midday/apps/api/src/trpc/routers/reports.ts)
- [insights.ts](file://midday/apps/api/src/rest/routers/insights.ts)
- [insights.ts](file://midday/apps/api/src/trpc/routers/insights.ts)
- [widgets.ts](file://midday/apps/api/src/rest/routers/widgets.ts)
- [widgets.ts](file://midday/apps/api/src/trpc/routers/widgets.ts)
- [runway-burn-rate-analysis.md](file://midday/docs/runway-burn-rate-analysis.md#L1-L352)
- [weekly-insights.md](file://midday/docs/weekly-insights.md#L1-L425)