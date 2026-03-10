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
      white: "#0B0D0E",
      gray: "#121417",
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
      white: "#2E3440",
      gray: "#3B4252",
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
      white: "#1A1B26",
      gray: "#16161E",
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
      gray: "#231D2F",
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
      white: "#0A1F2E",
      gray: "#0D1B2A",
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
      white: "#1C1917",
      gray: "#292524",
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
    name: "New Theme 1",
    dark: {
      primary: { main: "#FFEAD7", light: "#FFEAD7", dark: "#FFEAD7" },
      background: { dark: "#3E4260", darker: "#3E4260", accent: "#3E4260" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#3E4260", light: "#3E4260", dark: "#3E4260" },
      background: { dark: "#FFEAD7", darker: "#FFEAD7", accent: "#F5EAD7" },
      foreground: { white: "#3E4260", gray: "#3E4260" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme2",
    name: "New Theme 2",
    dark: {
      primary: { main: "#F0F5DF", light: "#F0F5DF", dark: "#F0F5DF" },
      background: { dark: "#5E9EA0", darker: "#5E9EA0", accent: "#5E9EA0" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#5E9EA0", light: "#5E9EA0", dark: "#5E9EA0" },
      background: { dark: "#F0F5DF", darker: "#F0F5DF", accent: "#E8F0D7" },
      foreground: { white: "#5E9EA0", gray: "#5E9EA0" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme3",
    name: "New Theme 3",
    dark: {
      primary: { main: "#F2EEE3", light: "#F2EEE3", dark: "#F2EEE3" },
      background: { dark: "#6B495A", darker: "#6B495A", accent: "#6B495A" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#6B495A", light: "#6B495A", dark: "#6B495A" },
      background: { dark: "#F2EEE3", darker: "#F2EEE3", accent: "#EAE6DB" },
      foreground: { white: "#6B495A", gray: "#6B495A" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme4",
    name: "New Theme 4",
    dark: {
      primary: { main: "#FFB400", light: "#FFB400", dark: "#FFB400" },
      background: { dark: "#1A1A2E", darker: "#1A1A2E", accent: "#1A1A2E" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#1A1A2E", light: "#1A1A2E", dark: "#1A1A2E" },
      background: { dark: "#FFB400", darker: "#FFB400", accent: "#F5AC00" },
      foreground: { white: "#1A1A2E", gray: "#1A1A2E" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme5",
    name: "New Theme 5",
    dark: {
      primary: { main: "#FFB400", light: "#FFB400", dark: "#FFB400" },
      background: { dark: "#667780", darker: "#667780", accent: "#667780" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#667780", light: "#667780", dark: "#667780" },
      background: { dark: "#FFB400", darker: "#FFB400", accent: "#F5AC00" },
      foreground: { white: "#667780", gray: "#667780" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme6",
    name: "New Theme 6",
    dark: {
      primary: { main: "#C96A4A", light: "#C96A4A", dark: "#C96A4A" },
      background: { dark: "#1C1F24", darker: "#1C1F24", accent: "#1C1F24" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#1C1F24", light: "#1C1F24", dark: "#1C1F24" },
      background: { dark: "#C96A4A", darker: "#C96A4A", accent: "#C16242" },
      foreground: { white: "#1C1F24", gray: "#1C1F24" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme7",
    name: "New Theme 7",
    dark: {
      primary: { main: "#4CC9F0", light: "#4CC9F0", dark: "#4CC9F0" },
      background: { dark: "#0E0F12", darker: "#0E0F12", accent: "#0E0F12" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#0E0F12", light: "#0E0F12", dark: "#0E0F12" },
      background: { dark: "#4CC9F0", darker: "#4CC9F0", accent: "#44C1E8" },
      foreground: { white: "#0E0F12", gray: "#0E0F12" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme8",
    name: "New Theme 8",
    dark: {
      primary: { main: "#C7D2D8", light: "#C7D2D8", dark: "#C7D2D8" },
      background: { dark: "#2C3A47", darker: "#2C3A47", accent: "#2C3A47" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#2C3A47", light: "#2C3A47", dark: "#2C3A47" },
      background: { dark: "#C7D2D8", darker: "#C7D2D8", accent: "#BFCAD0" },
      foreground: { white: "#2C3A47", gray: "#2C3A47" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme9",
    name: "New Theme 9",
    dark: {
      primary: { main: "#FF9E6D", light: "#FF9E6D", dark: "#FF9E6D" },
      background: { dark: "#1A2238", darker: "#1A2238", accent: "#1A2238" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#1A2238", light: "#1A2238", dark: "#1A2238" },
      background: { dark: "#FF9E6D", darker: "#FF9E6D", accent: "#F59665" },
      foreground: { white: "#1A2238", gray: "#1A2238" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme10",
    name: "New Theme 10",
    dark: {
      primary: { main: "#F5F6F7", light: "#F5F6F7", dark: "#F5F6F7" },
      background: { dark: "#2F2F33", darker: "#2F2F33", accent: "#2F2F33" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#2F2F33", light: "#2F2F33", dark: "#2F2F33" },
      background: { dark: "#F5F6F7", darker: "#F5F6F7", accent: "#EDEEEF" },
      foreground: { white: "#2F2F33", gray: "#2F2F33" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme11",
    name: "New Theme 11",
    dark: {
      primary: { main: "#E0E5E9", light: "#E0E5E9", dark: "#E0E5E9" },
      background: { dark: "#004E64", darker: "#004E64", accent: "#004E64" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#004E64", light: "#004E64", dark: "#004E64" },
      background: { dark: "#E0E5E9", darker: "#E0E5E9", accent: "#D8DDE1" },
      foreground: { white: "#004E64", gray: "#004E64" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme12",
    name: "New Theme 12",
    dark: {
      primary: { main: "#C7DDEB", light: "#C7DDEB", dark: "#C7DDEB" },
      background: { dark: "#0A2540", darker: "#0A2540", accent: "#0A2540" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#0A2540", light: "#0A2540", dark: "#0A2540" },
      background: { dark: "#C7DDEB", darker: "#C7DDEB", accent: "#BFD5E3" },
      foreground: { white: "#0A2540", gray: "#0A2540" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme13",
    name: "New Theme 13",
    dark: {
      primary: { main: "#D7CCC8", light: "#D7CCC8", dark: "#D7CCC8" },
      background: { dark: "#4E342E", darker: "#4E342E", accent: "#4E342E" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#4E342E", light: "#4E342E", dark: "#4E342E" },
      background: { dark: "#D7CCC8", darker: "#D7CCC8", accent: "#CFC4C0" },
      foreground: { white: "#4E342E", gray: "#4E342E" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme14",
    name: "New Theme 14",
    dark: {
      primary: { main: "#8A6CFF", light: "#8A6CFF", dark: "#8A6CFF" },
      background: { dark: "#0E2A47", darker: "#0E2A47", accent: "#0E2A47" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#0E2A47", light: "#0E2A47", dark: "#0E2A47" },
      background: { dark: "#8A6CFF", darker: "#8A6CFF", accent: "#8264F7" },
      foreground: { white: "#0E2A47", gray: "#0E2A47" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme15",
    name: "New Theme 15",
    dark: {
      primary: { main: "#C7D2FE", light: "#C7D2FE", dark: "#C7D2FE" },
      background: { dark: "#3AB0FF", darker: "#3AB0FF", accent: "#3AB0FF" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#3AB0FF", light: "#3AB0FF", dark: "#3AB0FF" },
      background: { dark: "#C7D2FE", darker: "#C7D2FE", accent: "#BFC9F6" },
      foreground: { white: "#3AB0FF", gray: "#3AB0FF" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme16",
    name: "New Theme 16",
    dark: {
      primary: { main: "#FAF9F6", light: "#FAF9F6", dark: "#FAF9F6" },
      background: { dark: "#007F5F", darker: "#007F5F", accent: "#007F5F" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#007F5F", light: "#007F5F", dark: "#007F5F" },
      background: { dark: "#FAF9F6", darker: "#FAF9F6", accent: "#F2F1EE" },
      foreground: { white: "#007F5F", gray: "#007F5F" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme17",
    name: "New Theme 17",
    dark: {
      primary: { main: "#E6A4B4", light: "#E6A4B4", dark: "#E6A4B4" },
      background: { dark: "#2D0A3A", darker: "#2D0A3A", accent: "#2D0A3A" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#2D0A3A", light: "#2D0A3A", dark: "#2D0A3A" },
      background: { dark: "#E6A4B4", darker: "#E6A4B4", accent: "#DEA0AC" },
      foreground: { white: "#2D0A3A", gray: "#2D0A3A" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme18",
    name: "New Theme 18",
    dark: {
      primary: { main: "#83CBBA", light: "#83CBBA", dark: "#83CBBA" },
      background: { dark: "#485A56", darker: "#485A56", accent: "#485A56" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#485A56", light: "#485A56", dark: "#485A56" },
      background: { dark: "#83CBBA", darker: "#83CBBA", accent: "#7BC3B2" },
      foreground: { white: "#485A56", gray: "#485A56" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme19",
    name: "New Theme 19",
    dark: {
      primary: { main: "#D6C1EB", light: "#D6C1EB", dark: "#D6C1EB" },
      background: { dark: "#4B1D3F", darker: "#4B1D3F", accent: "#4B1D3F" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#4B1D3F", light: "#4B1D3F", dark: "#4B1D3F" },
      background: { dark: "#D6C1EB", darker: "#D6C1EB", accent: "#CEB9E3" },
      foreground: { white: "#4B1D3F", gray: "#4B1D3F" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme20",
    name: "New Theme 20",
    dark: {
      primary: { main: "#F5D1F2", light: "#F5D1F2", dark: "#F5D1F2" },
      background: { dark: "#00388D", darker: "#00388D", accent: "#00388D" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#00388D", light: "#00388D", dark: "#00388D" },
      background: { dark: "#F5D1F2", darker: "#F5D1F2", accent: "#EDD1EA" },
      foreground: { white: "#00388D", gray: "#00388D" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme21",
    name: "New Theme 21",
    dark: {
      primary: { main: "#EAF2EF", light: "#EAF2EF", dark: "#EAF2EF" },
      background: { dark: "#912F56", darker: "#912F56", accent: "#912F56" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#912F56", light: "#912F56", dark: "#912F56" },
      background: { dark: "#EAF2EF", darker: "#EAF2EF", accent: "#E2EAE7" },
      foreground: { white: "#912F56", gray: "#912F56" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme22",
    name: "New Theme 22",
    dark: {
      primary: { main: "#E9D5E6", light: "#E9D5E6", dark: "#E9D5E6" },
      background: { dark: "#3F303D", darker: "#3F303D", accent: "#3F303D" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#3F303D", light: "#3F303D", dark: "#3F303D" },
      background: { dark: "#E9D5E6", darker: "#E9D5E6", accent: "#E1CDDE" },
      foreground: { white: "#3F303D", gray: "#3F303D" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme23",
    name: "New Theme 23",
    dark: {
      primary: { main: "#F5CE0A", light: "#F5CE0A", dark: "#F5CE0A" },
      background: { dark: "#000812", darker: "#000812", accent: "#000812" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#000812", light: "#000812", dark: "#000812" },
      background: { dark: "#F5CE0A", darker: "#F5CE0A", accent: "#EDCA02" },
      foreground: { white: "#000812", gray: "#000812" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme24",
    name: "New Theme 24",
    dark: {
      primary: { main: "#FFEFB3", light: "#FFEFB3", dark: "#FFEFB3" },
      background: { dark: "#013E37", darker: "#013E37", accent: "#013E37" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#013E37", light: "#013E37", dark: "#013E37" },
      background: { dark: "#FFEFB3", darker: "#FFEFB3", accent: "#F7E7AB" },
      foreground: { white: "#013E37", gray: "#013E37" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme25",
    name: "New Theme 25",
    dark: {
      primary: { main: "#36D0AD", light: "#36D0AD", dark: "#36D0AD" },
      background: { dark: "#00778A", darker: "#00778A", accent: "#00778A" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#00778A", light: "#00778A", dark: "#00778A" },
      background: { dark: "#36D0AD", darker: "#36D0AD", accent: "#2EC8A5" },
      foreground: { white: "#00778A", gray: "#00778A" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme26",
    name: "New Theme 26",
    dark: {
      primary: { main: "#FFF7EC", light: "#FFF7EC", dark: "#FFF7EC" },
      background: { dark: "#21AEC0", darker: "#21AEC0", accent: "#21AEC0" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#21AEC0", light: "#21AEC0", dark: "#21AEC0" },
      background: { dark: "#FFF7EC", darker: "#FFF7EC", accent: "#F7EFE4" },
      foreground: { white: "#21AEC0", gray: "#21AEC0" },
      logo: require("../../assets/images/Logo.png"),
    },
  },
  {
    id: "newtheme27",
    name: "New Theme 27",
    dark: {
      primary: { main: "#FEABEF", light: "#FEABEF", dark: "#FEABEF" },
      background: { dark: "#121909", darker: "#121909", accent: "#121909" },
      foreground: { white: "#FFFFFF", gray: "#BFC3C7" },
      logo: require("../../assets/images/Logo.png"),
    },
    light: {
      primary: { main: "#121909", light: "#121909", dark: "#121909" },
      background: { dark: "#FEABEF", darker: "#FEABEF", accent: "#F6A3E7" },
      foreground: { white: "#121909", gray: "#121909" },
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
