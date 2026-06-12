```markdown
# 🍴 BUONO PROJECT - MASTER CONTEXT FILE
# Version: 11.0 (Smart Master File with Status Tracking!)
# Last Updated: 2026-06-10
# Purpose: ONE file = AI knows EVERYTHING + Current Work!

═══════════════════════════════════════════════════════════════
## 📚 TABLE OF CONTENTS
═══════════════════════════════════════════════════════════════

PART A: 🆕 SMART TRACKING (READ FIRST!)
  1. 🎯 Current Status Dashboard
  2. 📋 Active Development Plan
  3. 📖 How to Use This File
  4. 🤖 AI Instructions

PART B: PROJECT FUNDAMENTALS
  5. 🎯 Project Overview
  6. 👤 Developer Profile
  7. 🔴 7 Mandatory Rules
  8. 🏗️ Architecture Guide

PART C: TECHNICAL REFERENCE
  9. 🔥 Firebase Config Master
  10. ⭐ DATABASES Array Guide
  11. 📝 Code Patterns & Snippets
  12. 🎨 Design System
  13. 📱 Mobile Patterns

PART D: SYSTEM REFERENCE
  14. 🔐 Permissions System
  15. 🗄️ Firebase Collections (18)
  16. 👥 User Roles (7)
  17. 🆕 Page-by-Page Features

PART E: PRACTICAL GUIDES
  18. 📋 Common Tasks (Step-by-Step)
  19. 🐛 Common Errors + Fixes
  20. 👤 Test Credentials
  21. 💡 Best Practices

═══════════════════════════════════════════════════════════════
# 🆕 PART A: SMART TRACKING (CRITICAL!)
═══════════════════════════════════════════════════════════════

## 1. 🎯 CURRENT STATUS DASHBOARD

### 📅 Last Update Info:
```
Date: 2026-06-10
Time: Evening session
Developer: Naveen (Sachintha1999)
Working on: Call Center Improvements
```

### 🏆 Current Version:
```
Project Version: v10.9
File Updates:
- callcenter.html      → v10.9 (Smart Date Buttons added)
- callcenter-script.js → v10.9 (Date logic complete)
- callcenter-style.css → v10.9 (Date button styles added)
```

### ✅ Recently Completed:
```
✅ Step 1: Smart Date Buttons (DONE - 2026-06-10)
   - Quick buttons: Tomorrow, 3 Days, 1 Week, 2 Weeks, 1 Month
   - Auto-set on status change (Smart Defaults)
   - Auto badge display
   - Active button highlighting
   - Manual override clears active state
   - Works in: Call Log, Might Join, Follow-ups tabs
```

### ⏳ Currently In Progress:
```
Nothing in progress (Step 1 complete, awaiting Step 2)
```

### 🎯 Next Steps (Order):
```
⏳ Step 2: Stats Bar Fix (HTML IDs missing)
⏳ Step 3: Tab Badge Zero Hide
⏳ Step 4: Lead Source Analytics
⏳ Step 5: Reminder Notifications
⏳ Step 6: Duplicate Smart Merge
⏳ Step 7: Lead Scoring System
```

### 📊 Project Health:
```
🟢 Architecture: Excellent (v10.3 4-Files Rule!)
🟢 Mobile: Fully responsive
🟢 Performance: Real-time updates working
🟢 Security: Permission-based access OK
🟡 Documentation: Updated v11.0 today!
🟢 Live Status: Production - working!
```

---

## 2. 📋 ACTIVE DEVELOPMENT PLAN

### 🎯 Current Focus: Call Center Improvements

**Total Features Planned: 7**
**Completed: 1**
**Remaining: 6**

### 📊 PROGRESS TRACKER:

```
┌────────────────────────────────────────────────┐
│ FEATURE                          │ STATUS      │
├────────────────────────────────────────────────┤
│ Step 1: Smart Date Buttons       │ ✅ DONE     │
│ Step 2: Stats Bar Fix            │ ⏳ NEXT     │
│ Step 3: Tab Badge Zero Hide      │ ⏳ Pending  │
│ Step 4: Lead Source Analytics    │ ⏳ Pending  │
│ Step 5: Reminder Notifications   │ ⏳ Pending  │
│ Step 6: Duplicate Smart Merge    │ ⏳ Pending  │
│ Step 7: Lead Scoring System      │ ⏳ Pending  │
└────────────────────────────────────────────────┘
```

### 📝 DETAILED PLAN:

#### ✅ Step 1: Smart Date Buttons (COMPLETED)
```
What was done:
- Quick buttons (Tomorrow, 3D, 1W, 2W, 1M)
- Auto-date on status change
- Smart defaults per status
- Auto badge indicator
- Active state highlighting

Files modified:
- callcenter.html (3 tabs + onchange handlers)
- callcenter-script.js (helper functions)
- callcenter-style.css (button styles + badge)

Status: ✅ Working in production
```

#### ⏳ Step 2: Stats Bar Fix (NEXT!)
```
Problem:
Script tries to update stats bars in:
- Might Join tab
- Follow-ups tab
- Hold tab
But HTML elements (mightJoinStats, followupsStats, 
holdStats) don't exist!

Solution:
Add stats bar HTML divs in 3 tabs
Display: Total | New | Old | Done Today | Remaining

Files to modify:
- callcenter.html (add 3 stats bars)

Estimated time: 15 minutes
```

#### ⏳ Step 3: Tab Badge Zero Hide
```
What:
Tab badges show "0" - looks ugly!
0 = hide badge
1+ = show badge

Files:
- callcenter-script.js (modify setEl logic)
- callcenter-style.css (badge visibility)

Estimated time: 5 minutes
```

#### ⏳ Step 4: Lead Source Analytics
```
What:
New section in Reports tab:
- Facebook: 45 leads, 12 enrolled (26%)
- Instagram: 23 leads, 5 enrolled (21%)
- Walk In: 67 leads, 30 enrolled (44%)
- etc.

Visual: Bar charts (like status bars)
Highlight: Best performing source!

Files:
- callcenter.html (add section)
- callcenter-script.js (calculation function)
- callcenter-style.css (visual styles)

Estimated time: 30 minutes
```

#### ⏳ Step 5: Reminder Notifications
```
What:
- Page load = check today's follow-ups
- Toast: "📅 3 follow-ups due today!"
- Tab badge pulse animation
- Click = jump to follow-ups tab
- Browser notification (optional)

Files:
- callcenter-script.js (check on init)
- callcenter-style.css (pulse animation)

Estimated time: 25 minutes
```

#### ⏳ Step 6: Duplicate Smart Merge
```
What:
- Quick Add = detect similar (name/phone)
- "Merge" button = combine 2 leads
- Combines: call history + WA history
- Keep newest status
- Settings tab: "Find Duplicates" tool

Files:
- callcenter.html (modals + settings section)
- callcenter-script.js (merge logic)
- callcenter-style.css (merge UI)

Estimated time: 45 minutes
```

#### ⏳ Step 7: Lead Scoring System
```
What:
Auto-score each lead 0-100:
+20 Course interest selected
+15 Might Join status
+10 Each call attempt (max 40)
+15 WhatsApp sent
+10 Follow-up date set
-20 Hold status
-30 Unable to join
-10 Not in use
+50 Payment started

Display:
🟢 80-100: HOT LEAD 🔥
🟡 50-79:  WARM
🟠 30-49:  COOL
🔴 0-29:   COLD

Features:
- Score badge on every lead card
- Sort by score option
- Reports: score distribution chart

Files:
- callcenter.html (score badges + filters)
- callcenter-script.js (scoring logic)
- callcenter-style.css (score colors)

Estimated time: 1 hour
```

---

## 3. 📖 HOW TO USE THIS FILE

### 🆕 For NEW CHAT (After Freeze):

```
1. Open new chat with Claude/AI
2. Copy this ENTIRE file
3. Paste at the start
4. Say one of these:

For continuing work:
"Continue from where we left off"
→ AI reads "Current Status" and "Active Plan"
→ Knows exactly what's next!

For new feature:
"Add a new feature: [description]"
→ AI uses project structure to plan it

For bug fix:
"Bug in [page]: [description]"
→ AI knows architecture, suggests fix

For questions:
"How does [feature] work?"
→ AI explains based on docs
```

### 📂 Common Scenarios:

#### Scenario 1: Chat froze in middle of work
```
Action: Paste this file → Say "Continue Step X"
AI Response: Asks for current file → Continues

Example:
You: [paste file] "Continue Step 3"
AI: "I see Step 3 is Tab Badge Zero Hide. 
     Send me current callcenter-script.js to update."
```

#### Scenario 2: New bug found
```
Action: Paste this file → Describe bug
AI Response: Identifies file → Asks → Fixes

Example:
You: [paste file] "Bug: Login fails on mobile"
AI: "Send me login.html and login-script.js"
```

#### Scenario 3: New feature idea
```
Action: Paste this file → Describe feature
AI Response: Plans it → Adds to current plan

Example:
You: [paste file] "Add: SMS notifications"
AI: "Great idea! Here's the plan..."
```

#### Scenario 4: Just want to chat/discuss
```
Action: Paste this file → Ask questions
AI Response: Uses docs to answer

