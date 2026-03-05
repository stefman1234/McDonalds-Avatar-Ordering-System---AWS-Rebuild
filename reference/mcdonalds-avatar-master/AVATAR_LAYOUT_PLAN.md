# Avatar Layout Plan - Theater Mode with Bottom Carousel

**Decision:** Option 1 - Theater Mode with Bottom Carousel
**Date:** 2025-11-11
**Status:** Approved

---

## Layout Architecture

### Screen Division

```
┌─────────────────────────────────────────────────┐
│  [Back] [🏠 McDonald's]           [🛒 Cart (3)] │ 5%
├─────────────────────────────────────────────────┤
│                                                 │
│                                                 │
│              AVATAR ZONE (65%)                  │
│        [Klleon Avatar Rendering]                │
│                                                 │
│          "Hi! What can I get you?"              │
│                                                 │
├─────────────────────────────────────────────────┤
│  🍔  🍗  🥞  🍟  🥤  🍦  🎁  [Browse All]        │ 3%
│                                                 │
│  ◄  [Item] [Item] [Item] [Item] [Item]  ►      │ 27%
│      Horizontal Swipeable Carousel              │
└─────────────────────────────────────────────────┘
```

### Percentages:
- **Header**: 5% (navigation, cart button, logo)
- **Avatar Zone**: 65% (Klleon avatar, speech visualization, subtitles)
- **Category Tabs**: 3% (sticky category selector)
- **Menu Carousel**: 27% (horizontal scrolling item cards)

---

## Component Breakdown

### 1. Main Ordering Page (`app/page.tsx`)
- **Layout**: Split screen (65/35 avatar-to-menu ratio)
- **Avatar Container**: Top section with Klleon SDK
- **Carousel Section**: Bottom section with menu items
- **Modes**:
  - Voice Mode (default): Avatar + Carousel
  - Browse Mode: Click "Browse All" → Navigate to `/menu`

### 2. Avatar Zone (`components/Avatar/`)
- **AvatarContainer.tsx**: Klleon SDK initialization
- **SpeechVisualizer.tsx**: Animated waveform during speaking/listening
- **Subtitles.tsx**: Real-time speech text display
- **Features**:
  - Full-width, centered avatar
  - Subtle glow effect during active states
  - Greeting on load: "Hey! Welcome to McDonald's! What can I get you?"

### 3. Menu Carousel (`components/Menu/MenuCarousel.tsx`)
- **Layout**: Horizontal scrollable row
- **Visible Items**: 3-4 cards at once (based on screen size)
- **Navigation**:
  - Swipe gestures (touch/mouse)
  - Arrow buttons (← →)
  - Auto-scroll when avatar mentions items
- **Card Size**: 200-250px wide
- **Features**:
  - Snap-to-grid scrolling
  - Smooth momentum scrolling
  - Category-based filtering

### 4. Category Tabs (Updated)
- **Position**: Sticky above carousel
- **Style**: Compact icon + label pills
- **Categories**: 🍔 Burgers, 🍗 Chicken, 🥞 Breakfast, 🍟 Sides, 🥤 Drinks, 🍦 Desserts, 🎁 Happy Meal
- **Special**: "Browse All" button → Navigate to `/menu` page

### 5. Cart Integration
- **Position**: Fixed top-right corner
- **Visibility**: Always visible, floats above avatar
- **Badge**: Item count in yellow circle
- **Drawer**: Slides from right (existing implementation)

---

## Interaction Flows

### Flow 1: Voice-First Ordering
```
1. Avatar greets user
2. User speaks: "I want a Big Mac"
3. Avatar processes speech (STT via Klleon)
4. NLP parses order
5. Carousel auto-scrolls to show Big Mac
6. Big Mac card highlights briefly
7. Avatar confirms: "Got it! One Big Mac. Anything else?"
8. Item added to cart (badge updates)
```

