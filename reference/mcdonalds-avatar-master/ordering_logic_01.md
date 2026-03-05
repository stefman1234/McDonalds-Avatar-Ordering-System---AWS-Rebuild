# Advanced Ordering Logic - Planning Document

## Overview
This document outlines the implementation strategy for advanced ordering logic that handles meal customization, multiple items, clarification questions, and edge cases to create a natural, conversational ordering experience.

---

## 1. Core Ordering Patterns

### 1.1 Single Item Ordering

#### Pattern: Simple Item
**User Input**: "I want a Big Mac"
**Flow**:
1. Add Big Mac to cart
2. Avatar: "Got it! Adding a Big Mac. Would you like anything else?"

#### Pattern: Item with Size
**User Input**: "I want a large Big Mac"
**Flow**:
1. Add large Big Mac to cart
2. Avatar: "Perfect! Adding a large Big Mac. Anything else?"

#### Pattern: Item Quantity
**User Input**: "I want two Big Macs"
**Flow**:
1. Add 2x Big Mac to cart
2. Avatar: "Sure! Adding two Big Macs. Would you like anything else?"

---

### 1.2 Meal Ordering (Single Item)

#### Pattern: Incomplete Meal Request
**User Input**: "I want a Big Mac meal"
**Flow**:
1. Detect meal intent (keyword: "meal", "combo", "with fries and drink")
2. Mark order as incomplete - needs meal details
3. Avatar: "Great choice! For your Big Mac meal, would you like it medium or large?"
4. Wait for response: "Large"
5. Avatar: "Perfect! What side would you like with that? We have fries, corn cup, or garden salad."
6. Wait for response: "Fries"
7. Avatar: "And what drink would you like? We have Coke, Sprite, Fanta, Milo, and more."
8. Wait for response: "Coke"
9. Avatar: "Would you like ice with your Coke? Full ice, less ice, or no ice?"
10. Wait for response: "Full ice"
11. Add complete meal to cart
12. Avatar: "Awesome! I've added a large Big Mac meal with fries and Coke with full ice. Anything else?"

#### Pattern: Complete Meal Request
**User Input**: "I want a large Big Mac meal with fries and a Coke"
**Flow**:
1. Detect all meal components
2. Avatar: "Would you like ice with your Coke? Full ice, less ice, or no ice?"
3. Wait for response: "Full ice"
4. Add complete meal to cart
5. Avatar: "Perfect! Adding a large Big Mac meal with fries and Coke with full ice. What else can I get you?"

#### Pattern: Meal with Partial Details
**User Input**: "I want a Big Mac meal large with Coke"
**Flow**:
1. Detected: size (large), drink (Coke)
2. Missing: side, ice level
3. Avatar: "Great! For your large Big Mac meal, what side would you like? We have fries, corn cup, or garden salad."
4. Wait for response: "Fries"
5. Avatar: "And would you like ice with your Coke? Full ice, less ice, or no ice?"
6. Wait for response: "Less ice"
7. Add complete meal to cart
8. Avatar: "Excellent! I've added a large Big Mac meal with fries and Coke with less ice. Anything else?"

---

### 1.3 Multiple Item Ordering

#### Pattern: Multiple Simple Items
**User Input**: "I want a Big Mac, a cheeseburger, and fries"
**Flow**:
1. Parse all items (3 items detected)
2. Add all items to cart
3. Avatar: "Got it! I've added a Big Mac, a cheeseburger, and fries. Would you like any of these as a meal? Meals come with a side and drink for a better value!"
4. **If user says YES**:
   - Avatar: "Great! Which item would you like as a meal?"
   - Wait for response: "Big Mac"
   - Initiate meal customization flow for Big Mac
   - After meal complete: "Perfect! You also have a cheeseburger and fries in your order. Would you like the cheeseburger as a meal too?"
5. **If user says NO**:
   - Avatar: "No problem! Anything else I can add?"

#### Pattern: Multiple Items with Meal Keyword
**User Input**: "I want a Big Mac meal and a cheeseburger"
**Flow**:
1. Parse items: Big Mac (meal), cheeseburger (single)
2. Initiate meal customization for Big Mac first
3. Avatar: "I'll help you with your Big Mac meal first. Would you like it medium or large?"
4. Complete Big Mac meal customization flow
5. Add cheeseburger as single item
6. After complete: "Great! I've added your Big Mac meal and a cheeseburger. The cheeseburger is currently a single item - would you like to make it a meal too?"
7. **If YES**: Initiate meal flow for cheeseburger
8. **If NO**: "Perfect! Anything else?"

