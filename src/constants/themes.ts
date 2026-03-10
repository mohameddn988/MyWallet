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

export interface ThemeVariant {
  id: string;
  name: string;
  light: Theme;
  dark: Theme;
}

// Default Theme Variant
const defaultVariant: ThemeVariant = {
  id: "default",
  name: "Default",
  dark: {
    primary: {
      main: "#C8F14A",
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
  },
  light: {
    primary: {
      main: "#0B0D0E",
      light: "#121417",
      dark: "#1B1F24",
    },
    background: {
      dark: "#C8F14A",
      darker: "#A4E600",
      accent: "#D6F45F",
    },
    foreground: {
      white: "#1C1825",
      gray: "#1C1825",
    },
    logo: require("../../assets/images/Logo.png"),
  },
};

// Nord Theme Variant
const nordVariant: ThemeVariant = {
  id: "nord",
  name: "Nord",
  dark: {
    primary: {
      main: "#88C0D0",
      light: "#8FBCBB",
      dark: "#5E81AC",
    },
    background: {
      dark: "#2E3440",
      darker: "#3B4252",
      accent: "#434C5E",
    },
    foreground: {
      white: "#ECEFF4",
      gray: "#D8DEE9",
    },
    logo: require("../../assets/images/Logo.png"),
  },
  light: {
    primary: {
      main: "#2E3440",
      light: "#3B4252",
      dark: "#434C5E",
    },
    background: {
      dark: "#88C0D0",
      darker: "#5E81AC",
      accent: "#8FBCBB",
    },
    foreground: {
      white: "#1C1825",
      gray: "#1C1825",
    },
    logo: require("../../assets/images/Logo.png"),
  },
};

// Sapphire Theme Variant
const sapphireVariant: ThemeVariant = {
  id: "sapphire",
  name: "Sapphire",
  dark: {
    primary: {
      main: "#7AA2F7",
      light: "#9EBBFF",
      dark: "#5A8AE5",
    },
    background: {
      dark: "#1A1B26",
      darker: "#16161E",
      accent: "#24283B",
    },
    foreground: {
      white: "#C0CAF5",
      gray: "#A9B1D6",
    },
    logo: require("../../assets/images/Logo.png"),
  },
  light: {
    primary: {
      main: "#1A1B26",
      light: "#16161E",
      dark: "#24283B",
    },
    background: {
      dark: "#7AA2F7",
      darker: "#5A8AE5",
      accent: "#9EBBFF",
    },
    foreground: {
      white: "#1C1825",
      gray: "#1C1825",
    },
    logo: require("../../assets/images/Logo.png"),
  },
};

// Strawberry Daiquiri Theme Variant
const strawberryVariant: ThemeVariant = {
  id: "strawberry",
  name: "Strawberry Daiquiri",
  dark: {
    primary: {
      main: "#FF6B9D",
      light: "#FF8FB8",
      dark: "#E05482",
    },
    background: {
      dark: "#1C1825",
      darker: "#231D2F",
      accent: "#2D2639",
    },
    foreground: {
      white: "#E0DEF4",
      gray: "#C4B5FD",
    },
    logo: require("../../assets/images/Logo.png"),
  },
  light: {
    primary: {
      main: "#1C1825",
      light: "#231D2F",
      dark: "#2D2639",
    },
    background: {
      dark: "#FF6B9D",
      darker: "#E05482",
      accent: "#FF8FB8",
    },
    foreground: {
      white: "#1C1825",
      gray: "#1C1825",
    },
    logo: require("../../assets/images/Logo.png"),
  },
};

// Ocean Theme Variant
const oceanVariant: ThemeVariant = {
  id: "ocean",
  name: "Ocean",
  dark: {
    primary: {
      main: "#56C6E8",
      light: "#7DD6F3",
      dark: "#3BA5C7",
    },
    background: {
      dark: "#0A1F2E",
      darker: "#0D1B2A",
      accent: "#1B2B3A",
    },
    foreground: {
      white: "#E8F4F8",
      gray: "#B8D4E0",
    },
    logo: require("../../assets/images/Logo.png"),
  },
  light: {
    primary: {
      main: "#0A1F2E",
      light: "#0D1B2A",
      dark: "#1B2B3A",
    },
    background: {
      dark: "#56C6E8",
      darker: "#3BA5C7",
      accent: "#7DD6F3",
    },
    foreground: {
      white: "#1C1825",
      gray: "#1C1825",
    },
    logo: require("../../assets/images/Logo.png"),
  },
};

// Amber Theme Variant
const amberVariant: ThemeVariant = {
  id: "amber",
  name: "Amber",
  dark: {
    primary: {
      main: "#FDB813",
      light: "#FDCB3D",
      dark: "#E59F00",
    },
    background: {
      dark: "#1C1917",
      darker: "#292524",
      accent: "#44403C",
    },
    foreground: {
      white: "#FAFAF9",
      gray: "#D6D3D1",
    },
    logo: require("../../assets/images/Logo.png"),
  },
  light: {
    primary: {
      main: "#1C1917",
      light: "#292524",
      dark: "#44403C",
    },
    background: {
      dark: "#FDB813",
      darker: "#E59F00",
      accent: "#FDCB3D",
    },
    foreground: {
      white: "#1C1825",
      gray: "#1C1825",
    },
    logo: require("../../assets/images/Logo.png"),
  },
};

export const themeVariants: ThemeVariant[] = [
  defaultVariant,
  nordVariant,
  sapphireVariant,
  strawberryVariant,
  oceanVariant,
  amberVariant,
  // New themes added below with inverted color logic
  // Each pair: darker color = dark mode background, lighter color = dark mode primary
  // Light mode: invert - primary becomes background, background becomes primary
  {
    id: "newtheme1",
    name: "Twilight Peach",
    dark: {
      primary: { main: "#FFEAD7", light: "#FFEAD7", dark: "#FFEAD7" },
      background: { dark: "#3E4260", darker: "#353858", accent: "#4B5070" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#3E4260", light: "#3E4260", dark: "#3E4260" },
      background: { dark: "#FFEAD7", darker: "#F5DFC9", accent: "#EBD3BC" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme2",
    name: "Sea Sage",
    dark: {
      primary: { main: "#F0F5DF", light: "#F0F5DF", dark: "#F0F5DF" },
      background: { dark: "#5E9EA0", darker: "#4E8486", accent: "#6CB0B2" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#5E9EA0", light: "#5E9EA0", dark: "#5E9EA0" },
      background: { dark: "#F0F5DF", darker: "#E5EAD3", accent: "#D9DFC6" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme3",
    name: "Rose Ivory",
    dark: {
      primary: { main: "#F2EEE3", light: "#F2EEE3", dark: "#F2EEE3" },
      background: { dark: "#6B495A", darker: "#59394A", accent: "#7D5A6C" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#6B495A", light: "#6B495A", dark: "#6B495A" },
      background: { dark: "#F2EEE3", darker: "#E8E3D7", accent: "#DDD8CB" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme4",
    name: "Midnight Gold",
    dark: {
      primary: { main: "#FFB400", light: "#FFB400", dark: "#FFB400" },
      background: { dark: "#1A1A2E", darker: "#121224", accent: "#252543" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#1A1A2E", light: "#1A1A2E", dark: "#1A1A2E" },
      background: { dark: "#FFB400", darker: "#F0A900", accent: "#E09C00" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme5",
    name: "Slate Amber",
    dark: {
      primary: { main: "#FFB400", light: "#FFB400", dark: "#FFB400" },
      background: { dark: "#667780", darker: "#57666E", accent: "#748895" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#667780", light: "#667780", dark: "#667780" },
      background: { dark: "#FFB400", darker: "#F0A900", accent: "#E09C00" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme6",
    name: "Ember",
    dark: {
      primary: { main: "#C96A4A", light: "#C96A4A", dark: "#C96A4A" },
      background: { dark: "#1C1F24", darker: "#14171B", accent: "#282C33" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#1C1F24", light: "#1C1F24", dark: "#1C1F24" },
      background: { dark: "#C96A4A", darker: "#BE5D3D", accent: "#B35030" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme7",
    name: "Electric Blue",
    dark: {
      primary: { main: "#4CC9F0", light: "#4CC9F0", dark: "#4CC9F0" },
      background: { dark: "#0E0F12", darker: "#07080A", accent: "#181A1F" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#0E0F12", light: "#0E0F12", dark: "#0E0F12" },
      background: { dark: "#4CC9F0", darker: "#3BBDE4", accent: "#2AB1D8" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme8",
    name: "Steel",
    dark: {
      primary: { main: "#C7D2D8", light: "#C7D2D8", dark: "#C7D2D8" },
      background: { dark: "#2C3A47", darker: "#22303D", accent: "#374858" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#2C3A47", light: "#2C3A47", dark: "#2C3A47" },
      background: { dark: "#C7D2D8", darker: "#B8C4CB", accent: "#A9B6BE" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme9",
    name: "Coral Night",
    dark: {
      primary: { main: "#FF9E6D", light: "#FF9E6D", dark: "#FF9E6D" },
      background: { dark: "#1A2238", darker: "#12192E", accent: "#242F4C" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#1A2238", light: "#1A2238", dark: "#1A2238" },
      background: { dark: "#FF9E6D", darker: "#F09260", accent: "#E18653" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme10",
    name: "Silver",
    dark: {
      primary: { main: "#F5F6F7", light: "#F5F6F7", dark: "#F5F6F7" },
      background: { dark: "#2F2F33", darker: "#252528", accent: "#3C3C41" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#2F2F33", light: "#2F2F33", dark: "#2F2F33" },
      background: { dark: "#F5F6F7", darker: "#E9EBEC", accent: "#DCDFE1" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme11",
    name: "Pearl Teal",
    dark: {
      primary: { main: "#E0E5E9", light: "#E0E5E9", dark: "#E0E5E9" },
      background: { dark: "#004E64", darker: "#003D50", accent: "#006280" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#004E64", light: "#004E64", dark: "#004E64" },
      background: { dark: "#E0E5E9", darker: "#D2D8DC", accent: "#C4CBCF" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme12",
    name: "Iceberg",
    dark: {
      primary: { main: "#C7DDEB", light: "#C7DDEB", dark: "#C7DDEB" },
      background: { dark: "#0A2540", darker: "#071C33", accent: "#102E52" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#0A2540", light: "#0A2540", dark: "#0A2540" },
      background: { dark: "#C7DDEB", darker: "#B8CFDE", accent: "#A9C1D1" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme13",
    name: "Espresso",
    dark: {
      primary: { main: "#D7CCC8", light: "#D7CCC8", dark: "#D7CCC8" },
      background: { dark: "#4E342E", darker: "#3E2923", accent: "#5E4038" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#4E342E", light: "#4E342E", dark: "#4E342E" },
      background: { dark: "#D7CCC8", darker: "#CABFBA", accent: "#BDB2AE" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme14",
    name: "Midnight Violet",
    dark: {
      primary: { main: "#8A6CFF", light: "#8A6CFF", dark: "#8A6CFF" },
      background: { dark: "#0E2A47", darker: "#0A1F38", accent: "#163458" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#0E2A47", light: "#0E2A47", dark: "#0E2A47" },
      background: { dark: "#8A6CFF", darker: "#7B5EF2", accent: "#6C50E5" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme15",
    name: "Azure",
    dark: {
      primary: { main: "#C7D2FE", light: "#C7D2FE", dark: "#C7D2FE" },
      background: { dark: "#3AB0FF", darker: "#2EA0EF", accent: "#4BBEFF" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#3AB0FF", light: "#3AB0FF", dark: "#3AB0FF" },
      background: { dark: "#C7D2FE", darker: "#B8C4F8", accent: "#A9B6F2" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme16",
    name: "Emerald Isle",
    dark: {
      primary: { main: "#FAF9F6", light: "#FAF9F6", dark: "#FAF9F6" },
      background: { dark: "#007F5F", darker: "#006B4F", accent: "#009670" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#007F5F", light: "#007F5F", dark: "#007F5F" },
      background: { dark: "#FAF9F6", darker: "#EEEDE9", accent: "#E2E1DC" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme17",
    name: "Nightbloom",
    dark: {
      primary: { main: "#E6A4B4", light: "#E6A4B4", dark: "#E6A4B4" },
      background: { dark: "#2D0A3A", darker: "#22082D", accent: "#3C1050" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#2D0A3A", light: "#2D0A3A", dark: "#2D0A3A" },
      background: { dark: "#E6A4B4", darker: "#D896A6", accent: "#CA8898" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme18",
    name: "Sage",
    dark: {
      primary: { main: "#83CBBA", light: "#83CBBA", dark: "#83CBBA" },
      background: { dark: "#485A56", darker: "#3A4A46", accent: "#566B66" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#485A56", light: "#485A56", dark: "#485A56" },
      background: { dark: "#83CBBA", darker: "#75BDAC", accent: "#67AF9E" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme19",
    name: "Plum",
    dark: {
      primary: { main: "#D6C1EB", light: "#D6C1EB", dark: "#D6C1EB" },
      background: { dark: "#4B1D3F", darker: "#3C1732", accent: "#5C2450" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#4B1D3F", light: "#4B1D3F", dark: "#4B1D3F" },
      background: { dark: "#D6C1EB", darker: "#C8B3DE", accent: "#BAA5D1" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme20",
    name: "Cobalt Bloom",
    dark: {
      primary: { main: "#F5D1F2", light: "#F5D1F2", dark: "#F5D1F2" },
      background: { dark: "#00388D", darker: "#002D75", accent: "#0044AA" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#00388D", light: "#00388D", dark: "#00388D" },
      background: { dark: "#F5D1F2", darker: "#E8C3E5", accent: "#DBB5D8" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme21",
    name: "Raspberry",
    dark: {
      primary: { main: "#EAF2EF", light: "#EAF2EF", dark: "#EAF2EF" },
      background: { dark: "#912F56", darker: "#7A2648", accent: "#A8396A" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#912F56", light: "#912F56", dark: "#912F56" },
      background: { dark: "#EAF2EF", darker: "#DBE5E2", accent: "#CCD8D5" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme22",
    name: "Mauve Noir",
    dark: {
      primary: { main: "#E9D5E6", light: "#E9D5E6", dark: "#E9D5E6" },
      background: { dark: "#3F303D", darker: "#322631", accent: "#4E3D4C" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#3F303D", light: "#3F303D", dark: "#3F303D" },
      background: { dark: "#E9D5E6", darker: "#DCC7D9", accent: "#CFB9CC" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme23",
    name: "Void Gold",
    dark: {
      primary: { main: "#F5CE0A", light: "#F5CE0A", dark: "#F5CE0A" },
      background: { dark: "#000812", darker: "#00050D", accent: "#0A1020" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#000812", light: "#000812", dark: "#000812" },
      background: { dark: "#F5CE0A", darker: "#E8C200", accent: "#D9B600" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme24",
    name: "Champagne Forest",
    dark: {
      primary: { main: "#FFEFB3", light: "#FFEFB3", dark: "#FFEFB3" },
      background: { dark: "#013E37", darker: "#01302B", accent: "#024D44" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#013E37", light: "#013E37", dark: "#013E37" },
      background: { dark: "#FFEFB3", darker: "#F5E3A0", accent: "#EBD78E" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme25",
    name: "Teal Sand",
    dark: {
      primary: { main: "#e6D0AD", light: "#e6D0AD", dark: "#e6D0AD" },
      background: { dark: "#00778A", darker: "#006273", accent: "#008EA4" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#00778A", light: "#00778A", dark: "#00778A" },
      background: { dark: "#36D0AD", darker: "#28C29F", accent: "#1AB491" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme26",
    name: "Cyan Cream",
    dark: {
      primary: { main: "#FFF7EC", light: "#FFF7EC", dark: "#FFF7EC" },
      background: { dark: "#21AEC0", darker: "#1A98AA", accent: "#28C4D8" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#21AEC0", light: "#21AEC0", dark: "#21AEC0" },
      background: { dark: "#FFF7EC", darker: "#F5EBD8", accent: "#EADFC4" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme27",
    name: "Neon Blossom",
    dark: {
      primary: { main: "#FEABEF", light: "#FEABEF", dark: "#FEABEF" },
      background: { dark: "#121909", darker: "#0C1206", accent: "#1A2410" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#121909", light: "#121909", dark: "#121909" },
      background: { dark: "#FEABEF", darker: "#F49EE0", accent: "#EA91D1" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme28",
    name: "Olive Linen",
    dark: {
      primary: { main: "#DAD7CD", light: "#DAD7CD", dark: "#DAD7CD" },
      background: { dark: "#97A87A", darker: "#8A9C6A", accent: "#A5B88A" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#97A87A", light: "#97A87A", dark: "#97A87A" },
      background: { dark: "#DAD7CD", darker: "#CDD0C4", accent: "#C0C3BB" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme29",
    name: "Neon Jungle",
    dark: {
      primary: { main: "#F8FE06", light: "#F8FE06", dark: "#F8FE06" },
      background: { dark: "#02C57A", darker: "#01A868", accent: "#03DA89" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#02C57A", light: "#02C57A", dark: "#02C57A" },
      background: { dark: "#F8FE06", darker: "#E8EE00", accent: "#D8DE00" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme30",
    name: "Pink Noir",
    dark: {
      primary: { main: "#FEABEF", light: "#FEABEF", dark: "#FEABEF" },
      background: { dark: "#121909", darker: "#0C1206", accent: "#1A2410" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#121909", light: "#121909", dark: "#121909" },
      background: { dark: "#FEABEF", darker: "#F49EE0", accent: "#EA91D1" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme31",
    name: "Moss & Lime",
    dark: {
      primary: { main: "#D5EF84", light: "#D5EF84", dark: "#D5EF84" },
      background: { dark: "#40554C", darker: "#344740", accent: "#4D6358" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#40554C", light: "#40554C", dark: "#40554C" },
      background: { dark: "#D5EF84", darker: "#C8E275", accent: "#BBD566" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme32",
    name: "Linen",
    dark: {
      primary: { main: "#F7F8E2", light: "#F7F8E2", dark: "#F7F8E2" },
      background: { dark: "#DFDECA", darker: "#D2D1BC", accent: "#CCCBB5" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#DFDECA", light: "#DFDECA", dark: "#DFDECA" },
      background: { dark: "#F7F8E2", darker: "#ECEFD3", accent: "#E1E6C4" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme33",
    name: "Urban Green",
    dark: {
      primary: { main: "#9CCD62", light: "#9CCD62", dark: "#9CCD62" },
      background: { dark: "#3A3C42", darker: "#2E3038", accent: "#464850" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#3A3C42", light: "#3A3C42", dark: "#3A3C42" },
      background: { dark: "#9CCD62", darker: "#90C054", accent: "#84B346" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme34",
    name: "Copper",
    dark: {
      primary: { main: "#B17457", light: "#B17457", dark: "#B17457" },
      background: { dark: "#4A4947", darker: "#3D3C3A", accent: "#575655" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#4A4947", light: "#4A4947", dark: "#4A4947" },
      background: { dark: "#B17457", darker: "#A5684A", accent: "#995C3D" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme35",
    name: "Desert Sky",
    dark: {
      primary: { main: "#5FC0FB", light: "#5FC0FB", dark: "#5FC0FB" },
      background: { dark: "#B8A58D", darker: "#AC9880", accent: "#C4B29A" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#B8A58D", light: "#B8A58D", dark: "#B8A58D" },
      background: { dark: "#5FC0FB", darker: "#50B3EE", accent: "#41A6E1" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme36",
    name: "Galactic",
    dark: {
      primary: { main: "#982598", light: "#982598", dark: "#982598" },
      background: { dark: "#15173D", darker: "#0E1030", accent: "#1E1F4A" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#15173D", light: "#15173D", dark: "#15173D" },
      background: { dark: "#982598", darker: "#8A1F89", accent: "#7C197A" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme37",
    name: "Matrix",
    dark: {
      primary: { main: "#3DF2E0", light: "#3DF2E0", dark: "#3DF2E0" },
      background: { dark: "#0B0F14", darker: "#060A0F", accent: "#131820" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#0B0F14", light: "#0B0F14", dark: "#0B0F14" },
      background: { dark: "#3DF2E0", darker: "#2FE5D3", accent: "#21D8C6" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme38",
    name: "Neon Green",
    dark: {
      primary: { main: "#00FF88", light: "#00FF88", dark: "#00FF88" },
      background: { dark: "#0B0B0B", darker: "#060606", accent: "#141414" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#0B0B0B", light: "#0B0B0B", dark: "#0B0B0B" },
      background: { dark: "#00FF88", darker: "#00EE79", accent: "#00DD6A" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme39",
    name: "Stormy Peach",
    dark: {
      primary: { main: "#FFA77F", light: "#FFA77F", dark: "#FFA77F" },
      background: { dark: "#1F2937", darker: "#161D2A", accent: "#2A3546" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#1F2937", light: "#1F2937", dark: "#1F2937" },
      background: { dark: "#FFA77F", darker: "#F59A70", accent: "#EB8D61" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme40",
    name: "Dark Matter",
    dark: {
      primary: { main: "#5C2CF4", light: "#5C2CF4", dark: "#5C2CF4" },
      background: { dark: "#040405", darker: "#020203", accent: "#0B0B10" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#040405", light: "#040405", dark: "#040405" },
      background: { dark: "#5C2CF4", darker: "#4E1EE6", accent: "#4010D8" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme41",
    name: "Ultraviolet",
    dark: {
      primary: { main: "#E445FF", light: "#E445FF", dark: "#E445FF" },
      background: { dark: "#141418", darker: "#0E0E12", accent: "#1E1E24" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#141418", light: "#141418", dark: "#141418" },
      background: { dark: "#E445FF", darker: "#D636EF", accent: "#C827DF" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme42",
    name: "Acid Night",
    dark: {
      primary: { main: "#B6FF3B", light: "#B6FF3B", dark: "#B6FF3B" },
      background: { dark: "#0C1A2B", darker: "#071321", accent: "#132235" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#0C1A2B", light: "#0C1A2B", dark: "#0C1A2B" },
      background: { dark: "#B6FF3B", darker: "#A8F22C", accent: "#9AE51D" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme43",
    name: "Sky Blue",
    dark: {
      primary: { main: "#DDE3EA", light: "#DDE3EA", dark: "#DDE3EA" },
      background: { dark: "#4FC3F7", darker: "#40B6EA", accent: "#5ECFFF" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#4FC3F7", light: "#4FC3F7", dark: "#4FC3F7" },
      background: { dark: "#DDE3EA", darker: "#CDD5DD", accent: "#BDC7D0" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme44",
    name: "Indigo",
    dark: {
      primary: { main: "#7C83FF", light: "#7C83FF", dark: "#7C83FF" },
      background: { dark: "#1F2140", darker: "#181A33", accent: "#282B50" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#1F2140", light: "#1F2140", dark: "#1F2140" },
      background: { dark: "#7C83FF", darker: "#6D74F2", accent: "#5E65E5" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme45",
    name: "Deep Mint",
    dark: {
      primary: { main: "#2EF2E2", light: "#2EF2E2", dark: "#2EF2E2" },
      background: { dark: "#0F2F2F", darker: "#092424", accent: "#163A3A" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#0F2F2F", light: "#0F2F2F", dark: "#0F2F2F" },
      background: { dark: "#2EF2E2", darker: "#20E5D5", accent: "#12D8C8" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme46",
    name: "Electric Jungle",
    dark: {
      primary: { main: "#A4F000", light: "#A4F000", dark: "#A4F000" },
      background: { dark: "#003F3A", darker: "#00322E", accent: "#004E48" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#003F3A", light: "#003F3A", dark: "#003F3A" },
      background: { dark: "#A4F000", darker: "#96E300", accent: "#88D600" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme47",
    name: "Blazing Night",
    dark: {
      primary: { main: "#F97316", light: "#F97316", dark: "#F97316" },
      background: { dark: "#1A1A2E", darker: "#121224", accent: "#252543" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#1A1A2E", light: "#1A1A2E", dark: "#1A1A2E" },
      background: { dark: "#F97316", darker: "#EC680A", accent: "#DF5D00" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme48",
    name: "Crimson",
    dark: {
      primary: { main: "#D7263D", light: "#D7263D", dark: "#D7263D" },
      background: { dark: "#1B1B1E", darker: "#131315", accent: "#262629" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#1B1B1E", light: "#1B1B1E", dark: "#1B1B1E" },
      background: { dark: "#D7263D", darker: "#CA1C33", accent: "#BD1229" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme49",
    name: "Sunburst",
    dark: {
      primary: { main: "#FED141", light: "#FED141", dark: "#FED141" },
      background: { dark: "#C15910", darker: "#A84D0C", accent: "#D46215" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#C15910", light: "#C15910", dark: "#C15910" },
      background: { dark: "#FED141", darker: "#F0C530", accent: "#E8B820" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme50",
    name: "Forest",
    dark: {
      primary: { main: "#5E7C3C", light: "#5E7C3C", dark: "#5E7C3C" },
      background: { dark: "#223631", darker: "#1A2C28", accent: "#2B4239" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#223631", light: "#223631", dark: "#223631" },
      background: { dark: "#5E7C3C", darker: "#527030", accent: "#4A6428" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme51",
    name: "Maritime",
    dark: {
      primary: { main: "#94BBCF", light: "#94BBCF", dark: "#94BBCF" },
      background: { dark: "#001D51", darker: "#001440", accent: "#002464" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#001D51", light: "#001D51", dark: "#001D51" },
      background: { dark: "#94BBCF", darker: "#85ACC0", accent: "#759DB1" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme52",
    name: "Amethyst",
    dark: {
      primary: { main: "#EBDEFC", light: "#EBDEFC", dark: "#EBDEFC" },
      background: { dark: "#8246AF", darker: "#6E389B", accent: "#9554C3" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#8246AF", light: "#8246AF", dark: "#8246AF" },
      background: { dark: "#EBDEFC", darker: "#DDD0F0", accent: "#CFC2E4" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme53",
    name: "Graphite",
    dark: {
      primary: { main: "#E9E8E4", light: "#E9E8E4", dark: "#E9E8E4" },
      background: { dark: "#424348", darker: "#35363B", accent: "#4F5057" },
      foreground: { white: "#ECEFF4", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#424348", light: "#424348", dark: "#424348" },
      background: { dark: "#E9E8E4", darker: "#DCDBD7", accent: "#CFCECA" },
      foreground: { white: "#1C1825", gray: "#1C1825" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
];

export type ThemeMode = "system" | "light" | "dark";

// Helper function to get theme by variant and mode
export function getThemeByVariantAndMode(
  variantId: string,
  mode: "light" | "dark"
): Theme {
  const variant = themeVariants.find((v) => v.id === variantId) || defaultVariant;
  return mode === "light" ? variant.light : variant.dark;
}
