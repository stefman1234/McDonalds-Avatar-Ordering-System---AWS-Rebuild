# Section 1.4: Smart Meal Conversion Acceptance - Test Report

## Overview
This document provides comprehensive test cases for the Smart Meal Conversion Acceptance feature (Section 1.4). Each test case includes the expected conversation flow and verification points.

---

## Test Environment Setup

### Prerequisites
1. Development server running (`npm run dev`)
2. Database connection active
3. Menu items populated in Supabase
4. Avatar initialized successfully

### Test Data Requirements
- At least one burger item (e.g., Big Mac, Cheeseburger)
- Sides available: Fries, Corn Cup, Garden Salad
- Drinks available: Coke, Sprite, Fanta, Milo
- Ice levels: Full, Less, None

---

## Test Case 1: Full Details in Acceptance Response

### Objective
Verify that providing all meal details in the acceptance response adds the meal directly to cart without asking any questions.

### Test Steps
1. Order a meal-eligible item
2. When offered meal conversion, provide ALL details in response
3. Verify meal is added to cart immediately

### Expected Conversation

```
👤 User: "I want a Big Mac"

🤖 Avatar: "Would you like your Big Mac solo or as a medium or large meal?"

👤 User: "Yes, large with fries and Coke, full ice"

🤖 Avatar: "Perfect! I've added a large Big Mac meal with fries and Coke with full ice. Anything else?"

[✅ Meal should be in cart with all components]
```

### Verification Points
- ✅ No additional questions asked
- ✅ Cart contains: 1x Big Mac Meal
- ✅ Meal size: Large
- ✅ Side: Fries
- ✅ Drink: Coke
- ✅ Ice level: Full
- ✅ Avatar switches to "Your Order" tab

### Console Logs to Check
```
[🍔 SMART CONVERSION] Size: large
[🍔 SMART CONVERSION] Side: Fries
[🍔 SMART CONVERSION] Drink: Coke
[🍔 SMART CONVERSION] Ice level: full
[🍔 SMART CONVERSION] Meal complete from acceptance response! Adding to cart...
[🛒 CART] Added complete meal: 1x Big Mac meal
```

---

## Test Case 2: Size and Drink in Acceptance

### Objective
Verify that providing partial details (size + drink) skips those questions and only asks for missing components.

### Test Steps
1. Order a meal-eligible item
2. Provide size and drink in acceptance
3. Verify only side and ice questions are asked

### Expected Conversation

```
👤 User: "I want a McChicken"

🤖 Avatar: "Would you like your McChicken solo or as a medium or large meal?"

👤 User: "Yeah make it large with Coke"

🤖 Avatar: "Great! What side would you like? We have fries, corn cup, or garden salad."

👤 User: "Fries"

🤖 Avatar: "Would you like ice with your Coke? Full ice, less ice, or no ice?"

👤 User: "Less ice"

🤖 Avatar: "Awesome! I've added a large McChicken meal with fries and Coke with less ice. Anything else?"

[✅ Meal should be in cart]
```

### Verification Points
- ✅ Size question SKIPPED (provided in acceptance)
- ✅ Drink question SKIPPED (provided in acceptance)
- ✅ Side question ASKED (not provided)
- ✅ Ice question ASKED (not provided)
- ✅ Final meal correct: Large McChicken, Fries, Coke, Less Ice

### Console Logs to Check
```
[🍔 SMART CONVERSION] Size: large
[🍔 SMART CONVERSION] Drink: Coke
[🍔 SMART CONVERSION] Starting customization for McChicken (step: meal_side)
```

---

## Test Case 3: Size and Side in Acceptance

### Objective
Verify that providing size and side skips those questions.

### Test Steps
1. Order a meal-eligible item
2. Provide size and side in acceptance
3. Verify only drink and ice questions are asked

### Expected Conversation

