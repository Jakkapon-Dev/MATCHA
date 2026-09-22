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
          primary: '#042509',       // 1. สีเขียวหลักของแบรนด์ (Deep Forest Green)
          'primary-dark': '#021505',
          'primary-light': '#518F5C',
          secondary: '#518F5C',     // 3. สีเขียวมัทฉะรอง (Matcha Leaf Green)
          'secondary-light': '#E2EFE4',
          'secondary-dark': '#3E7047',
          bg: '#F1F1F1',            // 4. สีพื้นหลังหลัก (Clean Off-White)
          card: '#FFFFFF',          // สีพื้นการ์ด (Pure White)
          accent: '#C91D1D',        // 5. สีแดงไฮไลต์ / Sale / Badge (Crimson Red)
          'accent-hover': '#A81515',
          text: '#000000',          // 2. ตัวอักษรหลัก ขาว-ดำ (Pure Black)
          muted: '#666666',         // ตัวอักษรรอง (Neutral Gray)
          border: '#DCDCDC',        // เส้นขอบสไตล์คลีน
        }
      }
    },
  },
  plugins: [],
}