### Flow 2: Visual Browsing
```
1. User swipes carousel or uses category tabs
2. User taps item card
3. Item modal appears with customization options
4. User selects options and taps "Add to Order"
5. Avatar confirms: "Added to your order!"
6. Item added to cart
```

### Flow 3: Hybrid (Voice + Visual)
```
1. User speaks: "I want chicken nuggets"
2. Avatar: "We have 4, 6, 10, and 20 piece. Which size?"
3. Carousel shows all McNuggets options
4. User taps "10 Piece McNuggets"
5. Avatar: "Perfect! 10 piece nuggets. Anything else?"
```

### Flow 4: Browse Mode Switch
```
1. User taps "Browse All" button in category tabs
2. Navigate to /menu page
3. Shows full grid view (existing implementation)
4. Cart button still visible and functional
5. "Back to Order" button returns to avatar mode
```

---

## Responsive Behavior

### Desktop/Kiosk (1920x1080)
- Avatar: 65% = ~700px height
- Carousel: 27% = ~290px height
- 4 items visible in carousel
- Large, prominent avatar

### Tablet (1024x768)
- Avatar: 60% = ~460px height
- Carousel: 32% = ~245px height
- 3 items visible in carousel
- Slightly smaller avatar

### Mobile (375x667) - Vertical
- Avatar: 55% = ~367px height
- Carousel: 35% = ~233px height
- 1.5 items visible in carousel (scroll encouraged)
- Category tabs scroll horizontally

---

## Avatar-Carousel Synchronization

### When Avatar Mentions Items:
1. NLP detects mentioned item: "Big Mac"
2. Carousel automatically scrolls to Big Mac card
3. Big Mac card gets temporary highlight (2s glow)
4. User can tap highlighted card or continue speaking

### When User Selects from Carousel:
1. User taps "Quarter Pounder"
2. Event sent to avatar system
3. Avatar responds contextually: "Great choice! Quarter Pounder. What size?"
4. Modal opens for customization

### Conversation Context:
- Cart state always visible to avatar
- Avatar can reference items: "Want to make that combo a meal?"
- Carousel updates based on conversation stage

---

## Changes to Existing Code

### ✅ No Changes Needed (Safe to Keep):
1. **Cart Store** (`store/cart.ts`) - Works perfectly as-is
2. **Cart Components** (`components/Cart/*`) - Fully functional
3. **Menu API** (`app/api/menu/*`) - Backend stays same
4. **MenuCard Component** (`components/Menu/MenuCard.tsx`) - Reusable in carousel
5. **CategoryFilter Component** (`components/Menu/CategoryFilter.tsx`) - Just needs restyling

### 🔧 Modifications Needed:
1. **app/page.tsx**: Currently doesn't exist
   - **Action**: Create new home page with theater mode layout

2. **app/menu/page.tsx**: Full grid menu
   - **Action**: Keep as "Browse Mode" alternative
   - **Add**: "Back to Order" button to return to avatar

3. **CategoryFilter**: Currently horizontal tabs
   - **Action**: Make more compact, add "Browse All" button

### 🆕 New Components Needed:
1. **components/Avatar/AvatarContainer.tsx** - Klleon integration
2. **components/Avatar/AvatarZone.tsx** - Top section layout
3. **components/Menu/MenuCarousel.tsx** - Horizontal scrolling
4. **components/Menu/CarouselItem.tsx** - Compact card for carousel
5. **app/page.tsx** - Main ordering page with theater layout

---

## Implementation Priority

### Phase 4 (Next): Avatar Integration
1. **Phase 4.1**: Create AvatarContainer skeleton
2. **Phase 4.2**: Integrate Klleon SDK
3. **Phase 4.3**: Create MenuCarousel component
4. **Phase 4.4**: Build main theater mode page (app/page.tsx)
5. **Phase 4.5**: Synchronize avatar with carousel

### Phase 5: NLP Integration
- Connect voice input to carousel highlighting
- Implement auto-scroll on item mention
- Add visual feedback during speech processing