```
👤 User: "I want a Quarter Pounder"

🤖 Avatar: "Would you like your Quarter Pounder solo or as a medium or large meal?"

👤 User: "Sure, medium with fries"

🤖 Avatar: "And what drink would you like? We have Coke, Sprite, Fanta, Milo, and more."

👤 User: "Sprite"

🤖 Avatar: "Would you like ice with your Sprite? Full ice, less ice, or no ice?"

👤 User: "Full ice"

🤖 Avatar: "Perfect! I've added a medium Quarter Pounder meal with fries and Sprite with full ice. Anything else?"

[✅ Meal should be in cart]
```

### Verification Points
- ✅ Size question SKIPPED
- ✅ Side question SKIPPED
- ✅ Drink question ASKED
- ✅ Ice question ASKED
- ✅ Final meal correct

### Console Logs to Check
```
[🍔 SMART CONVERSION] Size: medium
[🍔 SMART CONVERSION] Side: Fries
[🍔 SMART CONVERSION] Starting customization for Quarter Pounder (step: meal_drink)
```

---

## Test Case 4: Only Size in Acceptance

### Objective
Verify that providing only size skips just the size question.

### Test Steps
1. Order a meal-eligible item
2. Provide only size in acceptance
3. Verify side, drink, and ice questions are asked

### Expected Conversation

```
👤 User: "I want a Cheeseburger"

🤖 Avatar: "Would you like your Cheeseburger solo or as a medium or large meal?"

👤 User: "Large meal"

🤖 Avatar: "Perfect! What side would you like? We have fries, corn cup, or garden salad."

👤 User: "Corn cup"

🤖 Avatar: "And what drink would you like? We have Coke, Sprite, Fanta, Milo, and more."

👤 User: "Milo"

🤖 Avatar: "Would you like ice with your Milo? Full ice, less ice, or no ice?"

👤 User: "No ice"

🤖 Avatar: "Excellent! I've added a large Cheeseburger meal with corn cup and Milo with no ice. Anything else?"

[✅ Meal should be in cart]
```

### Verification Points
- ✅ Size question SKIPPED
- ✅ Side question ASKED
- ✅ Drink question ASKED
- ✅ Ice question ASKED
- ✅ Final meal correct: Large Cheeseburger, Corn Cup, Milo, No Ice

---

## Test Case 5: No Details in Acceptance (Baseline)

### Objective
Verify that providing no details in acceptance asks all questions (baseline behavior).

### Test Steps
1. Order a meal-eligible item
2. Accept conversion without details
3. Verify all questions are asked

### Expected Conversation

```
👤 User: "I want a Big Mac"

🤖 Avatar: "Would you like your Big Mac solo or as a medium or large meal?"

👤 User: "Yes"

🤖 Avatar: "Great! Would you like it medium or large?"

👤 User: "Large"

🤖 Avatar: "Perfect! What side would you like? We have fries, corn cup, or garden salad."

👤 User: "Fries"

🤖 Avatar: "And what drink would you like? We have Coke, Sprite, Fanta, Milo, and more."

👤 User: "Coke"

🤖 Avatar: "Would you like ice with your Coke? Full ice, less ice, or no ice?"

👤 User: "Full ice"

🤖 Avatar: "Awesome! I've added a large Big Mac meal with fries and Coke with full ice. Anything else?"

[✅ Meal should be in cart]
```

### Verification Points
- ✅ ALL questions asked (size, side, drink, ice)
- ✅ Meal correctly assembled
- ✅ Normal flow without smart parsing

---

## Test Case 6: Drink and Ice in Acceptance

### Objective
Verify that providing drink and ice level skips those questions.

### Test Steps
1. Order a meal-eligible item
2. Provide drink and ice level in acceptance
3. Verify only size and side questions are asked

### Expected Conversation

