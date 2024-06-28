/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",

        // Or if using `src` directory:
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
          backgroundClip: {
            text: 'text',
          },
          textFillColor: {
            transparent: 'transparent',
          },
          backgroundImage: {
            'gradient-to-right': 'linear-gradient(to right, transparent, blue)',
          },
        },
      },
      plugins: [
        function ({ addUtilities }) {
          addUtilities({
            '.gradient-text': {
              'background-image': 'linear-gradient(to right, transparent, blue)',
              '-webkit-background-clip': 'text',
              '-webkit-text-fill-color': 'transparent',
            },
          });
        },
      ],
}


