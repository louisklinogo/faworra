 # ERD: Products & Inventory
 
 Products, variants, inventory, media, categories. Full detail: `docs/diagrams/erds.md`.
 
 ```mermaid
 erDiagram
   PRODUCTS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     text name
     varchar slug
     product_type type
     product_status status
     text description
     varchar category_slug
     jsonb tags
     jsonb attributes
     timestamptz created_at
     timestamptz updated_at
     timestamptz deleted_at
     tsvector search_tsv
   }
 
   PRODUCT_VARIANTS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     uuid product_id FK -> PRODUCTS.id
     text name
     varchar sku
     varchar barcode
     varchar unit_of_measure
     numeric pack_size
     numeric price
     varchar currency
     numeric cost
     product_status status
     fulfillment_type fulfillment_type
     boolean stock_managed
     integer lead_time_days
     date availability_date
     varchar backorder_policy
     integer capacity_per_period
     timestamptz created_at
     timestamptz updated_at
   }
 
   INVENTORY_LOCATIONS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     text name
     varchar code
     boolean is_default
     text address
     timestamptz created_at
     timestamptz updated_at
   }
 
   PRODUCT_INVENTORY {
     uuid team_id FK -> TEAMS.id
     uuid variant_id FK -> PRODUCT_VARIANTS.id
     uuid location_id FK -> INVENTORY_LOCATIONS.id
     integer on_hand
     integer allocated
     integer safety_stock
     timestamptz updated_at
     PK(variant_id,location_id)
   }
 
   PRODUCT_MEDIA {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     uuid product_id FK -> PRODUCTS.id
     uuid variant_id FK -> PRODUCT_VARIANTS.id
     text path
     text alt
     boolean is_primary
     integer position
     integer width
     integer height
     integer size_bytes
     varchar mime_type
     timestamptz created_at
   }
 
   PRODUCT_CATEGORIES {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     text name
     text slug
     text color
     text description
     uuid parent_id FK -> PRODUCT_CATEGORIES.id
     boolean system
     timestamptz created_at
     timestamptz updated_at
   }
 
   PRODUCT_CATEGORY_MAPPINGS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     uuid product_category_id FK -> PRODUCT_CATEGORIES.id
     uuid transaction_category_id FK -> TRANSACTION_CATEGORIES.id
     timestamptz created_at
   }
 
   TEAMS ||--o{ PRODUCTS : has
   PRODUCTS ||--o{ PRODUCT_VARIANTS : has
   PRODUCT_VARIANTS ||--o{ PRODUCT_INVENTORY : at
   INVENTORY_LOCATIONS ||--o{ PRODUCT_INVENTORY : stores
   PRODUCTS ||--o{ PRODUCT_MEDIA : has
   TEAMS ||--o{ PRODUCT_CATEGORIES : has
   PRODUCT_CATEGORIES ||--o{ PRODUCT_CATEGORIES : parent
   PRODUCT_CATEGORIES ||--o{ PRODUCT_CATEGORY_MAPPINGS : maps
   TRANSACTION_CATEGORIES ||--o{ PRODUCT_CATEGORY_MAPPINGS : maps
 ```
