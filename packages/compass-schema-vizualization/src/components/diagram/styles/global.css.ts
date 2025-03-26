// import { fontFamilies } from '@mongodb-js/compass-components';
// import { globalFontFace, globalStyle } from '@vanilla-extract/css';

// // Override the-new-css-reset placeholder styling. Due to LG TextArea not correctly applying placeholder styles
// globalStyle('::placeholder', {
//   color: 'revert',
// });

// // Vendor-prefixed scrollbar styling used by Safari
// globalStyle('::-webkit-scrollbar', {
//   width: '10px',
// });

// globalStyle('a', {
//   fontWeight: 'bold',
//   textDecoration: 'underline',
//   cursor: 'pointer',
// });

// globalStyle('th', {
//   fontWeight: 600,
//   fontSize: '13px',
// });

// globalStyle('td', {
//   fontWeight: 400,
// });

// /**
//  *
//  * Fonts
//  * @see https://www.figma.com/proto/7ifdX2zGEu92H5HJx88ARl/Typography-Update-Guide
//  *
//  */

// const fontsPath = '/fonts/';

// const fontFaceStyle = (fileName: string, fontWeight: string, fontStyle: string) => {
//   const src = `url('${fontsPath}${fileName}.woff') format('woff'), url('${fontsPath}${fileName}.woff2') format('woff2');`;

//   return {
//     src,
//     fontWeight,
//     fontStyle,
//   };
// };

// const fontAssets = {
//   euclid: {
//     fontFamily: 'Euclid Circular A',
//     medium: 'EuclidCircularA-Medium-WebXL',
//     mediumItalic: 'EuclidCircularA-MediumItalic-WebXL',
//     normal: 'EuclidCircularA-Regular-WebXL',
//     italic: 'EuclidCircularA-RegularItalic-WebXL',
//     semiBold: 'EuclidCircularA-Semibold-WebXL',
//     semiBoldItalic: 'EuclidCircularA-SemiboldItalic-WebXL',
//   },
//   serif: {
//     fontFamily: 'MongoDB Value Serif',
//     bold: 'MongoDBValueSerif-Bold',
//     medium: 'MongoDBValueSerif-Medium',
//     normal: 'MongoDBValueSerif-Regular',
//   },
//   code: {
//     fontFamily: 'Source Code Pro',
//     bold: 'source-code-pro-v20-latin-700',
//     medium: 'source-code-pro-v20-latin-500',
//     normal: 'source-code-pro-v20-latin-regular',
//   },
// };

// const fontWeights = {
//   euclid: {
//     semiBold: '700',
//     medium: '500',
//     normal: '400, normal',
//   },
//   serif: {
//     bold: '700, bold',
//     medium: '500',
//     normal: '400, normal',
//   },
//   code: {
//     bold: '700',
//     medium: '500',
//     normal: '400',
//   },
// };

// /* Euclid Circular A fonts */

// // semi-bold
// globalFontFace(
//   fontAssets.euclid.fontFamily,
//   fontFaceStyle(fontAssets.euclid.semiBold, fontWeights.euclid.semiBold, 'normal'),
// );

// // semi-bold italic
// globalFontFace(
//   fontAssets.euclid.fontFamily,
//   fontFaceStyle(fontAssets.euclid.semiBoldItalic, fontWeights.euclid.semiBold, 'italic'),
// );

// // medium
// globalFontFace(
//   fontAssets.euclid.fontFamily,
//   fontFaceStyle(fontAssets.euclid.medium, fontWeights.euclid.medium, 'normal'),
// );

// // medium italic
// globalFontFace(
//   fontAssets.euclid.fontFamily,
//   fontFaceStyle(fontAssets.euclid.mediumItalic, fontWeights.euclid.medium, 'italic'),
// );

// // regular
// globalFontFace(
//   fontAssets.euclid.fontFamily,
//   fontFaceStyle(fontAssets.euclid.normal, fontWeights.euclid.normal, 'normal'),
// );

// // regular italic
// globalFontFace(
//   fontAssets.euclid.fontFamily,
//   fontFaceStyle(fontAssets.euclid.italic, fontWeights.euclid.normal, 'italic'),
// );

// /* MongoDB Value Serif fonts */

// // bold
// globalFontFace(fontAssets.serif.fontFamily, fontFaceStyle(fontAssets.serif.bold, fontWeights.serif.bold, 'normal'));

// // medium
// globalFontFace(fontAssets.serif.fontFamily, fontFaceStyle(fontAssets.serif.medium, fontWeights.serif.medium, 'normal'));

// // normal
// globalFontFace(fontAssets.serif.fontFamily, fontFaceStyle(fontAssets.serif.normal, fontWeights.serif.normal, 'normal'));

// /* Source Code Pro fonts @see https://google-webfonts-helper.herokuapp.com/fonts/source-code-pro?subsets=latin */

// // bold
// globalFontFace(fontAssets.code.fontFamily, fontFaceStyle(fontAssets.code.bold, fontWeights.serif.bold, 'normal'));

// // medium
// globalFontFace(fontAssets.code.fontFamily, fontFaceStyle(fontAssets.code.medium, fontWeights.serif.medium, 'normal'));

// // normal
// globalFontFace(fontAssets.code.fontFamily, fontFaceStyle(fontAssets.code.normal, fontWeights.serif.normal, 'normal'));

// /**
//  *
//  * Global HTML Styles
//  *
//  */
// globalStyle('html, body, #root', {
//   margin: 0,
//   height: '100%',
//   fontFamily: fontFamilies.default,
// });
