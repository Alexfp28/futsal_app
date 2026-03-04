/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#164bf0",
          50: "#e8edfc",
          100: "#c5d4f8",
          200: "#9eb8f3",
          300: "#779cee",
          400: "#5a86ea",
          500: "#164bf0",
          600: "#1143dc",
          700: "#0d37c2",
          800: "#092b9f",
          900: "#061f7c",
        },
        secondary: {
          DEFAULT: "#f6ec15",
          50: "#fefee7",
          100: "#fdfcc5",
          200: "#fbf990",
          300: "#f8f55b",
          400: "#f6f032",
          500: "#f6ec15",
          600: "#e0d40a",
          700: "#b8ab08",
          800: "#918206",
          900: "#6b6104",
        },
        tertiary: {
          DEFAULT: "#708cc5",
          50: "#f0f3fa",
          100: "#dce3f3",
          200: "#c4d0ea",
          300: "#a8bcdf",
          400: "#8aa4d3",
          500: "#708cc5",
          600: "#5b73b4",
          700: "#4a5c9c",
          800: "#3e4c80",
          900: "#35426a",
        },
        notion: {
          bg: "#f8f9fa",
          card: "#ffffff",
          border: "#e5e5e5",
          text: "#1a1a2e",
          muted: "#6b7280",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        notion: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)",
        "notion-hover":
          "0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        notion: "8px",
      },
    },
  },
  plugins: [],
};
