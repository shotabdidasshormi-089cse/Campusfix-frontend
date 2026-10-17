# CampusFix AI - Frontend

Web-based university facility and safety issue management system.
This repository contains the **frontend** (HTML5, CSS3, JavaScript).

## How to run
1. Open the folder in VS Code
2. Install the "Live Server" extension
3. Right click `index.html` and choose "Open with Live Server"

No build step is needed. Data is stored in the browser (localStorage) until the backend is ready.

## Test accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@campus.com | Admin123 |
| Technician | tech@campus.com | Tech1234 |
| Student | student@campus.com | Student1 |

To reset all sample data, open the browser console, run `localStorage.clear()`, then refresh.

## Pages
| Page | File | Role |
|---|---|---|
| Landing | index.html | Everyone |
| Login / Register / Logout | pages/login.html, register.html, logout.html | Everyone |
| Dashboard | pages/dashboard.html | All roles |
| Report New Issue | pages/report.html | Student |
| My Reports | pages/student.html | Student |
| All Issues | pages/admin.html | Admin |
| Manage Users | pages/users.html | Admin |
| Buildings & Categories | pages/categories.html | Admin |
| Analytics | pages/analytics.html | Admin |
| My Tasks | pages/technician.html | Technician |
| Issue Details | pages/details.html?id=1 | All roles |
| Profile | pages/profile.html | All roles |

## Features
- Role-based access (route guard) for Student, Technician and Administrator
- Add / Edit / Delete on issues, users, buildings, categories, notes, notifications and profile
- Search and status filter, priority and technician assignment
- Critical issue highlight, status stepper and activity timeline
- Smart category and priority suggestion
- Notifications (bell) for students, technicians and admins
- Analytics summary and bar charts
- Responsive layout

## Folder structure
- `css/style.css` : all styles
- `js/seed.js` : sample data and the data shape of every table
- `js/storage.js` : all data functions (the ONLY file to change when connecting the backend)
- `js/auth.js` : session, route guard, logout
- `js/utils.js` : toast, confirm popup, badges
- `js/layout.js` : sidebar, topbar, notification bell
- `js/smart.js` : smart suggestion rules
- `js/<page>.js` : logic of each page

## For the backend and database team

### Data fields (JSON)
- users: id, name, email, password, role (student | technician | admin)
- buildings: id, name
- categories: id, name
- issues: id, title, category, building, room, priority (Normal | High | Critical), status (Open | In Progress | Resolved), description, photo, reporterId, assignedTo, createdAt, startedAt, resolvedAt
- updates (timeline): id, issueId, text, status, date
- notes: id, issueId, authorId, authorName, text, date
- notifications: id, userId, issueId, text, date, read

The frontend stores category and building names directly inside issues. The database can use foreign keys, and the API can return names in the same JSON shape.

### How the frontend talks to data
All pages call these functions from `js/storage.js`. Replace their bodies with `fetch` calls:

| Function | Suggested endpoint |
|---|---|
| getAll(name) | GET /api/{name} |
| getById(name, id) | GET /api/{name}/{id} |
| addItem(name, item) | POST /api/{name} |
| updateItem(name, id, changes) | PUT /api/{name}/{id} |
| deleteItem(name, id) | DELETE /api/{name}/{id} |

Login is in `js/auth-validation.js`. It should call `POST /api/auth/login` and store the returned user and token with `setSession()` in `js/auth.js`.

### Notes
- Passwords are plain text only because this is mock data. The backend must hash them.
- Photos are saved as base64 text now. The backend should store the file and return a URL.
- Timeline entries are created automatically when status, priority or assignment changes.
- Smart suggestion: keyword rules are in `js/smart.js`. The backend can implement the same rules and return suggestedCategory and suggestedPriority. The admin always makes the final decision.
- Notifications are created on: new report (to admins), priority, assignment or status change (to the reporter), new task (to the technician), task completed (to admins).
- Deleting a student, technician, building or category has rules in the frontend. The backend should enforce the same rules.

## Team
- Frontend: Shotabdi Das
- Backend: Mehdia Alam Surmi
- Database: Hridi Singha