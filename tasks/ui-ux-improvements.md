## **UI/UX Improvement Tasks**

- [x] **Task 1: Header Simplification**
  - [x] **1.1 Remove Redundant Navigation**
  - [x] **1.2 Streamline Top Bar**

- [x] **Task 2: Remove Distracting Notifications**
  - [x] **2.1 Eliminate Active Recording Banner**
  - [x] **2.2 Consent Flow Redesign**

- [x] **Task 3: Right Sidebar Consolidation**

#### **3.1 Navigation Tab Migration**
- **Move:** "Suggestions" tab content to right sidebar default view
- **Move:** "Analysis" tab content to sidebar Analysis section
- **Move:** "Vocabulary" and "Progress" under Analysis section
- **Move:** "AI Tutor" tab to sidebar Chat section
- **Remove:** Original tab navigation bar

#### **3.2 Sidebar Organization Structure**
```
Right Sidebar Sections:
├── 📊 Analysis (horizontal tab, default open)
│   ├── Grammar & Style
│   ├── Readability
│   ├── Vocabulary
│   └── Assignment Settings
├── ✏️ Suggestions (horizontal tab)
│   ├── Essay Templates
│   ├── Transitions
│   ├── Citation Help
│   └── Progress
└── 💬 AI Tutor (collapsible)

```

#### **3.3 Academic Tools Integration**
- **Move:** Essay Templates under "Suggestions"
- **Move:** Transitions, Analysis, Citing under "Suggestions"
- **Move:** Writing Goals to "Assignment Settings"
- **Consolidate:** 5-Paragraph Essay, Argumentative Essay, Analytical Essay into simple template picker

### **Task 4: Editor Toolbar & Formatting**

#### **4.1 Replace Generic Feedback**
- **Remove:** "Your text looks great!" with green checkmark
- **Replace:** With actionable feedback counts
  - "2 grammar suggestions"
  - "3 vocabulary improvements"
  - "Readability: Grade 10 level"

#### **4.2 Progress Indicators**
- **Add:** Writing progress bar based on assignment settings
- **Add:** Real-time word count vs. goal
- **Add:** Time remaining until due date (if set)

#### **4.3 Contextual Suggestions**
- **Implement:** Show relevant suggestions based on cursor position
- **Design:** Expandable suggestion cards
- **Add:** One-click acceptance for suggestions

#### **4.4 Testing**
- Suggestion relevance testing
- Click-through rate measurement
- Student preference testing (actionable vs. generic feedback)

### **Task 5: Document Management Simplification**

#### **5.1 Improve Document List**
- **Rename:** "My Documents" to "My Essays"
- **Add:** Assignment type badges (English, History, Social Studies)
- **Add:** Due date display

#### **5.2 Document Metadata**
- **Implement:** Assignment type selection
- **Add:** Teacher/class assignment
- **Include:** Creation and last modified dates
- **Design:** Clean card-based layout

### **Task 6: Mobile Responsiveness**

### **Task 7: Writing Mode Indicator Redesign**

#### **7.1 Subtle Academic Mode Display**
- **Replace:** Blue banner with small badge
- **Position:** Top-right corner of editor
- **Design:** Minimal, non-intrusive indicator
- **Include:** Tooltip explaining academic mode benefits 