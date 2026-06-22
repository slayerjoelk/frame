/** @type {import('tailwindcss').Config} */
const { buildTailwindExtension } = require("./lib/design-system");
const ds = buildTailwindExtension("creative");
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ...ds.colors,
        primary: "#e830b7",
        dark: "#570f44",
        card: "#931f74",
      },
      fontFamily: ds.fontFamily,
      fontSize: ds.fontSize,
      spacing: ds.spacing,
      borderRadius: ds.borderRadius,
      boxShadow: ds.boxShadow,
    },
  },
  plugins: [],
};