#### Pattern: Multiple Meals
**User Input**: "I want a large Big Mac meal and a large cheeseburger meal"
**Flow**:
1. Detect 2 meals
2. Avatar: "I'll help you customize both meals. Let's start with the Big Mac meal. What side would you like?"
3. Complete Big Mac meal customization
4. Avatar: "Awesome! Now for the cheeseburger meal - what side would you like?"
5. Complete cheeseburger meal customization
6. Avatar: "Perfect! I've added both meals to your order. Anything else?"

---

## 2. State Management for Multi-Step Ordering

### 2.1 Pending Order State

**State Structure**:
```typescript
interface PendingOrder {
  type: 'single' | 'meal' | 'multiple_items' | 'multiple_meals';
  currentStep: 'meal_size' | 'meal_side' | 'meal_drink' | 'ice_level' | 'meal_conversion_offer' | 'complete';
  items: PendingOrderItem[];
  currentItemIndex: number;
  awaitingResponse: boolean;
  lastQuestion: string;
}

interface PendingOrderItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  isMeal: boolean;
  mealDetails?: {
    size?: 'medium' | 'large';
    side?: { id: string; name: string };
    drink?: { id: string; name: string };
    iceLevel?: 'none' | 'less' | 'full';
  };
  isComplete: boolean;
}
```

### 2.2 State Transitions

```
[User Orders] → Parse Intent
    ↓
[Single Item] → Add to Cart → Offer More Items
    ↓
[Meal Item] → Check Completeness
    ↓ (Incomplete)
    [Ask Meal Size] → Wait for Response
    ↓
    [Ask Side] → Wait for Response
    ↓
    [Ask Drink] → Wait for Response
    ↓
    [Ask Ice Level] → Wait for Response
    ↓
    [Complete Meal] → Add to Cart → Offer More Items
    ↓
[Multiple Items] → Add to Cart → Offer Meal Conversion
    ↓ (User accepts)
    [Select Item for Meal] → Initiate Meal Flow
    ↓
    [Process Remaining Items] → Offer Meal Conversion for Each
    ↓
    [All Items Complete] → Offer More Items
```

---

## 3. NLP Intent Recognition

### 3.1 New Intents to Recognize

```typescript
type OrderIntent =
  | 'order'              // Simple item order
  | 'order_meal'         // Meal order (explicit or implicit)
  | 'order_multiple'     // Multiple items
  | 'meal_response'      // Response to meal customization question
  | 'meal_conversion'    // User wants to convert item to meal
  | 'modify'             // Modify existing order
  | 'remove'             // Remove from cart
  | 'checkout'           // Ready to checkout
  | 'clarification'      // Response to clarification question
  | 'unclear';           // Unclear intent
```

### 3.2 Meal Detection Patterns

**Explicit Meal Keywords**:
- "meal"
- "combo"
- "with fries and drink"
- "with a side and drink"
- "make it a meal"

**Implicit Meal Patterns**:
- Burger + fries + drink mentioned together
- "I want [item] with [side] and [drink]"
- "[size] [item] meal"

**Examples**:
```
✅ "Big Mac meal" → Meal
✅ "Big Mac combo" → Meal
✅ "Big Mac with fries and Coke" → Meal
✅ "Large Big Mac meal" → Meal (size detected)
✅ "Big Mac meal with fries" → Meal (side detected)
❌ "Big Mac and fries" → NOT a meal (offer conversion)
❌ "Big Mac" → Single item
```

### 3.3 Meal Completeness Detection

**Required Fields for Meal**:
1. Main item (burger/chicken)
2. Meal size (medium/large)
3. Side (fries, corn, salad)
4. Drink (Coke, Sprite, Milo, etc.)
5. Ice level (full, less, none)

**Completeness Check**:
```typescript
function isMealComplete(meal: PendingOrderItem): boolean {
  if (!meal.isMeal) return false;

  const details = meal.mealDetails;
  return !!(
    details?.size &&
    details?.side &&
    details?.drink &&
    details?.iceLevel
  );
}
```

---

## 4. Clarification Question Logic

### 4.1 Question Priority Order

When meal details are incomplete, ask in this order:
1. **Meal Size** (if not specified)
2. **Side** (if not specified)
3. **Drink** (if not specified)
4. **Ice Level** (always ask, even if drink specified)

