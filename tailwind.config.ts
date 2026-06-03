import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
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
  				DEFAULT: '#FCD535',
  				foreground: '#0B0E11'
  			},
  			secondary: {
  				DEFAULT: '#2B3139',
  				foreground: '#EAECEF'
  			},
  			muted: {
  				DEFAULT: '#1E2329',
  				foreground: '#848E9C'
  			},
  			accent: {
  				DEFAULT: '#FCD535',
  				foreground: '#0B0E11'
  			},
  			destructive: {
  				DEFAULT: '#F6465D',
  				foreground: '#FFFFFF'
  			},
        success: {
          DEFAULT: '#0ECB81',
          foreground: '#FFFFFF'
        },
  			border: '#2B3139',
  			input: '#2B3139',
  			ring: '#FCD535',
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
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
