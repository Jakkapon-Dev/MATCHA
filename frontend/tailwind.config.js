/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        matcha: {
          primary: '#2D5A27',       // สีหลักของแบรนด์ (Deep Matcha Green)
          'primary-dark': '#23471E',
          'primary-light': '#3E7536',
          secondary: '#D0DEC6',     // สีพื้นหลังรอง (Soft Sage Green)
          'secondary-light': '#E2ECDC',
          'secondary-dark': '#B8CBAE',
          bg: '#FAF8F5',            // สีพื้นหลังหลัก (Warm Cream)
          card: '#F4F1EA',
          accent: '#BC5A36',        // สีสะดุดตา (Terracotta Rust / Sale / CTA)
          'accent-hover': '#A64C2B',
          text: '#2D231E',          // ตัวอักษรทั้งหมด (Deep Espresso Brown)
          muted: '#6B5E55',         // ตัวอักษรรอง (Warm Muted Brown)
          border: '#D9D3C7',        // เส้นขอบนุ่มนวล
        }
      }
    },
  },
  plugins: [],
}