### 4.2 Question Templates

**Meal Size**:
- "Would you like your [item] meal medium or large?"
- "What size meal would you like - medium or large?"

**Side**:
- "What side would you like with that? We have fries, corn cup, or garden salad."
- "Which side would you prefer - fries, corn cup, or garden salad?"

**Drink**:
- "And what drink would you like? We have Coke, Sprite, Fanta, Milo, and more."
- "What drink can I get you? We have Coke, Sprite, Fanta, Milo, orange juice, and more."

**Ice Level**:
- "Would you like ice with your [drink]? Full ice, less ice, or no ice?"
- "How much ice would you like - full, less, or none?"

### 4.3 Handling Unclear Responses

**User Response**: "Yes"
**Context**: Awaiting meal size
**Avatar**: "Sorry, I need to know which size - would you like medium or large?"

**User Response**: "Small"
**Context**: Awaiting meal size (only medium/large available)
**Avatar**: "We have medium and large sizes available. Which would you prefer?"

**User Response**: "Pepsi"
**Context**: Awaiting drink (Pepsi not available)
**Avatar**: "Sorry, we don't have Pepsi. We have Coke, Sprite, Fanta, Milo, orange juice, and water. Which would you like?"

---

## 5. Meal Conversion Offers

### 5.1 When to Offer Meal Conversion

**Scenario 1: Burger + Fries + Drink Ordered Separately**
- Detect: User ordered burger, fries, and drink as separate items
- Calculate savings: Separate total vs meal total
- Offer: "I noticed you ordered [burger], fries, and [drink]. Would you like me to make that a meal? It's only $X.XX and saves you $Y.YY!"

**Scenario 2: Multiple Burgers Without Meals**
- Detect: User ordered 2+ burgers as single items
- Offer: "You have [X] burgers in your order. Would you like any of these as meals? Meals come with a side and drink for better value!"

**Scenario 3: Single Burger Only**
- Detect: User ordered 1 burger
- Offer (subtle): "Would you like to make that a meal? Comes with a side and drink for just $X.XX more."

### 5.2 Conversion Offer Timing

**Immediate Offer** (within same interaction):
- User: "I want a Big Mac, fries, and Coke"
- Avatar: "I can make that a meal for you if you'd like! It's $8.49 instead of $10.97 - save $2.48!"

**Delayed Offer** (after adding items):
- User: "I want a Big Mac"
- Avatar: "Got it! Adding a Big Mac."
- User: "And fries"
- Avatar: "Adding fries."
- User: "And a Coke"
- Avatar: "Perfect! I notice you have a Big Mac, fries, and Coke. Would you like me to make that a meal? You'd save $2.48!"

**Post-Order Offer** (in Your Order tab):
- Show visual indicator on cart items that can be combined as a meal
- Avatar can mention: "By the way, I see you have items that could be a meal in your order. You can combine them in the Your Order tab to save money!"

---

## 6. Customization Reminders

### 6.1 When to Remind About Customization

**After Adding Item to Cart**:
- Avatar: "I've added [item] to your cart. Remember, you can customize it anytime in the Your Order tab!"

**After Completing Meal**:
- Avatar: "Your [item] meal is ready! If you want to change any toppings or add special instructions, just head to the Your Order tab."

**When User Asks About Changes**:
- User: "Can I change that?"
- Avatar: "Absolutely! You can customize any item in the Your Order tab. Just tap on the item you want to change."

**When User Orders Multiple Items**:
- Avatar: "I've added all your items! If you need to customize any of them - like removing pickles or adding extra cheese - just check the Your Order tab."

### 6.2 Customization Reminder Templates

**Standard Reminder**:
- "You can customize any item in the Your Order tab!"
- "Need to change something? Head to the Your Order tab to customize your items."

**Specific Use Case**:
- "Want to remove pickles or add extra sauce? Customize in Your Order tab!"
- "You can adjust portion sizes, add toppings, or include special instructions in Your Order."

**After Error/Misunderstanding**:
- "No worries! If I got anything wrong, you can fix it in the Your Order tab."

---

## 7. Edge Cases & Error Handling

### 7.1 Interrupted Meal Customization

**Scenario**: User starts customizing meal, then orders something else mid-flow

**User Input**: "I want a Big Mac meal"
**Avatar**: "Great! Would you like it medium or large?"
**User Input**: "Actually, can I get a cheeseburger first?"

