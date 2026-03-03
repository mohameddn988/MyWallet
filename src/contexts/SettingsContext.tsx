import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type FirstDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
export type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
export type NumberFormat = "1,234.56" | "1.234,56" | "1 234,56";

interface SettingsContextType {
  firstDayOfWeek: FirstDayOfWeek;
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  setFirstDayOfWeek: (day: FirstDayOfWeek) => Promise<void>;
  setDateFormat: (format: DateFormat) => Promise<void>;
  setNumberFormat: (format: NumberFormat) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const FIRST_DAY_OF_WEEK_KEY = "@mywallet_first_day_of_week";
const DATE_FORMAT_KEY = "@mywallet_date_format";
const NUMBER_FORMAT_KEY = "@mywallet_number_format";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [firstDayOfWeek, setFirstDayOfWeekState] = useState<FirstDayOfWeek>(1); // Monday default
  const [dateFormat, setDateFormatState] = useState<DateFormat>("DD/MM/YYYY");
  const [numberFormat, setNumberFormatState] = useState<NumberFormat>("1,234.56");

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [storedFirstDay, storedDateFormat, storedNumberFormat] = await Promise.all([
          AsyncStorage.getItem(FIRST_DAY_OF_WEEK_KEY),
          AsyncStorage.getItem(DATE_FORMAT_KEY),
          AsyncStorage.getItem(NUMBER_FORMAT_KEY),
        ]);

        if (storedFirstDay !== null) {
          setFirstDayOfWeekState(parseInt(storedFirstDay) as FirstDayOfWeek);
        }
        if (storedDateFormat) {
          setDateFormatState(storedDateFormat as DateFormat);
        }
        if (storedNumberFormat) {
          setNumberFormatState(storedNumberFormat as NumberFormat);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadSettings();
  }, []);

  const setFirstDayOfWeek = async (day: FirstDayOfWeek) => {
    try {
      setFirstDayOfWeekState(day);
      await AsyncStorage.setItem(FIRST_DAY_OF_WEEK_KEY, day.toString());
    } catch (error) {
      console.error("Error saving first day of week:", error);
    }
  };

  const setDateFormat = async (format: DateFormat) => {
    try {
      setDateFormatState(format);
      await AsyncStorage.setItem(DATE_FORMAT_KEY, format);
    } catch (error) {
      console.error("Error saving date format:", error);
    }
  };

  const setNumberFormat = async (format: NumberFormat) => {
    try {
      setNumberFormatState(format);
      await AsyncStorage.setItem(NUMBER_FORMAT_KEY, format);
    } catch (error) {
      console.error("Error saving number format:", error);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        firstDayOfWeek,
        dateFormat,
        numberFormat,
        setFirstDayOfWeek,
        setDateFormat,
        setNumberFormat,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    // Return defaults if context is not available
    return {
      firstDayOfWeek: 1 as FirstDayOfWeek,
      dateFormat: "DD/MM/YYYY" as DateFormat,
      numberFormat: "1,234.56" as NumberFormat,
      setFirstDayOfWeek: async () => {},
      setDateFormat: async () => {},
      setNumberFormat: async () => {},
    };
  }
  return context;
}
