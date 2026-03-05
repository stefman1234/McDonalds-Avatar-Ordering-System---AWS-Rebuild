# Fuzzy Matching Testing Guide

## Overview
This document provides comprehensive testing instructions for the FEATURE_1_ORDER_CLARIFICATION fuzzy matching implementation.

## Prerequisites

### 1. Database Migration (REQUIRED)
Before testing, you MUST run the database migration to add search fields:

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/mgelwbilxwglksdidtgj/sql/new
2. Execute the following SQL:

```sql
-- Add search columns
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS search_terms TEXT[] DEFAULT '{}';

-- Add indexes for better search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_menu_items_tags ON menu_items USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_menu_items_name_trgm ON menu_items USING gin(name gin_trgm_ops);
```

### 2. Populate Search Data
After migration, populate the menu items with search tags and terms:

```bash
npx tsx scripts/populate-search-data.ts
```

Expected output:
```
✅ Completed: 31 updated, 0 skipped
```

### 3. Regenerate Prisma Client
```bash
npx prisma generate
```

## Test Scenarios

### Scenario 1: Exact Item Not Found
**Goal**: Test fuzzy matching when exact item doesn't exist

#### Test Case 1.1: Misspelled Item
**User Input**: "I want a borgir"
**Expected Behavior**:
- NLP returns unclear intent
- Fuzzy matcher finds "Hamburger"
- FilterBanner appears showing: "Did you mean one of these?"
- Carousel shows filtered items including Hamburger
- Avatar speaks: "Did you mean one of these? [shows hamburger options]"
- User can select Hamburger from carousel or click "Show All Items"