```
👤 User: "I want a McChicken"

🤖 Avatar: "Would you like your McChicken solo or as a medium or large meal?"

👤 User: "Yes with Sprite, no ice"

🤖 Avatar: "Great! Would you like it medium or large?"

👤 User: "Medium"

🤖 Avatar: "What side would you like? We have fries, corn cup, or garden salad."

👤 User: "Garden salad"

🤖 Avatar: "Perfect! I've added a medium McChicken meal with garden salad and Sprite with no ice. Anything else?"

[✅ Meal should be in cart]
```

### Verification Points
- ✅ Size question ASKED
- ✅ Side question ASKED
- ✅ Drink question SKIPPED
- ✅ Ice question SKIPPED
- ✅ Final meal correct

### Console Logs to Check
```
[🍔 SMART CONVERSION] Drink: Sprite
[🍔 SMART CONVERSION] Ice level: none
[🍔 SMART CONVERSION] Starting customization for McChicken (step: meal_size)
```

---

## Test Case 7: All Details with "Make it" Phrasing

### Objective
Verify smart parsing works with natural language variations.

### Test Steps
1. Order a meal-eligible item
2. Use "make it" phrasing with all details
3. Verify immediate cart addition

### Expected Conversation

```
👤 User: "I want a Big Mac"

🤖 Avatar: "Would you like your Big Mac solo or as a medium or large meal?"

👤 User: "Make it a large meal with fries and Coke, less ice"

🤖 Avatar: "Perfect! I've added a large Big Mac meal with fries and Coke with less ice. Anything else?"

[✅ Meal should be in cart]
```

### Verification Points
- ✅ Parses "make it a" correctly
- ✅ All details extracted
- ✅ No questions asked
- ✅ Immediate cart addition

---

## Test Case 8: Multiple Items - Sequential Smart Conversion

### Objective
Verify smart conversion works for multiple items sequentially.

### Test Steps
1. Order multiple meal-eligible items
2. Provide different levels of detail for each
3. Verify smart parsing for each item

### Expected Conversation

```
👤 User: "I want a Big Mac and a Cheeseburger"

🤖 Avatar: "Great! I've added a Big Mac and a Cheeseburger. Would you like to make any of these a meal?"

👤 User: "Yes, large Big Mac meal with fries and Coke, full ice"

🤖 Avatar: "Perfect! You also have a Cheeseburger in your order. Would you like to make that a meal too?"

👤 User: "Sure, medium with Sprite"

🤖 Avatar: "What side would you like? Fries, corn cup, or garden salad?"

👤 User: "Corn cup"

🤖 Avatar: "Would you like ice with your Sprite? Full ice, less ice, or no ice?"

👤 User: "Less ice"

🤖 Avatar: "Excellent! I've added both meals to your order. Anything else?"

[✅ Both meals should be in cart]
```

### Verification Points
- ✅ First item: All details provided → No questions
- ✅ Second item: Partial details → Only missing questions asked
- ✅ Both meals correctly in cart
- ✅ Smart parsing works independently for each item

---

## Test Case 9: Edge Case - Invalid Item Names

### Objective
Verify graceful handling when drink/side names are invalid.

### Test Steps
1. Order a meal-eligible item
2. Provide invalid side/drink names
3. Verify system asks for valid options

### Expected Conversation

```
👤 User: "I want a Big Mac"

🤖 Avatar: "Would you like your Big Mac solo or as a medium or large meal?"

👤 User: "Yes, large with onion rings and Pepsi"

🤖 Avatar: "Great! Would you like it medium or large?"

[System should not parse invalid items]

👤 User: "Large"

🤖 Avatar: "What side would you like? We have fries, corn cup, or garden salad."

[Should ask because "onion rings" not recognized]
```

### Verification Points
- ✅ Invalid items not parsed
- ✅ System falls back to asking questions
- ✅ No errors thrown
- ✅ User can complete order with valid options

---

## Test Case 10: Mixed Case and Typos

### Objective
Verify parsing is case-insensitive and handles common variations.

