# DigAlert — User Manual

Welcome to the **DigAlert Platform User Manual**. This document guides citizens, utility operators, and GHMC administrators on how to access, navigate, and leverage DigAlert to coordinate municipal excavations and prevent repeated road damage.

---

## 📖 Table of Contents
1. [Platform Overview](#platform-overview)
2. [Citizen Portal (Reporting Issues)](#citizen-portal-reporting-issues)
3. [Utility Agency Portal (Permits & Clashes)](#utility-agency-portal-permits--clashes)
4. [GHMC Administrator Dashboard (Resolution & Analytics)](#ghmc-administrator-dashboard-resolution--analytics)
5. [Frequently Asked Questions](#frequently-asked-questions)

---

## 1. Platform Overview
DigAlert serves as a single source of truth for all excavation activities in the city. By registering every planned dig, the system identifies **spatial clashes** (overlapping digging coordinates within a 150m radius), **temporal clashes** (overlapping dates), and **depth conflicts** before any work begins, recommending **co-digging opportunities** to save costs and reduce traffic congestion.

---

## 2. Citizen Portal (Reporting Issues)
Citizens do not need an account to report issues, but logging in allows tracking reports over time.

### Filing a Complaint:
1. Navigate to the homepage and click **Report Issue** or go directly to the citizen dashboard.
2. Select the **Complaint Category**:
   * *Open Trench*
   * *Water Leakage*
   * *Damaged Road*
   * *Unsafe Excavation*
   * *Traffic Obstruction*
3. Provide a clear **Description** of the issue.
4. Input the **Location**: Drag the pin on the interactive map or let the browser auto-detect coordinates.
5. Upload a **Photo** of the site (optional but recommended for verification).
6. Click **Submit**. You will receive a ticket ID to track the complaint status (e.g., *Open* → *In Progress* → *Resolved*).

---

## 3. Utility Agency Portal (Permits & Clashes)
Utility agencies (such as TSSPDCL, HMWSSB, Airtel, BSNL) log in to submit excavation requests and coordinate work.

### Submitting a Permit:
1. Log in with your utility agency credentials.
2. Click **New Permit Request**.
3. Fill out the permit details:
   * **Excavation Depth**: The planned depth in meters.
   * **Duration**: Select the excavation start and end dates.
   * **Excavation Path**: Draw the LineString path directly on the interactive map canvas.
4. Click **Run Clash Analysis**. 
5. The platform will instantly check for conflicts. If no conflict is found, the permit goes to pending admin approval. If conflicts are found, a **Clash Alert** is displayed showing overlapping permits and a **Co-Dig proposal**.

---

## 4. GHMC Administrator Dashboard (Resolution & Analytics)
GHMC administrators possess full read/write authorization to monitor, approve, and resolve clashes.

### Approving Permits & Resolving Clashes:
1. Log in as an `ADMIN`.
2. Go to the **Permit Review Center**.
3. View the **Clash Center** to inspect active overlaps.
4. Review the **Co-Dig Recommendations** (showing estimated financial savings in INR and recommended joint excavation windows).
5. Approve, reject, or request coordination among the conflicting agencies.

---

## 5. Frequently Asked Questions
* **How are cost savings calculated?** Savings are calculated automatically based on the length of the overlapping segment, depth conflicts resolved, and standard restoration cost models per square meter.
* **Can a citizen delete a report?** No, reports can only be resolved by assigned municipal utility workers or GHMC administrators once verified.
