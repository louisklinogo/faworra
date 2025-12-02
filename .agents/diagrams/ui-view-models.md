 # Diagram: UI View‑Models
 
 Representative view‑models used by UI features. Full detail: `docs/diagrams/erds.md`.
 
 ```mermaid
 classDiagram
   class TransactionEnriched {
     transaction: { id, date, description, type, status, amount, currency, categorySlug, paymentMethod, transactionNumber, excludeFromAnalytics }
     client?: { id, name }
     category?: { id, name, slug }
     assignedUser?: { id, fullName, email }
     tags: Array<{ id, name, color }>
     nextCursor?: { date?: string, id: string }
   }
 
   class ProductDetailsVM {
     product: { id, name, type, status, description, categorySlug, createdAt, updatedAt }
     variants: Array<{ id, sku, name, price, currency, stockQuantity? }>
     media: Array<{ id, path, alt, isPrimary, width?, height?, sizeBytes?, mimeType? }>
   }
 
   class ClientsListVM {
     items: Array<{ id, name, whatsapp, phone?, email?, tags: string[] }>
     nextCursor?: string
   }
 
   class InboxThreadVM {
     thread: { id, channel, status, assignedUserId?, lastMessageAt }
     account: { id, provider, externalId, displayName }
     customer?: { id, name }
     messages: Array<{ id, direction, type, content?, sentAt?, status? }>
   }
 ```
