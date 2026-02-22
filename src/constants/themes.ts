export interface Theme {
  primary: {
    main: string;
    light: string;
    dark: string;
  };
  background: {
    dark: string;
    darker: string;
    accent: string;
  };
  foreground: {
    white: string;
    gray: string;
  };
  logo: any; // Image require() source
}

export const defaultTheme: Theme = {
  primary: {
    main: "#C8F14A", // Current green
    light: "#D6F45F",
    dark: "#A4E600",
  },
  background: {
    dark: "#0B0D0E",
    darker: "#121417",
    accent: "#1B1F24",
  },
  foreground: {
    white: "#FFFFFF",
    gray: "#BFC3C7",
  },
  logo: require("../../assets/images/Logo.png"),
};

export const themes = {
  default: defaultTheme,
} as const;

export type ThemeType = keyof typeof themes;
