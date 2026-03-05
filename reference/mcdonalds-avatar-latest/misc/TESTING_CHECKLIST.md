# Ordering Logic Testing Checklist

## Test Session: Multiple Item Ordering (Task 1.3)

**Server**: http://localhost:3000/order
**Date**: 2025-11-17

---

## Test 1: Multiple Simple Items Flow

### Test Case 1.1: Multiple Items Without Meal Keywords
**Input**: "I want a Big Mac, a cheeseburger, and fries"

**Expected Behavior**:
1. ✅ System parses all 3 items
2. ✅ All items added to cart as regular (non-meal) items
3. ✅ Avatar offers meal conversion: "Would you like any of these as a meal?"
4. ✅ Cart shows: Big Mac (single), Cheeseburger (single), Fries (single)

**Test Steps**:
- [ ] Navigate to /order page
- [ ] Say: "I want a Big Mac, a cheeseburger, and fries"
- [ ] Verify all 3 items appear in cart
- [ ] Verify meal conversion offer is displayed
- [ ] Screenshot result

**User says YES to meal conversion**:
- [ ] Avatar asks: "Which item would you like as a meal?"
- [ ] Say: "Big Mac"
- [ ] Meal customization flow starts for Big Mac
- [ ] After completing Big Mac meal, avatar asks: "Would you like the cheeseburger as a meal too?"
- [ ] Say: "No"
- [ ] Final cart: Big Mac (meal), Cheeseburger (single), Fries (single)

**User says NO to meal conversion**:
- [ ] Say: "No thanks"
- [ ] Avatar: "No problem! Anything else?"
- [ ] All items remain as singles in cart
- [ ] No meal customization flow triggered

### Test Case 1.2: Two Items (Potential Meal Combo)
**Input**: "I want a McChicken and an apple pie"

**Expected Behavior**:
1. ✅ Both items added as singles
2. ✅ Avatar offers meal conversion for McChicken
3. ✅ If YES: Start meal customization
4. ✅ If NO: Keep as singles

**Test Steps**:
- [ ] Clear cart
- [ ] Say: "I want a McChicken and an apple pie"
- [ ] Verify conversion offer
- [ ] Test YES path
- [ ] Test NO path

---

## Test 2: Multiple Items with Meal Keyword Flow

### Test Case 2.1: One Meal + One Single Item
**Input**: "I want a Big Mac meal and a cheeseburger"

**Expected Behavior**:
1. ✅ System detects Big Mac as meal, cheeseburger as single
2. ✅ Avatar starts meal customization for Big Mac first
3. ✅ Avatar: "I'll help you with your Big Mac meal first. Would you like it medium or large?"
4. ✅ Complete Big Mac meal flow (size → side → drink → ice)
5. ✅ Cheeseburger added as single item
6. ✅ After meal complete, avatar asks: "Would you like to make the cheeseburger a meal too?"
7. ✅ Cart shows: Big Mac (complete meal), Cheeseburger (single)

**Test Steps**:
- [ ] Clear cart
- [ ] Say: "I want a Big Mac meal and a cheeseburger"
- [ ] Verify meal customization starts for Big Mac
- [ ] Answer: "Large"
- [ ] Verify side question appears
- [ ] Answer: "Fries"
- [ ] Verify drink question appears
- [ ] Answer: "Coke"
- [ ] Verify ice question appears
- [ ] Answer: "Full ice"
- [ ] Verify Big Mac meal added to cart with all details
- [ ] Verify cheeseburger conversion offer appears
- [ ] Test YES path (convert cheeseburger to meal)
- [ ] Test NO path (keep cheeseburger as single)

### Test Case 2.2: Meal + Multiple Singles
**Input**: "I want a McChicken meal, nuggets, and fries"

**Expected Behavior**:
1. ✅ McChicken meal customization starts first
2. ✅ Nuggets and fries added as singles
3. ✅ After meal complete, avatar mentions the singles
4. ✅ May offer to convert nuggets to meal (if eligible)

**Test Steps**:
- [ ] Clear cart
- [ ] Say: "I want a McChicken meal, nuggets, and fries"
- [ ] Complete meal customization
- [ ] Verify singles are in cart
- [ ] Check for appropriate follow-up

### Test Case 2.3: Two Meals + One Single
**Input**: "I want a Big Mac meal, a McChicken meal, and an apple pie"

**Expected Behavior**:
1. ✅ Avatar: "I'll help you customize both meals. Let's start with the Big Mac meal."
2. ✅ Complete Big Mac meal customization
3. ✅ Avatar: "Now for the McChicken meal - what size?"
4. ✅ Complete McChicken meal customization
5. ✅ Apple pie added as single
6. ✅ Cart shows both complete meals + apple pie

**Test Steps**:
- [ ] Clear cart
- [ ] Say: "I want a Big Mac meal, a McChicken meal, and an apple pie"
- [ ] Complete both meal flows
- [ ] Verify both meals in cart
- [ ] Verify apple pie as single

---

## Test 3: Multiple Meals Flow

### Test Case 3.1: Two Complete Meals with Size Specified
**Input**: "I want a large Big Mac meal and a large McChicken meal"

