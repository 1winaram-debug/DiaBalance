/**
 * DiaBalance — Touch-Friendly Drag-and-Drop for menu.html
 * Adds full touch support to food-card → meal-slot transfers.
 * Falls back gracefully on desktop (mouse DnD still works).
 *
 * Strategy:
 *  - On touchstart, record which food card was touched
 *  - On touchmove, move a visual "ghost" element under the finger
 *  - On touchend, detect which meal-slot is under the finger and call
 *    the existing addFoodToMeal() function
 *  - Also enhances the tap-to-add buttons (already functional via onclick)
 *    with visual ripple feedback for a polished mobile experience
 */
(function () {
  'use strict';

  /* ── Ghost element for visual drag feedback ── */
  let ghost = null;
  let activeFoodCard = null;
  let activeFoodId   = null;

  function createGhost(card, x, y) {
    ghost = card.cloneNode(true);
    ghost.id = 'touch-ghost';
    ghost.style.cssText = `
      position: fixed;
      left: ${x - 20}px;
      top:  ${y - 20}px;
      width: ${card.offsetWidth}px;
      opacity: 0.82;
      pointer-events: none;
      z-index: 9999;
      transform: scale(1.03);
      border: 2px solid #0cbfb0;
      border-radius: 14px;
      background: rgba(208,245,242,0.95);
      box-shadow: 0 12px 30px rgba(12,191,176,0.35);
      transition: transform 0.1s;
    `;
    // Remove add buttons from ghost to keep it clean
    ghost.querySelectorAll('.add-btns-row').forEach(el => el.remove());
    document.body.appendChild(ghost);
  }

  function moveGhost(x, y) {
    if (!ghost) return;
    ghost.style.left = `${x - ghost.offsetWidth / 2}px`;
    ghost.style.top  = `${y - 30}px`;
  }

  function removeGhost() {
    if (ghost) { ghost.remove(); ghost = null; }
  }

  /* ── Highlight drop zones ── */
  function highlightSlotAt(x, y) {
    document.querySelectorAll('.meal-slot').forEach(slot => {
      slot.classList.remove('drag-over');
    });
    const el = getSlotAt(x, y);
    if (el) el.classList.add('drag-over');
  }

  function clearSlotHighlights() {
    document.querySelectorAll('.meal-slot').forEach(s => s.classList.remove('drag-over'));
  }

  function getSlotAt(x, y) {
    // Temporarily hide ghost so elementFromPoint sees what's beneath
    if (ghost) ghost.style.display = 'none';
    const el = document.elementFromPoint(x, y);
    if (ghost) ghost.style.display = '';
    if (!el) return null;
    return el.closest('.meal-slot');
  }

  /* ── Ripple effect on add-btn tap ── */
  function addRipple(btn) {
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute; border-radius: 50%;
      background: rgba(12,191,176,0.35);
      width: 60px; height: 60px;
      margin-top: -30px; margin-left: -30px;
      top: 50%; left: 50%;
      animation: rippleAnim 0.5s linear;
      pointer-events: none;
    `;
    if (!ripple.style.animation) {
      ripple.style.transition = 'transform 0.5s, opacity 0.5s';
      ripple.style.transform = 'scale(3)';
      ripple.style.opacity = '0';
    }
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  /* Inject ripple keyframes */
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rippleAnim {
      from { transform: scale(0); opacity: 1; }
      to   { transform: scale(4); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  /* ── Attach touch events to all food cards ── */
  function attachTouchDnD() {
    const foodList = document.getElementById('food-list');
    if (!foodList) return;

    // Use event delegation so dynamically re-rendered cards also work
    foodList.addEventListener('touchstart', onTouchStart, { passive: true });
    foodList.addEventListener('touchmove',  onTouchMove,  { passive: false });
    foodList.addEventListener('touchend',   onTouchEnd,   { passive: true });

    // Ripple on add buttons
    foodList.addEventListener('click', e => {
      const btn = e.target.closest('.add-btn');
      if (btn) addRipple(btn);
    });
  }

  function onTouchStart(e) {
    const card = e.target.closest('.food-card');
    if (!card) return;
    activeFoodCard = card;
    activeFoodId   = parseInt(card.dataset.foodId);
    if (!activeFoodId) return; // no data-food-id means tap on an add-btn
    const t = e.changedTouches[0];
    createGhost(card, t.clientX, t.clientY);
    card.style.opacity = '0.45';
  }

  function onTouchMove(e) {
    if (!ghost) return;
    e.preventDefault(); // prevent page scroll during drag
    const t = e.changedTouches[0];
    moveGhost(t.clientX, t.clientY);
    highlightSlotAt(t.clientX, t.clientY);
  }

  function onTouchEnd(e) {
    if (!ghost) { activeFoodCard = null; activeFoodId = null; return; }
    const t = e.changedTouches[0];
    const slot = getSlotAt(t.clientX, t.clientY);

    removeGhost();
    clearSlotHighlights();

    if (activeFoodCard) { activeFoodCard.style.opacity = ''; }

    if (slot && activeFoodId && typeof addFoodToMeal === 'function') {
      const mealKey = slot.dataset.meal;
      const foodDb  = typeof FOOD_DB !== 'undefined' ? FOOD_DB : [];
      const food    = foodDb.find(f => f.id === activeFoodId);
      if (food && mealKey) addFoodToMeal(food, mealKey);
    }

    activeFoodCard = null;
    activeFoodId   = null;
  }

  /* ── Patch renderFoodList to inject data-food-id attributes ── */
  // We need to wrap the original renderFoodList so each card gets the id
  window.addEventListener('load', () => {
    const originalRenderFoodList = window.renderFoodList;
    if (typeof originalRenderFoodList === 'function') {
      window.renderFoodList = function (...args) {
        originalRenderFoodList.apply(this, args);
        // After render, stamp data-food-id on every card
        document.querySelectorAll('.food-card[draggable]').forEach((card, i) => {
          // The cards are in the same order as filteredFoods — match by index
          // But safer: get food id from the add-btn data-meal sibling
          const firstAddBtn = card.querySelector('.add-btn');
          if (firstAddBtn && firstAddBtn.dataset.foodId) {
            card.dataset.foodId = firstAddBtn.dataset.foodId;
          }
        });
        // stamp meal-slot data-meal
        document.querySelectorAll('.meal-slot').forEach(slot => {
          const header = slot.querySelector('.meal-slot-header');
          if (header && !slot.dataset.meal) {
            // infer from slotDiv dataset set during renderMealSlots
          }
        });
      };
    }

    /* Patch renderFoodList to add data-food-id to add-btns */
    /* Since we can't easily hook into the closure, we use MutationObserver */
    const observer = new MutationObserver(() => {
      document.querySelectorAll('.food-card').forEach(card => {
        const btns = card.querySelectorAll('.add-btn');
        // Food id is in the first btn's parent — we stored it via ondragstart
        // Read it from the card's drag handler context using data
        if (!card.dataset.foodId) {
          const titleEl = card.querySelector('.food-title');
          if (titleEl) {
            const title = titleEl.textContent.trim();
            const foodDb = typeof FOOD_DB !== 'undefined' ? FOOD_DB : [];
            const match = foodDb.find(f => f.title === title);
            if (match) card.dataset.foodId = match.id;
          }
        }
      });

      // Stamp meal-slot data-meal from rendered content
      document.querySelectorAll('.meal-slot').forEach(slot => {
        if (!slot.dataset.meal) {
          const header = slot.querySelector('.meal-slot-header');
          if (header) {
            const text = header.textContent.trim();
            const mealMap = {
              'Նախաճաշ':'breakfast', 'Ճաշ':'lunch',
              'Ընթրիք':'dinner', 'Միջանկյալ':'snacks'
            };
            Object.entries(mealMap).forEach(([hy, en]) => {
              if (text.includes(hy)) slot.dataset.meal = en;
            });
          }
        }
      });
    });

    const foodList = document.getElementById('food-list');
    const mealSlots = document.getElementById('meal-slots');
    if (foodList)  observer.observe(foodList,  { childList: true, subtree: true });
    if (mealSlots) observer.observe(mealSlots, { childList: true, subtree: true });

    attachTouchDnD();
  });
})();