**Handling**:
1. Save incomplete meal state
2. Process new order (cheeseburger)
3. Avatar: "Got it! Adding a cheeseburger. Now, back to your Big Mac meal - would you like it medium or large?"

### 7.2 Conflicting Information

**Scenario**: User says "medium" but previously said "large"

**User Input**: "I want a large Big Mac meal"
**Avatar**: "What side would you like?"
**User Input**: "Fries, and make it medium"

**Handling**:
1. Detect contradiction (user changed size mid-customization)
2. Update meal size to medium
3. Avatar: "No problem! I've changed that to a medium Big Mac meal with fries. What drink would you like?"

### 7.3 Invalid Options

**Scenario**: User requests item not on menu for meal component

**User Input**: "I want onion rings with my meal"
**Context**: Asking for side (only fries, corn, salad available)

**Handling**:
1. Recognize intent (wants onion rings)
2. Check menu: onion rings not available
3. Avatar: "Sorry, we don't have onion rings. For sides, we have fries, corn cup, or garden salad. Which would you prefer?"

### 7.4 Multiple Pending Orders

**Scenario**: User orders multiple meals before finishing customization

**User Input**: "I want a Big Mac meal and a McChicken meal"
**Avatar**: "I'll help you with both! Let's start with the Big Mac meal - would you like it medium or large?"
**User Input**: "Large, and I also want nuggets"

**Handling**:
1. Note additional item (nuggets) while customizing meals
2. Avatar: "Got it! I'll add nuggets. Now, what side would you like with your large Big Mac meal?"
3. Continue meal flow
4. After completing both meals: "Perfect! I've also added nuggets to your order. Anything else?"

### 7.5 User Changes Mind

**Scenario**: User cancels meal mid-customization

**User Input**: "I want a Big Mac meal"
**Avatar**: "Great! Would you like it medium or large?"
**User Input**: "Actually, just the Big Mac, no meal"

**Handling**:
1. Cancel meal customization flow
2. Add single Big Mac to cart
3. Avatar: "No problem! Adding just a Big Mac. Anything else?"

### 7.6 Ambiguous Quantity

**Scenario**: Unclear if user wants multiple of same meal or different meals

**User Input**: "I want two Big Mac meals"

**Handling Option 1** (Same configuration):
1. Avatar: "Got it! Two Big Mac meals. Would you like them both the same, or customize them separately?"
2. **If "same"**: Customize once, duplicate
3. **If "separately"**: Customize each one

**Handling Option 2** (Assume same, offer customization later):
1. Avatar: "Two Big Mac meals - got it! Would you like them both medium or large?"
2. Complete single customization
3. Duplicate for second meal
4. Avatar: "I've added two identical large Big Mac meals. If you need them different, you can customize each one in the Your Order tab."

---

## 8. Conversation Flow Patterns

### 8.1 Happy Path (Single Meal)

```
User: "I want a Big Mac meal"
Avatar: "Great choice! Would you like it medium or large?"

User: "Large"
Avatar: "Perfect! What side would you like? We have fries, corn cup, or garden salad."

User: "Fries"
Avatar: "And what drink? We have Coke, Sprite, Fanta, Milo, and more."

User: "Coke"
Avatar: "Would you like ice with your Coke? Full ice, less ice, or no ice?"

User: "Full ice"
Avatar: "Awesome! I've added a large Big Mac meal with fries and Coke with full ice. Anything else?"
```

### 8.2 Complex Path (Multiple Items with Meal Conversion)

```
User: "I want a Big Mac, cheeseburger, fries, and a Coke"
Avatar: "Got it! I've added a Big Mac, cheeseburger, fries, and Coke. I notice these could be a meal - would you like me to make the Big Mac a meal? Comes with fries and a drink!"

User: "Yes"
Avatar: "Great! Your Big Mac is now a meal with fries and Coke. Would you like it medium or large?"

User: "Large"
Avatar: "Would you like ice with your Coke? Full ice, less ice, or no ice?"

User: "Less ice"
Avatar: "Perfect! You also have a cheeseburger in your cart. Would you like to make that a meal too?"

User: "No thanks"
Avatar: "No problem! Your order is: 1 large Big Mac meal with fries and Coke (less ice), and 1 cheeseburger. Anything else?"
```

### 8.3 Error Recovery Path

