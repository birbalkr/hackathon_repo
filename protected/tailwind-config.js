tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        display: ["Playfair Display", "serif"],
        sans: ["DM Sans", "sans-serif"],
      },
      colors: {
        green: {
          dark: "#0D4A1E",
          mid: "#1A6B2E",
          bright: "#2E9E50",
          light: "#5DC47A",
          pale: "#C8F0D4",
        },
        amber: { DEFAULT: "#E8A020", pale: "#FEF3DC" },
        kblue: { DEFAULT: "#1A6B9E", pale: "#EBF5FB" },
      },
    },
  },
};