---

## Technical Specifications

### Carousel Performance:
- **Library**: Use `react-scroll-horizontal` or custom with `IntersectionObserver`
- **Optimization**: Virtual scrolling for 50+ items
- **Animation**: CSS `scroll-snap-type: x mandatory`
- **Touch**: Native touch scrolling + custom gestures

### Avatar Zone:
- **Container**: `position: relative` with aspect ratio lock
- **Klleon**: Render in full container bounds
- **Overflow**: Hidden to prevent avatar clipping
- **Background**: Subtle McDonald's gradient

### State Management:
- **Current Item**: Track which item is centered in carousel
- **Scroll Position**: Persist on tab/category changes
- **Avatar State**: Loading/Ready/Speaking/Listening
- **Sync**: Bidirectional communication between avatar and carousel

---

## Design Specifications

### Colors:
- **Avatar Zone Background**: `linear-gradient(135deg, #DA291C 0%, #C41E3A 100%)`
- **Carousel Background**: `#FFFFFF`
- **Category Tabs**: `#F5F5F5` inactive, `#DA291C` active
- **Highlighted Item**: Yellow glow `box-shadow: 0 0 20px #FFC72C`

### Typography:
- **Avatar Subtitles**: `font-size: 24px`, white text with shadow
- **Carousel Items**: `font-size: 16px`, bold names
- **Category Tabs**: `font-size: 14px`, uppercase

### Spacing:
- **Avatar to Carousel Gap**: `0px` (seamless)
- **Carousel Padding**: `16px` horizontal
- **Item Gap**: `12px` between cards
- **Category Tab Padding**: `8px 16px`

---

## User Testing Scenarios

### Test 1: Pure Voice Ordering
1. User speaks entire order
2. Avatar confirms each item
3. Items appear in cart
4. User speaks "checkout"
5. Navigate to checkout page

### Test 2: Pure Visual Ordering
1. User browses carousel
2. Taps items to add
3. Uses category tabs
4. Never speaks
5. Completes order visually

### Test 3: Hybrid Ordering
1. User speaks "Big Mac meal"
2. Carousel shows Big Mac Meal combo
3. User taps to customize
4. Adds extra item visually
5. Speaks "that's all" to checkout

---

## Accessibility

### Voice Users:
- All carousel items reachable via voice
- Avatar can list items: "We have burgers, chicken, breakfast..."
- Can complete order 100% by voice

### Visual Users:
- Carousel fully functional without voice
- Clear visual feedback
- Touch/mouse/keyboard navigation

### Screen Readers:
- Avatar zone labeled as "ordering assistant"
- Carousel items properly labeled
- ARIA landmarks for navigation

---

## Future Enhancements

### Phase 2 Features:
1. **Avatar Gestures**: Point at carousel items
2. **Personalization**: "Welcome back! Same order as last time?"
3. **Upsells**: Avatar suggests items based on cart
4. **Analytics**: Track voice vs visual preference
5. **A/B Testing**: Different avatar personalities

### Optional Modes:
1. **Kids Mode**: Simplified UI, fun avatar personality
2. **Express Mode**: Favorites carousel for repeat customers
3. **Drive-Thru Mode**: Voice-only with larger confirmation screen

---

## Success Metrics

### User Engagement:
- **Voice Adoption**: >50% of users try voice input
- **Completion Rate**: >95% of started orders complete
- **Average Order Time**: <90 seconds
- **Carousel Interaction**: >70% users interact with carousel

### Technical Performance:
- **Avatar Load Time**: <2 seconds
- **Carousel Scroll FPS**: 60fps
- **Voice Processing**: <1 second latency
- **Cart Sync**: Real-time (<100ms)

---

**Document Status**: Approved and Ready for Implementation
**Next Action**: Begin Phase 4.1 - Create AvatarContainer skeleton
**Owner**: Development Team
**Last Updated**: 2025-11-11
