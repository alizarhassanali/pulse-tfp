

## Problem

The Event Detail page structure is already correct (2 top-level tabs: Send → sub-tabs Send Now / Share & QR, and Automate), but there's a **stale state bug**: when navigating from ManageEvents, clicking "Send" or "Automate" may not switch the active tab because `useState(defaultTab)` only runs on initial component mount — not when `location.state` changes.

## Fix

**File: `src/pages/nps/EventDetail.tsx`**

Add a `useEffect` to sync `activeTab` whenever `location.state?.tab` changes:

```typescript
useEffect(() => {
  if (location.state?.tab) {
    setActiveTab(location.state.tab);
  }
}, [location.state?.tab]);
```

This ensures that clicking "Send" from ManageEvents always opens the Send tab (with Send Now + Share & QR sub-tabs visible), and clicking "Automate" always opens the Automate tab — even if the EventDetail component is already mounted.

One file change, ~4 lines added.