Example:
You: [paste file] "Tell me about the inventory system"
AI: "Buono inventory has 4 features..."
```

### 📥 What Files to Send:

#### For Call Center work:
```
✅ callcenter.html
✅ callcenter-script.js
✅ callcenter-style.css
(Don't need firebase-config.js usually)
```

#### For new database/page:
```
✅ firebase-config.js (to add to DATABASES)
✅ Existing similar page (template)
```

#### For Permission/User issues:
```
✅ index.html
✅ index-script.js
✅ access.html (sometimes)
```

#### For Login/Auth issues:
```
✅ login.html
✅ login-script.js
✅ firebase-config.js
```

### 🎯 Quick Templates:

#### Template: Continue Work
```
[Paste this file]

"Continue from Current Status.
Currently on Step [X].
Files I'll send: [list]"
```

#### Template: Bug Report
```
[Paste this file]

"Bug Report:
Page: [name]
Issue: [description]
When: [steps to reproduce]
Files attached: [list]"
```

#### Template: New Feature
```
[Paste this file]

"New Feature Request:
What: [description]
Why: [reason]
Priority: [high/medium/low]
Affects: [pages/databases]"
```

---

## 4. 🤖 AI INSTRUCTIONS

### 👋 You are helping Naveen with Buono Project!

### 🎯 BEHAVIORAL RULES:

```
✅ ALWAYS DO:
1. Read "Current Status Dashboard" FIRST
2. Read "Active Development Plan" SECOND
3. Then answer/respond
4. Speak Sinhala (Singlish OK)
5. Give FULL files (no partial code!)
6. Plan first, then ask for permission
7. Step-by-step approach
8. Clear test instructions
9. Encouraging tone (Naveen learning!)
10. Update this file's "Current Status" after each task

❌ NEVER DO:
1. Don't assume tech knowledge (no jargon!)
2. Don't give partial code
3. Don't skip planning phase
4. Don't modify multiple files without explaining
5. Don't use English-only responses
6. Don't be technical without simplifying
```

### 🔄 STANDARD WORKFLOW:

```
Step 1: ACKNOWLEDGE
  - "හරි!" / "Good!" / etc.
  - Confirm you understood
  - Reference current status

Step 2: PLAN
  - Explain what will be done
  - List files to be modified
  - Estimate complexity
  - Ask for permission

Step 3: REQUEST FILES (if needed)
  - "Send me [file1.js]"
  - Be specific about what you need

Step 4: GIVE SOLUTION
  - Full file replacements
  - One file at a time
  - Clear copy-paste instructions

Step 5: TEST INSTRUCTIONS
  - "Save → Deploy → Refresh"
  - What to check
  - Expected results

Step 6: UPDATE STATUS
  - Mark step as ✅ DONE
  - Move to next step
  - Update "Currently In Progress"
```

### 💬 RESPONSE FORMAT:

```
Good Response:
═════════════
"හරි නවීන්! 🎉

Step 2 යමු - Stats Bar Fix!

📋 Plan:
- callcenter.html update කරන්න
- 3 places add කරන්න (stats bars)

📤 Send me:
- callcenter.html

මම update කරලා දෙන්නම්!"

Bad Response:
═════════════
"Sure, I'll add stats bars by inserting div elements
at lines 245-250 in your HTML file. You need to add..."
(Too technical, partial info, no Sinhala)
```

### 🔧 FILE HANDLING:

```
When Naveen sends a file:
1. Read entire file
2. Understand structure
3. Apply changes
4. Give COMPLETE updated file
5. Highlight what changed (in description, not code)

Example:
"✅ Updated callcenter.html!

Changes made:
- Added stats bars in 3 tabs
- mightJoinStats div added
- followupsStats div added  
- holdStats div added

Save → Deploy → Test!"
```

### 🎓 LEARNING STYLE:

```
Naveen's level: Beginner (copy/paste only)
Best approach:
- One concept at a time
- Visual examples
- Clear "what" before "why"
- Practical over theoretical
- Celebrate small wins!
```

### 🚨 EMERGENCY PROTOCOL:

```
If Naveen says "broken" / "error":
1. STAY CALM (don't panic)
2. Ask: "What's the exact error?"
3. Ask: "Screenshot please?"
4. Ask: "Console (F12) errors?"
5. Suggest: "Last working commit"
6. Solution: Revert if needed

Don't make it worse!
```

### 📊 TRACK PROGRESS:

```
After each completed step:
- Update Current Status section
- Mark step ✅ DONE
- Add timestamp
- Update "Recently Completed"
- Move next step to "In Progress"

This way, even if chat freezes,
next AI knows exactly where to continue!
```

[END OF PART 1/6]
```

---

## ✅ Part 1 Done!


```markdown
═══════════════════════════════════════════════════════════════
# PART B: PROJECT FUNDAMENTALS
═══════════════════════════════════════════════════════════════

## 5. 🎯 PROJECT OVERVIEW

### Project Identity:
```
Name:     Buono Employee & Business Management System
Business: Buono Cafe + Buono Academy (Sri Lanka)
Type:     Web Application (Responsive - no mobile app)
Status:   Production - LIVE & Working!
```

### Live URLs:
```
🌐 Production:     https://buono-project-927b8.web.app
🔗 GitHub:         https://github.com/Sachintha1999/Buono-project
🔥 Firebase Console: https://console.firebase.google.com/project/buono-project-927b8
```

### Tech Stack:
```
FRONTEND:
- HTML5 (semantic)
- CSS3 (custom, no framework)
- JavaScript (Vanilla ES6+)

BACKEND:
- Firebase Firestore (NoSQL database)
- Firebase Storage (image uploads)
- Firebase Hosting (deployment)

FIREBASE SDK:
- Compat v8 (NOT v9!)
- CDN: https://www.gstatic.com/firebasejs/8.10.1/

FIREBASE PLAN:
- Blaze (Pay-as-you-go)
- Free tier inside (Rs. 0/month current!)
```

### Session Management:
```javascript
// Logged in user stored in sessionStorage
const stored = sessionStorage.getItem('loggedInUser');
const user = JSON.parse(stored);

// User object:
{
    id: "firestore_doc_id",
    name: "Full Name",
    nickname: "loginname",
    password: "password",
    access: "Admin",        // Role
    permissions: {...}      // DB permissions
}
```

### Project Scale:
```
📊 Pages:        10 main pages
🗄️ Collections:  18 active
💾 Databases:    7 logical databases
👥 User Roles:   7 roles
✅ Features:     500+ features
🏆 Architecture: Auto-scaling (4-Files Rule!)
```

---

## 6. 👤 DEVELOPER PROFILE

### About Naveen:
```
Name:       Naveen
GitHub:     Sachintha1999
Background: NO coding background!
Skill:      Copy/paste only
Tools:      VS Code + Firebase + GitHub
Language:   Sinhala (Singlish OK)
```

### Working Style:
```
✅ PREFERS:
- Step-by-step approach
- Full file replacement (NO partial code!)
- Test after every change
- Honest feedback
- Visual screenshots help
- Sinhala/Singlish responses
- Plan first, then code
- Clear instructions

❌ AVOIDS:
- Partial code snippets
- "Add this line at line 245"
- Complex git operations  
- Command line beyond basics
- Technical jargon without explanation
- Multiple changes at once
```

### Common Commands Naveen Uses:
```bash
# Deploy:
firebase deploy

# Git basics:
git add .
git commit -m "message"
git push

# Browser:
Ctrl + Shift + R    (Hard refresh)
F12                 (Console)
```

---

## 7. 🔴 7 MANDATORY RULES

### 🔴 RULE #1: GLOBAL FIREBASE CONFIG ⭐

**Every HTML page MUST have this script order:**
```html
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js"></script>
<script src="firebase-config.js"></script>
<script src="page-script.js"></script>
<script src="mobile-script.js"></script>
```

**firebase-config.js provides:**
- ✅ Firebase initialized (`db`, `firebase.storage()`)
- ✅ Auth helpers (`getCurrentUser()`, `logout()`)
- ✅ DATABASES array (7 DBs - SINGLE SOURCE!)
- ✅ Access helpers (`checkDBAccess()`)
- ✅ UI builders (`buildTopbar()`)
- ✅ Format helpers (`formatDate()`, `formatCurrency()`)

**Page JS files MUST NOT have:**
```javascript
❌ const firebaseConfig = {...}
❌ firebase.initializeApp(...)
❌ const db = firebase.firestore()
❌ const DATABASES = [...]
```

### 🔴 RULE #2: MOBILE SUPPORT ALWAYS!

```html
<link rel="stylesheet" href="mobile.css">
<script src="mobile-script.js"></script>
```

Tables MUST use `data-label`:
```html
<td data-label="Name">John Doe</td>
<td data-label="Amount">Rs. 1,500</td>
```

### 🔴 RULE #3: FILE SPLITTING (Strict!)

For EVERY page, 3 files:
```
pagename.html         (structure)
pagename-script.js    (logic)
pagename-style.css    (styles)
```

**NEVER:**
- ❌ Inline JavaScript in HTML
- ❌ Inline styles in HTML
- ❌ Multiple pages in one file

### 🔴 RULE #4: 7 DATABASES (Auto-Managed!)

Single source: `firebase-config.js` DATABASES array

**All 7 DBs:**
1. employeeDB (👥)
2. dayEndReportDB (💰)
3. inventoryDB (📦)
4. kitchenDB (🍳)
5. purchasingDB (🛒)
6. callCenterDB (📞)
7. reportsDB (📊)

**To add new DB:**
- ONLY add 1 entry to DATABASES array!
- access.html updates AUTO
- index.html permissions update AUTO
- DB switchers update AUTO

### 🔴 RULE #5: PERMISSIONS - ALL DBs!

Every DB has 5 permissions:
- `add` - Create new
- `view` - View all data
- `selfView` - View own data only
- `edit` - Modify
- `delete` - Remove

**Special:**
- Admin = ALL permissions auto-true
- Manager = Most permissions
- Others = Custom per DB

### 🔴 RULE #6: FULL FILE REPLACE!

```
✅ "Here is full file.js - paste replace!"
❌ "Add this line at line 245..."
❌ "Replace function X with..."
```

Why: Naveen can't debug partial changes!

### 🔴 RULE #7: TOPBAR CONSISTENCY!

Every page MUST have:
- Buono logo (left)
- DB switcher (left, after logo)
- Welcome message (right)
- Logout button (right)

---

## 8. 🏗️ ARCHITECTURE GUIDE

### File Structure:
```
public/
├── 🔥 GLOBAL FILES:
│   ├── firebase-config.js  ⭐ MASTER
│   ├── style.css           (shared)
│   ├── mobile.css          (responsive)
│   └── mobile-script.js    (mobile UI)
│
├── 🔐 AUTH:
│   ├── login.html
│   └── login-script.js
│
├── 🏠 HOME:
│   ├── access.html         (✅ AUTO cards!)
│   └── access-script.js
│
├── 👥 EMPLOYEE DB:
│   ├── index.html          (✅ AUTO permissions!)
│   └── index-script.js
│
├── 💰 CASHIER DB:
│   ├── cashier.html
│   └── cashier-script.js
│
├── 📦 INVENTORY DB:
│   ├── inventory.html
│   └── inventory-script.js
│
├── 🍳 KITCHEN DB:
│   ├── kitchen.html
│   └── kitchen-script.js
│
├── 🛒 PURCHASING DB:
│   ├── purchasing.html
│   └── purchasing-script.js (with 📸 payment proof)
│
├── 📊 REPORTS DB:
│   ├── reports.html
│   └── reports-script.js
│
└── 📞 CALL CENTER:
    ├── callcenter.html
    ├── callcenter-style.css
    └── callcenter-script.js (9 tabs!)
```

### Load Order (Critical!):
```
1. firebase-app.js          (Firebase core)
2. firebase-firestore.js    (Database)
3. firebase-storage.js      (Images - if needed)
4. firebase-config.js       (Our config + helpers)
5. page-script.js           (Page logic)
6. mobile-script.js         (Mobile UI)
```

### Page Flow:
```
1. User opens page
2. firebase-config.js loads → db, DATABASES, helpers ready
3. page-script.js loads → initializeApp() runs
4. Check auth (sessionStorage)
5. Refresh user data from Firebase
6. Check DB access permission
7. Build UI (topbar, switcher, content)
8. Start real-time listeners
9. Render data
```

### Data Flow:
```
User Action → Page JS Function → Firestore Operation
→ Firestore Listener (real-time) → UI Update

Example:
[Click "Add"] → openAddModal() → User fills → saveData()
→ db.collection().add() → Listener triggers
→ renderData() → UI updates automatically!
```

### Architecture Wins (v10.3):
```
✅ Single Source of Truth (DATABASES array)
✅ Auto-generated UI (cards, permissions)
✅ Centralized helpers (no duplicate code)
✅ Mobile-first responsive
✅ Real-time updates (onSnapshot)
✅ Permission-based access
✅ Modular file structure
✅ Easy maintenance (4-Files Rule!)
```

═══════════════════════════════════════════════════════════════
# PART C: TECHNICAL REFERENCE
═══════════════════════════════════════════════════════════════

## 9. 🔥 FIREBASE CONFIG MASTER

### Firebase Initialization:
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBkXBs5GrfnMIFnJLJWkSMULYxGKz0Shtk",
    authDomain: "buono-project-927b8.firebaseapp.com",
    projectId: "buono-project-927b8",
    storageBucket: "buono-project-927b8.firebasestorage.app",
    messagingSenderId: "706681135399",
    appId: "1:706681135399:web:c15f197f1efe3a64f00902"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
```

### Global Helper Functions:

#### 🔐 Auth Helpers:
```javascript
// Get logged-in user
const user = getCurrentUser();

// Check auth (redirect if not logged in)
const user = checkAuth();

// Logout with confirm
logout();

// Check role access
const user = checkAccessLevel(['Admin', 'Manager']);

// Check DB permission
if (hasPermission('inventoryDB')) { ... }
```

#### 🗄️ Database Helpers:
```javascript
// Get DB config by ID
const dbConfig = getDatabaseById('inventoryDB');

// Check DB access
if (checkDBAccess('purchasingDB')) { ... }

// Get all accessible DBs
const accessibleDbs = getAccessibleDatabases();
```

#### 🎨 UI Builders:
```javascript
// Build complete topbar
const topbarHTML = buildTopbar('cashierDB');

// Build DB switcher only
const switcherHTML = buildDatabaseSwitcher('inventoryDB');

// Toggle DB switcher
toggleDBSwitcher(event);
```

#### ⭐ All-in-One Init:
```javascript
// Complete page initialization
const user = initPage('cashierDB', ['Admin', 'Manager', 'Cashier']);
if (!user) return; // Handled redirects automatically
```

#### 📅 Format Helpers:
```javascript
formatDate(new Date());        // "Jun 10, 2026"
formatTime(new Date());        // "11:36 PM"
formatDateTime(new Date());    // "Jun 10, 2026 11:36 PM"
formatCurrency(1500);          // "Rs. 1,500.00"
getServerTimestamp();          // Firestore server timestamp
```

#### 📊 Table Helpers:
```javascript
showTableLoading('myTableBody', 5);
showTableEmpty('myTableBody', 5, 'No items found');
```

---

## 10. ⭐ DATABASES ARRAY GUIDE

### Location: `firebase-config.js`

### Purpose:
**SINGLE SOURCE OF TRUTH** for all 7 databases.
Add 1 entry = EVERYWHERE updates AUTO!

### Field Reference:

#### 🔵 BASIC FIELDS (Required):
```javascript
{
    id: 'newDB',                    // Unique ID (camelCase)
    name: 'New Database',           // Display name
    shortName: 'New',               // Short name
    icon: '🆕',                     // Emoji
    url: 'newdb.html',              // Page URL
    permPrefix: 'new',              // 3-letter prefix
    color: '#XXXXXX'                // Brand color
}
```

#### 🟢 ACCESS PAGE FIELDS:
```javascript
{
    description: 'Short tagline',
    accessDescription: 'Full description for card',
    badgeLabel: 'Data Entry',
    badgeClass: 'badge-entry',
    cardClass: '',
    adminManagerOnly: false,
    accessChecks: ['add', 'view', 'selfView', 'edit']
}
```

#### 🟡 ADVANCED FIELDS (Optional):
```javascript
{
    autoAccessRoles: ['Manager', 'Call Operator'],
    privilegedRoles: ['Admin', 'Manager'],
    privilegedRolePerms: { add: true, view: true },
    specialRoleBadges: { 'Call Operator': [...] },
    customPermBadges: [...],
    permBorderColor: '#FF9800',
    permTitleColor: '#FF9800',
    permSubtitle: '(Call Operators)',
    defaultPermsForRole: {
        'Call Operator': { add: true, view: true }
    }
}
```

### Current 7 Databases:
```javascript
const DATABASES = [
    { id: 'employeeDB',     icon: '👥', url: 'index.html' },
    { id: 'dayEndReportDB', icon: '💰', url: 'cashier.html' },
    { id: 'inventoryDB',    icon: '📦', url: 'inventory.html' },
    { id: 'kitchenDB',      icon: '🍳', url: 'kitchen.html' },
    { id: 'purchasingDB',   icon: '🛒', url: 'purchasing.html' },
    { id: 'callCenterDB',   icon: '📞', url: 'callcenter.html' },
    { id: 'reportsDB',      icon: '📊', url: 'reports.html' }
];
```

[END OF PART 2/6]
```

---

## ✅ Part 2 Done!

```markdown
## 11. 📝 CODE PATTERNS & SNIPPETS

### Standard New Page Structure:

#### `newpage.html` Template:
```html
<!DOCTYPE html>
<html lang="si">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buono - [PAGE NAME]</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="mobile.css">
</head>
<body>

    <!-- TOPBAR -->
    <div class="topbar">
        <div class="topbar-left">
            <span class="topbar-icon">🍴</span>
            <h2 style="margin-right:15px;">Buono</h2>
            
            <div class="db-switcher" id="dbSwitcher">
                <span class="db-switcher-icon">📂</span>
                <span class="db-switcher-name">[DB NAME]</span>
                <span class="db-switcher-arrow">▼</span>
                
                <div class="db-switcher-dropdown" id="dbDropdown">
                    <div class="db-dropdown-title">📂 Switch to:</div>
                    <div id="dbDropdownList"></div>
                    <div class="db-dropdown-divider"></div>
                    <a href="access.html" class="db-dropdown-item">
                        <span>🏠</span>
                        <span>Access Home</span>
                    </a>
                </div>
            </div>
        </div>
        
        <div class="topbar-right">
            <span id="welcomeUser">👋 Welcome</span>
            <button class="btn-logout" onclick="logout()">🚪 Logout</button>
        </div>
    </div>

    <!-- MAIN CONTAINER -->
    <div class="dashboard-container">
        <!-- Stats, Search, Table, Modals... -->
    </div>

    <!-- SCRIPTS -->
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
    <script src="firebase-config.js"></script>
    <script src="newpage-script.js"></script>
    <script src="mobile-script.js"></script>

</body>
</html>
```

#### `newpage-script.js` Template:
```javascript
// GLOBAL VARIABLES
let allData = [];
let currentUser = null;
let myPerms = null;

// INITIALIZE
async function initializeApp() {
    const user = sessionStorage.getItem('loggedInUser');
    if (!user) { window.location.href = "login.html"; return; }
    const userData = JSON.parse(user);

    // Refresh from Firebase
    try {
        const userDoc = await db.collection('employees').doc(userData.id).get();
        if (userDoc.exists) {
            const d = userDoc.data();
            userData.access = d.access;
            userData.permissions = d.permissions || {};
            sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
        }
    } catch (e) { console.error(e); }

    // Check access
    const isAdmin = userData.access === 'Admin';
    const perms = userData.permissions?.[DB_ID] || {};
    const hasAccess = isAdmin || perms.add || perms.view || perms.selfView;

    if (!hasAccess) {
        alert('⛔ No access!');
        window.location.href = "access.html";
        return;
    }

    myPerms = isAdmin ? 
        { add: true, view: true, selfView: true, edit: true, delete: true } : 
        perms;
    currentUser = userData;

    document.getElementById('welcomeUser').textContent = 
        `👋 Welcome, ${userData.name} (${userData.access})`;

    buildDatabaseSwitcher();
    startDataListener();
}

initializeApp();

// REAL-TIME LISTENER
function startDataListener() {
    db.collection('[COLLECTION_NAME]').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        allData = [];
        snapshot.forEach((doc) => {
            allData.push({ id: doc.id, ...doc.data() });
        });
        renderData(allData);
    });
}

// SAVE / EDIT / DELETE / SEARCH functions...
```

### Common Patterns:

#### 🔄 Real-time Listener:
```javascript
db.collection('collectionName')
    .orderBy('createdAt', 'desc')
    .onSnapshot((snapshot) => {
        const data = [];
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });
        renderData(data);
    });
```

#### 🖼️ Image Upload (Firebase Storage):
```javascript
async function uploadImage(file) {
    const storageRef = firebase.storage().ref();
    const fileRef = storageRef.child(`images/${Date.now()}_${file.name}`);
    await fileRef.put(file);
    return await fileRef.getDownloadURL();
}

// Usage:
const file = document.getElementById('fileInput').files[0];
const imageURL = await uploadImage(file);
```

#### 🔍 Search Filter:
```javascript
function searchData() {
    const text = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allData.filter(item =>
        item.name.toLowerCase().includes(text)
    );
    renderData(filtered);
}
```

#### 📅 Date Range Filter:
```javascript
function filterByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59);
    
    return allData.filter(item => {
        const itemDate = item.createdAt?.toDate() || new Date(item.date);
        return itemDate >= start && itemDate <= end;
    });
}
```

#### 💬 WhatsApp Share:
```javascript
function shareWhatsApp(phone, message) {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}
```

#### ✅ Approval Workflow:
```javascript
function approveItem(docId) {
    if (!confirm('Approve?')) return;
    db.collection('items').doc(docId).update({
        status: 'approved',
        approvedBy: currentUser.id,
        approvedAt: getServerTimestamp()
    });
}
```

#### 📊 Statistics:
```javascript
function calculateStats() {
    const total = allData.length;
    const pending = allData.filter(d => d.status === 'pending').length;
    const totalAmount = allData.reduce((sum, d) => sum + (d.amount || 0), 0);
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statAmount').textContent = formatCurrency(totalAmount);
}
```

---

## 12. 🎨 DESIGN SYSTEM

### Color Palette:

#### 🎨 Backgrounds:
```css
--bg-main:       #1a1a2e;    /* Main background */
--bg-card:       #16213e;    /* Card backgrounds */
--bg-input:      #0f3460;    /* Input fields */
--bg-darker:     #0a0a1e;    /* Darker accents */
```

#### 🎨 Primary Colors (Buono Brand):
```css
--primary-orange:    #f0a500;    /* Main brand orange */
--primary-orange-2:  #FF9800;    /* Alternative */
--accent-orange:     #ff6b35;    /* Accent */
```

#### 🎨 Status Colors:
```css
--success-green:  #4CAF50;    /* Success */
--danger-red:     #ff4444;    /* Error, delete */
--warning-yellow: #FFC107;    /* Warning, pending */
--info-blue:      #2196F3;    /* Info, manager */
--purple:         #9C27B0;    /* Special */
--cyan:           #00BCD4;    /* Call center */
```

#### 🎨 Role Badge Colors:
```javascript
const badgeColors = {
    'Admin':              '#ff4444',  // Red
    'Manager':            '#2196F3',  // Blue
    'Cashier':            '#4CAF50',  // Green
    'Purchasing Officer': '#FF9800',  // Orange
    'Head Chef':          '#9C27B0',  // Purple
    'Call Operator':      '#00BCD4',  // Cyan
    'Waiter':             '#607D8B'   // Grey-blue
};
```

### Typography:
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             Roboto, Oxygen, Ubuntu, sans-serif;

h1: 28px (bold)
h2: 22px (bold)
h3: 18px (semi-bold)
body: 14px (regular)
small: 12px (regular)
tiny: 11px (regular)

600: Semi-bold (headings)
500: Medium (buttons)
400: Regular (body)
```

### Spacing System:
```css
--spacing-xs:  5px;
--spacing-sm:  10px;
--spacing-md:  15px;
--spacing-lg:  20px;
--spacing-xl:  30px;
--spacing-xxl: 40px;

--radius-sm:   6px;
--radius-md:   10px;
--radius-lg:   12px;
--radius-xl:   16px;
```

### Button Styles:

```css
/* Primary (Orange) */
.btn-primary {
    background: linear-gradient(135deg, #f0a500, #ff6b35);
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

/* Secondary (Grey) */
.btn-secondary {
    background: #2a2a3e;
    color: white;
    border: 1px solid #444;
}

/* Danger (Red) */
.btn-danger {
    background: #ff4444;
    color: white;
}

/* Edit (Yellow) */
.btn-edit {
    background: #FFC107;
    color: #1a1a2e;
}

/* Delete (Red) */
.btn-delete {
    background: #ff4444;
    color: white;
}
```

### Form Elements:
```css
input, select, textarea {
    background: #0f3460;
    color: white;
    border: 1px solid #2a4a7c;
    padding: 10px 15px;
    border-radius: 8px;
    width: 100%;
}

input:focus {
    border-color: #f0a500;
    box-shadow: 0 0 0 2px rgba(240, 165, 0, 0.2);
}

label {
    color: #f0a500;
    font-weight: 600;
    margin-bottom: 5px;
    display: block;
}
```

### Cards:
```css
.card {
    background: #16213e;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #2a4a7c;
}

.stat-card {
    background: linear-gradient(135deg, #16213e, #1a2842);
    padding: 20px;
    border-radius: 12px;
    display: flex;
    gap: 15px;
}
```

### Modals:
```css
.modal {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: #16213e;
    padding: 30px;
    border-radius: 16px;
    width: 500px;
    max-height: 90vh;
    overflow-y: auto;
}
```

### Badge Classes:
```css
.badge-admin       { background: #ff4444; }
.badge-manager     { background: #2196F3; }
.badge-cashier     { background: #4CAF50; }
.badge-purchasing  { background: #FF9800; }
.badge-chef        { background: #9C27B0; }
.badge-operator    { background: #00BCD4; }
.badge-waiter      { background: #607D8B; }

/* Permission badges */
.perm-add     { background: rgba(76,175,80,0.2);  color: #4CAF50; }
.perm-view    { background: rgba(33,150,243,0.2); color: #2196F3; }
.perm-self    { background: rgba(255,193,7,0.2);  color: #FFC107; }
.perm-edit    { background: rgba(255,152,0,0.2);  color: #FF9800; }
.perm-delete  { background: rgba(244,67,54,0.2);  color: #f44336; }
```

---

## 13. 📱 MOBILE PATTERNS

### Breakpoints:
```css
@media (max-width: 768px)  { /* Tablet */ }
@media (max-width: 600px)  { /* Mobile */ }
@media (max-width: 480px)  { /* Small phone */ }
```

### Responsive Table Pattern:

#### HTML:
```html
<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Amount</th>
            <th>Date</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td data-label="Name">John Doe</td>
            <td data-label="Amount">Rs. 1,500</td>
            <td data-label="Date">Jun 10</td>
        </tr>
    </tbody>
</table>
```

#### Mobile CSS:
```css
@media (max-width: 768px) {
    table thead { display: none; }
    
    table tr {
        display: block;
        margin-bottom: 15px;
        background: #16213e;
        padding: 15px;
        border-radius: 10px;
    }
    
    table td {
        display: block;
        text-align: right;
        padding: 8px 0;
        border-bottom: 1px solid #2a4a7c;
    }
    
    table td::before {
        content: attr(data-label);
        float: left;
        font-weight: bold;
        color: #f0a500;
    }
    
    table td:last-child { border-bottom: none; }
}
```

### Mobile-Friendly Buttons:
```css
@media (max-width: 600px) {
    .btn-primary,
    .btn-secondary,
    .btn-danger {
        width: 100%;
        padding: 12px;
        margin-bottom: 10px;
        font-size: 16px;
    }
    
    .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
}
```

### Responsive Topbar:
```css
@media (max-width: 768px) {
    .topbar {
        flex-direction: column;
        padding: 10px;
    }
    
    .topbar-left, 
    .topbar-right {
        width: 100%;
        justify-content: center;
        margin-bottom: 10px;
    }
}
```

### Stats Row Responsive:
```css
.stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
}

@media (max-width: 768px) {
    .stats-row { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
    .stats-row { grid-template-columns: 1fr; }
}
```

### Mobile Modal:
```css
@media (max-width: 600px) {
    .modal-content {
        width: 95% !important;
        max-width: 95% !important;
        padding: 20px;
    }
    
    .modal-buttons {
        flex-direction: column;
    }
    
    .modal-buttons button {
        width: 100%;
        margin: 5px 0;
    }
}
```

### Touch-Friendly Sizing:
```css
/* Minimum 44px tap targets */
button, .btn, input, select {
    min-height: 44px;
}

@media (max-width: 600px) {
    .form-group { margin-bottom: 20px; }
    input, select { padding: 12px 15px; }
}
```

[END OF PART 3/6]
```

---

## ✅ Part 3 Done!



```markdown
═══════════════════════════════════════════════════════════════
# PART D: SYSTEM REFERENCE
═══════════════════════════════════════════════════════════════

## 14. 🔐 PERMISSIONS SYSTEM

### Permission Structure:
```javascript
employee.permissions = {
    employeeDB:     { add, view, selfView, edit, delete },
    dayEndReportDB: { add, view, selfView, edit, delete },
    inventoryDB:    { add, view, selfView, edit, delete },
    kitchenDB:      { add, view, selfView, edit, delete },
    purchasingDB:   { add, view, selfView, edit, delete },
    callCenterDB:   { add, view, selfView, edit, delete },
    reportsDB:      { add, view, selfView, edit, delete }
}
```

### 5 Permission Types:

#### `add` - Create Permission
```
✅ Can: Add new records
✅ Shows: "➕ Add New" button
❌ Cannot: View/Edit/Delete
```

#### `view` - View All Permission
```
✅ Can: See ALL records (everyone's data)
✅ Shows: Full data table + search
✅ Implies: selfView (auto-true)
```

#### `selfView` - Self View Only
```
✅ Can: See only OWN records
✅ Shows: Filtered table (own data)
❌ Cannot: See others' data
❌ Hides: Search bar
```

#### `edit` - Edit Permission
```
✅ Can: Modify existing records
✅ Shows: "✏️ Edit" buttons
⚠️ Limited: May only edit own data if no view
```

#### `delete` - Delete Permission
```
✅ Can: Remove records
✅ Shows: "🗑️ Delete" buttons
⚠️ Requires: view permission
❌ Cannot: Delete own profile
```

### Permission Examples:

#### 👨‍💼 Admin (All Permissions):
```javascript
{
    add: true, view: true, selfView: true,
    edit: true, delete: true
}
// Auto-true for ALL DBs
```

#### 💼 Cashier:
```javascript
dayEndReportDB: {
    add: true,        // Can add reports
    selfView: true,   // See own reports
    view: false,      // Can't see others
    edit: false,      // Can't edit
    delete: false     // Can't delete
}
```

#### 📞 Call Operator:
```javascript
callCenterDB: {
    add: true,        // Add leads
    view: true,       // See all leads
    selfView: true,
    edit: true,       // Update leads
    delete: false     // Can't delete
}
```

### Permission Check Patterns:

#### Single permission:
```javascript
const userData = JSON.parse(sessionStorage.getItem('loggedInUser'));
const perms = userData.permissions?.inventoryDB || {};

if (perms.add) {
    // Show add button
}
```

#### Any access check:
```javascript
const isAdmin = userData.access === 'Admin';
const hasAccess = isAdmin || perms.add || perms.view || perms.selfView;

if (!hasAccess) {
    alert('⛔ No access!');
    window.location.href = 'access.html';
}
```

#### Filter data by permission:
```javascript
let visibleData = [];
if (myPerms.view) {
    visibleData = allData;  // See all
} else if (myPerms.selfView) {
    visibleData = allData.filter(d => d.createdBy === currentUser.id);
}
```

### Auto-Behaviors:

#### Auto self-view:
```javascript
// When add or view checked → selfView auto-checked
if (add.checked || view.checked) {
    selfView.checked = true;
}
```

#### Admin auto-all:
```javascript
if (access === 'Admin') {
    DATABASES.forEach(d => {
        PERM_KEYS.forEach(key => {
            document.getElementById(`${d.permPrefix}_${key}`).checked = true;
        });
    });
}
```

---

## 15. 🗄️ FIREBASE COLLECTIONS (18!)

### Complete List:

#### 1. `employees` (HR)
```javascript
{
    name, nickname, password, access,
    permissions: { ... },
    createdAt
}
```

#### 2. `dayEndReports` (Cashier)
```javascript
{
    date, cashier, cashierId,
    openingCash, closingCash, totalSales,
    cashSales, cardSales, onlineSales,
    bankDeposit, expenses: [], notes,
    status: "pending/approved/rejected",
    approvedBy, createdAt
}
```

#### 3. `inventoryItems`
```javascript
{
    name, category, unit,
    currentStock, minStock,
    costPrice, sellPrice,
    supplier, createdAt
}
```

#### 4. `inventoryCategories`
```javascript
{
    name, icon, color, createdAt
}
```

#### 5. `stockMovements`
```javascript
{
    itemId, itemName, type: "in/out",
    quantity, reason, referenceId,
    createdBy, createdAt
}
```

#### 6. `recipes` (Kitchen)
```javascript
{
    name, category,
    ingredients: [{itemId, name, quantity, unit}],
    sellPrice, costPrice,
    instructions, image, createdAt
}
```

#### 7. `staffMeals`
```javascript
{
    date, recipeId, recipeName,
    quantity, cost, employee, notes, createdAt
}
```

#### 8. `wastage`
```javascript
{
    date, itemId, itemName,
    quantity, unit, reason,
    cost, reportedBy, createdAt
}
```

#### 9. `stockIssues`
```javascript
{
    date, itemId, itemName,
    issueType, description,
    status: "open/resolved", createdAt
}
```

#### 10. `stockCounts`
```javascript
{
    date, items: [{itemId, name, system, physical, diff}],
    countedBy, status: "draft/submitted", createdAt
}
```

#### 11. `purchases` (Purchasing)
```javascript
{
    invoiceNumber, supplierId, supplierName, date,
    items: [{itemId, name, quantity, unitPrice, total}],
    subtotal, tax, discount, total,
    paymentStatus: "paid/pending/partial",
    paymentMethod: "cash/bank/credit",
    paymentProof: "url",          // 📸 Image
    notes, status: "pending/approved",
    approvedBy, createdAt
}
```

#### 12. `suppliers`
```javascript
{
    name, contact, email, address,
    category, paymentTerms, totalDue, createdAt
}
```

#### 13. `purchaseReturns`
```javascript
{
    purchaseId, supplierId, date,
    items: [], totalAmount, reason,
    status: "pending", createdAt
}
```

#### 14. `supplierCreditNotes`
```javascript
{
    supplierId, supplierName,
    creditAmount, reason, referenceId,
    used: false, createdAt
}
```

#### 15. `leads` (Call Center)
```javascript
{
    name, phone, countryCode, whatsapp, email,
    courseInterest, source, status,    // 13 statuses!
    callAttempts: 0,
    assignedTo, lastCallDate, nextFollowUp,
    callHistory: [{date, status, notes, calledBy}],
    whatsappHistory: [{type, sentBy, date, preview}],
    payment: {downPaid, downAmount, installment1Paid, ...},
    followUpDate, notes,
    createdAt, updatedAt, lastUpdatedAt
}
```

#### 16. `courses` (Academy)
```javascript
{
    name, academy, fee, downPayment,
    duration, description, active, createdAt
}
```

#### 17. `events` (Academy/Campaigns)
```javascript
{
    name, platform, startDate, status,
    description, capacity, registered, createdAt
}
```

#### 18. `callCenterComments` (Scripts)
```javascript
{
    title, category, content,
    createdBy, createdAt
}
```

### Naming Convention:
```
✅ camelCase (employees, dayEndReports)
✅ Plural (employees, not employee)
✅ Descriptive (callCenterComments)
❌ snake_case
❌ UPPERCASE
```

---

## 16. 👥 USER ROLES (7!)

### Role Details:

#### 1. 👨‍💼 Admin
```
Badge: 🔴 Red (#ff4444)
Access: ALL databases, ALL permissions
Auto-Permissions: TRUE for everything
Can:
✅ Manage all employees
✅ Set permissions for others
✅ View all data across all DBs
✅ Approve reports
✅ Access settings
```

#### 2. 🧑‍💼 Manager
```
Badge: 🔵 Blue (#2196F3)
Access: Most databases (including Reports)
Auto-Access: Reports DB, Call Center DB
Can:
✅ View Reports Database
✅ Approve Day End Reports
✅ Approve Purchase Orders
✅ Manage Call Center
✅ View all operational data
❌ Cannot manage Admin permissions
```

#### 3. 💰 Cashier
```
Badge: 🟢 Green (#4CAF50)
Primary DB: Day End Reports
Default Permissions:
- dayEndReportDB: { add: true, selfView: true }

Can:
✅ Create daily reports
✅ View own reports
❌ Cannot see other cashier reports
```

#### 4. 📦 Purchasing Officer
```
Badge: 🟠 Orange (#FF9800)
Primary DB: Purchasing
Default Permissions:
- purchasingDB: { add: true, view: true, edit: true }
- inventoryDB: { view: true, selfView: true }

Can:
✅ Create purchase orders
✅ Manage suppliers
✅ Update stock IN
✅ Upload payment proofs 📸
✅ View inventory
```

#### 5. 👨‍🍳 Head Chef
```
Badge: 🟣 Purple (#9C27B0)
Primary DB: Kitchen
Default Permissions:
- kitchenDB: { add: true, view: true, edit: true }
- inventoryDB: { view: true, selfView: true }

Can:
✅ Manage recipes
✅ Record staff meals
✅ Report wastage
✅ Stock count
✅ View inventory
```

#### 6. 📞 Call Operator
```
Badge: 🩵 Cyan (#00BCD4)
Primary DB: Call Center
Auto-Access: Call Center (no permission needed!)
Default Permissions:
- callCenterDB: { add: true, view: true, edit: true }

Can:
✅ Add new leads
✅ Update lead status
✅ Call history tracking
✅ WhatsApp messaging
✅ Payment tracking
❌ Cannot delete leads
```

#### 7. 🍽️ Waiter
```
Badge: ⚪ Grey-blue (#607D8B)
Primary DB: Custom (limited)
Default Permissions:
- employeeDB: { selfView: true }

Can:
✅ View own profile
❌ Limited other access
```

---

## 17. 🆕 PAGE-BY-PAGE FEATURES (DETAILED!)

### 🏠 ACCESS.HTML (Home Page)
```
Purpose: Database selection home
URL: /access.html

Features:
✅ Auto-generated DB cards (from DATABASES array)
✅ Permission-based visibility
✅ Admin Manager only cards (Reports)
✅ Custom badges per DB
✅ Click card → goes to DB page
✅ Topbar with logout
✅ Welcome message
✅ Mobile responsive

Files:
- access.html
- access-script.js
- (Uses style.css + mobile.css)
```

### 👥 INDEX.HTML (Employee Database)
```
Purpose: HR / Employee management
URL: /index.html

Features:
✅ Add/Edit/Delete employees
✅ 7 access roles
✅ Permission setup (7 DBs × 5 perms = 35!)
✅ Permission badges display
✅ Auto-Admin permissions
✅ Self-profile editing
✅ Search functionality
✅ Filter by role
✅ Role-based badge colors
✅ Mobile-friendly

Files:
- index.html
- index-script.js
```

### 💰 CASHIER.HTML (Day End Reports)
```
Purpose: Daily cashier reports
URL: /cashier.html

Features:
✅ Add daily reports
✅ Opening/closing cash entry
✅ Multiple payment methods:
   - Cash sales
   - Card sales
   - Online sales
✅ Expenses tracking (multiple)
✅ Bank deposits
✅ Notes section
✅ Status workflow:
   - pending → approved/rejected
✅ View by cashier (selfView)
✅ Date-range filtering
✅ Auto-calculate totals
✅ Reports analytics

Files:
- cashier.html
- cashier-script.js
```

### 📦 INVENTORY.HTML (Inventory Database)
```
Purpose: Stock & item management
URL: /inventory.html

Features:
✅ Item management (CRUD)
✅ Categories with icons (CRUD)
✅ Stock IN tracking
✅ Stock OUT tracking
✅ Stock movements history
✅ Low stock alerts (visual!)
✅ Cost price tracking
✅ Sell price tracking
✅ Supplier linkage
✅ Units (kg, L, pcs, etc.)
✅ Real-time updates
✅ Search by name/category
✅ Filter by category
✅ Stock value calculation

Files:
- inventory.html
- inventory-script.js
```

### 🍳 KITCHEN.HTML (Kitchen Database)
```
Purpose: Recipes & kitchen operations
URL: /kitchen.html

Features:
✅ Recipe management (CRUD)
✅ Ingredient list (linked to inventory!)
✅ Auto-calculate recipe cost
✅ Recipe images
✅ Sell price vs cost
✅ Staff meals tracking
✅ Wastage reporting
✅ Stock issues reporting
✅ Stock count (physical inventory)
✅ Multiple tabs interface
✅ Search recipes
✅ Filter by category
✅ Cost vs profit analysis

Files:
- kitchen.html
- kitchen-script.js
```

### 🛒 PURCHASING.HTML (Purchasing Database)
```
Purpose: Purchase orders & suppliers
URL: /purchasing.html

Features:
✅ Purchase orders (CRUD)
✅ Supplier management (CRUD)
✅ Invoice number tracking
✅ Multi-item per purchase
✅ Auto-calculate totals
✅ Tax & discount support
✅ Payment status:
   - paid / pending / partial
✅ Payment methods:
   - cash / bank / credit
✅ 📸 Payment Proof Upload (Firebase Storage!)
✅ Image preview before upload
✅ Purchase returns
✅ Supplier credit notes
✅ Auto stock IN on purchase save
✅ Approval workflow (Admin/Manager)
✅ Search & filter
✅ Date filtering

Files:
- purchasing.html
- purchasing-script.js
```

### 📞 CALLCENTER.HTML (Call Center - BIGGEST!)
```
Purpose: Academy lead management
URL: /callcenter.html

CURRENT VERSION: v10.9 (Smart Date Buttons added!)

9 TABS:
═══════════════════════════════════════

1. 📱 QUICK ADD TAB:
   ✅ Country code selector (14 countries)
   ✅ Phone + Name input
   ✅ Enter key = quick add
   ✅ Duplicate detection
   ✅ Recent leads table
   ✅ Search + status filter
   ✅ View | Call | WhatsApp | Edit | Delete

2. 📞 CALL LOG TAB:
   ✅ Lead search (name/phone)
   ✅ Selected lead info
   ✅ Call attempts tracker
   ✅ Status update (13 options)
   ✅ Course interest select
   ✅ Follow-up date picker
   ✅ ⚡ Smart Date Buttons (NEW! v10.9)
      - Tomorrow, 3D, 1W, 2W, 1M
   ✅ ⚡ Auto-date on status change (NEW! v10.9)
   ✅ Call notes
   ✅ Lead source select
   ✅ Campaign select
   ✅ "Save & Next ⚡" auto-loads next
   ✅ WhatsApp buttons (4 types)
   ✅ Pending queue (today + older)
   ✅ Stats bar
   ✅ Max attempts warning → Hold
   ✅ Call history display

3. 🔵 MIGHT JOIN TAB:
   ✅ Smart categorization:
      - 🔥 Attempt 1 (GREEN)
      - ⚡ Attempt 2 (BLUE)
      - 🟡 Attempt 3 (ORANGE)
      - ⚠️ Attempt 4+ (RED + pulse!)
      - ✅ Done Today (GREY faded)
   ✅ FIFO sorting (oldest first)
   ✅ Update form with Smart Date Buttons
   ✅ WhatsApp options

4. 🔄 FOLLOW-UPS TAB:
   ✅ Includes statuses:
      - Not Responding
      - Switch off
      - Will join next intake
      - Call back later
      - Will decide
      - User busy
   ✅ Same smart categorization
   ✅ Smart Date Buttons
   ✅ Update form

5. ⏸️ HOLD TAB:
   ✅ Includes statuses:
      - Hold
      - Unable to join
      - Not in use
   ✅ Re-activate to Need Call (reset attempts!)
   ✅ Smart categorization

6. ✅ ENROLLED TAB:
   ✅ Successfully enrolled students
   ✅ Course update
   ✅ WhatsApp sent count badge
   ✅ Done today badge
   ✅ Confirmation/Payment templates

7. 💰 PAYMENTS TAB:
   ✅ Course fee display
   ✅ Down payment status
   ✅ Installment 1 status
   ✅ Installment 2 status
   ✅ Auto-calculated balance
   ✅ Color-coded (red/green)
   ✅ WhatsApp payment details

8. 📊 REPORTS TAB:
   ✅ Filters: Today/Week/Month/All
   ✅ Stats:
      - Total Leads
      - Enrolled count
      - Might Join count
      - Expected Revenue
      - Conversion Rate
   ✅ Status breakdown bars
   ✅ Sorted by count

9. ⚙️ SETTINGS TAB:
   ✅ Max Call Attempts setting
   ✅ Course management (CRUD)
   ✅ Auto-calculate installments
   ✅ Default courses (SCA)
   ✅ Campaign management (CRUD)
   ✅ Operator Scripts (CRUD)

SPECIAL FEATURES:
═══════════════════════════════════════
✅ 13 lead statuses
✅ 14 country codes
✅ 4 WhatsApp templates + Multi-select
✅ Auto-next lead after save
✅ Hold warning modal (max attempts)
✅ Smart Categorization (v10.8)
✅ Smart Date Buttons (v10.9)
✅ Auto-defaults per status
✅ Color-coded urgency
✅ Pulse animations for high priority

Files:
- callcenter.html
- callcenter-script.js
- callcenter-style.css
```

### 📊 REPORTS.HTML (Reports Database)
```
Purpose: Cross-DB analytics & approvals
URL: /reports.html
Access: Admin & Manager only!

Features:
✅ Multi-DB reports view
✅ Day End reports:
   - View all
   - Approve/Reject
   - Cashier breakdown
✅ Purchase orders:
   - View all
   - Approve/Reject
   - 📸 Payment Proof Display
✅ Stock count reports
✅ Employee reports
✅ Date-range filtering
✅ Statistics calculations
✅ Approval workflow
✅ Export options (PDF future)

Files:
- reports.html
- reports-script.js
```

[END OF PART 4/6]
```

---

## ✅ Part 4 Done!


```markdown
═══════════════════════════════════════════════════════════════
# PART E: PRACTICAL GUIDES
═══════════════════════════════════════════════════════════════

## 18. 📋 COMMON TASKS (Step-by-Step!)

### TASK 1: Add New Database (4-Files Rule!) ⭐

**Example: Adding "Attendance Database"**

#### Step 1: Edit `firebase-config.js`
```javascript
// Add to DATABASES array:
{
    id: 'attendanceDB',
    name: 'Attendance Database',
    shortName: 'Attendance',
    icon: '⏰',
    url: 'attendance.html',
    permPrefix: 'att',
    color: '#FF5722',
    
    description: 'Daily attendance tracking',
    accessDescription: 'Check-in/out times, late tracking.',
    badgeLabel: 'Data Entry',
    badgeClass: 'badge-entry',
    cardClass: '',
    adminManagerOnly: false,
    accessChecks: ['add', 'view', 'selfView', 'edit'],
    
    permBorderColor: '#FF5722',
    permTitleColor: '#FF5722',
    defaultPermsForRole: {
        'Cashier': { selfView: true },
        'Head Chef': { selfView: true }
    }
}
```

#### Step 2: Create `attendance.html`
Use the template from Section 11!

#### Step 3: Create `attendance-style.css` (if needed)
Custom styles only.

#### Step 4: Create `attendance-script.js`
Use the template from Section 11!

#### Step 5: Deploy & Test
```bash
firebase deploy
```

✅ Total time: 15-30 minutes!
✅ access.html → New card appears AUTO!
✅ index.html → New permissions appear AUTO!
✅ DB switchers updated AUTO!

---

### TASK 2: Add New Field to Existing DB

**Example: Add "phone" field to employees**

#### Update HTML form:
```html
<label>📞 Phone:</label>
<input type="text" id="empPhone" placeholder="Enter phone">
```

#### Update saveEmployee():
```javascript
const phone = document.getElementById('empPhone').value.trim();

await db.collection('employees').add({
    name, nickname, password, access, permissions,
    phone,  // ⭐ NEW FIELD
    createdAt: getServerTimestamp()
});
```

#### Update editEmployee():
```javascript
document.getElementById('empPhone').value = emp.phone || '';
```

#### Update table display:
```html
<th>Phone</th>
<td data-label="Phone">${emp.phone || '-'}</td>
```

---

### TASK 3: Add Image Upload

#### Step 1: Add Storage SDK
```html
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js"></script>
```

#### Step 2: Add file input
```html
<label>📸 Upload Image:</label>
<input type="file" id="imageUpload" accept="image/*">
<img id="imagePreview" style="display:none; max-width:200px;">
```

#### Step 3: Upload function
```javascript
async function uploadImage(file) {
    if (!file) return null;
    const storageRef = firebase.storage().ref();
    const fileName = `${Date.now()}_${file.name}`;
    const fileRef = storageRef.child(`uploads/${fileName}`);
    
    try {
        await fileRef.put(file);
        return await fileRef.getDownloadURL();
    } catch (error) {
        alert('❌ Upload failed!');
        return null;
    }
}

// Usage:
const file = document.getElementById('imageUpload').files[0];
const imageURL = await uploadImage(file);

await db.collection('items').add({
    name, image: imageURL,
    createdAt: getServerTimestamp()
});
```

#### Step 4: Preview before upload
```javascript
document.getElementById('imageUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});
```

---

### TASK 4: Add WhatsApp Share

```html
<button onclick="shareWhatsApp('${item.id}')">
    💬 WhatsApp
</button>
```

```javascript
function shareWhatsApp(itemId) {
    const item = allData.find(d => d.id === itemId);
    if (!item) return;
    
    const phone = item.phone.replace(/[^0-9]/g, '');
    const message = `Hello ${item.name}!

Your order #${item.id} is ready.
Total: ${formatCurrency(item.total)}

Thank you for choosing Buono! 🍴`;
    
    const url = `https://wa.me/94${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}
```

---

### TASK 5: Add PDF Export

#### Step 1: Add jsPDF
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

#### Step 2: Export function
```javascript
function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Buono Report', 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${formatDate(new Date())}`, 14, 28);
    
    let y = 40;
    allData.forEach((item, i) => {
        doc.text(`${i+1}. ${item.name} - ${formatCurrency(item.amount)}`, 14, y);
        y += 8;
        if (y > 280) { doc.addPage(); y = 20; }
    });
    
    doc.save(`Report_${Date.now()}.pdf`);
}
```

---

### TASK 6: Date Range Filter

```html
<input type="date" id="startDate" onchange="filterByDateRange()">
<input type="date" id="endDate" onchange="filterByDateRange()">
<button onclick="clearFilter()">Clear</button>
```

```javascript
function filterByDateRange() {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    if (!start || !end) return;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59);
    
    const filtered = allData.filter(item => {
        const itemDate = item.createdAt?.toDate() || new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
    });
    
    renderData(filtered);
}
```

---

### TASK 7: Add Approval System

```javascript
function approveItem(docId) {
    if (!confirm('✅ Approve this item?')) return;
    
    db.collection('items').doc(docId).update({
        status: 'approved',
        approvedBy: currentUser.id,
        approvedByName: currentUser.name,
        approvedAt: getServerTimestamp()
    });
}

function rejectItem(docId) {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    
    db.collection('items').doc(docId).update({
        status: 'rejected',
        rejectedBy: currentUser.id,
        rejectionReason: reason,
        rejectedAt: getServerTimestamp()
    });
}

function getActionButtons(item) {
    let buttons = '';
    if (item.status === 'pending' && 
        (currentUser.access === 'Admin' || currentUser.access === 'Manager')) {
        buttons += `
            <button class="btn-success" onclick="approveItem('${item.id}')">✅</button>
            <button class="btn-danger" onclick="rejectItem('${item.id}')">❌</button>
        `;
    }
    return buttons;
}
```

---

### TASK 8: Connect 2 Databases (Foreign Key)

**Example: Recipe uses Inventory items**

```javascript
// Load both collections
let allRecipes = [];
let allItems = [];

db.collection('recipes').onSnapshot(snap => {
    allRecipes = [];
    snap.forEach(doc => allRecipes.push({id: doc.id, ...doc.data()}));
    renderRecipes();
});

db.collection('inventoryItems').onSnapshot(snap => {
    allItems = [];
    snap.forEach(doc => allItems.push({id: doc.id, ...doc.data()}));
    populateItemDropdown();
});

// Save recipe with item references
async function saveRecipe() {
    const ingredients = [];
    document.querySelectorAll('.ingredient-row').forEach(row => {
        const itemId = row.querySelector('.item-select').value;
        const quantity = row.querySelector('.qty-input').value;
        const item = allItems.find(i => i.id === itemId);
        
        ingredients.push({
            itemId: itemId,
            name: item.name,        // Denormalized for display
            quantity: parseFloat(quantity),
            unit: item.unit
        });
    });
    
    await db.collection('recipes').add({
        name, ingredients,
        createdAt: getServerTimestamp()
    });
}
```

---

### TASK 9: Backup Data (JSON Export)

```javascript
async function backupAllData() {
    const backup = {
        timestamp: new Date().toISOString(),
        version: '11.0',
        data: {}
    };
    
    const collections = [
        'employees', 'dayEndReports', 'inventoryItems',
        'recipes', 'purchases', 'leads', 'courses'
    ];
    
    for (const col of collections) {
        const snap = await db.collection(col).get();
        backup.data[col] = [];
        snap.forEach(doc => {
            backup.data[col].push({ id: doc.id, ...doc.data() });
        });
    }
    
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buono_backup_${Date.now()}.json`;
    a.click();
}
```

---

## 19. 🐛 COMMON ERRORS + FIXES

### ❌ Error 1: "firebase is not defined"
```
Cause: firebase-config.js loaded BEFORE Firebase SDK
Fix: Check script order:
1. firebase-app.js
2. firebase-firestore.js
3. firebase-config.js ← AFTER!
4. page-script.js
```

### ❌ Error 2: "DATABASES is not defined"
```
Cause: page-script.js before firebase-config.js
Fix: Same as above
OR: Remove local DATABASES, use global!
```

### ❌ Error 3: "Cannot read property 'X' of undefined"
```
Cause: User object missing or perms not loaded
Fix:
1. Check sessionStorage exists
2. Refresh from Firebase first:
   const userDoc = await db.collection('employees').doc(userId).get();
```

### ❌ Error 4: "Permission denied" (Firestore)
```
Cause: Firestore rules blocking
Fix: Update rules in console:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // Development only!
    }
  }
}
```

### ❌ Error 5: "Quota exceeded" (Storage)
```
Cause: Free tier limit reached
Fix:
1. Delete old images
2. Compress before upload
3. Upgrade to Blaze (already on it!)
```

### ❌ Error 6: Images not loading
```
Cause: CORS or invalid URL
Fix:
1. Check Storage rules: allow read: if true;
2. Get fresh URL: await ref.getDownloadURL();
```

### ❌ Error 7: Real-time listener not updating
```
Cause: Listener not started or detached
Fix:
1. Check console for errors
2. Verify onSnapshot called
3. Don't reassign db variable!
```

### ❌ Error 8: Form submits but data not saved
```
Cause: Network/validation/rules
Fix: Add console.log in try/catch:
} catch (error) {
    console.error('Save error:', error);
    alert('❌ Error: ' + error.message);
}
```

### ❌ Error 9: Mobile view broken
```
Cause: mobile.css not loaded or data-label missing
Fix:
1. Check <link rel="stylesheet" href="mobile.css">
2. Add data-label to ALL <td>:
   <td data-label="Name">${item.name}</td>
```

### ❌ Error 10: Logout not working
```
Cause: logout() not defined
Fix: Make sure firebase-config.js loaded
     (logout is global function)
```

### ❌ Error 11: Modal not closing
```
Cause: Click handler issue
Fix:
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};
```

### ❌ Error 12: Date format wrong
```
Cause: Different formats from Firebase
Fix: Use formatDate() helper:

// Firestore Timestamp:
formatDate(item.createdAt?.toDate())

// ISO string:
formatDate(item.date)

// Date object:
formatDate(new Date())
```

### ❌ Error 13: "Maximum update depth exceeded"
```
Cause: Infinite loop in onSnapshot
Fix: Don't update Firestore inside onSnapshot
     unless using flags carefully!
```

### ❌ Error 14: Search not filtering
```
Cause: Wrong field or case-sensitive
Fix:
const filtered = allData.filter(item =>
    item.name.toLowerCase().includes(text.toLowerCase())
);
```

### ❌ Error 15: Can't delete document
```
Cause: 
1. No permission
2. Wrong doc ID
3. Document referenced elsewhere

Fix:
1. Check permission first
2. console.log(docId) to verify
3. Cascade delete or warn user
```

---

## 20. 👤 TEST CREDENTIALS

### Active Test Users:

| # | Name | Nickname | Password | Access | Color |
|---|------|----------|----------|--------|-------|
| 1 | Naveen | Naveen | sara | Admin | 🔴 Red |
| 2 | Tishan | Tishan | owner | Manager | 🔵 Blue |
| 3 | Siriwardana | siri | (set) | Cashier | 🟢 Green |
| 4 | Sujith | suji | (set) | Head Chef | 🟣 Purple |
| 5 | Chamika | chamika | (set) | Purchasing Officer | 🟠 Orange |

### Login URL:
```
https://buono-project-927b8.web.app/login.html
```

### Quick Test Scenarios:

#### Test 1: Admin Full Access
```
Login: Naveen / sara
Expected:
✅ All 7 database cards visible
✅ Can add/edit/delete employees
✅ All permissions auto-checked
✅ Can access Reports DB
```

#### Test 2: Manager Access
```
Login: Tishan / owner
Expected:
✅ Reports DB visible
✅ Can approve reports
✅ Auto-access to Call Center
✅ Cannot manage Admin
```

#### Test 3: Cashier Limited
```
Login: siri / (password)
Expected:
✅ Only Day End Reports card
✅ Can add daily reports
✅ See only own reports
❌ Cannot see Reports DB
```

#### Test 4: Call Operator Special
```
Login: (call operator)
Expected:
✅ Call Center card (auto-access!)
✅ Custom badges: Add/View/Edit
✅ Cannot access other DBs
```

### Creating Test Users:
```
1. Login as Admin (Naveen/sara)
2. Go to Employee Database
3. Click "➕ Add New Employee"
4. Fill: Name, Nickname (unique!), Password
5. Select access level
6. Permissions auto-fill
7. Save
8. Logout → Login as new user
```

[END OF PART 5/6]
```

---

## ✅ Part 5 Done!


```markdown
## 21. 💡 BEST PRACTICES

### File Naming Convention:
```
✅ kebab-case:
   - call-center-script.js
   - day-end-style.css
   
❌ Avoid:
   - dayEndScript.js (camelCase)
   - day_end.js (snake_case)
   - DayEnd.js (PascalCase)
```

### JavaScript Style:

#### Function Naming:
```javascript
✅ camelCase:
   - initializeApp()
   - buildDatabaseSwitcher()
   - calculateTotal()
   
❌ Avoid:
   - InitializeApp()
   - init_app()
```

#### Variable Naming:
```javascript
✅ Descriptive:
   - const currentUser = ...
   - let totalAmount = 0
   - const isAdmin = true
   
❌ Avoid:
   - const u = ...
   - let t = 0
```

#### Constants:
```javascript
✅ UPPER_SNAKE_CASE:
   - const PERM_KEYS = ['add', 'view']
   - const MAX_RETRIES = 3
```

### HTML Style:

```html
✅ DO:
<!-- Semantic + grouped -->
<div class="form-group">
    <label>Name:</label>
    <input type="text" id="name">
</div>

<button class="btn-primary">Save</button>
<table>...</table>
<form>...</form>

❌ DON'T:
<div onclick="save()">Save</div>  <!-- Use button! -->
<div><div><div><div>...</div></div></div></div>  <!-- Too nested -->
```

### CSS Style:

```css
✅ DO:
/* Classes for styling */
.btn-primary { ... }

/* Group related */
/* === BUTTONS === */
.btn-primary { ... }
.btn-secondary { ... }

/* Mobile-first */
.container { padding: 20px; }
@media (min-width: 768px) {
    .container { padding: 40px; }
}

❌ DON'T:
.text { color: red !important; }  /* No !important */
<div style="color:red;">  /* No inline styles */
```

### JavaScript Best Practices:

```javascript
✅ DO:
// Async/await
async function saveData() {
    try {
        await db.collection('items').add(data);
        alert('✅ Saved!');
    } catch (error) {
        console.error(error);
        alert('❌ ' + error.message);
    }
}

// Optional chaining
const name = user?.profile?.name || 'Guest';

// Use const/let
const PI = 3.14;
let counter = 0;

❌ DON'T:
// No callback hell
db.collection().add().then(function(){
    db.collection().get().then(function(){
        // Mess!
    });
});

// No var
var x = 10;  // Use let/const!
```

### Firebase Best Practices:

```javascript
✅ DO:
// Real-time listeners
db.collection().onSnapshot(snap => {...});

// Batch operations
const batch = db.batch();
batch.set(ref1, data1);
batch.set(ref2, data2);
await batch.commit();

// Server timestamps
createdAt: getServerTimestamp()

// Denormalize for display
{
    userId: 'abc123',
    userName: 'John'  // Save name for display
}

❌ DON'T:
// Avoid get() on every load
const snap = await db.collection().get();

// Don't store sensitive data
sessionStorage.setItem('apiKey', 'xxx');

// Avoid huge documents (1MB limit)
{
    bigDataField: [...10000 items]
}
```

### Performance Tips:

```javascript
// 1. Use indexes for compound queries
db.collection('items')
    .where('status', '==', 'active')
    .where('category', '==', 'food')
    .orderBy('createdAt', 'desc')

// 2. Paginate large datasets
let lastDoc = null;
async function loadPage() {
    let query = db.collection('items').orderBy('createdAt').limit(20);
    if (lastDoc) query = query.startAfter(lastDoc);
    const snap = await query.get();
    lastDoc = snap.docs[snap.docs.length - 1];
}

// 3. Debounce search
let searchTimeout;
function searchData() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        // Actual search
    }, 300);
}

// 4. Lazy load images
<img loading="lazy" src="...">
```

### Git Workflow:

```bash
# Daily:
git status
git add .
git commit -m "feat: Added X"
git push

# Commit messages:
feat: New feature
fix: Bug fix
update: Updated existing
docs: Documentation
style: CSS/UI change
refactor: Code cleanup

# Examples:
git commit -m "feat: Added Attendance DB"
git commit -m "fix: Login error on mobile"
git commit -m "update: Improved DB switcher"
```

### Backup Strategy:

```
🔄 Regular Backups:

1. Code:
   - Git push daily
   - Multiple branches for major changes

2. Firebase Data:
   - Use export function (Task 9)
   - Manual export monthly
   
3. Documentation:
   - Update MASTER_CONTEXT.md after features
   - Keep version history
   - Commit to Git
```

---

## ⚡ QUICK REFERENCE CHEAT SHEET

### 🔥 Most Used Code:

#### Get current user:
```javascript
const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
```

#### Check Admin:
```javascript
const isAdmin = user.access === 'Admin';
```

#### Check permission:
```javascript
const canEdit = user.permissions?.inventoryDB?.edit;
```

#### Add document:
```javascript
await db.collection('items').add({
    name: 'Item',
    createdAt: getServerTimestamp()
});
```

#### Update document:
```javascript
await db.collection('items').doc(docId).update({
    name: 'New name'
});
```

#### Delete document:
```javascript
await db.collection('items').doc(docId).delete();
```

#### Real-time listener:
```javascript
db.collection('items').onSnapshot(snap => {
    const data = [];
    snap.forEach(doc => data.push({id: doc.id, ...doc.data()}));
    renderData(data);
});
```

#### Query with filter:
```javascript
db.collection('items')
    .where('status', '==', 'active')
    .orderBy('createdAt', 'desc')
    .get();
```

#### Format date:
```javascript
formatDate(item.createdAt?.toDate());  // "Jun 10, 2026"
```

#### Format currency:
```javascript
formatCurrency(1500);  // "Rs. 1,500.00"
```

#### Show/hide modal:
```javascript
document.getElementById('myModal').style.display = 'flex';
document.getElementById('myModal').style.display = 'none';
```

### 🎨 CSS Quick Classes:

```css
/* Layouts */
.dashboard-container
.stats-row
.stat-card
.section-header
.table-container
.search-bar
.modal
.modal-content

/* Buttons */
.btn-primary       /* Orange */
.btn-secondary     /* Grey */
.btn-danger        /* Red */
.btn-edit          /* Yellow */
.btn-delete        /* Red */
.btn-success       /* Green */
.btn-logout        /* Red logout */

/* Badges */
.badge-admin
.badge-manager
.badge-cashier
.badge-purchasing
.badge-chef
.badge-operator
.badge-waiter

/* Permission badges */
.perm-add
.perm-view
.perm-self
.perm-edit
.perm-delete

/* Topbar */
.topbar
.topbar-left
.topbar-right
.db-switcher
.db-switcher-dropdown

/* Forms */
.form-group
.permission-block
.perm-checkbox
```

### 📱 Mobile Quick:

```css
/* Breakpoints */
@media (max-width: 768px) { /* Tablet */ }
@media (max-width: 600px) { /* Mobile */ }
@media (max-width: 480px) { /* Small */ }

/* Table to cards */
@media (max-width: 768px) {
    table thead { display: none; }
    table tr { display: block; }
    table td { display: block; text-align: right; }
    table td::before { content: attr(data-label); float: left; }
}
```

### 🔧 Firebase Commands:

```bash
firebase deploy              # Deploy all
firebase deploy --only hosting  # Hosting only
firebase open                # Open project
firebase login               # Login
firebase logout              # Logout
firebase init                # Init new
```

### 🧪 Debugging:

```javascript
console.log('Variable:', variable);
console.table(arrayData);
console.error('Error:', error);

console.log('Firebase:', firebase.apps.length > 0);
console.log('User:', getCurrentUser());
console.log('DBs:', DATABASES);
console.log('Perms:', currentUser.permissions);
```

---

## 📊 PROJECT STATISTICS

### Current Stats (v11.0):
```
📊 SCALE:
- Pages:              10
- Collections:        18
- Databases:          7
- User Roles:         7
- Permission Types:   5 per DB (35 total!)

🏆 ARCHITECTURE:
- Master File:        firebase-config.js
- Lines Saved:        500+
- Files per New DB:   4 (was 10+)
- Time per New DB:    15-30 min (was hours!)

✅ FEATURES:
- Total:              500+
- Real-time:          All pages
- Mobile:             All pages
- Image Uploads:      2 (Purchasing, Reports)
- WhatsApp:           1 (Call Center - HUGE!)
- Approvals:          2 (Day End, Purchasing)
- Multi-tab UIs:      1 (Call Center - 9 tabs)

🔥 TECH:
- Firebase SDK:       v8.10.1 (compat)
- Frontend:           HTML5, CSS3, ES6+
- No frameworks
- No build tools
- No npm

💰 COSTS:
- Monthly:            Rs. 0
- Plan:               Blaze (free tier active)
```

### Development Timeline:
```
v1.0  → Basic Employee Management
v2.0  → Day End Reports
v3.0  → Inventory System
v4.0  → Kitchen Module
v5.0  → Purchasing Module
v6.0  → Reports + Approvals
v7.0  → Payment Proof Uploads 📸
v8.0  → Call Center System (HUGE!)
v9.0  → Permission System Overhaul
v9.5  → Mobile Optimization
v10.0 → Architecture Migration
v10.3 → 4-FILES RULE ACHIEVED! 🏆
v10.4 → Pending Queue System
v10.5 → Phase 1 (Country codes, WA)
v10.7 → Tab Badges
v10.8 → Smart Categorization
v10.9 → Smart Date Buttons ⭐ (CURRENT)
v11.0 → MASTER FILE v11 (Smart Tracking!) 📄
```

---

## 🎯 WORKFLOW SUMMARY

### Adding New Feature - Standard:
```
1. 📋 PLAN
   - What feature?
   - Which DB affected?
   - New collection needed?

2. 💬 DISCUSS with AI
   - Paste MASTER_CONTEXT.md
   - Describe feature
   - Get plan

3. 🛠️ BUILD
   - Get full files
   - Copy-paste-save
   - Don't modify partial

4. 🧪 TEST
   - firebase deploy
   - Ctrl+Shift+R
   - Check console

5. ✅ COMMIT
   - git add .
   - git commit -m "feat: ..."
   - git push

6. 📝 UPDATE DOCS
   - Update MASTER_CONTEXT.md
   - Update Current Status
   - Save & commit
```

### Daily Routine:
```
Morning:
□ Check Firebase Console
□ Review yesterday's commits
□ Plan today's tasks

During Work:
□ One feature at a time
□ Test after every change
□ Commit small, commit often

End of Day:
□ Test all changes
□ Commit + push
□ Update docs if major change
```

### Emergency Recovery:
```
🚨 If something breaks:

Step 1: Don't panic!
Step 2: Check console (F12)
Step 3: Check git history:
        git log --oneline -10
Step 4: Revert if needed:
        git reset --hard <commit-hash>
Step 5: Re-deploy:
        firebase deploy
```

---

## 📞 SUPPORT & RESOURCES

### Project Resources:
```
🌐 Live: https://buono-project-927b8.web.app
🔗 Git:  https://github.com/Sachintha1999/Buono-project
🔥 Console: https://console.firebase.google.com/project/buono-project-927b8
📚 Docs: https://firebase.google.com/docs/web/setup
```

### Firebase Free Tier:
```
📊 Firestore:
- 50,000 reads/day
- 20,000 writes/day
- 1 GB storage

💾 Storage:
- 5 GB total
- 1 GB/day download

🚀 Hosting:
- 10 GB storage
- 360 MB/day transfer

Current usage: <1% 💪
```

---

═══════════════════════════════════════════════════════════════
## 🏁 END OF MASTER CONTEXT FILE
═══════════════════════════════════════════════════════════════

```
📅 Last Updated: 2026-06-10
📌 Version: 11.0 (Smart Master with Status Tracking!)
🏆 Status: Production - LIVE!
✅ Complete: 99%
🐛 Known Bugs: 0
🚀 Active Plan: Call Center 7 Features (1/7 done)
```

---

### 📝 HOW TO UPDATE THIS FILE:

After every major feature:

**1. Update Section 1 (Current Status Dashboard):**
```
- Change "Last Update" date
- Change "Current Version"
- Update "Recently Completed"
- Update "Currently In Progress"
- Update "Next Steps"
```

**2. Update Section 2 (Active Plan):**
```
- Mark completed step as ✅ DONE
- Move next step to "NEXT"
- Add new steps if planned
```

**3. Update Section 17 (Page Features):**
```
- If page got new feature
- Update version notes
- Add to features list
```

**4. Save & Commit:**
```bash
git add BUONO_MASTER_CONTEXT.md
git commit -m "docs: Updated to v11.X"
git push
```

---

## 🎓 USING THIS FILE - NEW AI CHAT:

### Standard Opening:
```
Step 1: Open new chat
Step 2: Copy ENTIRE this file
Step 3: Paste at start of conversation
Step 4: Add your message:

Examples:
"Continue from Current Status"
"Bug fix needed: [describe]"
"New feature idea: [describe]"
"Tell me about [feature]"
```

### Expected AI Behavior:
```
1. AI reads Current Status FIRST
2. AI reads Active Plan SECOND
3. AI knows project structure
4. AI speaks Sinhala
5. AI gives full files
6. AI tracks progress
7. AI updates this file
```

---

**🎉 Thank you for using BUONO MASTER CONTEXT v11.0!**

**Built with ❤️ by Naveen (Sachintha1999)**
**With AI Assistance from Claude**

═══════════════════════════════════════════════════════════════
END OF FILE
═══════════════════════════════════════════════════════════════
```

---

## ✅✅✅ ALL 6 PARTS COMPLETE! 🎉🎉🎉

```
📄 BUONO_MASTER_CONTEXT.md - FULL VERSION 11.0!

Size: ~15,000+ words
Sections: 21 main + 4 special
Coverage: EVERYTHING!

✨ NEW FEATURES:
✅ Current Status Dashboard
✅ Active Development Plan tracker
✅ How to Use guide
✅ AI Instructions
✅ Page-by-Page Features (detailed!)
```

---

🎉🎉🎉 **PERFECT! Files 3ම කියෙව්වා!** 

ඔයා **HUGE progress** කරලා! මට පේනවා **6 features** complete!

---

## ✅ Completed Features Review:

```
✅ Step 1: Smart Date Buttons (v10.9)
✅ Step 2: Stats Bar Fix (Might Join, Follow-ups, Hold)
✅ Step 3: Tab Badge Zero Hide (v11.0)
✅ Step 4: Lead Source Analytics (v11.1) 🆕
✅ Step 5: Reminder Notifications (v11.2) 🆕
✅ BONUS: Smart Hold (HOLD_TRIGGER_STATUSES) 🆕
```

**නියමයි! 7 ක plan එකෙන් 6 ක් DONE!** 🔥

---

## 📊 UPDATED MASTER CONTEXT FILE v12.0

Copy කරලා save කරන්න `BUONO_MASTER_CONTEXT.md`:

```markdown
═══════════════════════════════════════════════════════════════
# 🍴 BUONO PROJECT - MASTER CONTEXT FILE
# Version: 12.0 (6 Features Complete!)
# Last Updated: 2026-06-10 (Late Evening)
# Status: Production - LIVE!
═══════════════════════════════════════════════════════════════

## 1. 🎯 CURRENT STATUS DASHBOARD

### 📅 Last Update Info:
```
Date: 2026-06-10
Time: Late evening session
Developer: Naveen (Sachintha1999)
Working on: Call Center Improvements - 6 of 7 DONE!
```

### 🏆 Current Version:
```
Project Version: v11.2
File Updates:
- callcenter.html      → v11.2 (Stats bars + Source Analytics + Smart Hold modal)
- callcenter-script.js → v11.2 (Smart Hold + Source Analytics + Reminders)
- callcenter-style.css → v11.2 (All new feature styles)
```

### ✅ Recently Completed (Massive Update!):
```
✅ Step 1: Smart Date Buttons (DONE - v10.9)
   - Quick buttons (Tomorrow, 3D, 1W, 2W, 1M)
   - Auto-defaults per status
   - Active state highlighting
   - Auto badge display

✅ Step 2: Stats Bar Fix (DONE - v11.0)
   - mightJoinStats div added ✓
   - followupsStats div added ✓
   - holdStats div added ✓
   - Total | New | Old | Done Today | Remaining

✅ Step 3: Tab Badge Zero Hide (DONE - v11.0)
   - 0 count = hide badge
   - 1+ count = show badge
   - Smooth fade transition

✅ Step 4: Lead Source Analytics (DONE - v11.1) 🆕
   - Source breakdown (Facebook, Instagram, Walk In, etc.)
   - Conversion rate per source
   - Top Performer badge (🏆 Best Rate)
   - Hidden Gem detection (✨)
   - Rank medals (🥇🥈🥉)
   - Smart insights generation
   - Revenue per source

✅ Step 5: Reminder Notifications (DONE - v11.2) 🆕
   - Page load = check today's follow-ups
   - Special reminder toast (clickable)
   - Tab pulse animation (red dot)
   - Browser notifications (optional)
   - Auto-hide on tab click
   - Overdue detection

✅ BONUS: Smart Hold (DONE - v11.2) 🆕
   - HOLD_TRIGGER_STATUSES defined:
     * "Need Call" + max attempts ✓
     * "Not Responding" + max attempts ✓
     * "Switch off" + max attempts ✓
     * "User busy" + max attempts ✓
   - NOT triggered for active conversations:
     * "Will decide" (active)
     * "Call back later" (scheduled)
     * "Might Join" (interested)
     * "Will join next intake" (committed)
   - Works in Call Log AND Follow-ups tabs!
```

### ⏳ Currently In Progress:
```
Nothing in progress (6/7 complete!)
```

### 🎯 Next Steps:
```
⏳ Step 6: Duplicate Smart Merge
⏳ Step 7: Lead Scoring System (HOT/WARM/COOL/COLD)
```

### 📊 Project Health:
```
🟢 Architecture: Excellent (4-Files Rule!)
🟢 Mobile: Fully responsive
🟢 Performance: Real-time updates working
🟢 Security: Permission-based access OK
🟢 Documentation: v12.0 updated!
🟢 Live Status: Production - working!
🟢 Features: 6/7 complete (86%!)
```

---

## 2. 📋 ACTIVE DEVELOPMENT PLAN

### 🎯 Current Focus: Call Center Improvements

**Total Features Planned: 7 + 1 BONUS**
**Completed: 6**
**Remaining: 2**

### 📊 PROGRESS TRACKER:

```
┌────────────────────────────────────────────────┐
│ FEATURE                          │ STATUS      │
├────────────────────────────────────────────────┤
│ Step 1: Smart Date Buttons       │ ✅ DONE     │
│ Step 2: Stats Bar Fix            │ ✅ DONE     │
│ Step 3: Tab Badge Zero Hide      │ ✅ DONE     │
│ Step 4: Lead Source Analytics    │ ✅ DONE     │
│ Step 5: Reminder Notifications   │ ✅ DONE     │
│ BONUS: Smart Hold                │ ✅ DONE     │
│ Step 6: Duplicate Smart Merge    │ ⏳ NEXT     │
│ Step 7: Lead Scoring System      │ ⏳ Pending  │
└────────────────────────────────────────────────┘

Progress: ████████████████░░░░ 75%
```

---

## 📞 CALL CENTER v11.2 - FULL FEATURE LIST:

### 🎯 Quick Add Tab:
- 14 country codes
- Duplicate detection
- Enter = quick add
- Search + filter

### 📞 Call Log Tab:
- Smart Date Buttons (5 options)
- Auto-set date on status change
- Auto badge display
- **Smart Hold** (only for specific statuses!)
- Save & Next workflow
- WhatsApp templates (4 + Multi)
- Pending queue (Today + Older)

### 🔵 Might Join Tab:
- Smart Categorization (Att 1, 2, 3, 4+, Done)
- Color-coded urgency
- Stats bar (Total | New | Old | Done | Remaining)
- Smart Date Buttons

### 🔄 Follow-ups Tab:
- Includes 6 statuses
- Smart Categorization
- Stats bar
- Smart Date Buttons
- **Smart Hold check** (NEW!)
- Reminder pulse animation 🆕

### ⏸️ Hold Tab:
- Hold + Unable to join + Not in use
- Re-activate to Need Call
- Stats bar
- Smart Categorization

### ✅ Enrolled Tab:
- Course management
- WhatsApp confirmation
- Done today badges

### 💰 Payments Tab:
- Down + Install 1 + Install 2
- Auto-calculated balance
- Color-coded (paid/pending)

### 📊 Reports Tab:
- Today/Week/Month/All filters
- 5 stat cards
- Status breakdown bars
- **Lead Source Analytics** 🆕
  - Rank medals
  - Top Performer badge
  - Hidden Gem detection
  - Conversion percentage
  - Revenue tracking
  - Smart insights

### ⚙️ Settings Tab:
- Max attempts setting
- Course management
- Campaign management
- Operator scripts

---

## 🆕 NEW HELPER FUNCTIONS (v11.2):

```javascript
// Smart Hold
HOLD_TRIGGER_STATUSES = ['Need Call', 'Not Responding', 'Switch off', 'User busy']

// Source Analytics
renderSourceAnalytics(leads, period)

// Reminders
checkTodayReminders()
showReminderToast(dueCount, overdueCount)
addReminderPulse(count)
removeReminderPulse()
requestNotificationPermission()
```

[Rest of file same as v11.0]
═