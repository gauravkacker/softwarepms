# Active Context: Practice Management System (PMS) for Homeopathic Clinics

## Current State

**Project Status**: ✅ Module 3 Complete - Patient Management System
**Next**: Module 4 - Appointment Scheduler

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

### Module 3 - Patient Management System (Complete)
- [x] Patient type definition and CRUD operations
- [x] Patient list page with search and filtering
- [x] Patient detail view page
- [x] Add new patient form
- [x] Edit patient page (/patients/[id]/edit)
- [x] Delete patient functionality
- [x] Create visit form (/patients/[id]/visits/new)
- [x] Salutation field support
- [x] Age display fix (use patient.age field)
- [x] **Profile Photo Upload** - Webcam capture + file upload with compression (3.5)
- [x] **Tag Management UI** - Create/edit/delete custom patient tags (3.6)
- [x] **Registration Number Settings** - Configure prefix, starting number, padding (3.2)

### Module 4 - Appointment Scheduler & Queue Management (Complete)
- [x] Appointment type definition with slots, dates, patients
- [x] Slot configuration page (create/edit/delete time slots)
- [x] **Token Mode Setting** - Continuous or reset daily mode
- [x] **Patient Dropdown** - Show only 10 recently added patients in new appointment
- [x] **Slot Filter** - Filter appointments by slot
- [x] **Settings Index Page** - Navigation hub for Registration, Slots, Fees, Import
- [x] Import Patients feature with CSV support
- [x] Appointment list page with date/slot filters
- [x] Queue management page (check-in, in-consultation, completed)
- [x] Doctor panel for queue viewing
- [x] Fee structure configuration (types, amounts)
- [x] Slots persistence fix (localStorage)

## Architecture Overview (Module 1)

### Design Philosophy
- ✅ **Offline-first**: Works 100% without internet
- ✅ **Local data source of truth**: All critical data stored locally
- ✅ **Modular architecture**: Independent, pluggable modules

### Phase-1 Features (Foundation)
1. ✅ Dashboard - Overview and stats
2. ✅ PMS Module - Patient management
3. ✅ Appointment Scheduler - Module 4 Complete
4. ✅ Queue Management - Module 4 Complete
5. [ ] Doctor Panel (Manual)
6. [ ] Prescription Engine
7. [ ] Pharmacy (Manual)
8. [ ] Materia Medica (Exact text search)
9. ✅ Fees & Billing - Basic structure in Module 4
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

1. [ ] **Complete Appointment Scheduler** - Module 4 in progress
2. [ ] Build Doctor Panel (Manual)
3. [ ] Build Prescription Engine
4. [ ] Build Pharmacy module
5. [ ] Build Materia Medica search
6. [ ] Build Reports
7. [ ] Add SQLite database for persistence
8. [ ] Add data export/backup

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
| 2026-02-03 | Module 4: Appointment Scheduler, Queue, Fee structure |
| 2026-02-04 | Module 4: Token mode, slot filter, patient dropdown, settings index |
| 2026-02-05 | Fix lint errors for setState in useEffect hooks |
| 2026-02-05 | Fix appointment booking to search all patients (not just recent) |

## Key Architecture Rules (from Module 1)

- ✅ Offline-first - no API calls block UI
- ✅ Local data is source of truth
- ✅ Modular - each module independent
- ✅ Phase-2/3 features won't break Phase-1
- ✅ Single-workspace UI philosophy
- ✅ Non-blocking UI - async operations
- ✅ Settings as first-class citizen
- ✅ Failure-safe design - isolated module failures
