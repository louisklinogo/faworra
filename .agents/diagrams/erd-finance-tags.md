 # ERD: Finance & Tags
 
 Financial accounts, transactions, categories, tags, attachments, statements. Full detail: `docs/diagrams/erds.md`.
 
 ```mermaid
 erDiagram
   FINANCIAL_ACCOUNTS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     varchar type
     text name
     varchar currency
     varchar provider
     text external_id
     varchar status
     numeric opening_balance
     text sync_cursor
     timestamptz created_at
     timestamptz updated_at
   }
 
   TRANSACTIONS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     date date
     text name
     text description
     text internal_id
     numeric amount
     varchar currency
     numeric balance
     numeric base_amount
     varchar base_currency
     transaction_type type
     varchar category
     text category_slug
     varchar payment_method
     transaction_status status
     uuid client_id FK -> CLIENTS.id
     uuid order_id FK -> ORDERS.id
     uuid invoice_id FK -> INVOICES.id
     uuid assigned_id FK -> USERS.id
     uuid account_id FK -> FINANCIAL_ACCOUNTS.id
     varchar transaction_number
     text counterparty_name
     text merchant_name
     varchar payment_reference
     text notes
     boolean manual
     boolean recurring
     transaction_frequency frequency
     boolean enrichment_completed
     boolean exclude_from_analytics
     timestamptz transaction_date
     timestamptz due_date
     timestamptz created_at
     timestamptz updated_at
     timestamptz deleted_at
   }
 
   TRANSACTION_ALLOCATIONS {
     uuid id PK
     uuid transaction_id FK -> TRANSACTIONS.id
     uuid invoice_id FK -> INVOICES.id
     numeric amount
     timestamptz created_at
   }
 
   TRANSACTION_CATEGORIES {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     text name
     text slug
     text color
     text description
     uuid parent_id FK -> TRANSACTION_CATEGORIES.id
     numeric tax_rate
     text tax_type
     text tax_reporting_code
     boolean excluded
     boolean system
     timestamptz created_at
     timestamptz updated_at
   }
 
   TAGS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     text name
     text color
     timestamptz created_at
   }
 
   TRANSACTION_TAGS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     uuid transaction_id FK -> TRANSACTIONS.id
     uuid tag_id FK -> TAGS.id
     timestamptz created_at
   }
 
   TRANSACTION_ATTACHMENTS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     uuid transaction_id FK -> TRANSACTIONS.id
     text name
     text[] path
     text type
     text mime_type
     numeric size
     text checksum
     uuid uploaded_by FK -> USERS.id
     timestamptz created_at
   }
 
   TEAMS ||--o{ FINANCIAL_ACCOUNTS : has
   FINANCIAL_ACCOUNTS ||--o{ TRANSACTIONS : posts
   TEAMS ||--o{ TRANSACTION_CATEGORIES : has
   TRANSACTION_CATEGORIES ||--o{ TRANSACTION_CATEGORIES : parent
   TRANSACTION_CATEGORIES ||--o{ TRANSACTIONS : classifies
   TEAMS ||--o{ TAGS : has
   TAGS ||--o{ TRANSACTION_TAGS : used_in
   TRANSACTIONS ||--o{ TRANSACTION_TAGS : has
   TRANSACTIONS ||--o{ TRANSACTION_ATTACHMENTS : has
   INVOICES ||--o{ TRANSACTION_ALLOCATIONS : allocated_by
   TRANSACTIONS ||--o{ TRANSACTION_ALLOCATIONS : allocates
 ```
