### 

### **1\. Kanban Columns**

* **Backlog:** All the tickets for the whole project live here.  
* **Up Next (Sprint/Phase):** Tickets pulled from the Backlog that are ready to be worked on *right now*.  
* **In Progress:** Tickets a dev is actively coding. (Rule: A dev should only have 1 ticket here at a time to prevent bottlenecking).  
* **Code Review (PR):** Code is written and waiting for you or another lead to review and merge.  
* **QA / Testing:** Code is merged to staging and needs to be tested against the SRS requirements.  
* **Done:** fully completed and ready for the MVP launch.

### **2\. Initial Task Tickets**

**Phase 0: UI/UX Prototyping & Stakeholder Sign-off**

* **\[UI/UX\] Public Landing & Auth Portals:** Design the clean hero section, main search bar, Login/Register portals, and a Data Privacy Consent checkbox.  
* **\[UI/UX\] Search Results & Faceted Filtering:** Design the result cards (Title, Author, Year, truncated Abstract) and the sidebar filters.  
* **\[UI/UX\] Scholar Submission Dashboard:** Design the metadata input form and the drag-and-drop zone for PDF uploads.  
* **\[UI/UX\] Admin Analytics Dashboard:** Design the data visualizations for Top Downloads, Active Regions, and Total Output.  
* **\[UI/UX\] Admin Review Queue:** Design the interface for Administrators to view "Pending Review" submissions and click Approve/Return with feedback.  
* **\[Milestone\] Stakeholder Figma Approval:** Present the clickable prototype to Anasel/Kurt for final visual sign-off.

**Phase 1: Foundation & Identity**

* **\[DB\] Database Initialization:** Setup PostgreSQL and run migration scripts for users, scholar\_profiles, papers, paper\_authors, paper\_downloads, and audit\_logs.  
* **\[Auth\] Scholar Lookup Module:** Build the logic to validate incoming registrations against the internal SPAS ID/Name/Birthdate dataset.  
* **\[Auth\] User Registration Endpoint:** Create the API to handle Scholar and Public User sign-ups, enforcing a strong password policy (min 12 chars, alphanumeric, special) , and including AES-256 encryption for PII.  
* **\[Auth\] Email Verification (OTL):** Implement the One-Time Link email sending for new account activation.  
* **\[Auth\] Password Reset Flow:** Build the "Forgot Password" UI and secure token generation.

**Phase 2: Core Repository Engine**

* **\[UI\] Submission Dashboard:** Build the frontend form for Scholars to input Title, Abstract, Year, Region, Field of Study, Keywords, Co-authors, University/Institution, and Advisor/Mentor Name.  
* **\[API\] PDF Upload Handler:** Create the endpoint to accept PDF uploads, enforce the 50MB size limit, and push to cloud storage.  
* **\[DB\] Pivot Table Logic:** Ensure the submission form properly writes to the paper\_authors many-to-many table for multi-author papers.  
* **\[API\] Input Sanitization:** Implement global form validation to prevent SQL Injection and Cross-Site Scripting (XSS) across all submission and search inputs.  
* **\[API\] Paper Status & Revision:** Implement the logic allowing Scholars to overwrite their PDF only if the status is "Draft" or "Returned".

**Phase 3: Discovery & Administration**

* **\[UI\] Global Search Bar & Results:** Build the homepage search UI and result cards (Title, Author, Year, truncated Abstract) , and include Sorting by Relevance, Year, and Most Downloaded.  
* **\[API\] Faceted Search Engine:** Implement backend filtering by Year, Region, University, Field of Study, and Keywords.  
* **\[Auth/API\] PDF Access Control:** Build the middleware logic to ensure unregistered users can only view abstracts/metadata , and restrict full-text PDF downloads to logged-in users.  
* **\[Feature\] Dynamic Watermarking:** Integrate the PDF processing engine to stamp the downloaded file with "\[User Full Name\] (ID: \[UserID\]) on \[Date/Time\]".  
* **\[API\] Admin Approval Workflow:** Create the backend endpoints for Admins to change paper status from "Pending" to "Published" or "Returned" (with feedback logging).  
* **\[Admin\] Analytics Dashboard UI:** Build the visual layout for Top Downloaded, Active Regions, and Total Research Output.  
* **\[Admin\] CSV Export Feature:** Create the functionality for Admins to download the analytics reports.

**Phase 4: Hardening & UAT**

* **\[QA\] Security & Privacy Audit:** Verify encryption at rest and test Admin audit logs.  
* **\[QA\] User Acceptance Testing (UAT):** Conduct beta testing sessions with a small group of DOST scholars, specifically testing Responsive Web Design (RWD) ensuring the UI works on mobile devices (320px width) up to desktop.  
* **\[Deploy\] Production Launch:** Finalize CI/CD pipeline and deploy the MVP to the production server.

