@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Space Grotesk", sans-serif;
}

@layer base {
  body {
    @apply antialiased selection:bg-neutral-500/30;
  }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 5px;
}

::-webkit-scrollbar-track {
  @apply bg-transparent;
}

::-webkit-scrollbar-thumb {
  @apply bg-neutral-200 dark:bg-neutral-800 rounded-full;
}

/* Typography Overrides */
h1, h2, h3, h4, h5, h6 {
  @apply font-sans tracking-tight;
}

