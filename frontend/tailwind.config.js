// tailwind.config.js
export default {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    // darkMode is configured in CSS with @variant directive for Tailwind v4
    theme: {
        extend: {
            colors: {
                primary: "#FF6B6B",
                mint: "#7FFFD4",
                coral: "#FFAB91",
            },
            keyframes: {
                fadeIn: {
                    from: { opacity: "0", transform: "translateY(10px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                shimmer: {
                    "0%": { transform: "translateX(-100%)" },
                    "100%": { transform: "translateX(100%)" },
                },
                gradient: {
                    "0%,100%": { "background-position": "0% 50%" },
                    "50%": { "background-position": "100% 50%" },
                },
            },
            animation: {
                fadeIn: "fadeIn 0.6s ease forwards",
                shimmer: "shimmer 2s linear infinite",
                gradient: "gradient 15s ease infinite",
            },

            /** bổ sung nhỏ giúp gradient & viewport hoạt động mượt */
            backgroundImage: {
                "linear-to-r":
                    "linear-gradient(to right, var(--tw-gradient-stops))",
                "linear-to-br":
                    "linear-gradient(to bottom right, var(--tw-gradient-stops))",
            },
            minHeight: {
                dvh: "100dvh",
            },
            cursor: {
                pointer: "pointer",
            },
        },
    },
    plugins: [],
};