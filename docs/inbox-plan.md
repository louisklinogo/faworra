# 📬 Unified Messaging Inbox - Development Plan

## 🎯 Project Overview

Transform the current basic messaging inbox into a **production-ready unified communications platform** for managing customer conversations across WhatsApp, Instagram, and future channels (SMS, Email).

**Current State:** Basic thread list + message view with real-time updates
**Target State:** Full-featured customer support inbox (like Intercom, Front, Zendesk)

---

## 📋 Phase 1: Foundation & Core UX (Week 1-2) ✅ COMPLETE

### 1.1 Database Schema Enhancements
Current schema already supports:
- ✅ Thread status (open, pending, resolved, snoozed)
- ✅ Assignment to users (`assigned_user_id`)
- ✅ Customer linking (`customer_id`)
- ✅ Multi-channel support

**Action Items:**
- [ ] Add `tags` JSONB field to `communication_threads` for labels
- [ ] Add `priority` enum field (low, normal, high, urgent)
- [ ] Create `thread_notes` table for internal team notes
- [ ] Create `canned_responses` table for quick replies
- [ ] Add `unread_count` to threads (or compute on-the-fly)

### 1.2 Improved Layout & Navigation ✅ DONE

**Completed:**
- ✅ Consolidated into single inbox implementation
- ✅ Implemented 3-column layout:
  - Left: Conversation list (380px)
  - Center: Active conversation (flex-1)
  - Right: Customer sidebar (320px, collapsible)
- ✅ Added mobile-responsive behavior (show one column at a time)
- ✅ Implemented keyboard navigation (↑↓ arrows, Esc, Cmd+B)
- ✅ Added conversation search within inbox

### 1.3 Enhanced Conversation List ✅ DONE

**Completed:**
- ✅ Better visual hierarchy (avatar, name, preview, metadata)
- ✅ Unread count badges
- ✅ Status badges (open, pending, resolved)
- ✅ Last message preview with sender indicator
- ✅ Platform badges (WhatsApp, Instagram)
- ✅ Improved hover and selected states

**Still Needed:**
- [ ] Assignment indicators (show assigned team member)
- [ ] Priority indicators
- [ ] Typing indicators
- [ ] Pinned conversations
- [ ] Multi-select for bulk actions

### 1.4 Customer Info Sidebar ✅ DONE

**Completed:**
- ✅ Customer profile card
  - Avatar, name, contact info
  - Platform badges (WhatsApp, Instagram)
  - Link to customer record
- ✅ Conversation metadata
  - Status dropdown
  - Assignment dropdown
  - Timestamps
- ✅ Customer history
  - Previous conversations count
  - Order history count
- ✅ Internal notes section (UI only)
  - Team-only comments
  - Timestamps and authors

**Still Needed:**
- [ ] Connect status dropdown to backend
- [ ] Connect assignment dropdown to backend
- [ ] Persist internal notes to database
- [ ] Add @mentions for team members
- [ ] Rich text editor for notes

---

## 📋 Phase 2: Backend Integration (Week 3) 🔄 IN PROGRESS

### 2.1 Database Schema Updates

**Create Migration:**
```sql
-- Add tags to threads
ALTER TABLE communication_threads 
ADD COLUMN tags JSONB DEFAULT '[]';

-- Add priority to threads
CREATE TYPE thread_priority AS ENUM ('low', 'normal', 'high', 'urgent');
ALTER TABLE communication_threads 
ADD COLUMN priority thread_priority DEFAULT 'normal';

-- Create thread_notes table
CREATE TABLE thread_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES communication_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_thread_notes_thread ON thread_notes(thread_id);
CREATE INDEX idx_thread_notes_team ON thread_notes(team_id);

-- Create canned_responses table
CREATE TABLE canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_canned_responses_team ON canned_responses(team_id);
CREATE INDEX idx_canned_responses_user ON canned_responses(user_id);
```

### 2.2 tRPC Endpoints

**Create/Update:**
- [ ] `communications.updateThreadStatus` - Update thread status
- [ ] `communications.assignThread` - Assign thread to user
- [ ] `communications.updateThreadPriority` - Update priority
- [ ] `communications.addThreadNote` - Add internal note
- [ ] `communications.getThreadNotes` - Get notes for thread
- [ ] `communications.updateThreadNote` - Edit note
- [ ] `communications.deleteThreadNote` - Delete note
- [ ] `communications.addThreadTags` - Add tags
- [ ] `communications.removeThreadTags` - Remove tags
- [ ] `communications.getCannedResponses` - Get quick replies
- [ ] `communications.createCannedResponse` - Create quick reply
- [ ] `communications.updateCannedResponse` - Update quick reply
- [ ] `communications.deleteCannedResponse` - Delete quick reply

### 2.3 Connect UI to Backend

**Update Components:**
- [ ] Connect status dropdown in CustomerSidebar
- [ ] Connect assignment dropdown in CustomerSidebar
- [ ] Connect priority selector in CustomerSidebar
- [ ] Implement notes persistence
- [ ] Add optimistic updates for all mutations
- [ ] Add error handling and toast notifications

