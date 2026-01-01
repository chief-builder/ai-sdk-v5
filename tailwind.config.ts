import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-source-sans)', 'system-ui', 'sans-serif'],
  			display: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
  		},
  		fontSize: {
  			// Senior-friendly sizes (base is 18px in globals.css)
  			'xs': ['0.75rem', { lineHeight: '1.5' }],     // 13.5px
  			'sm': ['0.875rem', { lineHeight: '1.5' }],    // 15.75px
  			'base': ['1rem', { lineHeight: '1.6' }],      // 18px
  			'lg': ['1.125rem', { lineHeight: '1.6' }],    // 20.25px
  			'xl': ['1.25rem', { lineHeight: '1.75' }],    // 22.5px - AI responses
  			'2xl': ['1.5rem', { lineHeight: '1.5' }],     // 27px
  			'3xl': ['1.75rem', { lineHeight: '1.4' }],    // 31.5px - Headlines
  			'4xl': ['2rem', { lineHeight: '1.3' }],       // 36px
  		},
  		spacing: {
  			// Extended spacing for generous padding
  			'18': '4.5rem',
  			'22': '5.5rem',
  		},
  		minHeight: {
  			// Touch target sizes
  			'touch': '44px',
  			'touch-lg': '48px',
  		},
  		minWidth: {
  			'touch': '44px',
  			'touch-lg': '48px',
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			xl: 'calc(var(--radius) + 4px)',
  		},
  		boxShadow: {
  			'warm': '0 2px 8px -2px rgba(45, 49, 66, 0.08), 0 4px 16px -4px rgba(45, 49, 66, 0.12)',
  			'warm-lg': '0 4px 12px -2px rgba(45, 49, 66, 0.1), 0 8px 24px -4px rgba(45, 49, 66, 0.15)',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