```
User: "I want a Big Mac meal"
Avatar: "Great! Would you like it medium or large?"

User: "Small"
Avatar: "We have medium and large sizes. Which would you prefer?"

User: "Medium"
Avatar: "Perfect! What side would you like? Fries, corn cup, or garden salad?"

User: "Onion rings"
Avatar: "Sorry, we don't have onion rings. We have fries, corn cup, or garden salad. Which would you like?"

User: "Fries"
Avatar: "Great! And what drink? Coke, Sprite, Fanta, Milo, or others?"

User: "Pepsi"
Avatar: "We don't have Pepsi, but we have Coke, Sprite, Fanta, Milo, orange juice, and water. Which would you prefer?"

User: "Coke"
Avatar: "Would you like ice? Full ice, less ice, or no ice?"

User: "Full"
Avatar: "Awesome! I've added a medium Big Mac meal with fries and Coke with full ice. Anything else?"
```

---

## 9. Implementation Strategy

### 9.1 Phase 1: State Management (Week 1)

**Tasks**:
1. Create `PendingOrderState` in AvatarContainer
2. Add state transitions for meal customization flow
3. Implement step tracking (meal_size → side → drink → ice)
4. Handle state persistence during multi-step interactions

**Files to Create/Modify**:
- `lib/state/pendingOrderManager.ts` (new)
- `components/Avatar/AvatarContainer.tsx` (modify)

### 9.2 Phase 2: NLP Enhancements (Week 1-2)

**Tasks**:
1. Add meal detection to orderProcessor
2. Enhance intent recognition (meal_response, meal_conversion)
3. Add meal completeness checking
4. Implement context-aware parsing (understanding meal customization responses)

**Files to Modify**:
- `lib/nlp/orderProcessor.ts`
- `app/api/nlp/parse-order/route.ts`

### 9.3 Phase 3: Meal Customization Flow (Week 2)

**Tasks**:
1. Implement question generation for missing meal details
2. Add response handlers for meal customization
3. Handle meal completion and cart addition
4. Implement meal conversion offers

**Files to Create/Modify**:
- `lib/ordering/mealCustomizationFlow.ts` (new)
- `components/Avatar/AvatarContainer.tsx` (modify)

### 9.4 Phase 4: Multiple Item Handling (Week 2-3)

**Tasks**:
1. Detect multiple items in single order
2. Implement sequential meal customization for multiple meals
3. Add meal conversion offers for multiple items
4. Handle interrupted flows (user adds items mid-customization)

**Files to Create/Modify**:
- `lib/ordering/multiItemHandler.ts` (new)
- `components/Avatar/AvatarContainer.tsx` (modify)

### 9.5 Phase 5: Edge Cases & Error Handling (Week 3)

**Tasks**:
1. Handle invalid options (item not available)
2. Handle contradictions (user changes mind)
3. Handle interruptions (user orders something else mid-flow)
4. Implement fallback responses for unclear inputs

**Files to Modify**:
- `lib/ordering/errorHandlers.ts` (new)
- `lib/nlp/orderProcessor.ts`

### 9.6 Phase 6: Testing & Refinement (Week 3-4)

**Tasks**:
1. Test all conversation flows
2. Test edge cases
3. Refine avatar responses for naturalness
4. Performance optimization
5. User acceptance testing

---

## 10. Technical Architecture

### 10.1 State Machine for Meal Customization

```typescript
type MealCustomizationState =
  | 'idle'
  | 'awaiting_meal_size'
  | 'awaiting_side'
  | 'awaiting_drink'
  | 'awaiting_ice_level'
  | 'meal_complete'
  | 'offer_conversion';

interface MealStateMachine {
  currentState: MealCustomizationState;
  pendingItems: PendingOrderItem[];
  currentItemIndex: number;

  // State transitions
  transition(event: MealEvent): void;

  // Get current question
  getCurrentQuestion(): string;

  // Process user response
  processResponse(userInput: string): void;

  // Complete current item
  completeCurrentItem(): void;

  // Move to next item
  nextItem(): void;
}
```

### 10.2 Meal Detection in NLP

