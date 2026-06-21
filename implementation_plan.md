# Online Exam IDE Implementation Plan

This document outlines the current state of the Online Exam IDE project and proposes a technical roadmap for its enhancement. The current system consists of a React frontend with Monaco Editor and proctoring features, and a Node.js Express backend for remote code execution.

## Current State Analysis
- **Frontend**: A React application featuring a code editor (Monaco), problem descriptions, execution terminal, and a suite of client-side proctoring features (disabling copy/paste, detecting DevTools, tab switching, and DOM injections).
- **Backend**: A Node.js Express server that accepts base64-encoded code payloads, decrypts them, performs rudimentary string-based filtering to prevent dangerous imports, and executes the code on the host machine using `child_process.exec`.

> [!WARNING]
> **Critical Security Flaw**
> The current backend uses simple string replacement (e.g., replacing `import os`) to prevent malicious code execution. This is highly vulnerable to bypasses (e.g., using `__import__('os')` in Python or `eval()` in JavaScript) and could allow an attacker to run arbitrary commands on your host system. It is highly recommended to implement true sandboxing.

## User Review Required

Please review the proposed architectural improvements below. Since you asked for an implementation plan without specifying a new feature, I have outlined the most critical next steps for a production-ready application. **Let me know which of these you would like to implement next, or if you have a different feature in mind.**

## Open Questions

> [!IMPORTANT]
> **To proceed with development, please clarify the following:**
> 1. **Focus Area:** Would you like to focus on fixing the backend security (Sandboxing via Docker), adding a Database (saving users, questions, exam results), or enhancing the Frontend (more proctoring, user login)?
> 2. **Database Choice:** Do you have a preferred database for saving exam results and questions (e.g., MongoDB, PostgreSQL, Firebase)?
> 3. **Hosting:** Where do you plan to deploy this application? (This affects how we implement code execution sandboxing).

## Proposed Changes

If approved, we can proceed with any of the following phases:

### Phase 1: Secure Code Execution (Sandboxing)
#### [MODIFY] backend/index.js
- Replace direct `child_process.exec` calls with isolated Docker containers (e.g., using `docker run --rm`).
- Implement resource limits per container (memory limits, CPU limits, no network access).
- Remove the easily-bypassed `interceptImports` string matching.

### Phase 2: Persistence & Authentication
#### [NEW] backend/models/
- Setup database schemas for Users, Questions, and Exam Sessions.
#### [MODIFY] frontend/src/App.jsx
- Add authentication flows (Login/Register).
- Fetch the `QUESTIONS` array from the backend API instead of hardcoding it.
- Submit the final code/score to the backend upon exam completion or lock.

### Phase 3: Enhanced Exam Flow & Proctoring
#### [MODIFY] frontend/src/App.jsx
- Add webcam/microphone monitoring requests.
- Add an exam dashboard indicating overall progress and score.

## Verification Plan

### Automated Tests
- Create unit tests for code execution engines to verify that legitimate code executes correctly and malicious code (e.g., `rm -rf /` or infinite loops) is safely terminated and contained.

### Manual Verification
- Test code execution for all supported languages (Python, Java, C#, C++, JS) within the new sandboxed environment.
- Trigger proctoring events manually to ensure the exam locks correctly and reports the incident to the backend.
