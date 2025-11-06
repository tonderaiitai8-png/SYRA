# AI-Enhanced Restaurant Ordering - Testing Plan

## Test Information
**Website Type**: SPA (Single Page Application)
**Deployed URL**: https://yah5rahrzqd7.space.minimax.io
**Test Date**: 2025-11-06
**Focus**: Safety-First Allergy Management & AI Intelligence

## Critical AI Features to Test

### Priority 1: Allergy Safety (CRITICAL)
- [ ] AI asks about allergies in first interaction
- [ ] AI validates all recommendations against allergies
- [ ] AI provides cross-contamination warnings
- [ ] AI offers safe alternatives for restricted items
- [ ] Cart validation prevents allergen items

### Priority 2: Contextual Intelligence
- [ ] Time-based greetings (morning/afternoon/evening)
- [ ] Smart pairing suggestions based on cart content
- [ ] Weather-aware recommendations
- [ ] Day-of-week awareness (weekend suggestions)

### Priority 3: Enhanced Conversation
- [ ] Ingredient explanations on request
- [ ] Smart menu search (spicy, healthy, under £10)
- [ ] Meal completion suggestions
- [ ] Pattern recognition in orders

### Priority 4: Core Functionality (Existing)
- [ ] Add items to cart
- [ ] Remove items from cart
- [ ] Meal deal creation
- [ ] Checkout process
- [ ] Payment integration

## Testing Progress

### Step 1: Pre-Test Planning
- Website complexity: Simple SPA with advanced AI
- Test strategy: Focus on allergy safety first, then contextual features

### Step 2: Comprehensive Testing
**Status**: Ready to start

### Step 3: Coverage Validation
- [ ] All AI safety features tested
- [ ] Contextual awareness tested
- [ ] Core ordering flow tested
- [ ] Edge cases validated

### Step 4: Fixes & Re-testing
**Bugs Found**: TBD

## Test Scenarios

### Scenario 1: Allergy Safety (Most Critical)
1. Start conversation → Should ask about allergies
2. Mention "dairy allergy" → All suggestions should be dairy-free
3. Ask for burger → Should warn about cheese, offer alternatives
4. Try to order cheesy chips → Should prevent or warn strongly

### Scenario 2: Time-Based Intelligence
1. Test during different times → Check greeting changes
2. Check meal suggestions match time of day
3. Validate weekend suggestions

### Scenario 3: Smart Pairing
1. Add burger to cart → Should suggest drink/fries
2. Add multiple items → Should suggest dessert
3. Missing drink → Should notice and recommend

### Scenario 4: Conversational Intelligence
1. Ask "what's spicy?" → Should filter menu
2. Ask "under £10" → Should show budget options
3. Request ingredient info → Should explain
4. Test meal search → Should understand natural language