```typescript
interface MealDetectionResult {
  isMeal: boolean;
  confidence: number;
  detectedComponents: {
    mainItem?: string;
    size?: 'medium' | 'large';
    side?: string;
    drink?: string;
    iceLevel?: 'none' | 'less' | 'full';
  };
  missingComponents: ('size' | 'side' | 'drink' | 'ice')[];
}

function detectMeal(userText: string, menuItems: any[]): MealDetectionResult {
  // Check for meal keywords
  const hasMealKeyword = /\bmeal\b|\bcombo\b|with (fries|drink|side)/i.test(userText);

  // Check for meal components
  const hasMainItem = detectMainItem(userText, menuItems);
  const hasSize = /\b(medium|large)\b/i.test(userText);
  const hasSide = /\b(fries|corn|salad)\b/i.test(userText);
  const hasDrink = /\b(coke|sprite|milo|juice)\b/i.test(userText);

  // Determine if this is a meal
  const isMeal = hasMealKeyword || (hasMainItem && (hasSide || hasDrink));

  // Return detection result
  return {
    isMeal,
    confidence: calculateConfidence(hasMealKeyword, hasMainItem, hasSide, hasDrink),
    detectedComponents: {
      mainItem: extractMainItem(userText, menuItems),
      size: extractSize(userText),
      side: extractSide(userText, menuItems),
      drink: extractDrink(userText, menuItems),
      iceLevel: extractIceLevel(userText),
    },
    missingComponents: determineMissingComponents(/*...*/),
  };
}
```

### 10.3 Question Generator

```typescript
interface QuestionGenerator {
  generateMealSizeQuestion(itemName: string): string;
  generateSideQuestion(): string;
  generateDrinkQuestion(): string;
  generateIceLevelQuestion(drinkName: string): string;
  generateMealConversionOffer(items: CartItem[], savings: number): string;
}

class AvatarQuestionGenerator implements QuestionGenerator {
  generateMealSizeQuestion(itemName: string): string {
    const templates = [
      `Would you like your ${itemName} meal medium or large?`,
      `What size meal would you prefer - medium or large?`,
      `Medium or large ${itemName} meal?`,
    ];
    return this.selectRandom(templates);
  }

  generateSideQuestion(): string {
    const templates = [
      "What side would you like with that? We have fries, corn cup, or garden salad.",
      "Which side would you prefer - fries, corn cup, or garden salad?",
      "Fries, corn cup, or garden salad for your side?",
    ];
    return this.selectRandom(templates);
  }

  // ... more methods
}
```

---

## 11. Success Metrics

### 11.1 Key Performance Indicators (KPIs)

1. **Meal Completion Rate**: % of meal orders successfully completed without user frustration
   - Target: >90%

2. **Meal Conversion Rate**: % of eligible orders converted to meals
   - Target: >40%

3. **Average Questions Per Meal**: Number of clarification questions needed
   - Target: <5 questions

4. **Error Recovery Rate**: % of errors successfully recovered
   - Target: >85%

5. **User Satisfaction**: Based on completed orders vs abandoned mid-flow
   - Target: >80% completion rate

### 11.2 Testing Scenarios

**Test Case 1**: Single incomplete meal
- Input: "I want a Big Mac meal"
- Expected: Ask 4-5 questions, complete meal, add to cart

**Test Case 2**: Multiple items without meals
- Input: "I want a Big Mac, cheeseburger, and fries"
- Expected: Add items, offer meal conversion

**Test Case 3**: Multiple meals
- Input: "I want a Big Mac meal and a McChicken meal"
- Expected: Customize both meals sequentially

**Test Case 4**: Interrupted customization
- Input 1: "I want a Big Mac meal"
- Avatar: "Would you like it medium or large?"
- Input 2: "Actually, add nuggets first"
- Expected: Add nuggets, return to meal customization

**Test Case 5**: Invalid options
- Input: "I want a Big Mac meal with onion rings"
- Expected: Politely inform unavailable, offer alternatives

**Test Case 6**: Contradictory info
- Input: "I want a large Big Mac meal with fries"
- Avatar: "What drink would you like?"
- Input: "Coke, and make it medium"
- Expected: Update to medium, continue with Coke

---

## 12. Future Enhancements

### 12.1 Machine Learning Integration

- Learn user preferences over time
- Predict meal choices based on history
- Personalized suggestions ("Last time you got fries, want them again?")

### 12.2 Voice Optimization

- Reduce number of questions for returning customers
- "Your usual?" for repeat orders
- Skip ice question if user always chooses same ice level

### 12.3 Upselling Intelligence

- Smart upselling based on cart contents
- "Most people add [item] with that order"
- "Popular combo: [suggestion]"

### 12.4 Multi-Language Support

