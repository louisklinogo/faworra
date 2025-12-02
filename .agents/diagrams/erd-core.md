 # ERD: Core & Identity
 
 Teams, users, and memberships. Full detail: `docs/diagrams/erds.md`.
 
 ```mermaid
 erDiagram
   TEAMS {
     uuid id PK
     text name
     text base_currency
     text country
     text timezone
     text quiet_hours
     text locale
     timestamptz created_at
     timestamptz updated_at
   }
 
   USERS {
     uuid id PK
     varchar email
     text full_name
     uuid current_team_id FK -> TEAMS.id
     timestamptz created_at
   }
 
   TEAM_MEMBERSHIPS {
     uuid team_id FK -> TEAMS.id
     uuid user_id FK -> USERS.id
     varchar role
     timestamptz created_at
     PK(team_id,user_id)
   }
 
   USERS_ON_TEAM {
     uuid id PK
     uuid user_id FK -> USERS.id
     uuid team_id FK -> TEAMS.id
     varchar role
     timestamptz created_at
   }
 
   TEAMS ||--o{ TEAM_MEMBERSHIPS : has
   USERS ||--o{ TEAM_MEMBERSHIPS : has
   TEAMS ||--o{ USERS_ON_TEAM : has
   USERS ||--o{ USERS_ON_TEAM : has
 ```
