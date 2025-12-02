 # ERD: Sales, Clients, Documents, Scheduling
 
 Clients, orders, invoices, measurements, documents, appointments. Full detail: `docs/diagrams/erds.md`.
 
 ```mermaid
 erDiagram
   CLIENTS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     text name
     varchar phone
     varchar whatsapp
     varchar email
     text address
     text country
     varchar country_code
     text company
     text occupation
     text referral_source
     jsonb tags
     text notes
     timestamptz created_at
     timestamptz updated_at
     timestamptz deleted_at
     tsvector search_tsv
   }
 
   ORDERS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     uuid client_id FK -> CLIENTS.id
     varchar order_number
     varchar status
     numeric total_price
     numeric deposit_amount
     numeric balance_amount
     text notes
     timestamptz due_date
     text idempotency_key
     text created_by_type
     uuid created_by_id
     text source
     text conversation_id
     timestamptz created_at
     timestamptz updated_at
     timestamptz completed_at
     timestamptz cancelled_at
     timestamptz deleted_at
     tsvector search_tsv
   }
 
   ORDER_ITEMS {
     uuid id PK
     uuid order_id FK -> ORDERS.id
     text name
     integer quantity
     numeric unit_price
     numeric total
     timestamptz created_at
   }
 
   INVOICES {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     uuid order_id FK -> ORDERS.id
     varchar invoice_number
     numeric subtotal
     numeric tax
     numeric discount
     numeric amount
     varchar currency
     numeric exchange_rate
     numeric paid_amount
     numeric vat_rate
     numeric vat_amount
     invoice_status status
     timestamptz due_date
     timestamptz sent_at
     timestamptz paid_at
     text invoice_url
     text notes
     text idempotency_key
     text created_by_type
     uuid created_by_id
     text source
     text conversation_id
     timestamptz created_at
     timestamptz updated_at
     timestamptz deleted_at
   }
 
   INVOICE_ITEMS {
     uuid id PK
     uuid invoice_id FK -> INVOICES.id
     uuid order_item_id FK -> ORDER_ITEMS.id
     text name
     integer quantity
     numeric unit_price
     numeric total
     timestamptz created_at
   }
 
   MEASUREMENTS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     uuid client_id FK -> CLIENTS.id
     varchar record_name
     varchar garment_type
     jsonb measurements
     integer version
     uuid measurement_group_id
     uuid previous_version_id FK -> MEASUREMENTS.id
     boolean is_active
     text[] tags
     text notes
     timestamptz taken_at
     timestamptz created_at
     timestamptz updated_at
     timestamptz deleted_at
   }
 
   APPOINTMENTS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     uuid client_id FK -> CLIENTS.id
     uuid staff_user_id FK -> USERS.id
     timestamptz start_at
     timestamptz end_at
     timestamptz reminder_at
     appointment_status status
     text location
     text notes
     timestamptz created_at
   }
 
   DOCUMENTS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     text name
     text[] path_tokens
     text mime_type
     integer size
     text[] tags
     varchar processing_status
     jsonb metadata
     uuid order_id FK -> ORDERS.id
     uuid invoice_id FK -> INVOICES.id
     uuid client_id FK -> CLIENTS.id
     uuid uploaded_by FK -> USERS.id
     timestamptz created_at
     timestamptz updated_at
     timestamptz deleted_at
     tsvector search_tsv
   }
 
   TEAM_DAILY_ORDERS_SUMMARY {
     uuid team_id FK -> TEAMS.id
     date day
     integer created_count
     integer created_count_excl_cancelled
     numeric created_value_sum_excl_cancelled
     integer completed_count
     numeric completed_value_sum
     timestamptz updated_at
     PK(team_id,day)
   }
 
   TEAMS ||--o{ CLIENTS : has
   CLIENTS ||--o{ ORDERS : places
   ORDERS ||--o{ ORDER_ITEMS : contains
   ORDERS ||--o{ INVOICES : bills
   INVOICES ||--o{ INVOICE_ITEMS : lists
   CLIENTS ||--o{ MEASUREMENTS : has
   TEAMS ||--o{ APPOINTMENTS : has
   TEAMS ||--o{ DOCUMENTS : has
   ORDERS ||--o{ DOCUMENTS : links
   INVOICES ||--o{ DOCUMENTS : links
   CLIENTS ||--o{ DOCUMENTS : links
 ```