---

## 📋 Phase 3: Message Composer Enhancements (Week 4)

### 3.1 Rich Message Composer

**Features:**
- [ ] Multi-line text input with auto-resize
- [ ] Emoji picker integration
- [ ] File attachments (images, videos, documents) ✅ Already working
- [ ] Drag & drop file upload
- [ ] Image preview before sending
- [ ] Video/audio message support
- [ ] Message formatting (bold, italic, links)
- [ ] Character counter for SMS

### 3.2 Canned Responses / Quick Replies

**Implementation:**
- [ ] Create/edit/delete canned responses
- [ ] Organize by categories
- [ ] Keyboard shortcut to open (/)
- [ ] Search/filter responses
- [ ] Variable substitution ({{customer_name}}, {{order_id}})
- [ ] Team-wide vs personal responses
- [ ] Usage analytics

### 3.3 Internal Notes ✅ UI Done, Backend Needed

**Features:**
- [ ] Toggle between "Reply to customer" and "Internal note"
- [ ] Different visual styling for notes
- [ ] @mention team members
- [ ] Notification on @mention
- [ ] Notes visible in sidebar ✅ Done
- [ ] Edit/delete notes

### 3.4 Message Actions

**Features:**
- [ ] Copy message text
- [ ] Delete message (with confirmation)
- [ ] Forward message
- [ ] React to messages (emoji reactions)
- [ ] Quote/reply to specific message
- [ ] Mark as important

---

## 📋 Phase 4: Advanced Features (Week 5-6)

### 4.1 Real-time Enhancements

