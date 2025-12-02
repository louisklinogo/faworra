 # ERD: Activities & Notifications
 
 Activity logging and user notification preferences. Full detail: `docs/diagrams/erds.md`.
 
 ```mermaid
 erDiagram
   ACTIVITIES {
     uuid id PK
     uuid team_id FK -> TEAMS.id
     uuid user_id FK -> USERS.id
     text type
     jsonb metadata
     timestamptz created_at
   }
 
   NOTIFICATION_SETTINGS {
     uuid id PK
     uuid user_id FK -> USERS.id
     uuid team_id FK -> TEAMS.id
     text notification_type
     text channel
     boolean enabled
     timestamptz created_at
     timestamptz updated_at
   }
 
   TEAMS ||--o{ ACTIVITIES : has
   USERS ||--o{ ACTIVITIES : actor
   TEAMS ||--o{ NOTIFICATION_SETTINGS : has
   USERS ||--o{ NOTIFICATION_SETTINGS : prefs
 ```