**Expected Behavior**:
1. ✅ System detects 2 meals, both large
2. ✅ Avatar: "I'll help you customize both meals. Let's start with the Big Mac meal. What side would you like?"
3. ✅ Complete Big Mac meal (skip size, already specified)
4. ✅ Avatar: "Now for the McChicken meal - what side?"
5. ✅ Complete McChicken meal (skip size, already specified)
6. ✅ Both meals added to cart with correct details

**Test Steps**:
- [ ] Clear cart
- [ ] Say: "I want a large Big Mac meal and a large McChicken meal"
- [ ] Verify size question is SKIPPED (already specified as "large")
- [ ] Answer side question for Big Mac
- [ ] Answer drink question for Big Mac
- [ ] Answer ice question for Big Mac
- [ ] Verify Big Mac meal complete
- [ ] Answer side question for McChicken
- [ ] Answer drink question for McChicken
- [ ] Answer ice question for McChicken
- [ ] Verify both meals in cart with "large" size

### Test Case 3.2: Two Incomplete Meals (No Size)
**Input**: "I want a Big Mac meal and a McChicken meal"

**Expected Behavior**:
1. ✅ Avatar: "I'll help you with both meals. Let's start with the Big Mac meal - would you like it medium or large?"
2. ✅ Ask ALL questions for Big Mac (size → side → drink → ice)
3. ✅ Avatar: "Now for the McChicken meal - medium or large?"
4. ✅ Ask ALL questions for McChicken
5. ✅ Both complete meals in cart

**Test Steps**:
- [ ] Clear cart
- [ ] Say: "I want a Big Mac meal and a McChicken meal"
- [ ] Verify size question appears for Big Mac
- [ ] Complete all 4 questions for Big Mac
- [ ] Verify size question appears for McChicken
- [ ] Complete all 4 questions for McChicken
- [ ] Verify both meals correctly added

### Test Case 3.3: Three Meals (Stress Test)
**Input**: "I want a Big Mac meal, McChicken meal, and Filet-O-Fish meal"

**Expected Behavior**:
1. ✅ Avatar acknowledges all 3 meals
2. ✅ Sequential customization: Meal 1 → Meal 2 → Meal 3
3. ✅ All 3 meals added to cart
4. ✅ No confusion or lost items

**Test Steps**:
- [ ] Clear cart
- [ ] Say: "I want a Big Mac meal, McChicken meal, and Filet-O-Fish meal"
- [ ] Complete customization for all 3 meals
- [ ] Verify all 3 in cart with correct details
- [ ] Check for any errors or skipped items

### Test Case 3.4: Two Meals with Partial Details
**Input**: "I want a large Big Mac meal with fries and a medium McChicken meal with Sprite"

**Expected Behavior**:
1. ✅ Big Mac: Size (large) + Side (fries) detected, needs drink + ice
2. ✅ McChicken: Size (medium) + Drink (Sprite) detected, needs side + ice
3. ✅ Avatar asks only missing questions for each meal
4. ✅ Big Mac questions: Drink → Ice (skip size/side)
5. ✅ McChicken questions: Side → Ice (skip size/drink)

**Test Steps**:
- [ ] Clear cart
- [ ] Say: "I want a large Big Mac meal with fries and a medium McChicken meal with Sprite"
- [ ] Verify Big Mac skips to drink question (size/side already provided)
- [ ] Answer drink for Big Mac
- [ ] Answer ice for Big Mac
- [ ] Verify McChicken skips to side question (size/drink already provided)
- [ ] Answer side for McChicken
- [ ] Answer ice for McChicken
- [ ] Verify both meals complete with correct details

---

## Edge Cases to Test

### Edge Case 1: Declining Meal Conversion (Bug Fix Verification)
**Input**: "I want a McChicken"
**Avatar**: "Would you like to make your McChicken a meal?"
**User**: "No"

**Expected**: McChicken added as SINGLE item (NOT as meal)
**Test**:
- [ ] Verify McChicken appears as single item
- [ ] Verify NO meal was added
- [ ] Bug fix verified ✅

### Edge Case 2: Interruption During Meal Customization
**Input 1**: "I want a Big Mac meal"
**Avatar**: "Would you like it medium or large?"
**Input 2**: "Actually, add an apple pie first"

**Expected**:
- [ ] Apple pie added to cart
- [ ] Avatar returns to Big Mac meal customization
- [ ] "Now, back to your Big Mac meal - medium or large?"

### Edge Case 3: Invalid Item During Meal Customization
**Input**: "I want a Big Mac meal"
**Avatar**: "What side would you like?"
**User**: "Onion rings"

**Expected**:
- [ ] Avatar: "Sorry, we don't have onion rings. We have fries, corn cup, or garden salad."
- [ ] Waits for valid side choice

---

## Testing Notes

### Issues Found:
- [ ] Issue 1:
- [ ] Issue 2:
- [ ] Issue 3:

### Successful Scenarios:
- [ ] All simple items scenarios passed
- [ ] All meal + single scenarios passed
- [ ] All multiple meals scenarios passed

### Performance Notes:
- Response time for NLP parsing: _______
- Avatar speech delay: _______
- Overall ordering smoothness: ⭐⭐⭐⭐⭐

---

## Sign-off

**Tester**: _______________
**Date**: _______________
**Status**: ⬜ PASS | ⬜ FAIL | ⬜ NEEDS FIXES

**Overall Assessment**:
```
Scenarios Tested: ___/14
Scenarios Passed: ___/14
Pass Rate: ____%
```
