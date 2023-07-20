import { css } from 'lit';

export const sharedStyles = css`
:host {

  --nh-menu-subtitle: #A89CB0;
  --nh-theme-bg-neutral: #433A4A;
  --nh-font-families-menu: "Work Sans", "Open Sans";


  /**
 * NH Design System Token Variables
 * Generated on Mon, 03 Jul 2023 09:59:43 GMT
 */
    --nh-text-decoration-captions: none;
    --nh-text-decoration-buttons: none;
    --nh-text-decoration-none: none;
    --nh-text-case-headlines: none;
    --nh-text-case-buttons: none;
    --nh-text-case-captions: none;
    --nh-text-case-none: none;
    --nh-theme-shadow-opacity-blur: 0.9;
    --nh-theme-shadow-opacity-base: 1;
    --nh-theme-shadow-color: #0d0d0d;
    --nh-paragraph-spacing-default: 0;
    --nh-letter-spacing-captions: 0em;
    --nh-letter-spacing-buttons: 0.03em;
    --nh-letter-spacing-headlines: -0.01em;
    --nh-letter-spacing-body: 0em;
    --nh-font-size-scale: 1.2;
    --nh-font-size-base: 16;
    --nh-font-weights-body-regular: 400;
    --nh-font-weights-body-bold: 700;
    --nh-font-weights-headlines-regular: 400;
    --nh-font-weights-headlines-bold: 700;
    --nh-line-heights-body-default: 1.5;
    --nh-line-heights-body-relaxed: 1.75;
    --nh-line-heights-headlines-sm: 1.3;
    --nh-line-heights-headlines-default: 1.1;
    --nh-line-heights-headlines-lg: 1.1;
    --nh-line-heights-headlines-xl: 1.1;
    --nh-font-families-body: Manrope;
    --nh-font-families-headlines: Manrope;
    --nh-sizing-xxl: 100px;
    --nh-sizing-xl: 64px;
    --nh-sizing-lg: 48px;
    --nh-sizing-md: 40px;
    --nh-sizing-sm: 32px;
    --nh-sizing-xs: 24px;
    --nh-spacing-base: 4;
    --nh-shadows-y-base: 1px;
    --nh-shadows-blur-base: 1px;
    --nh-radii-rounded: 100px;
    --nh-radii-base: 6; /* the base for our radii tokens */
    --nh-shadow-soft: 0.5;
    --nh-gradient-overlay-lightop-shade: linear-gradient(90deg, #ffffffd9 0%, #ffffff00 100%);
    --nh-gradient-overlay-light-bottom-shade: linear-gradient(90deg, #ffffff00 0%, #ffffffd9 100%);
    --nh-gradient-overlay-darkop-shade: linear-gradient(90deg, #303030d9 0%, #30303000 100%);
    --nh-gradient-overlay-dark-bottom-shade: linear-gradient(90deg, #30303000 0%, #303030d9 100%);
    --nh-gradient-scooter-top-to-bottom: linear-gradient(270deg, #5b86e5 0%, #36d1dc 100%);
    --nh-gradient-scooter-left-to-right: linear-gradient(180deg, #5b86e5 0%, #36d1dc 100%);
    --nh-gradient-dull-days-top-to-bottom: linear-gradient(270deg, #c9d6ff 0%, #e2e2e2 100%);
    --nh-gradient-dull-days-left-to-right: linear-gradient(180deg, #c9d6ff 0%, #e2e2e2 100%);
    --nh-gradient-purpink-top-to-bottom: linear-gradient(270deg, #7f00ff 0%, #e100ff 100%);
    --nh-gradient-purpink-left-to-right: linear-gradient(180deg, #7f00ff 0%, #e100ff 100%);
    --nh-gradient-orange-fun-top-to-bottom: linear-gradient(270deg, #fc4a1a 0%, #f7b733 100%);
    --nh-gradient-orange-fun-left-to-right: linear-gradient(180deg, #fc4a1a 0%, #f7b733 100%);
    --nh-gradient-delicate-top-to-bottom: linear-gradient(270deg, #d3cce3 0%, #e9e4f0 100%);
    --nh-gradient-delicate-left-to-right: linear-gradient(180deg, #d3cce3 0%, #e9e4f0 100%);
    --nh-gradient-happy-people-top-to-bottom: linear-gradient(270deg, #96c93d 0%, #00b09b 100%);
    --nh-gradient-happy-people-left-to-right: linear-gradient(180deg, #96c93d 0%, #00b09b 100%);
    --nh-gradient-lawrencium-top-to-bottom: linear-gradient(270deg, #24243e 0%, #0f0c29 100%);
    --nh-gradient-lawrencium-left-to-right: linear-gradient(180deg, #24243e 0%, #0f0c29 100%);
    --nh-gradient-sublime-light-top-to-bottom: linear-gradient(270deg, #6a82fb 0%, #fc5c7d 100%);
    --nh-gradient-sublime-light-left-to-right: linear-gradient(180deg, #6a82fb 0%, #fc5c7d 100%);
    --nh-gradient-quepal-top-to-bottom: linear-gradient(270deg, #38ef7d 0%, #11998e 100%);
    --nh-gradient-quepal-left-to-right: linear-gradient(180deg, #38ef7d 0%, #11998e 100%);
    --nh-gradient-sandy-bleue-top-to-bottom: linear-gradient(270deg, #ffe8b7 0%, #b8d8ff 100%);
    --nh-gradient-sandy-bleue-left-to-right: linear-gradient(180deg, #ffe8b7 0%, #b8d8ff 100%);
    --nh-gradient-ocean-view-top-to-bottom: linear-gradient(270deg, #3f2b96 0%, #a8c0ff 100%);
    --nh-gradient-ocean-view-left-to-right: linear-gradient(180deg, #3f2b96 0%, #a8c0ff 100%);
    --nh-gradient-vanusa-top-to-bottom: linear-gradient(270deg, #89216b 0%, #da4453 100%);
    --nh-gradient-vanusa-left-to-right: linear-gradient(180deg, #89216b 0%, #da4453 100%);
    --nh-gradient-miami-shore-top-to-bottom: linear-gradient(270deg, #5d45f9 0%, #267deb 100%);
    --nh-gradient-miami-shore-left-to-right: linear-gradient(180deg, #5d45f9 0%, #267deb 100%);
    --nh-gradient-light-mist-top-to-bottom: linear-gradient(270deg, #e8e8e8 0%, #ffffff 100%);
    --nh-gradient-light-mist-left-to-right: linear-gradient(180deg, #e8e8e8 0%, #ffffff 100%);
    --nh-gradient-plum-plate-top-to-bottom: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    --nh-gradient-plum-plate-left-to-right: linear-gradient(0deg, #667eea 0%, #764ba2 100%);
    --nh-gradient-new-york-top-to-bottom: linear-gradient(270deg, #ace0f9 0%, #fff1eb 100%);
    --nh-gradient-new-york-left-to-right: linear-gradient(180deg, #ace0f9 0%, #fff1eb 100%);
    --nh-gradient-ripe-malinka-top-to-bottom: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
    --nh-gradient-ripe-malinka-left-to-right: linear-gradient(0deg, #f093fb 0%, #f5576c 100%);
    --nh-gradient-soft-grass-top-to-bottom: linear-gradient(90deg, #deecdd 0%, #c1dfc4 100%);
    --nh-gradient-soft-grass-left-to-right: linear-gradient(0deg, #deecdd 0%, #c1dfc4 100%);
    --nh-gradient-loupe-fiesta-top-to-bottom: linear-gradient(270deg, #105efb 0%, #199afb 100%);
    --nh-gradient-loupe-fiesta-left-to-right: linear-gradient(180deg, #105efb 0%, #199afb 100%);
    --nh-gradient-winter-neva-top-to-bottom: linear-gradient(270deg, #a1c4fd 0%, #c2e9fb 100%);
    --nh-gradient-winter-neva-left-to-right: linear-gradient(180deg, #a1c4fd 0%, #c2e9fb 100%);
    --nh-gradient-sunny-morning-top-to-bottom: linear-gradient(90deg, #f7ce68 0%, #fbab7e 100%);
    --nh-gradient-sunny-morning-left-to-right: linear-gradient(0deg, #f7ce68 0%, #fbab7e 100%);
    --nh-gradient-juicy-peach-top-to-bottom: linear-gradient(90deg, #ffecd2 0%, #fcb69f 100%);
    --nh-gradient-juicy-peach-left-to-right: linear-gradient(0deg, #ffecd2 0%, #fcb69f 100%);
    --nh-gradient-night-fade-top-to-bottom: linear-gradient(270deg, #a18cd1 0%, #fbc2eb 100%);
    --nh-gradient-night-fade-left-to-right: linear-gradient(180deg, #a18cd1 0%, #fbc2eb 100%);
    --nh-gradient-warm-flame-top-to-bottom: linear-gradient(270deg, #ff9a9e 0%, #fad0c4 100%);
    --nh-gradient-warm-flame-left-to-right: linear-gradient(180deg, #ff9a9e 0%, #fad0c4 100%);
    --nh-colors-eggplant-950: #0c0a0d;
    --nh-colors-eggplant-900: #18151b;
    --nh-colors-eggplant-800: #251f28;
    --nh-colors-eggplant-700: #312a36;
    --nh-colors-eggplant-600: #3d3443;
    --nh-colors-eggplant-500: #645d69;
    --nh-colors-eggplant-400: #8b858e;
    --nh-colors-eggplant-300: #b1aeb4;
    --nh-colors-eggplant-200: #d8d6d9;
    --nh-colors-eggplant-100: #ecebec;
    --nh-colors-eggplant-50: #f5edf7;
    --nh-colors-slate-950: #05080f;
    --nh-colors-slate-900: #0f172a;
    --nh-colors-slate-800: #1e293b;
    --nh-colors-slate-700: #334155;
    --nh-colors-slate-600: #475569;
    --nh-colors-slate-500: #64748b;
    --nh-colors-slate-400: #94a3b8;
    --nh-colors-slate-300: #cbd5e1;
    --nh-colors-slate-200: #e2e8f0;
    --nh-colors-slate-100: #f1f5f9;
    --nh-colors-slate-50: #f8fafc;
    --nh-colors-grey-950: #1f1f1f;
    --nh-colors-grey-900: #323232;
    --nh-colors-grey-800: #424242;
    --nh-colors-grey-700: #616161;
    --nh-colors-grey-600: #757575;
    --nh-colors-grey-500: #9e9e9e;
    --nh-colors-grey-400: #bdbdbd;
    --nh-colors-grey-300: #e0e0e0;
    --nh-colors-grey-200: #eeeeee;
    --nh-colors-grey-100: #f5f5f5;
    --nh-colors-grey-50: #fcfcfc;
    --nh-colors-red-950: #090103;
    --nh-colors-red-900: #160207;
    --nh-colors-red-800: #2d040d;
    --nh-colors-red-700: #59091a;
    --nh-colors-red-600: #9c0f2e;
    --nh-colors-red-500: #df1642;
    --nh-colors-red-400: #e95c7b;
    --nh-colors-red-300: #f2a2b3;
    --nh-colors-red-200: #f9d0d9;
    --nh-colors-red-100: #fce8ec;
    --nh-colors-red-50: #fdf1f4;
    --nh-colors-yellow-950: #0c0903;
    --nh-colors-yellow-900: #191306;
    --nh-colors-yellow-800: #33250b;
    --nh-colors-yellow-700: #664b16;
    --nh-colors-yellow-600: #b38327;
    --nh-colors-yellow-500: #ffbb38;
    --nh-colors-yellow-400: #ffcf74;
    --nh-colors-yellow-300: #ffe4af;
    --nh-colors-yellow-200: #fff1d7;
    --nh-colors-yellow-100: #fff8eb;
    --nh-colors-yellow-50: #fffbf5;
    --nh-colors-green-950: #010905;
    --nh-colors-green-900: #021109;
    --nh-colors-green-800: #052211;
    --nh-colors-green-700: #0a4423;
    --nh-colors-green-600: #11763d;
    --nh-colors-green-500: #18a957;
    --nh-colors-green-400: #5dc389;
    --nh-colors-green-300: #a3ddbc;
    --nh-colors-green-200: #d1eedd;
    --nh-colors-green-100: #e8f6ee;
    --nh-colors-green-50: #f4fbf7;
    --nh-colors-mint-950: #171a1c;
    --nh-colors-mint-900: #282e31;
    --nh-colors-mint-800: #505d61;
    --nh-colors-mint-700: #778b92;
    --nh-colors-mint-600: #9fbac2;
    --nh-colors-mint-500: #c7e8f3;
    --nh-colors-mint-400: #d2edf5;
    --nh-colors-mint-300: #ddf1f8;
    --nh-colors-mint-200: #e9f6fa;
    --nh-colors-mint-100: #f4fafd;
    --nh-colors-mint-50: #f9fdfe;
    --nh-colors-lavender-950: #090616;
    --nh-colors-lavender-900: #1c1233;
    --nh-colors-lavender-800: #372366;
    --nh-colors-lavender-700: #533599;
    --nh-colors-lavender-600: #6e46cc;
    --nh-colors-lavender-500: #8a58ff;
    --nh-colors-lavender-400: #a179ff;
    --nh-colors-lavender-300: #b99bff;
    --nh-colors-lavender-200: #d0bcff;
    --nh-colors-lavender-100: #e8deff;
    --nh-colors-lavender-50: #f3eeff;
    --nh-colors-purple-950: #090616;
    --nh-colors-purple-900: #110d2b;
    --nh-colors-purple-800: #221956;
    --nh-colors-purple-700: #342682;
    --nh-colors-purple-600: #4532ad;
    --nh-colors-purple-500: #563fd8;
    --nh-colors-purple-400: #7865e0;
    --nh-colors-purple-300: #9a8ce8;
    --nh-colors-purple-200: #bbb2ef;
    --nh-colors-purple-100: #ddd9f7;
    --nh-colors-purple-50: #eeecfb;
    --nh-colors-blue-950: #060818;
    --nh-colors-blue-900: #0c1131;
    --nh-colors-blue-800: #182162;
    --nh-colors-blue-700: #253293;
    --nh-colors-blue-600: #3142c4;
    --nh-colors-blue-500: #3d53f5;
    --nh-colors-blue-400: #6475f7;
    --nh-colors-blue-300: #8b98f9;
    --nh-colors-blue-200: #b1bafb;
    --nh-colors-blue-100: #d8ddfd;
    --nh-colors-blue-50: #eceefe;
    --nh-colors-white: #ffffff;
    --nh-colors-black: #171717;
    --nh-documentation-body-xl: var(--nh-font-weights-body-bold) 112px/140%
      var(--nh-font-families-body);
    --nh-documentation-body-regular-small: var(--nh-font-weights-body-regular) 20px/140%
      var(--nh-font-families-body);
    --nh-documentation-body-regular-large: var(--nh-font-weights-body-regular) 48px/140%
      var(--nh-font-families-body);
    --nh-documentation-body-bold-small: var(--nh-font-weights-body-bold) 20px/140%
      var(--nh-font-families-body);
    --nh-documentation-body-bold-large: var(--nh-font-weights-body-bold) 48px/140%
      var(--nh-font-families-body);
    --nh-documentation-headlines-xl: var(--nh-font-weights-headlines-bold) 112px/140%
      var(--nh-font-families-headlines);
    --nh-documentation-headlines-regular-small: var(--nh-font-weights-headlines-regular) 20px/140%
      var(--nh-font-families-headlines);
    --nh-documentation-headlines-regular-large: var(--nh-font-weights-headlines-regular) 48px/140%
      var(--nh-font-families-headlines);
    --nh-documentation-headlines-bold-small: var(--nh-font-weights-headlines-bold) 20px/140%
      var(--nh-font-families-headlines);
    --nh-documentation-headlines-bold-large: var(--nh-font-weights-headlines-bold) 48px/140%
      var(--nh-font-families-headlines);
    --nh-typography-input-large-regular: var(--nh-font-weights-body-regular) var(--nh-font-size-md)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-input-large-bold: var(--nh-font-weights-body-bold) var(--nh-font-size-md)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-input-normal-regular: var(--nh-font-weights-body-regular) var(--nh-font-size-sm)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-input-normal-bold: var(--nh-font-weights-body-bold) var(--nh-font-size-sm)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-button-x-large-regular: var(--nh-font-weights-body-regular)
      var(--nh-font-size-xl) px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-button-x-large-bold: var(--nh-font-weights-body-bold) var(--nh-font-size-xl)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-button-large-regular: var(--nh-font-weights-body-regular) var(--nh-font-size-md)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-button-large-bold: var(--nh-font-weights-body-bold) var(--nh-font-size-md)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-button-normal-regular: var(--nh-font-weights-body-regular)
      var(--nh-font-size-sm) px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-button-normal-bold: var(--nh-font-weights-body-bold) var(--nh-font-size-sm)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-tiny-regular: var(--nh-font-weights-body-regular) var(--nh-font-size-xxs)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-tiny-bold: var(--nh-font-weights-body-bold) var(--nh-font-size-xxs)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-x-small-regular: var(--nh-font-weights-body-regular) var(--nh-font-size-xs)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-x-small-bold: var(--nh-font-weights-body-bold) var(--nh-font-size-xs)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-caption-regular: var(--nh-font-weights-body-regular) var(--nh-font-size-sm)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-caption-bold: var(--nh-font-weights-body-bold) var(--nh-font-size-sm)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-small-regular: var(--nh-font-weights-body-regular) var(--nh-font-size-md)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-small-bold: var(--nh-font-weights-body-bold) var(--nh-font-size-md)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-body-regular: var(--nh-font-weights-body-regular) var(--nh-font-size-lg)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-body-bold: var(--nh-font-weights-body-bold) var(--nh-font-size-lg)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-lead-regular: var(--nh-font-weights-body-regular) var(--nh-font-size-2xl)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-lead-bold: var(--nh-font-weights-body-bold) var(--nh-font-size-2xl)
      px/var(--nh-line-heights-body-default) var(--nh-font-families-body);
    --nh-typography-headline-5-regular: var(--nh-font-weights-headlines-regular)
      var(--nh-font-size-xl) px/var(--nh-line-heights-headlines-sm)
      var(--nh-font-families-headlines);
    --nh-typography-headline-5-bold: var(--nh-font-weights-headlines-bold) var(--nh-font-size-xl)
      px/var(--nh-line-heights-headlines-sm) var(--nh-font-families-headlines);
    --nh-typography-headline-4-regular: var(--nh-font-weights-headlines-regular)
      var(--nh-font-size-3xl) px/var(--nh-line-heights-headlines-sm)
      var(--nh-font-families-headlines);
    --nh-typography-headline-4-bold: var(--nh-font-weights-headlines-bold) var(--nh-font-size-3xl)
      px/var(--nh-line-heights-headlines-sm) var(--nh-font-families-headlines);
    --nh-typography-headline-3-regular: var(--nh-font-weights-headlines-regular)
      var(--nh-font-size-4xl) px/var(--nh-line-heights-headlines-default)
      var(--nh-font-families-headlines);
    --nh-typography-headline-3-bold: var(--nh-font-weights-headlines-bold) var(--nh-font-size-4xl)
      px/var(--nh-line-heights-headlines-default) var(--nh-font-families-headlines);
    --nh-typography-headline-2-regular: var(--nh-font-weights-headlines-regular)
      var(--nh-font-size-5xl) px/var(--nh-line-heights-headlines-default)
      var(--nh-font-families-headlines);
    --nh-typography-headline-2-bold: var(--nh-font-weights-headlines-bold) var(--nh-font-size-5xl)
      px/var(--nh-line-heights-headlines-default) var(--nh-font-families-headlines);
    --nh-typography-headline-1-regular: var(--nh-font-weights-headlines-regular)
      var(--nh-font-size-6xl) px/var(--nh-line-heights-headlines-default)
      var(--nh-font-families-headlines);
    --nh-typography-headline-1-bold: var(--nh-font-weights-headlines-bold) var(--nh-font-size-6xl)
      px/var(--nh-line-heights-headlines-default) var(--nh-font-families-headlines);
    --nh-typography-uber-regular: var(--nh-font-weights-headlines-regular) var(--nh-font-size-9xl)
      px/var(--nh-line-heights-headlines-lg) var(--nh-font-families-headlines);
    --nh-typography-uber-bold: var(--nh-font-weights-headlines-bold) var(--nh-font-size-9xl)
      px/var(--nh-line-heights-headlines-lg) var(--nh-font-families-headlines);
    --nh-typography-hero-regular: var(--nh-font-weights-headlines-regular) var(--nh-font-size-8xl)
      px/var(--nh-line-heights-headlines-default) var(--nh-font-families-headlines);
    --nh-typography-hero-bold: var(--nh-font-weights-headlines-bold) var(--nh-font-size-8xl)
      px/var(--nh-line-heights-headlines-default) var(--nh-font-families-headlines);
    --nh-typography-display-regular: var(--nh-font-weights-headlines-regular)
      var(--nh-font-size-7xl) px/var(--nh-line-heights-headlines-default)
      var(--nh-font-families-headlines);
    --nh-typography-display-bold: var(--nh-font-weights-headlines-bold) var(--nh-font-size-7xl)
      px/var(--nh-line-heights-headlines-default) var(--nh-font-families-headlines);
    --nh-typography-colossus-regular: var(--nh-font-weights-headlines-regular)
      var(--nh-font-size-1var(--nh-paragraph-spacing-default) xl)
      px/var(--nh-line-heights-headlines-xl) var(--nh-font-families-headlines);
    --nh-typography-colossus-bold: var(--nh-font-weights-headlines-bold)
      var(--nh-font-size-1var(--nh-paragraph-spacing-default) xl)
      px/var(--nh-line-heights-headlines-xl) var(--nh-font-families-headlines);
    --nh-theme-overlay-bg: var(--nh-colors-black);
    --nh-theme-shadow-blur-active: var(--nh-colors-lavender-600);
    --nh-theme-shadow-blur: rgba(13, 13, 13, var(--nh-theme-shadow-opacity-blur));
    --nh-theme-shadow-base: rgba(var(--nh-theme-shadow-opacity-base) 3, 13, 13, 1);
    --nh-theme-input-fg-disabled: var(--nh-colors-grey-300);
    --nh-theme-input-border-disabled: var(--nh-colors-grey-200);
    --nh-theme-input-border-default: var(--nh-colors-grey-300);
    --nh-theme-input-placeholder: var(--nh-colors-grey-500);
    --nh-theme-input-text: var(--nh-colors-grey-800);
    --nh-theme-input-background: var(--nh-colors-white);
    --nh-theme-success-on-success: var(--nh-colors-white);
    --nh-theme-success-emphasis: var(--nh-colors-green-500);
    --nh-theme-success-muted: var(--nh-colors-green-600);
    --nh-theme-success-subtle: var(--nh-colors-green-800);
    --nh-theme-success-default: var(--nh-colors-green-400);
    --nh-theme-error-on-error: var(--nh-colors-white);
    --nh-theme-error-emphasis: var(--nh-colors-red-500);
    --nh-theme-error-muted: var(--nh-colors-red-600);
    --nh-theme-error-subtle: var(--nh-colors-red-800);
    --nh-theme-error-default: var(--nh-colors-red-400);
    --nh-theme-info-on-info: var(--nh-colors-white);
    --nh-theme-info-emphasis: var(--nh-colors-blue-500);
    --nh-theme-info-muted: var(--nh-colors-blue-300);
    --nh-theme-info-subtle: var(--nh-colors-blue-100);
    --nh-theme-info-default: var(--nh-colors-blue-600);
    --nh-theme-warning-on-warning: var(--nh-colors-black);
    --nh-theme-warning-emphasis: var(--nh-colors-yellow-500);
    --nh-theme-warning-muted: var(--nh-colors-yellow-600);
    --nh-theme-warning-subtle: var(--nh-colors-yellow-800);
    --nh-theme-warning-default: var(--nh-colors-yellow-400);
    --nh-theme-fg-on-dark: var(--nh-colors-white);
    --nh-theme-fg-disabled: var(--nh-colors-grey-600);
    --nh-theme-fg-on-disabled: var(--nh-colors-grey-300);
    --nh-theme-fg-subtle: var(--nh-colors-grey-500);
    --nh-theme-fg-muted: var(--nh-colors-grey-200);
    --nh-theme-fg-on-accent: var(--nh-colors-white);
    --nh-theme-fg-default: var(--nh-colors-white);
    --nh-theme-accent-emphasis: var(--nh-colors-lavender-500);
    --nh-theme-accent-muted: var(--nh-colors-lavender-600);
    --nh-theme-accent-subtle: var(--nh-colors-lavender-900);
    --nh-theme-accent-default: var(--nh-colors-lavender-400);
    --nh-theme-accent-disabled: var(--nh-colors-grey-600);
    --nh-theme-bg-backdrop: var(--nh-colors-eggplant-950);
    --nh-theme-bg-canvas: var(--nh-colors-eggplant-900);
    --nh-theme-bg-muted: var(--nh-colors-eggplant-500);
    --nh-theme-bg-subtle: var(--nh-colors-eggplant-700);
    --nh-theme-bg-surface: var(--nh-colors-eggplant-600);
    --nh-font-size-lg: 19;
    --nh-font-size-md: var(--nh-font-size-base);
    --nh-font-size-sm: 13;
    --nh-spacing-xs: var(--nh-spacing-base); /* The base token for spacing */
    --nh-spacing-xxs: 2;
    --nh-shadows-y-100: 16px;
    --nh-shadows-y-80: 8px;
    --nh-shadows-y-60: 4px;
    --nh-shadows-y-40: 2px;
    --nh-shadows-y-20: var(--nh-shadows-y-base);
    --nh-shadows-blur-100: 32px;
    --nh-shadows-blur-80: 16px;
    --nh-shadows-blur-60: 8px;
    --nh-shadows-blur-40: 4px;
    --nh-shadows-blur-20: 3px;
    --nh-radii-sm: var(--nh-radii-base);
    --nh-radii-xs: 3;
    --nh-theme-border-default: var(--nh-theme-bg-subtle);
    --nh-theme-fg-opacity-90: rgba(61, 52, 67, 0.9);
    --nh-theme-fg-opacity-80: rgba(61, 52, 67, 0.8);
    --nh-theme-fg-opacity-70: rgba(61, 52, 67, 0.7);
    --nh-theme-fg-opacity-60: rgba(61, 52, 67, 0.6);
    --nh-theme-fg-opacity-50: rgba(61, 52, 67, 0.5);
    --nh-theme-fg-opacity-40: rgba(61, 52, 67, 0.4);
    --nh-theme-fg-opacity-30: rgba(61, 52, 67, 0.3);
    --nh-theme-fg-opacity-20: rgba(61, 52, 67, 0.2);
    --nh-theme-fg-opacity-10: rgba(61, 52, 67, 0.1);
    --nh-theme-fg-opacity-5: rgba(61, 52, 67, 0.05);
    --nh-theme-fg-opacity-1: rgba(61, 52, 67, 0.01);
    --nh-font-size-xl: 23;
    --nh-font-size-xs: 11;
    --nh-spacing-sm: 8;
    --nh-shadows-theme-soft-100: 0 var(--nh-shadows-y-100) var(--nh-shadows-blur-100) 0
        rgba(var(--nh-theme-shadow-blur), 0.3),
      0 0 var(--nh-shadows-blur-base) 0 rgba(var(--nh-theme-shadow-blur), 0.3);
    --nh-shadows-theme-soft-80: 0 var(--nh-shadows-y-80) var(--nh-shadows-blur-80) 0
        rgba(var(--nh-theme-shadow-blur), 0.3),
      0 0 var(--nh-shadows-blur-base) 0 rgba(var(--nh-theme-shadow-blur), 0.3);
    --nh-shadows-theme-soft-60: 0 var(--nh-shadows-y-60) var(--nh-shadows-blur-60) 0
        rgba(var(--nh-theme-shadow-blur), 0.3),
      0 0 var(--nh-shadows-blur-base) 0 rgba(var(--nh-theme-shadow-blur), 0.3);
    --nh-shadows-theme-soft-40: 0 var(--nh-shadows-y-40) var(--nh-shadows-blur-40) 0
        rgba(var(--nh-theme-shadow-blur), 0.3),
      0 0 var(--nh-shadows-blur-base) 0 rgba(var(--nh-theme-shadow-blur), 0.3);
    --nh-shadows-theme-soft-20: 0 var(--nh-shadows-y-20) var(--nh-shadows-blur-20) 0
        rgba(var(--nh-theme-shadow-blur), 0.3),
      0 0 var(--nh-shadows-blur-base) 0 rgba(var(--nh-theme-shadow-blur), 0.3);
    --nh-shadows-theme-background-surface-100: 0 var(--nh-shadows-y-100) var(--nh-shadows-blur-100)
        0 var(--nh-theme-bg-surface),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-bg-surface);
    --nh-shadows-theme-background-surface-80: 0 var(--nh-shadows-y-80) var(--nh-shadows-blur-80) 0
        var(--nh-theme-bg-surface),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-bg-surface);
    --nh-shadows-theme-background-surface-60: 0 var(--nh-shadows-y-60) var(--nh-shadows-blur-60) 0
        var(--nh-theme-bg-surface),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-bg-surface);
    --nh-shadows-theme-background-surface-40: 0 var(--nh-shadows-y-40) var(--nh-shadows-blur-40) 0
        var(--nh-theme-bg-surface),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-bg-surface);
    --nh-shadows-theme-background-surface-20: 0 var(--nh-shadows-y-20) var(--nh-shadows-blur-20) 0
        var(--nh-theme-bg-surface),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-bg-surface);
    --nh-shadows-theme-background-subtle-100: 0 var(--nh-shadows-y-100) var(--nh-shadows-blur-100) 0
        var(--nh-theme-bg-subtle),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-bg-subtle);
    --nh-shadows-theme-background-subtle-80: 0 var(--nh-shadows-y-80) var(--nh-shadows-blur-80) 0
        var(--nh-theme-bg-subtle),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-bg-subtle);
    --nh-shadows-theme-background-subtle-60: 0 var(--nh-shadows-y-60) var(--nh-shadows-blur-60) 0
        var(--nh-theme-bg-subtle),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-bg-subtle);
    --nh-shadows-theme-background-subtle-40: 0 var(--nh-shadows-y-40) var(--nh-shadows-blur-40) 0
        var(--nh-theme-bg-subtle),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-bg-subtle);
    --nh-shadows-theme-background-subtle-20: 0 var(--nh-shadows-y-20) var(--nh-shadows-blur-20) 0
        var(--nh-theme-bg-subtle),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-bg-subtle);
    --nh-shadows-theme-background-canvas-100: 0 var(--nh-shadows-y-100) var(--nh-shadows-blur-100) 0
        var(--nh-theme-bg-canvas),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-bg-canvas);
    --nh-shadows-theme-background-canvas-80: 0 var(--nh-shadows-y-80) var(--nh-shadows-blur-80) 0
        var(--nh-theme-bg-canvas),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-bg-canvas);
    --nh-shadows-theme-background-canvas-60: 0 var(--nh-shadows-y-60) var(--nh-shadows-blur-60) 0
        var(--nh-theme-bg-canvas),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-bg-canvas);
    --nh-shadows-theme-background-canvas-40: 0 var(--nh-shadows-y-40) var(--nh-shadows-blur-40) 0
        var(--nh-theme-bg-canvas),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-bg-canvas);
    --nh-shadows-theme-background-canvas-20: 0 var(--nh-shadows-y-20) var(--nh-shadows-blur-20) 0
        var(--nh-theme-bg-canvas),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-bg-canvas);
    --nh-shadows-theme-active-100: 0 0 var(--nh-shadows-blur-100) 0
        var(--nh-theme-shadow-blur-active),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-shadow-color);
    --nh-shadows-theme-active-80: 0 0 50px 0 var(--nh-theme-shadow-blur-active),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-shadow-color);
    --nh-shadows-theme-active-60: 0 0 20px 0 var(--nh-theme-shadow-blur-active),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-shadow-color);
    --nh-shadows-theme-active-40: 0 0 10px 0 var(--nh-theme-shadow-blur-active),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-shadow-color);
    --nh-shadows-theme-active-20: 0 0 5px 0 var(--nh-theme-shadow-blur-active),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-shadow-color);
    --nh-shadows-theme-100: 0 var(--nh-shadows-y-100) var(--nh-shadows-blur-100) 0
        var(--nh-theme-shadow-blur),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-shadow-color);
    --nh-shadows-theme-80: 0 var(--nh-shadows-y-80) var(--nh-shadows-blur-80) 0
        var(--nh-theme-shadow-blur),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-shadow-color);
    --nh-shadows-theme-60: 0 var(--nh-shadows-y-60) var(--nh-shadows-blur-60) 0
        var(--nh-theme-shadow-blur),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-shadow-color);
    --nh-shadows-theme-40: 0 var(--nh-shadows-y-40) var(--nh-shadows-blur-40) 0
        var(--nh-theme-shadow-blur),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-shadow-color);
    --nh-shadows-theme-20: 0 var(--nh-shadows-y-20) var(--nh-shadows-blur-20) 0
        var(--nh-theme-shadow-blur),
      0 0 var(--nh-shadows-blur-base) 0 var(--nh-theme-shadow-color);
    --nh-radii-md: 12;
    --nh-50: 0 0 var(--nh-shadows-y-80) 0 var(--nh-colors-black);
    --nh-font-size-2xl: 28;
    --nh-font-size-xxs: 9;
    --nh-spacing-md: 12;
    --nh-radii-lg: 18;
    --nh-font-size-3xl: 34;
    --nh-spacing-lg: 16;
    --nh-radii-xl: 24;
    --nh-font-size-4xl: 41;
    --nh-spacing-xl: 20;
    --nh-radii-2xl: 30;
    --nh-font-size-5xl: 49;
    --nh-spacing-2xl: var (--nh-spacing-base);
    --nh-font-size-6xl: 59;
    --nh-spacing-3xl: 32;
    --nh-font-size-7xl: 71;
    --nh-spacing-4xl: 64;
    --nh-font-size-8xl: 85;
    --nh-font-size-9xl: 102;
    --nh-font-size-10xl: 122;
  }
`;