- Support for Malay language ordering
- Code-switching handling (Bahasa Melayu + English mix)
- "Saya nak Big Mac meal" → Recognize and process

---

## 13. Implementation Checklist

### Phase 1: Foundation
- [ ] Create PendingOrderState interface and manager
- [ ] Implement state machine for meal customization
- [ ] Add meal detection to NLP processor
- [ ] Create question generator utility

### Phase 2: Basic Meal Flow
- [ ] Implement single meal customization flow
- [ ] Handle meal size question
- [ ] Handle side selection question
- [ ] Handle drink selection question
- [ ] Handle ice level question
- [ ] Add complete meal to cart

### Phase 3: Multiple Items
- [ ] Detect multiple items in single order
- [ ] Implement sequential meal customization
- [ ] Add meal conversion offers
- [ ] Handle interrupted flows

### Phase 4: Edge Cases
- [ ] Handle invalid options
- [ ] Handle contradictions
- [ ] Handle user changing mind mid-flow
- [ ] Implement error recovery
- [ ] Add fallback responses

### Phase 5: Polish & Test
- [ ] Test all conversation flows
- [ ] Refine avatar responses
- [ ] Add customization reminders
- [ ] Performance optimization
- [ ] User acceptance testing

---

## 14. Example Conversations

### Example 1: Perfect Flow

```
User: "I want a Big Mac meal"
Avatar: "Great choice! Would you like it medium or large?"
User: "Large"
Avatar: "Perfect! What side would you like? Fries, corn cup, or garden salad?"
User: "Fries"
Avatar: "And what drink? Coke, Sprite, Fanta, Milo, or others?"
User: "Coke"
Avatar: "Would you like ice? Full ice, less ice, or no ice?"
User: "Full ice"
Avatar: "Awesome! I've added a large Big Mac meal with fries and Coke with full ice ($8.49). Anything else?"
```

### Example 2: Complex Multi-Item

```
User: "I want a Big Mac meal, a McChicken meal, and nuggets"
Avatar: "Got it! I'll help you customize both meals. Let's start with the Big Mac meal - would you like it medium or large?"
User: "Large"
Avatar: "What side? Fries, corn, or salad?"
User: "Fries"
Avatar: "And what drink?"
User: "Coke"
Avatar: "Ice level? Full, less, or none?"
User: "Full"
Avatar: "Perfect! Now for the McChicken meal - medium or large?"
User: "Medium"
Avatar: "Side?"
User: "Corn"
Avatar: "Drink?"
User: "Sprite"
Avatar: "Ice?"
User: "Less ice"
Avatar: "Excellent! I've added a large Big Mac meal with fries and Coke (full ice), a medium McChicken meal with corn and Sprite (less ice), plus nuggets. What size nuggets - 4, 6, 9, or 20 piece?"
User: "6 piece"
Avatar: "Perfect! All set. Anything else?"
```

### Example 3: Meal Conversion Offer

```
User: "I want a Big Mac, fries, and a Coke"
Avatar: "I can make that a meal for you! It's $8.49 instead of $10.97 - you'd save $2.48. Would you like that?"
User: "Yes please"
Avatar: "Great! What size meal - medium or large?"
User: "Large"
Avatar: "Would you like ice with your Coke? Full, less, or none?"
User: "Full"
Avatar: "Perfect! I've converted that to a large Big Mac meal with fries and Coke with full ice. Saved you $2.48! Anything else?"
```

### Example 4: Error Recovery

```
User: "I want a Big Mac meal with onion rings and Pepsi"
Avatar: "I'd love to help! Just to let you know - we don't have onion rings or Pepsi. For sides, we have fries, corn cup, or garden salad. For drinks, we have Coke, Sprite, Fanta, Milo, and more. What would you like instead?"
User: "Fries and Coke"
Avatar: "Perfect! What size meal - medium or large?"
User: "Large"
Avatar: "Would you like ice with your Coke? Full, less, or none?"
User: "Full"
Avatar: "Awesome! Large Big Mac meal with fries and Coke with full ice. Anything else?"
```

---

## Conclusion

This advanced ordering logic provides a natural, conversational ordering experience that:
- Handles incomplete meal orders intelligently
- Offers meal conversions to increase average order value
- Manages multiple items and complex orders
- Recovers gracefully from errors and ambiguity
- Reminds users about customization options
- Scales to handle edge cases

Implementation will be phased over 3-4 weeks, with continuous testing and refinement based on real user interactions.