**Current:** Basic Supabase subscriptions ✅
**Improvements:**
- [ ] Typing indicators (show when customer is typing)
- [ ] Online/offline status
- [ ] Presence system (show who's viewing conversation)
- [ ] Desktop notifications
- [ ] Browser notification permissions
- [ ] Sound notifications (with mute option)
- [ ] Unread count in browser tab title

### 4.2 Search & Filters ✅ Basic Done

**Implementation:**
- [x] Global search across all conversations
- [ ] Search within conversation
- [x] Advanced filters:
  - [x] By status
  - [ ] By assignment
  - [x] By channel (WhatsApp, Instagram)
  - [ ] By date range
  - [ ] By tags
  - [ ] By priority
  - [ ] By customer
- [ ] Saved filter presets
- [ ] Search history

### 4.3 Bulk Actions

**Features:**
- [ ] Multi-select conversations (checkbox UI)
- [ ] Bulk status change
- [ ] Bulk assignment
- [ ] Bulk tagging
- [ ] Bulk delete/archive
- [ ] Select all / deselect all
- [ ] Keyboard shortcuts (Cmd+A, Shift+click)

### 4.4 Conversation History & Context

**Features:**
- [ ] Load older messages (infinite scroll up)
- [ ] Jump to date
- [ ] Message search within thread
- [ ] Linked conversations (merge/split)
- [ ] Conversation timeline view
- [ ] Export conversation (PDF, CSV)

---

## 📋 Phase 5: Team Collaboration (Week 7)

### 5.1 Team Features

**Implementation:**
- [ ] Team member list in sidebar
- [ ] Active team members indicator
- [ ] Transfer conversation to team member
- [ ] Collision detection (multiple people viewing same thread)
- [ ] Activity log (who did what, when)
- [ ] Team performance metrics

### 5.2 Notifications System

**Features:**
- [ ] In-app notification center
- [ ] Email notifications (configurable)
- [ ] Notification preferences per user
- [ ] Notification rules (only for assigned, only for @mentions)
- [ ] Digest emails (daily/weekly summary)
- [ ] Mobile push notifications (future)

### 5.3 Automation Rules

**Implementation:**
- [ ] Auto-assignment rules
- [ ] Auto-tagging based on keywords
- [ ] Auto-responses (business hours, away message)
- [ ] SLA tracking (response time goals)
- [ ] Escalation rules (auto-assign to manager if unresolved)

---

## 📋 Phase 6: Analytics & Reporting (Week 8)

### 6.1 Conversation Analytics

**Metrics:**
- [ ] Total conversations (by status, channel, period)
- [ ] Average response time
- [ ] Average resolution time
- [ ] Conversations per team member
- [ ] Customer satisfaction (future: CSAT surveys)
- [ ] Busiest hours/days
- [ ] Channel distribution

### 6.2 Team Performance

**Metrics:**
- [ ] Messages sent per team member
- [ ] Response time per team member
- [ ] Resolution rate
- [ ] Active conversations
- [ ] Workload distribution
- [ ] Leaderboard (gamification)

### 6.3 Reports & Exports

**Features:**
- [ ] Custom date range reports
- [ ] Export to CSV/Excel
- [ ] Scheduled reports (email)
- [ ] Dashboard widgets
- [ ] Real-time metrics

---

## 🎨 UI/UX Improvements

### Design System Consistency ✅ Done

**Completed:**
- ✅ Use shadcn components consistently
- ✅ Implement proper loading states (skeletons)
- ✅ Add empty states with helpful CTAs
- ✅ Improve error handling (toast notifications)
- ✅ Add smooth animations
- ✅ Responsive design

**Still Needed:**
- [ ] Add confirmation dialogs for destructive actions
- [ ] Implement optimistic updates for all mutations
- [ ] Add more loading skeletons

### Accessibility

**Requirements:**
- [x] Keyboard navigation throughout
- [ ] ARIA labels for screen readers
- [ ] Focus management
- [ ] Color contrast compliance (WCAG AA)
- [ ] Reduced motion support

### Performance

**Optimizations:**
- [ ] Virtual scrolling for long message lists
- [ ] Image lazy loading
- [x] Message pagination (load on scroll)
- [ ] Debounced search
- [ ] Optimistic UI updates
- [ ] Cache conversation list
- [ ] Prefetch adjacent conversations

---

## 🔧 Technical Improvements

### Backend (tRPC/API)

**Action Items:**
- [ ] Add conversation status mutation
- [ ] Add assignment mutation
- [ ] Add tags CRUD endpoints
- [ ] Add canned responses CRUD
- [ ] Add internal notes CRUD
- [ ] Add bulk operations endpoints
- [ ] Add search endpoint with filters
- [ ] Add analytics endpoints
- [ ] Implement rate limiting
- [ ] Add webhook support for external integrations

### Database Queries

**Optimizations:**
- [ ] Add indexes for common queries
- [ ] Optimize conversation list query
- [ ] Add full-text search indexes
- [ ] Implement cursor-based pagination
- [ ] Add database views for analytics

### Real-time Architecture

**Improvements:**
- [x] Optimize Supabase subscriptions
- [ ] Implement presence system
- [ ] Add typing indicators channel
- [ ] Batch real-time updates
- [ ] Handle reconnection gracefully

---

## 📱 Mobile Considerations ✅ Done

### Responsive Design

**Completed:**
- ✅ Single-column layout on mobile
- ✅ Bottom sheet for customer info
- ✅ Touch-friendly buttons
- ✅ Mobile-optimized composer
- ✅ Back button navigation

**Still Needed:**
- [ ] Swipe gestures (archive, delete)
- [ ] Pull-to-refresh

---

## 🚀 Quick Wins (Week 1 Priority) ✅ COMPLETE

1. **Consolidate Inbox Implementation** ✅ DONE
   - Merged inbox-view.tsx and inbox-page-client.tsx
   - Implemented proper 3-column layout
   - Added mobile responsiveness

2. **Customer Info Sidebar** ✅ DONE
   - Basic customer profile
   - Conversation metadata
   - Status/assignment dropdowns

3. **Internal Notes** ✅ UI DONE
   - Created UI for notes in sidebar
   - Need backend integration

4. **Keyboard Navigation** ✅ DONE
   - Arrow keys for thread navigation
   - Shortcuts for common actions
   - Esc to close/deselect

5. **Better Message Grouping** ✅ DONE
   - Group by date
   - Sender grouping (consecutive messages)
   - Improved visual hierarchy

---

## 📊 Success Metrics

### User Experience
- Average response time < 5 minutes
- 90%+ conversations resolved within 24 hours
- < 2 clicks to perform common actions
- Zero data loss on network issues

### Performance
- Page load < 2 seconds
- Message send < 500ms
- Real-time updates < 1 second latency
- Support 100+ concurrent conversations

### Adoption
- 100% team adoption within 2 weeks
- 50%+ reduction in missed messages
- 30%+ improvement in response time
- Positive user feedback (NPS > 8)

---

## 🔄 Current Status

### ✅ Completed (Phase 1)
- 3-column responsive layout
- Customer sidebar with profile and metadata
- Keyboard navigation
- Message grouping by date
- Enhanced conversation list
- Status and platform filters
- Mobile responsive design

### 🔄 In Progress (Phase 2)
- Database schema updates
- Backend tRPC endpoints
- Connect UI to backend

### 📅 Upcoming (Phase 3+)
- Canned responses
- Typing indicators
- Bulk actions
- Advanced search
- Team collaboration
- Analytics

---

## 📚 Reference Implementations

Study these for inspiration:
- **Intercom** - Customer messaging
- **Front** - Shared inbox
- **Chatwoot** - Open-source alternative
- **WhatsApp Web** - Familiar messaging UI
- **Linear** - Keyboard shortcuts & UX
- **Slack** - Real-time collaboration

---

## 🎬 Next Steps

1. **Complete Phase 2**: Backend integration
   - Create database migrations
   - Build tRPC endpoints
   - Connect UI to backend
   - Test status/assignment/notes functionality

2. **Start Phase 3**: Message composer enhancements
   - Implement canned responses
   - Add emoji picker
   - Improve file attachments

3. **Plan Phase 4**: Advanced features
   - Design typing indicators
   - Plan bulk actions UI
   - Design advanced search

---

**Let's build an amazing inbox! 🚀**