**How to Test**:
1. Navigate to [http://localhost:3002/order](http://localhost:3002/order)
2. Click microphone button
3. Say "I want a borgir"
4. Verify FilterBanner appears
5. Verify carousel shows burger items
6. Verify avatar speaks confirmation message

#### Test Case 1.2: Malaysian/Malay Terms
**User Input**: "ayam nugget"
**Expected Behavior**:
- Fuzzy matcher recognizes "ayam" (chicken in Malay)
- FilterBanner shows: "Showing X items matching 'ayam nugget'"
- Carousel filters to show Chicken McNuggets variants
- Avatar suggests: "Great choice! We have 4-piece, 6-piece, 9-piece, and 20-piece nuggets"

**Test Inputs**:
- "ayam nugget" → Chicken McNuggets
- "kentang goreng" → French Fries
- "ais krim" → Ice Cream/McFlurry
- "ikan burger" → Filet-O-Fish

#### Test Case 1.3: Common Misspellings
**Test Inputs**:
| User Says | Expected Match |
|-----------|---------------|
| "chiken" | Chicken items |
| "frice" | French Fries |
| "borgir" | Hamburger/Burgers |
| "nuggetz" | Chicken McNuggets |

### Scenario 2: Vague/Generic Requests
**Goal**: Test when user requests category without specific item

#### Test Case 2.1: Generic Category
**User Input**: "spicy burger"
**Expected Behavior**:
- NLP detects unclear intent (no exact "spicy burger" in menu)
- Fuzzy matcher finds items tagged with 'spicy' + 'burger'
- Carousel shows: Spicy Chicken McDeluxe, Double Spicy
- FilterBanner: "Showing 2 items matching 'spicy burger'"
- Avatar: "Let me show you our spicy burger options!"

**Test Inputs**:
- "spicy burger" → Spicy Chicken McDeluxe, Double Spicy
- "chicken" → All chicken items
- "ice cream" → McFlurry, Sundae, Soft Serve Cone
- "drink" → All beverage items

### Scenario 3: Quantity Specification
**Goal**: Test fuzzy matching with quantity keywords

#### Test Case 3.1: Nugget Quantities
**User Input**: "6 piece nuggets"
**Expected Behavior**:
- Fuzzy matcher recognizes "6 piece" search term
- Carousel filters to "Chicken McNuggets 6 Piece"
- Avatar: "Adding 6-piece Chicken McNuggets to your order"

**Test Inputs**:
- "4 piece nuggets" → 4 Piece variant
- "6pc" → 6 Piece variant
- "20 piece" → 20 Piece variant
- "nine piece" → 9 Piece variant

### Scenario 4: Size Specifications
**Goal**: Test size-based filtering

#### Test Case 4.1: Sized Items
**User Input**: "large fries"
**Expected Behavior**:
- Fuzzy matcher finds "French Fries Large"
- Adds directly to cart (high confidence match)

**Test Inputs**:
- "large fries" → French Fries Large
- "small coke" → Coca-Cola Small
- "medium sprite" → Sprite Medium
- "big drink" → Large drink options

### Scenario 5: Filter Mode Operations
**Goal**: Test filter UI interaction

#### Test Case 5.1: Clear Filter
**Steps**:
1. Say "spicy burger" to activate filter mode
2. Verify FilterBanner appears with count
3. Click "Show All Items" button
4. Verify carousel returns to showing all menu items
5. Verify FilterBanner disappears

#### Test Case 5.2: Select from Filtered Items
**Steps**:
1. Say "ice cream"
2. Verify carousel shows filtered desserts
3. Click "Add to Cart" on McFlurry Oreo
4. Verify item added to cart
5. Verify carousel returns to normal view (filter clears after selection)

### Scenario 6: Fallback Behavior
**Goal**: Test behavior when no matches found

#### Test Case 6.1: No Matches
**User Input**: "I want a pizza"
**Expected Behavior**:
- NLP returns unclear
- Fuzzy matcher finds no close matches
- Fallback to popular items
- FilterBanner: "No exact matches found. Here are our popular items:"
- Carousel shows: Big Mac, 6pc Nuggets, McFlurry, etc. (items with popular=true)

### Scenario 7: Multi-Strategy Matching
**Goal**: Verify matching strategy progression

#### Test Case 7.1: Close Match (Threshold 0.3)
**User Input**: "bigmac"
**Expected**:
- Exact match on search_terms
- Shows "Big Mac" only
- High confidence (1.0)

#### Test Case 7.2: Category Fallback
**User Input**: "breakfast"
**Expected**:
- No exact match
- Category match triggers
- Shows all breakfast items: Sausage McMuffin, Egg McMuffin, Hotcakes, etc.

#### Test Case 7.3: Keyword Match (Threshold 0.6)
**User Input**: "something sweet"
**Expected**:
- Loose keyword match
- Shows desserts matching "sweet" tag
- FilterBanner: "Showing items matching 'something sweet'"

## Test Checklist

### Functional Tests
- [ ] Misspelled items trigger fuzzy matching
- [ ] Malaysian/Malay terms work correctly
- [ ] Generic categories show filtered results
- [ ] Quantity keywords (4pc, 6 piece, etc.) work
- [ ] Size specifications work correctly
- [ ] "Show All Items" button clears filter
- [ ] Selecting filtered item adds to cart
- [ ] No matches falls back to popular items
- [ ] Avatar speaks appropriate messages
- [ ] FilterBanner displays correct count and message

### UI/UX Tests
- [ ] FilterBanner is visually distinct (yellow background)
- [ ] Carousel scrolls smoothly in filter mode
- [ ] Item count indicator updates in filter mode
- [ ] "Show All Items" button is easily clickable
- [ ] Filtered items display correctly
- [ ] Transition between filter/normal mode is smooth

### Edge Cases
- [ ] Empty search query
- [ ] Very long search query (50+ characters)
- [ ] Special characters in query
- [ ] Multiple spaces in query
- [ ] All uppercase query
- [ ] All lowercase query
- [ ] Mixed language query (English + Malay)

### Performance Tests
- [ ] Fuzzy matching completes within 500ms
- [ ] No visible lag when switching to filter mode
- [ ] Carousel renders filtered items smoothly
- [ ] Multiple rapid queries don't cause issues

## Debugging

### Check Fuzzy Matcher Output
Open browser console (F12) and look for:
```
[Fuzzy Match] Attempting fuzzy match for: "borgir"
[Fuzzy Match] Found 3 matches
[🔍 FUZZY MATCH] Found 3 matches for "borgir"
```

### Check API Response
In Network tab, inspect `/api/nlp/parse-order` response:
```json
{
  "success": true,
  "data": {
    "intent": "unclear",
    "items": [],
    "itemNotFound": true,
    "filteredItems": [...],
    "filterQuery": "borgir",
    "filterMessage": "Did you mean one of these?",
    "response": "Did you mean one of these?"
  }
}
```

### Verify Database Population
Check if menu items have search data:
```sql
SELECT name, tags, search_terms
FROM menu_items
WHERE name = 'Hamburger';
```

Expected:
```
name: "Hamburger"
tags: ["burger", "beef", "classic", "simple"]
search_terms: ["hamburger", "burger", "beef burger", "borgir", "simple burger"]
```

## Known Issues

### Issue 1: Database Not Migrated
**Symptom**: All queries return "unclear" without fuzzy matching
**Fix**: Run database migration SQL script

### Issue 2: Search Data Not Populated
**Symptom**: Fuzzy matching doesn't find obvious matches
**Fix**: Run `npx tsx scripts/populate-search-data.ts`

### Issue 3: Prisma Client Out of Sync
**Symptom**: TypeScript errors about missing fields
**Fix**: Run `npx prisma generate`

## Success Criteria

The fuzzy matching feature is working correctly if:
1. ✅ Misspelled items like "borgir" show burger options
2. ✅ Malaysian terms like "ayam nugget" work correctly
3. ✅ Generic queries like "spicy burger" show filtered results
4. ✅ FilterBanner appears with appropriate message
5. ✅ "Show All Items" button clears the filter
6. ✅ Avatar speaks clarification messages
7. ✅ User can select from filtered items and add to cart
8. ✅ No matches falls back to popular items

## Next Steps

After testing is complete:
1. Document any issues found in GitHub Issues
2. Create integration tests for fuzzy matching
3. Add unit tests for fuzzyMatcher.ts
4. Consider adding spell check for better matching
5. Expand Malaysian/Malay term dictionary
