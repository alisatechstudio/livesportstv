/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './*.js',
  ],
  safelist: [
    'translate-y-full',
    'bg-primary',
    'text-white',
    'border-primary',
    'shadow-sm',
    'font-bold',
    'scale-105',
    'bg-surface',
    'text-ink',
    'border-edge',
    'hover:bg-card',
    'hover:border-primary/50',
    'font-semibold',
  ],
  theme: {
    extend: {
      colors: {
        surface: "var(--bg-2)",
        card: "var(--card)",
        "card-hover": "var(--card-hover)",
        ink: "var(--text)",
        muted: "var(--muted)",
        edge: "var(--border)",
        primary: "var(--primary)",
        "primary-soft": "var(--primary-soft)",
        accent: "var(--accent)",
        emerald: "var(--emerald)",
      },
      backgroundColor: {
        base: "var(--bg)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      boxShadow: {
        glass: "0 10px 30px rgba(0, 0, 0, 0.45)",
        card: "0 14px 30px rgba(0, 0, 0, 0.35)",
      },
      transitionDuration: {
        160: "160ms",
      },
    },
  },
  plugins: [],
};
