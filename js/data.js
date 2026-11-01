/* ==========================================================================
   Icyblast Bistro — ALL editable business content lives here.
   Edit this file (not shared/js/main.js) to change contact details, fees,
   categories, menu items and prices.

   IMPORTANT: no Icyblast prices have been supplied yet.
   - price: number     -> a real, confirmed price (none yet)
   - price: null       -> "Price to be confirmed" and excluded from totals
   - demoPrice: number -> a placeholder so the cart can demonstrate its maths.
                          Always shown with a "Demo price" label. Replace with
                          `price: <real amount>` once the owner confirms, then
                          delete the demoPrice and the flag.
   ========================================================================== */
window.RD_DATA = (function () {
  'use strict';

  const CONFIG = {
    demoMode: true,
    currencySymbol: '₦',
    deliveryFee: null,     // null = "to be confirmed". Set a number to charge a fee.
    brand: {
      key: 'icyblast',
      name: 'Icyblast Bistro',
      tagline: 'Loaded. Stacked. Ice cold.',   // placeholder copy, not an official slogan
      tiktok: 'https://www.tiktok.com/@icyblastbistro',
      tiktokHandle: '@icyblastbistro',
      instagram: 'https://www.instagram.com/icyblastbistro/',
      instagramHandle: '@icyblastbistro'
    },
    // Only rendered when set. Never invent these.
    contact: { phone: null, whatsapp: null, email: null, address: null, mapUrl: null }
  };

  const CATEGORIES = [
    { id: 'platters',  label: 'Signature Platters', icon: 'bi-layers' },
    { id: 'burgers',   label: 'Burgers & Fries',    icon: 'bi-egg-fried' },
    { id: 'loaded',    label: 'Loaded Fries',       icon: 'bi-basket2' },
    { id: 'chicken',   label: 'Chicken & Chips',    icon: 'bi-basket' },
    { id: 'shawarma',  label: 'Shawarma',           icon: 'bi-box-seam' },
    { id: 'shakes',    label: 'Milkshakes',         icon: 'bi-cup-straw' },
    { id: 'cocktails', label: 'Cocktails',          icon: 'bi-cup' }
  ];

  const ITEMS = [
    /* Signature Platters */
    { id: 'icy-family-tower', cat: 'platters', name: 'The Family Tower', featured: true, provisional: true,
      desc: 'A tiered wooden stand built for sharing. Contents are provisional until the owner confirms them.',
      price: null, demoPrice: 45000, image: 'food-family-tower', focus: '50% 40%',
      alt: 'A tiered wooden stand loaded with burgers, fries, waffles, chicken and sticks' },

    /* Burgers & Fries */
    { id: 'icy-double-burger-chips', cat: 'burgers', name: 'Double Burger & Fries',
      desc: 'A tall double stack with melted cheese, lettuce and pink sauce, piled on golden fries.',
      price: null, demoPrice: 9000, image: 'food-double-burger', focus: '50% 45%', provisional: true,
      alt: 'Double burger with melted cheese and sauce on a bed of fries',
      info: 'Ingredients shown are what is visible in the photo — to be confirmed.' },
    { id: 'icy-waffle-burger', cat: 'burgers', name: 'Waffle Burger', provisional: true,
      desc: 'A savoury waffle sandwich with lettuce, cheese and sauce. Provisional name.',
      price: null, demoPrice: 7000, image: 'food-waffle-burger', focus: '50% 55%',
      alt: 'A waffle sandwich with lettuce and cheese on a black plate' },

    /* Loaded Fries */
    { id: 'icy-loaded-fries', cat: 'loaded', name: 'Loaded Fries', provisional: true,
      desc: 'Fries piled with a savoury topping, melted cheese, creamy sauce and ketchup.',
      price: null, demoPrice: 6000, image: 'food-loaded-fries', focus: '50% 50%',
      alt: 'A plate of loaded fries with melted cheese, sauce and ketchup' },

    /* Chicken & Chips */
    { id: 'icy-chicken-chips', cat: 'chicken', name: 'Chicken & Chips', provisional: true,
      desc: 'Crispy fried chicken with a basket of golden chips and a ketchup dip.',
      price: null, demoPrice: 8000, image: 'food-wings-chips', focus: '50% 40%',
      alt: 'Fried chicken pieces with chips in a wire basket and a bowl of ketchup' },

    /* Shawarma */
    { id: 'icy-shawarma', cat: 'shawarma', name: 'Shawarma', provisional: true,
      desc: 'Shawarma appears on the venue\'s printed tray liners. Fillings and sizes to be confirmed.',
      price: null, demoPrice: 5000 },

    /* Milkshakes */
    { id: 'icy-strawberry-waffle-shake', cat: 'shakes', name: 'Strawberry Waffle Shake', provisional: true,
      desc: 'A strawberry-style shake crowned with a waffle, whipped cream and sprinkles. Provisional name.',
      price: null, demoPrice: 5500, image: 'drink-strawberry-shake', focus: '50% 40%',
      alt: 'A tall strawberry milkshake topped with a waffle and whipped cream' },

    /* Cocktails */
    { id: 'icy-house-cocktail', cat: 'cocktails', name: 'House Cocktails', provisional: true,
      desc: 'The Icyblast logo is a cocktail glass. The actual cocktail list is to be supplied by the owner.',
      price: null, demoPrice: 5000 }
  ];

  const FLAG_TEXT = {};

  const GALLERY = [
    { name: 'food-family-tower', cat: 'food', caption: 'The Family Tower', alt: 'A tiered wooden stand loaded with burgers, fries, waffles and chicken' },
    { name: 'food-double-burger', cat: 'food', caption: 'Double burger & fries', alt: 'Double burger with melted cheese on a plate of fries' },
    { name: 'drink-strawberry-shake', cat: 'drinks', caption: 'Strawberry waffle shake', alt: 'A tall strawberry milkshake topped with a waffle and whipped cream' },
    { name: 'food-loaded-fries', cat: 'food', caption: 'Loaded fries', alt: 'Loaded fries with melted cheese, sauce and ketchup' },
    { name: 'food-wings-chips', cat: 'food', caption: 'Chicken & chips', alt: 'Fried chicken with chips in a wire basket and a bowl of ketchup' },
    { name: 'food-waffle-burger', cat: 'food', caption: 'Waffle burger', alt: 'A waffle sandwich with lettuce and cheese on a black plate' }
  ];
  const GALLERY_FILTERS = [['all', 'All'], ['food', 'Food'], ['drinks', 'Drinks']];

  return { CONFIG, CATEGORIES, ITEMS, FLAG_TEXT, GALLERY, GALLERY_FILTERS };
})();
