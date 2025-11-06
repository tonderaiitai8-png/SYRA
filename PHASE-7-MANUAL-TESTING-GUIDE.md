# Phase 7 Manual Testing Guide
**Test URL:** https://wjd0z1tkn9xk.space.minimax.io

## 🎯 **Priority 1: Cart Remove Button Testing**

### Steps:
1. **Add Items to Cart**
   - Open the menu
   - Add 3-4 different items (e.g., cheeseburger, fries, drink, ice cream)

2. **Verify Remove Buttons**
   - Open the cart panel
   - **✅ EXPECTED:** Each cart item should have a red "Remove" button in the top-right corner
   - **✅ EXPECTED:** Buttons should be clearly visible and clickable

3. **Test Remove Functionality**
   - Click remove button on first item
   - **✅ EXPECTED:** Item should be removed smoothly
   - **✅ EXPECTED:** Total price should update
   - **✅ EXPECTED:** Success toast should appear
   - **✅ EXPECTED:** Cart should stay open (if it was open)

4. **Test Multiple Removes**
   - Add more items back
   - Test removing 2-3 items in sequence
   - **✅ EXPECTED:** All removals work without errors

## 🎯 **Priority 2: Smart AI Recommendations**

### Test 1: Time-Based Filtering
1. **Set time context (if possible)**
   - Ask AI: "I want breakfast"
   - **✅ EXPECTED:** AI should acknowledge that breakfast options are limited early in the day
   - **✅ EXPECTED:** AI should suggest lighter alternatives if it's before 11 AM

### Test 2: Smart Upselling
1. **Add Cheeseburger to Order**
   - Add a cheeseburger to cart

2. **Ask AI for Recommendations**
   - "What would you recommend to add to my order?"
   - **✅ EXPECTED:** AI should suggest "Cheesy Chips for just £2 more!" as a smart pairing

3. **Test Other Pairings**
   - Add spicy item → Should suggest cold drinks
   - Add regular meal → Should suggest combo upgrades
   - **✅ EXPECTED:** Contextually relevant suggestions

## 🎯 **Priority 3: Order Flow Testing**

### Complete Order Test:
1. **Menu Navigation**
   - **✅ EXPECTED:** Menu opens without crashes (previous fix working)

2. **Add Items Systematically**
   - Add main item, side, drink
   - **✅ EXPECTED:** Each addition works smoothly

3. **Cart Management**
   - Remove items using new buttons
   - Adjust quantities if possible
   - **✅ EXPECTED:** All cart functions work without errors

4. **Checkout Process**
   - Proceed to checkout
   - **✅ EXPECTED:** Professional, clean checkout interface

5. **Payment Flow**
   - Complete order through Stripe
   - **✅ EXPECTED:** Redirects properly
   - **✅ EXPECTED:** Confirmation screen appears

## 🎯 **Priority 4: Order Confirmation Screen**

### What to Expect:
- **✅ EXPECTED:** Beautiful confirmation screen after payment
- **✅ EXPECTED:** Order summary with items and total
- **✅ EXPECTED:** Delivery time estimate
- **✅ EXPECTED:** Professional design with confetti or similar animation
- **✅ EXPECTED:** "Check your email for updates" message
- **✅ EXPECTED:** Clear next steps information

## 🎯 **Priority 5: Mobile Responsiveness**

### Mobile Test:
1. **Switch to Mobile View**
   - Use browser dev tools or test on actual phone
   - **✅ EXPECTED:** All features work on mobile
   - **✅ EXPECTED:** Remove buttons are touch-friendly
   - **✅ EXPECTED:** AI chat works on mobile
   - **✅ EXPECTED:** Order flow is smooth

## 🔍 **Error Checking**

### Red Flags to Watch For:
- ❌ Any crashes when opening menu
- ❌ Remove buttons not appearing
- ❌ AI giving irrelevant recommendations
- ❌ Cart state not persisting properly
- ❌ Payment process not working
- ❌ Mobile layout issues

## 📊 **Testing Results Format**

Please report back with:
- ✅ **PASS** or ❌ **FAIL** for each major feature
- **Issues Found** (if any)
- **Overall UX Rating** (1-10)
- **Anything that impressed you** (new features working well)

## 🚀 **Expected Improvements from Phase 7**

1. **Better Order Flow:** More intuitive meal deal process
2. **Smart Cart:** Easy item removal with visual feedback
3. **Intelligent AI:** Contextual recommendations based on order and time
4. **Professional Completion:** Beautiful order confirmation
5. **Mobile Optimized:** Works seamlessly on all devices

---

**Test Duration:** ~10-15 minutes for comprehensive testing
**Priority:** Focus on cart remove buttons and AI smart recommendations first, as these are the biggest improvements.
