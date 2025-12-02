 # ERD: Bank Statements
 
 Statements, lines, allocations. Full detail: `docs/diagrams/erds.md`.
 
 ```mermaid
 erDiagram
   BANK_STATEMENTS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     text source
     text account_label
     varchar currency
     numeric opening_balance
     numeric closing_balance
     timestamptz period_start
     timestamptz period_end
     timestamptz created_at
   }
 
   BANK_STATEMENT_LINES {
     uuid id PK
     uuid statement_id FK -> BANK_STATEMENTS.id
     timestamptz occurred_at
     text description
     numeric amount
     numeric balance
     text external_ref
     timestamptz created_at
   }
 
   BANK_STATEMENT_ALLOCATIONS {
     uuid id PK
     uuid line_id FK -> BANK_STATEMENT_LINES.id
     uuid transaction_id FK -> TRANSACTIONS.id
     numeric amount
     timestamptz created_at
   }
 
   TEAMS ||--o{ BANK_STATEMENTS : has
   BANK_STATEMENTS ||--o{ BANK_STATEMENT_LINES : has
   BANK_STATEMENT_LINES ||--o{ BANK_STATEMENT_ALLOCATIONS : allocates
   TRANSACTIONS ||--o{ BANK_STATEMENT_ALLOCATIONS : allocated_by
 ```
