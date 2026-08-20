#### **1\. Public / Unauthenticated Screens**

* **Landing / Home Page:** Features the hero section  and the global search bar.  
* **Search Results Page:** Displays paper cards (Title, Author, Year, truncated Abstract). Includes Faceted Filters (Year, Region, University, Field of Study, Keywords) and Sorting options (Relevance, Year, Downloads).  
* **Paper Details Page (Public View):** Shows metadata and abstract only. "Download PDF" button is locked, prompting users to log in/register.  
* **Registration Page:** Sign-up form requiring SPAS ID, Name, and Birthdate for Scholars , enforcing the strong password policy , and featuring the mandatory Data Privacy Act consent checkbox.  
* **Login Page:** Standard authentication screen to access restricted features.  
* **Forgot / Reset Password Page:** UI for requesting and inputting the secure reset token.  
* **Registration Status Prompts:** UI error/success states, specifically the "Record Not Found – Contact DOST Scholarship Division" error screen and "Email Verification (OTL) Sent" screen.

  #### **2\. Scholar Screens (Authenticated)**

* **Scholar Dashboard:** The scholar's personal hub showing their uploaded papers and current statuses (Pending Review, Published, Returned).  
* **New Submission / Edit Page:** The form for metadata input (Title, Abstract, Year, Region, Field of Study, Keywords, Co-authors, University, Advisor) and the 50MB PDF upload zone. Also acts as the interface to overwrite a PDF if the status is "Draft" or "Returned".  
* **Paper Details Page (Scholar View):** Shows full metadata. "Download PDF" is active and triggers the dynamic watermarking process.  
* **Account Settings / Profile Page:** A basic screen for the scholar to view their verified profile data and change their password.

  #### **3\. Administrator Screens (Authenticated)**

* **Admin Analytics Dashboard:** Visualizes Top Downloaded Papers, Active Regions, and Total Research Output. Includes the "Export to CSV" button.  
* **Admin Review Queue:** A list/table view showing all submissions currently marked as "Pending Review".  
* **Admin Submission Review Page:** Interface to check metadata accuracy and file integrity. Includes "Approve" (Publishes) and "Reject/Return" buttons (with a mandatory feedback text box).  
* **Admin Audit Log Viewer:** A secure table interface for Admins to view the immutable audit logs of actions involving Scholar PII, fulfilling the strict DPA 2012 security tracking.