### Test Steps
1. Order a meal-eligible item
2. Use mixed case and common variations
3. Verify correct parsing

### Expected Conversation

```
👤 User: "I want a Big Mac"

🤖 Avatar: "Would you like your Big Mac solo or as a medium or large meal?"

👤 User: "YEAH LARGE WITH FRIES AND coke, FULL ICE"

🤖 Avatar: "Perfect! I've added a large Big Mac meal with fries and Coke with full ice. Anything else?"

[✅ Should parse despite mixed case]
```

### Verification Points
- ✅ Handles uppercase correctly
- ✅ Handles lowercase correctly
- ✅ Handles mixed case correctly
- ✅ All details extracted properly

---

## Test Summary Template

After running all tests, fill out this summary:

### Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1: Full Details | ⬜ Pass / ⬜ Fail | |
| TC2: Size + Drink | ⬜ Pass / ⬜ Fail | |
| TC3: Size + Side | ⬜ Pass / ⬜ Fail | |
| TC4: Size Only | ⬜ Pass / ⬜ Fail | |
| TC5: No Details | ⬜ Pass / ⬜ Fail | |
| TC6: Drink + Ice | ⬜ Pass / ⬜ Fail | |
| TC7: "Make it" Phrasing | ⬜ Pass / ⬜ Fail | |
| TC8: Multiple Items | ⬜ Pass / ⬜ Fail | |
| TC9: Invalid Names | ⬜ Pass / ⬜ Fail | |
| TC10: Mixed Case | ⬜ Pass / ⬜ Fail | |

### Issues Found
1. [List any issues discovered]
2.
3.

### Performance Notes
- Average response time:
- Voice quality:
- UI responsiveness:

### Recommendations
- [List any recommendations for improvements]

---

## How to Run Tests

### Manual Testing
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the application in your browser

3. For each test case:
   - Say the user's lines exactly as written
   - Observe the avatar's responses
   - Check the cart contents
   - Verify console logs
   - Mark pass/fail in the summary table

### Console Monitoring
Open browser DevTools (F12) and filter for:
- `[🍔 SMART CONVERSION]` - Smart parsing logs
- `[🍔 MEAL CONVERSION]` - Conversion offer logs
- `[🛒 CART]` - Cart addition logs
- `[🤖 AVATAR RESPONSE]` - Avatar responses

### Debugging Tips
If a test fails:
1. Check console for error messages
2. Verify menu items exist in Supabase
3. Check network tab for API responses
4. Review the `parseMealDetailsFromAcceptance` function
5. Verify `findSideByName` and `findDrinkByName` are working

---

## Expected Code Paths

### When User Provides Full Details
```
parseMealConversionResponse()
  → parseMealDetailsFromAcceptance()
  → Returns: { accepted: true, itemIndex: 0, mealDetails: {...} }
  → AvatarContainer: Pre-populates all details
  → isCurrentItemComplete() returns true
  → Adds to cart immediately
```

### When User Provides Partial Details
```
parseMealConversionResponse()
  → parseMealDetailsFromAcceptance()
  → Returns: { accepted: true, itemIndex: 0, mealDetails: {size, drink} }
  → AvatarContainer: Pre-populates size and drink
  → nextStep() returns 'meal_side' (skips size)
  → Asks side question
  → User responds
  → nextStep() returns 'ice_level' (skips drink)
  → Asks ice question
  → User responds
  → isCurrentItemComplete() returns true
  → Adds to cart
```

---

## Success Criteria

Section 1.4 implementation is successful if:

✅ **All 10 test cases pass**
✅ **No errors in console**
✅ **Correct items in cart with correct details**
✅ **Questions are properly skipped when details provided**
✅ **Smart parsing works with natural language variations**
✅ **Multiple items handled correctly**
✅ **Edge cases handled gracefully**

---

## Date Tested: __________
## Tested By: __________
## Build/Commit: __________
## Overall Result: ⬜ Pass / ⬜ Fail
