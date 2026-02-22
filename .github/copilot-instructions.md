# Copilot Instructions — MyWallet

## Stack
- **Expo SDK 54** + **Expo Router v6** (file-based routing, `src/app/`)
- **React Native new architecture** (`newArchEnabled: true`) + React Compiler (`reactCompiler: true`)
- Package manager: **bun** (`bun add <pkg>`, `bun expo start`)
- Run dev: `bun expo start` · Android: `bun expo start --android`

## Routing architecture
File-based routing lives under `src/app/`. **Route groups do not have their own `_layout.tsx`** — all screens are registered directly in the root `src/app/_layout.tsx` `<Stack>`:

```tsx
<Stack.Screen name="index" />
<Stack.Screen name="auth/index" />
<Stack.Screen name="home/index" />
```

Adding a new screen = create the file + add a `<Stack.Screen>` entry in `_layout.tsx`.

`typedRoutes: true` is enabled. Until the type map regenerates, cast new routes: `router.navigate("/new-screen" as any)`.

## Entry / auth flow
`src/app/index.tsx` is the sole entry point. It shows the splash screen, waits for both the animation and `AuthContext.isLoading` to resolve, then navigates:
- `authMode === null` → `/auth`
- `authMode` is `"online"` or `"offline"` → `/home`

Never add redirect logic in `_layout.tsx` — it causes double renders.

## Theming
Single theme (`default`) defined in `src/constants/themes.ts`. Every screen consumes it with `makeStyles`:

```tsx
const { theme } = useTheme(); // from src/contexts/ThemeContext
const styles = makeStyles(theme);

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({ ... });
}
```

Always set `backgroundColor: theme.background.dark` on `SafeAreaView` and screen roots to prevent white flashes. Key tokens: `theme.primary.main` (#C8F14A green), `theme.background.dark/darker/accent`, `theme.foreground.white/gray`.

## Auth context
`src/contexts/AuthContext.tsx` exposes:
- `authMode: "online" | "offline" | null` — `null` means unauthenticated
- `isLoading: boolean` — AsyncStorage session loading
- `signInWithGoogle()` — **stub only**, logs to console
- `continueOffline()` — sets `authMode = "offline"`, persists to AsyncStorage

For one-off auth checks outside React components use `src/utils/auth.ts` → `auth.isLoggedIn()`.

## Provider order (must not change)
```
GestureHandlerRootView → ThemeProvider → AuthProvider → SafeAreaProvider → SafeAreaView
```

## Asset paths
Assets live at the workspace root `assets/`. From `src/constants/` the path is `../../assets/images/Logo.png`. The logo is exposed via `theme.logo` — prefer `theme.logo` over hardcoding the require path.

## Conventions
- No NativeWind yet — use `StyleSheet.create` via `makeStyles(theme)` only
- Use `Pressable` (not `TouchableOpacity`); apply `pressed && styles.pressed` (`opacity: 0.7`) for feedback
- Border color for dividers/inputs: `"#2C3139"`
- `@react-native-async-storage/async-storage` keys are prefixed `@mywallet_`
- `expo-linear-gradient` is installed (used in `SplashScreen`)
