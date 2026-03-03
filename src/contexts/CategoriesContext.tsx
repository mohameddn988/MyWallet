import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../data/categories";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "expense" | "income";
  isArchived?: boolean;
  order?: number;
  createdAt: string;
}

interface CategoriesContextType {
  categories: Category[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  isLoading: boolean;
  addCategory: (category: Omit<Category, "id" | "createdAt">) => Promise<Category>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  archiveCategory: (id: string) => Promise<void>;
  unarchiveCategory: (id: string) => Promise<void>;
  reorderCategories: (type: "expense" | "income", categoryIds: string[]) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  resetCategories: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

const STORAGE_KEY = "@mywallet_categories";

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load categories from storage or initialize with defaults
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setCategories(JSON.parse(stored));
        } else {
          // Initialize with default categories
          const defaultCategories: Category[] = [
            ...EXPENSE_CATEGORIES.map((cat, idx) => ({
              ...cat,
              order: idx,
              createdAt: new Date().toISOString(),
            })),
            ...INCOME_CATEGORIES.map((cat, idx) => ({
              ...cat,
              order: idx,
              createdAt: new Date().toISOString(),
            })),
          ];
          setCategories(defaultCategories);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCategories));
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Save categories to storage whenever they change
  const saveCategories = useCallback(async (cats: Category[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
      setCategories(cats);
    } catch (error) {
      console.error("Error saving categories:", error);
    }
  }, []);

  const addCategory = useCallback(
    async (categoryData: Omit<Category, "id" | "createdAt">) => {
      const newCategory: Category = {
        ...categoryData,
        id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString(),
        order:
          categories.filter((c) => c.type === categoryData.type && !c.isArchived).length,
      };
      const updated = [...categories, newCategory];
      await saveCategories(updated);
      return newCategory;
    },
    [categories, saveCategories]
  );

  const updateCategory = useCallback(
    async (category: Category) => {
      const updated = categories.map((c) => (c.id === category.id ? category : c));
      await saveCategories(updated);
    },
    [categories, saveCategories]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const updated = categories.filter((c) => c.id !== id);
      await saveCategories(updated);
    },
    [categories, saveCategories]
  );

  const archiveCategory = useCallback(
    async (id: string) => {
      const updated = categories.map((c) =>
        c.id === id ? { ...c, isArchived: true } : c
      );
      await saveCategories(updated);
    },
    [categories, saveCategories]
  );

  const unarchiveCategory = useCallback(
    async (id: string) => {
      const updated = categories.map((c) =>
        c.id === id ? { ...c, isArchived: false } : c
      );
      await saveCategories(updated);
    },
    [categories, saveCategories]
  );

  const reorderCategories = useCallback(
    async (type: "expense" | "income", categoryIds: string[]) => {
      const updated = categories.map((c) => {
        if (c.type === type) {
          const newOrder = categoryIds.indexOf(c.id);
          return newOrder >= 0 ? { ...c, order: newOrder } : c;
        }
        return c;
      });
      await saveCategories(updated);
    },
    [categories, saveCategories]
  );

  const getCategoryById = useCallback(
    (id: string) => {
      return categories.find((c) => c.id === id);
    },
    [categories]
  );

  const resetCategories = useCallback(async () => {
    const defaultCategories: Category[] = [
      ...EXPENSE_CATEGORIES.map((cat, idx) => ({
        ...cat,
        order: idx,
        createdAt: new Date().toISOString(),
      })),
      ...INCOME_CATEGORIES.map((cat, idx) => ({
        ...cat,
        order: idx,
        createdAt: new Date().toISOString(),
      })),
    ];
    await saveCategories(defaultCategories);
  }, [saveCategories]);

  const expenseCategories = categories
    .filter((c) => c.type === "expense" && !c.isArchived)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const incomeCategories = categories
    .filter((c) => c.type === "income" && !c.isArchived)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        expenseCategories,
        incomeCategories,
        isLoading,
        addCategory,
        updateCategory,
        deleteCategory,
        archiveCategory,
        unarchiveCategory,
        reorderCategories,
        getCategoryById,
        resetCategories,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error("useCategories must be used within CategoriesProvider");
  }
  return context;
}
