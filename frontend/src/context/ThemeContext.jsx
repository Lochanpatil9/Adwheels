import { createContext, useContext } from 'react'
// Theme is always light — no toggling needed for simplicity
const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} })
export function ThemeProvider({ children }) {
  return <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>{children}</ThemeContext.Provider>
}
export const useTheme = () => useContext(ThemeContext)