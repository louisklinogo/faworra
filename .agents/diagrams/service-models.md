 # Diagram: Service Models (Routers → Entities)
 
 High‑level mapping from tRPC routers to core entities. Full detail: `docs/diagrams/erds.md`.
 
 ```mermaid
 classDiagram
   class transactionsRouter {
     +create(payment|entry)
     +enrichedList(filters)
     +byId(id)
     +accounts()/accountsCreate()
     +categories()/categoriesCreate()
     +attachmentsAdd()/attachmentsRemove()
     +allocate()/deleteAllocation()
     +list()/stats()/spending()/recentLite()
     +aiParse(query)
   }
   class productsRouter
   class productCategoriesRouter
   class ordersRouter
   class invoicesRouter
   class clientsRouter
   class measurementsRouter
   class communicationsRouter
   class financialAccountsRouter
   class documentsRouter
   class tagsRouter
   class transactionCategoriesRouter
   class transactionTagsRouter
 
   class Transaction
   class TransactionAttachment
   class TransactionTag
   class TransactionAllocation
   class FinancialAccount
   class TransactionCategory
   class Tag
   class Invoice
   class Client
   class Order
   class OrderItem
   class Product
   class ProductVariant
   class ProductMedia
   class InventoryLocation
   class ProductInventory
   class Document
   class CommunicationAccount
   class CommunicationThread
   class CommunicationMessage
 
   transactionsRouter --> Transaction
   transactionsRouter --> FinancialAccount : accounts*
   transactionsRouter --> TransactionCategory : categories*
   transactionsRouter --> TransactionAttachment : add/remove
   transactionsRouter --> TransactionTag : link
   transactionsRouter --> TransactionAllocation : allocate
   Transaction --> Invoice : invoiceId
   Transaction --> Client : clientId
   Transaction --> Order : orderId
 
   productsRouter --> Product
   productsRouter --> ProductVariant
   productsRouter --> ProductMedia
   productCategoriesRouter --> ProductCategory
 
   ordersRouter --> Order
   ordersRouter --> OrderItem
   invoicesRouter --> Invoice
   clientsRouter --> Client
   measurementsRouter --> Client
   measurementsRouter --> Measurement
 
   communicationsRouter --> CommunicationAccount
   communicationsRouter --> CommunicationThread
   communicationsRouter --> CommunicationMessage
 
   financialAccountsRouter --> FinancialAccount
   documentsRouter --> Document
   tagsRouter --> Tag
   transactionCategoriesRouter --> TransactionCategory
   transactionTagsRouter --> TransactionTag
 ```
