# UI Layout Fix - Collapsible Sidebars

## Problem
Both sidebars consume 288px each (576px total), leaving limited space for the main chat content.

## Solution
Add collapse/expand functionality to both sidebars with icon-only collapsed mode.

---

## Files to Modify

### 1. `src/components/left-sidebar.tsx`

**Add state & toggle:**
```tsx
const [isCollapsed, setIsCollapsed] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('leftSidebarCollapsed') === 'true';
  }
  return false;
});
```

**Width classes:**
- Expanded: `w-64` (256px, down from 288px)
- Collapsed: `w-16` (64px)
- Add: `transition-all duration-300`

**Collapsed mode UI:**
- Hide section headers and labels
- Show only icons in a centered column
- Add tooltips on icon buttons
- Toggle button at top (ChevronLeft/ChevronRight)

**Elements in collapsed mode:**
- Quick Actions: Icon buttons only (UserCheckIcon, ClipboardListIcon, FileTextIcon)
- Progress: Hide entirely or show minimal indicator
- Help text: Hide

---

### 2. `src/components/right-sidebar.tsx`

**Add state & toggle:**
```tsx
const [isCollapsed, setIsCollapsed] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('rightSidebarCollapsed') !== 'false'; // Default collapsed
  }
  return true;
});
```

**Width classes:**
- Expanded: `w-56` (224px, down from 288px)
- Collapsed: `w-16` (64px)
- Add: `transition-all duration-300`

**Collapsed mode UI:**
- Important Links: Icon buttons only (GlobeIcon, ExternalLinkIcon, MapPinIcon)
- Help Topics: Single HelpCircleIcon that expands on click
- Contact: PhoneIcon only

---

### 3. `app/page.tsx`
No changes needed - sidebars manage their own state.

---

## Implementation Checklist

- [ ] Left sidebar: Add useState for collapse state
- [ ] Left sidebar: Add localStorage persistence
- [ ] Left sidebar: Add toggle button with ChevronLeft/Right
- [ ] Left sidebar: Conditional rendering for collapsed/expanded
- [ ] Left sidebar: Add tooltips for collapsed icons
- [ ] Right sidebar: Add useState for collapse state (default: true)
- [ ] Right sidebar: Add localStorage persistence
- [ ] Right sidebar: Add toggle button
- [ ] Right sidebar: Conditional rendering for collapsed/expanded
- [ ] Right sidebar: Add tooltips for collapsed icons
- [ ] Both: Add smooth width transition CSS

---

## Space Comparison

| State | Width | Chat Area Gain |
|-------|-------|----------------|
| Both expanded (before) | 576px | baseline |
| Both expanded (after) | 480px | +96px |
| Both collapsed | 128px | +448px |
