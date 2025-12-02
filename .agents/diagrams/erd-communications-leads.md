 # ERD: Communications & Leads
 
 Accounts, threads, messages, attachments, outbox, templates, contacts, leads. Full detail: `docs/diagrams/erds.md`.
 
 ```mermaid
 erDiagram
   COMMUNICATION_ACCOUNTS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     varchar provider
     text external_id
     text display_name
     varchar status
     text credentials_encrypted
     timestamptz created_at
     timestamptz updated_at
   }
 
   COMMUNICATION_THREADS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     uuid account_id FK -> COMMUNICATION_ACCOUNTS.id
     uuid customer_id FK -> CLIENTS.id
     uuid whatsapp_contact_id FK -> WHATSAPP_CONTACTS.id
     uuid instagram_contact_id FK -> INSTAGRAM_CONTACTS.id
     varchar channel
     text external_contact_id
     varchar status
     uuid assigned_user_id FK -> USERS.id
     timestamptz last_message_at
     timestamptz created_at
     timestamptz updated_at
   }
 
   COMMUNICATION_MESSAGES {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     uuid thread_id FK -> COMMUNICATION_THREADS.id
     text provider_message_id
     varchar direction
     varchar type
     text content
     jsonb meta
     timestamptz sent_at
     timestamptz delivered_at
     timestamptz read_at
     text error
     boolean is_status
     comm_message_status status
     text client_message_id
     timestamptz created_at
   }
 
   MESSAGE_ATTACHMENTS {
     uuid id PK
     uuid message_id FK -> COMMUNICATION_MESSAGES.id
     text storage_path
     text content_type
     numeric size
     text checksum
     timestamptz created_at
   }
 
   MESSAGE_DELIVERY {
     uuid id PK
     uuid message_id FK -> COMMUNICATION_MESSAGES.id
     varchar status
     text provider_error_code
     integer retries
     timestamptz created_at
   }
 
   WHATSAPP_CONTACTS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     text wa_id
     text phone
     text display_name
     text profile_pic_url
     jsonb metadata
     timestamptz created_at
     timestamptz updated_at
   }
 
   INSTAGRAM_CONTACTS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     text username
     text external_id
     text display_name
     text profile_pic_url
     jsonb metadata
     timestamptz created_at
     timestamptz updated_at
   }
 
   COMMUNICATION_OUTBOX {
     uuid id PK
     timestamptz created_at
     uuid team_id FK -> TEAMS.id
     uuid account_id FK -> COMMUNICATION_ACCOUNTS.id
     text recipient
     text content
     text status
     text error
     text client_message_id
     text media_path
     text media_type
     text media_filename
     text caption
   }
 
   COMMUNICATION_TEMPLATES {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     text provider
     text name
     text category
     text locale
     text body
     jsonb variables
     text status
     text external_id
     timestamptz created_at
   }
 
   LEADS {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     uuid thread_id FK -> COMMUNICATION_THREADS.id
     uuid customer_id FK -> CLIENTS.id
     uuid owner_user_id FK -> USERS.id
     text prospect_name
     varchar prospect_phone
     text prospect_handle
     uuid whatsapp_contact_id FK -> WHATSAPP_CONTACTS.id
     uuid instagram_contact_id FK -> INSTAGRAM_CONTACTS.id
     varchar source
     varchar status
     integer score
     varchar qualification
     integer message_count
     timestamptz last_interaction_at
     text notes
     jsonb metadata
     timestamptz created_at
     timestamptz updated_at
   }
 
   COMMUNICATION_ACCOUNTS ||--o{ COMMUNICATION_THREADS : owns
   CLIENTS ||--o{ COMMUNICATION_THREADS : links
   COMMUNICATION_THREADS ||--o{ COMMUNICATION_MESSAGES : has
   COMMUNICATION_MESSAGES ||--o{ MESSAGE_ATTACHMENTS : has
   COMMUNICATION_MESSAGES ||--o{ MESSAGE_DELIVERY : has
   TEAMS ||--o{ COMMUNICATION_OUTBOX : has
   TEAMS ||--o{ COMMUNICATION_TEMPLATES : has
   TEAMS ||--o{ WHATSAPP_CONTACTS : has
   TEAMS ||--o{ INSTAGRAM_CONTACTS : has
   TEAMS ||--o{ LEADS : has
 ```
