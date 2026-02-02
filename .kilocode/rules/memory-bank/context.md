# Active Context: Practice Management System (PMS) for Homeopathic Clinics

## Current State

**Project Status**: ✅ Module 2 Complete - User Roles & Login System

Building a modular, offline-first Practice Management System for homeopathic clinics based on Module 1 & Module 2 architecture specifications.

## Recently Completed

### Module 1 - Foundation
- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Dependencies installed and verified
- [x] Build verification passed
- [x] Modular directory structure created
- [x] Core type definitions for all data domains
- [x] Local database infrastructure (offline-first)
- [x] UI components: Button, Card, Input, Badge
- [x] Layout components: Sidebar, Header
- [x] Main dashboard with single-workspace interface
- [x] Sample data seeded (patients, materia medica, fees)

### Module 2 - User Roles & Permissions
- [x] User, Role, Permission type definitions
- [x] Authentication context with permission engine
- [x] Login page supporting 3 modes (none/basic/role)
- [x] User management page for Doctor
- [x] Role-based permission editor
- [x] Activity logging system for audit trails
- [x] Staff messaging system
- [x] Emergency mode feature
- [x] Frontdesk override feature
- [x] Sidebar updates based on user permissions

## Architecture Overview (Module 1)

### Design Philosophy
- ✅ **Offline-first**: Works 100% without internet
- ✅ **Local data source of truth**: All critical data stored locally
- ✅ **Modular architecture**: Independent, pluggable modules

### Phase-1 Features (Foundation)
1. ✅ Dashboard - Overview and stats
2. [ ] PMS Module - Patient management
3. [ ] Appointment Scheduler
4. [ ] Queue Management
5. [ ] Doctor Panel (Manual)
6. [ ] Prescription Engine
7. [ ] Pharmacy (Manual)
8. [ ] Materia Medica (Exact text search)
9. [ ] Fees & Billing
10. [ ] Reports (Basic)

### Data Domains
1. **Clinical Domain**: Patient, Case, Symptoms, Diagnosis, Prognosis
2. **Operational Domain**: Appointments, Queue, Pharmacy, Staff actions
3. **Financial Domain**: Fees, Receipts, Refunds, Reports
4. **Knowledge Domain**: Materia Medica, Repertory, Doctor's notes

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Dashboard page
│   ├── globals.css         # Tailwind imports + global styles
│   ├── favicon.ico         # Site icon
│   ├── login/              # Login page (Module 2)
│   ├── messages/           # Staff messaging (Module 2)
│   └── admin/              # Admin section (Module 2)
│       ├── activity-log/   # Activity log page
│       └── users/          # User management page
├── components/             # Reusable components
│   ├── ui/                 # UI primitives
│   │   ├── Button.tsx      # Button component
│   │   ├── Card.tsx        # Card component
│   │   ├── Input.tsx       # Input, Textarea, Select
│   │   └── Badge.tsx       # Badge, StatusBadge
│   └── layout/             # Layout components
│       ├── Sidebar.tsx     # Navigation sidebar
│       └── Header.tsx      # Page header
├── lib/                    # Utilities and helpers
│   ├── auth/               # Authentication (Module 2)
│   │   └── auth-context.tsx # Auth context & hooks
│   └── db/                 # Local database
│       └── database.ts     # Offline-first data layer
├── modules/                # Modular architecture (to be created)
│   ├── core/               # Core shared functionality
│   ├── pms/                # Patient Management System
│   ├── appointments/       # Appointment Scheduler
│   ├── queue/              # Queue Management
│   ├── doctor-panel/       # Doctor Panel
│   ├── prescription/       # Prescription Engine
│   ├── pharmacy/           # Pharmacy Module
│   ├── materia-medica/     # Materia Medica
│   ├── fees/               # Fees & Billing
│   └── reports/            # Reports
└── types/                  # TypeScript types
    └── index.ts            # All domain types + Module 2 types
```

## Next Steps

1. [ ] Build Patient Management module (add/edit/View patients)
2. [ ] Build Appointment Scheduler
3. [ ] Build Doctor Panel
4. [ ] Build Queue Management
5. [ ] Build Prescription Engine
6. [ ] Build Pharmacy module
7. [ ] Build Materia Medica search
8. [ ] Build Billing & Fees
9. [ ] Build Reports
10. [ ] Add SQLite database for persistence
11. [ ] Add data export/backup

## Quick Start Guide

### To run the development server:
```bash
bun dev
```
Then open http://localhost:3000 in your browser.

### To build for production:
```bash
bun run build
bun start
```

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Local SQLite database setup |

## Session History

| Date | Changes |
|------|---------|
| 2026-02-02 | Initial setup, verified build, updated architecture for PMS |
| 2026-02-02 | Created modular structure, types, database, UI components, dashboard |
| 2026-02-02 | Module 2: User roles, permissions, login, activity log, messaging |

## Key Architecture Rules (from Module 1)

- ✅ Offline-first - no API calls block UI
- ✅ Local data is source of truth
- ✅ Modular - each module independent
- ✅ Phase-2/3 features won't break Phase-1
- ✅ Single-workspace UI philosophy
- ✅ Non-blocking UI - async operations
- ✅ Settings as first-class citizen
- ✅ Failure-safe design - isolated module failures
