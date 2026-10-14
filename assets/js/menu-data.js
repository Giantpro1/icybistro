/* ==========================================================================
   menu-data.js — ALL editable business content lives here.
   Edit this file (not main.js) to change brands, contact details, fees,
   categories, menu items and prices.

   Price rules
   - price: number  -> shown as a naira amount
   - price: null    -> shown as "Price to be confirmed" and excluded from totals
   - variants: [{ label, price }] -> size options (price on the item is ignored)
   - flag: 'conflict'      -> the supplied menu images disagree on this price
   - flag: 'single-source' -> only one supplied menu image lists this item
   - flag: 'borrowed'      -> price comes from the Bistro 24 menu image; this
                              concept's own price has not been supplied
   ========================================================================== */
window.RD_DATA = (function () {
  'use strict';

  const CONFIG = {
    demoMode: true,
    currencySymbol: '₦',
    // null = "to be confirmed" (not added to the total). Set a number to charge a fee.
    deliveryFee: null,
    brands: {
      icy: {
        key: 'icy',
        name: 'Icy Blast Bistro',
        short: 'Icy Blast',
        role: 'The restaurant',
        tiktok: 'https://www.tiktok.com/@icyblastbistro',
        tiktokHandle: '@icyblastbistro',
        blurb: 'Loaded fries, stacked burgers, crispy chicken, signature platters and cocktails.'
      },
      cafe: {
        key: 'cafe',
        name: 'Bistro 24 Café',
        short: 'Bistro 24',
        role: 'The café',
        tiktok: 'https://www.tiktok.com/@bistro_24hr',
        tiktokHandle: '@bistro_24hr',
        blurb: 'Waffles, pancakes, boba, matcha, milkshakes, frozen cocktails and café favourites.'
      }
    },
    // Only rendered when set. Never invent these.
    contact: {
      phone: null,        // e.g. '+234…'
      whatsapp: null,     // e.g. '234…' (digits only, for wa.me)
      email: null,
      address: null,      // e.g. 'Street, Area, Lagos'
      mapUrl: null        // e.g. a Google Maps share link
    }
  };

  const CATEGORIES = {
    icy: [
      { id: 'burgers',   label: 'Burgers & Fries',    icon: 'bi-egg-fried' },
      { id: 'loaded',    label: 'Loaded Fries',       icon: 'bi-basket2' },
      { id: 'wings',     label: 'Chicken Wings',      icon: 'bi-fire' },
      { id: 'chicken',   label: 'Chicken & Chips',    icon: 'bi-basket' },
      { id: 'shawarma',  label: 'Shawarma',           icon: 'bi-box-seam' },
      { id: 'cocktails', label: 'Cocktails & Shots',  icon: 'bi-cup-straw' },
      { id: 'shakes',    label: 'Milkshakes',         icon: 'bi-cup-straw' },
      { id: 'platters',  label: 'Signature Platters', icon: 'bi-layers' }
    ],
    cafe: [
      { id: 'waffles',   label: 'Waffles',             icon: 'bi-grid-3x3' },
      { id: 'breakfast', label: 'Breakfast',           icon: 'bi-egg-fried' },
      { id: 'addons',    label: 'Add-ons & Toppings',  icon: 'bi-plus-circle' },
      { id: 'boba',      label: 'Boba Tea',            icon: 'bi-cup-straw' },
      { id: 'matcha',    label: 'Premium Matcha',      icon: 'bi-cup-hot' },
      { id: 'frozen',    label: 'Frozen Cocktails',    icon: 'bi-snow2' },
      { id: 'shakes',    label: 'Milkshakes',          icon: 'bi-cup-straw' },
      { id: 'treats',    label: 'Café Favourites',     icon: 'bi-cake2' }
    ]
  };

  // Helper to keep the data compact
  const sizes = (a, b) => [{ label: '500ml', price: a }, { label: '700ml', price: b }];

  const ITEMS = [
    /* ------------------------------ ICY BLAST ------------------------------ */
    { id: 'icy-double-burger-chips', brand: 'icy', cat: 'burgers', name: 'Double Burger & Chips',
      desc: 'A tall double stack with melted cheese, fresh lettuce and pink sauce, piled on golden fries.',
      price: 12000, flag: 'borrowed', image: 'food-double-burger', focus: '50% 45%',
      alt: 'Double burger with melted cheese and sauce on a bed of fries', info: 'Ingredients shown are what is visible in the photo — to be confirmed.' },
    { id: 'icy-single-burger-chips', brand: 'icy', cat: 'burgers', name: 'Single Burger & Chips',
      desc: 'A single burger served with chips.', price: 11000, flag: 'borrowed' },
    { id: 'icy-single-cheeseburger', brand: 'icy', cat: 'burgers', name: 'Single Beef Cheeseburger',
      desc: 'One beef patty with cheese.', price: 8000, flag: 'borrowed' },
    { id: 'icy-double-cheeseburger', brand: 'icy', cat: 'burgers', name: 'Double Beef Cheeseburger',
      desc: 'Two beef patties with cheese.', price: 12000, flag: 'borrowed' },
    { id: 'icy-waffle-burger', brand: 'icy', cat: 'burgers', name: 'Waffle Burger',
      desc: 'A savoury waffle sandwich with lettuce, cheese and sauce. Provisional name.',
      price: null, image: 'food-waffle-burger', focus: '50% 55%',
      alt: 'A waffle sandwich with lettuce and cheese on a black plate', provisional: true },
    { id: 'icy-loaded-fries', brand: 'icy', cat: 'loaded', name: 'Loaded Fries',
      desc: 'Fries piled with a savoury topping, melted cheese, creamy sauce and ketchup.',
      price: null, image: 'food-loaded-fries', focus: '50% 50%',
      alt: 'A plate of loaded fries with melted cheese, sauce and ketchup', provisional: true },
    { id: 'icy-wings', brand: 'icy', cat: 'wings', name: 'Glazed Chicken Wings',
      desc: 'Sticky, glazed wings. Provisional item shown from kitchen footage.',
      price: null, image: 'kitchen-wings', focus: '50% 55%',
      alt: 'Glazed chicken wings being handled in the kitchen', provisional: true },
    { id: 'icy-chicken-chips', brand: 'icy', cat: 'chicken', name: 'Chicken & Chips',
      desc: 'Crispy fried chicken with a basket of golden chips and a ketchup dip.',
      price: 10000, flag: 'borrowed', image: 'food-wings-chips', focus: '50% 40%',
      alt: 'Fried chicken pieces with chips in a wire basket and a bowl of ketchup' },
    { id: 'icy-shawarma', brand: 'icy', cat: 'shawarma', name: 'Shawarma',
      desc: 'Shawarma is part of the menu concept. Fillings and sizes to be confirmed.',
      price: null, provisional: true },
    { id: 'icy-old-fashioned', brand: 'icy', cat: 'cocktails', name: 'Old Fashioned Cocktail',
      desc: 'A classic whisky cocktail.', price: 10000, flag: 'borrowed' },
    { id: 'icy-tequila-shot', brand: 'icy', cat: 'cocktails', name: 'Tequila Shot',
      desc: 'A single tequila shot.', price: 3000, flag: 'borrowed' },
    { id: 'icy-martell-royale', brand: 'icy', cat: 'cocktails', name: 'Martell Royale',
      desc: 'A premium cognac serve.', price: 14000, flag: 'borrowed' },
    { id: 'icy-strawberry-waffle-shake', brand: 'icy', cat: 'shakes', name: 'Strawberry Waffle Shake',
      desc: 'A strawberry-style shake crowned with a waffle, whipped cream and sprinkles. Provisional name.',
      price: null, image: 'drink-strawberry-shake', focus: '50% 40%',
      alt: 'A tall strawberry milkshake topped with waffle and whipped cream', provisional: true },
    { id: 'icy-family-tower', brand: 'icy', cat: 'platters', name: 'The Family Tower',
      desc: 'A tiered platter built for sharing. Contents are provisional until the owner confirms them.',
      price: null, image: 'food-family-tower', focus: '50% 40%', featured: true,
      alt: 'A tiered wooden stand loaded with burgers, fries, waffles, chicken and sticks', provisional: true },

    /* ----------------------------- BISTRO 24 CAFÉ --------------------------- */
    { id: 'cafe-plain-waffle', brand: 'cafe', cat: 'waffles', name: 'Plain Waffle', desc: 'A classic waffle. Add a spread, crumbs or whipped cream.', price: 5000 },
    { id: 'cafe-double-plain-waffle', brand: 'cafe', cat: 'waffles', name: 'Double Plain Waffle', desc: 'Two classic waffles.', price: 7000 },
    { id: 'cafe-waffle-eggs', brand: 'cafe', cat: 'waffles', name: 'Waffle & Eggs', desc: 'Waffle served with eggs.', price: 7500 },
    { id: 'cafe-single-waffle-scrambled', brand: 'cafe', cat: 'waffles', name: 'Single Waffle & Scrambled Eggs', desc: 'One waffle with scrambled eggs.', price: 8000 },
    { id: 'cafe-double-waffle-scrambled', brand: 'cafe', cat: 'waffles', name: 'Double Waffles & Scrambled Eggs', desc: 'Two waffles with scrambled eggs.', price: 10000 },

    { id: 'cafe-plain-pancakes', brand: 'cafe', cat: 'breakfast', name: 'Plain Pancakes', desc: 'Classic pancakes.', price: 4000 },
    { id: 'cafe-pancakes-eggs', brand: 'cafe', cat: 'breakfast', name: 'Pancakes & Eggs', desc: 'Pancakes served with eggs.', price: 7000 },

    { id: 'cafe-hot-dog', brand: 'cafe', cat: 'addons', name: 'Hot Dog (add-on)', desc: 'Add a hot dog to any breakfast plate.', price: 1000 },
    { id: 'cafe-bacon', brand: 'cafe', cat: 'addons', name: 'Bacon (add-on)', desc: 'Add bacon to any breakfast plate.', price: 3000 },
    { id: 'cafe-chicken-addon', brand: 'cafe', cat: 'addons', name: 'Chicken (add-on)', desc: 'Add chicken to any breakfast plate.', price: 7000 },
    { id: 'cafe-extra-chips', brand: 'cafe', cat: 'addons', name: 'Extra Chips', desc: 'An extra portion of chips.', price: 3000 },
    { id: 'cafe-choc-spread', brand: 'cafe', cat: 'addons', name: 'Chocolate Spread', desc: 'Topping for waffles and pancakes.', price: 1000 },
    { id: 'cafe-caramel-spread', brand: 'cafe', cat: 'addons', name: 'Caramel Spread', desc: 'Topping for waffles and pancakes.', price: 1000 },
    { id: 'cafe-oreo-crumbs', brand: 'cafe', cat: 'addons', name: 'Oreo Crumbs', desc: 'Crunchy topping.', price: 800 },
    { id: 'cafe-biscoff-crumbs', brand: 'cafe', cat: 'addons', name: 'Biscoff Crumbs', desc: 'Crunchy topping.', price: 1000 },
    { id: 'cafe-whipped-cream', brand: 'cafe', cat: 'addons', name: 'Whipped Cream', desc: 'A generous swirl on top.', price: 1500 },
    { id: 'cafe-combo-choc-oreo', brand: 'cafe', cat: 'addons', name: 'Combo: Chocolate Spread + Oreo', desc: 'Signature topping combo.', price: 1500 },
    { id: 'cafe-combo-caramel-biscoff', brand: 'cafe', cat: 'addons', name: 'Combo: Caramel Spread + Biscoff', desc: 'Signature topping combo.', price: 1500 },
    { id: 'cafe-combo-choc-oreo-cream', brand: 'cafe', cat: 'addons', name: 'Combo: Chocolate + Oreo + Whipped Cream', desc: 'Signature topping combo.', price: 2500 },
    { id: 'cafe-combo-caramel-biscoff-cream', brand: 'cafe', cat: 'addons', name: 'Combo: Caramel + Biscoff + Whipped Cream', desc: 'Signature topping combo.', price: 2500 },

    { id: 'cafe-boba-milk-classic', brand: 'cafe', cat: 'boba', name: 'Milk Classic Boba Tea', desc: 'Creamy milk tea with boba pearls.', variants: sizes(5000, 6500) },
    { id: 'cafe-boba-taro', brand: 'cafe', cat: 'boba', name: 'Royal Taro Boba Tea', desc: 'Taro-flavoured milk tea with boba pearls.', variants: sizes(5000, 6500) },
    { id: 'cafe-boba-strawberry', brand: 'cafe', cat: 'boba', name: 'Strawberry Boba Tea', desc: 'Fruity strawberry tea with boba pearls.', variants: sizes(5000, 6500) },
    { id: 'cafe-boba-coco-pine', brand: 'cafe', cat: 'boba', name: 'Coco Pine Boba Tea', desc: 'Coconut and pineapple boba tea.', variants: sizes(7000, 8500) },
    { id: 'cafe-boba-choco', brand: 'cafe', cat: 'boba', name: 'Choco Boba Tea', desc: 'Chocolate milk tea with boba pearls.', variants: sizes(5000, 6500) },
    { id: 'cafe-boba-lotus', brand: 'cafe', cat: 'boba', name: 'Lotus Milk Tea Boba', desc: 'Biscoff-style lotus milk tea with boba pearls.', variants: sizes(8500, 10500) },
    { id: 'cafe-boba-extra', brand: 'cafe', cat: 'boba', name: 'Extra Boba Pearls', desc: 'Add extra pearls to any boba drink.', price: 500, flag: 'single-source' },

    { id: 'cafe-matcha-ceremonial', brand: 'cafe', cat: 'matcha', name: 'Ceremonial Matcha', desc: 'Premium matcha, served over ice.', variants: sizes(7000, 8500) },
    { id: 'cafe-matcha-mango', brand: 'cafe', cat: 'matcha', name: 'Mango Matcha', desc: 'Matcha with mango.', variants: sizes(8500, 10000) },
    { id: 'cafe-matcha-strawberry', brand: 'cafe', cat: 'matcha', name: 'Strawberry Matcha', desc: 'Matcha with strawberry.', variants: sizes(8500, 10000) },
    { id: 'cafe-matcha-vanilla', brand: 'cafe', cat: 'matcha', name: 'Vanilla Matcha', desc: 'Matcha with vanilla.', variants: sizes(8500, 10000), flag: 'single-source' },
    { id: 'cafe-matcha-coconut', brand: 'cafe', cat: 'matcha', name: 'Coconut Matcha', desc: 'Matcha with coconut.', variants: sizes(8500, 10000), flag: 'single-source' },

    { id: 'cafe-frozen-mango', brand: 'cafe', cat: 'frozen', name: 'Mango Pop', desc: 'Signature frozen cocktail.', variants: sizes(7500, 10000) },
    { id: 'cafe-frozen-straw', brand: 'cafe', cat: 'frozen', name: 'Straw-burst Pop', desc: 'Signature frozen cocktail.', variants: sizes(7500, 10000) },
    { id: 'cafe-frozen-berry', brand: 'cafe', cat: 'frozen', name: 'Berry Buzz Pop', desc: 'Signature frozen cocktail.', variants: sizes(7500, 10000) },
    { id: 'cafe-frozen-blue', brand: 'cafe', cat: 'frozen', name: 'Blue Wave Pop', desc: 'Signature frozen cocktail.', variants: sizes(7500, 10000) },
    { id: 'cafe-frozen-pina', brand: 'cafe', cat: 'frozen', name: 'Piña Coco-Bliss Pop', desc: 'Signature frozen cocktail.', variants: sizes(10000, 12500) },
    { id: 'cafe-frozen-sunset', brand: 'cafe', cat: 'frozen', name: 'Sunset Sip Pop', desc: 'Signature frozen cocktail.', variants: sizes(7500, 10000) },

    { id: 'cafe-shake-strawberry', brand: 'cafe', cat: 'shakes', name: 'Strawberry Milkshake', desc: 'Classic milkshake.', price: 8000, flag: 'conflict' },
    { id: 'cafe-shake-chocolate', brand: 'cafe', cat: 'shakes', name: 'Chocolate Milkshake', desc: 'Classic milkshake.', price: 8000 },
    { id: 'cafe-shake-vanilla', brand: 'cafe', cat: 'shakes', name: 'Vanilla Milkshake', desc: 'Classic milkshake.', price: 8000 },
    { id: 'cafe-shake-banana', brand: 'cafe', cat: 'shakes', name: 'Banana Milkshake', desc: 'Classic milkshake.', price: 8000, flag: 'conflict' },
    { id: 'cafe-shake-oreo', brand: 'cafe', cat: 'shakes', name: 'Oreo Milkshake', desc: 'Milkshake with Oreo.', price: 8500, flag: 'conflict' },
    { id: 'cafe-shake-biscoff', brand: 'cafe', cat: 'shakes', name: 'Biscoff Milkshake', desc: 'Milkshake with Biscoff.', price: 8000 },
    { id: 'cafe-shake-biscoff-baileys', brand: 'cafe', cat: 'shakes', name: 'Biscoff & Baileys Milkshake', desc: 'Biscoff milkshake with Baileys.', price: 13000, flag: 'conflict' },
    { id: 'cafe-shake-oreo-baileys', brand: 'cafe', cat: 'shakes', name: 'Oreo & Baileys Milkshake', desc: 'Oreo milkshake with Baileys.', price: 11000, flag: 'single-source' },

    { id: 'cafe-red-velvet', brand: 'cafe', cat: 'treats', name: 'Red Velvet Cake Slice', desc: 'A slice of red velvet cake.', price: 4000, flag: 'conflict' },
    { id: 'cafe-banana-bread', brand: 'cafe', cat: 'treats', name: 'Banana Bread (Mini)', desc: 'Mini banana bread.', price: 2800, flag: 'conflict' }
  ];

  const FLAG_TEXT = {
    conflict: 'Menu versions list different prices — to confirm',
    'single-source': 'Seen on one menu version only — to confirm',
    borrowed: 'Price from the Bistro 24 menu — to confirm'
  };

  return { CONFIG, CATEGORIES, ITEMS, FLAG_TEXT };
})();
