import { create } from "zustand";
import { CustomerType } from "@/types/orderType";
import {
  addCustomer as fbAddCustomer,
  deleteCustomer as fbDeleteCustomer,
  getCustomers as fbGetCustomers,
  updateCustomer as fbUpdateCustomer,
  getCustomerById as fbGetCustomerById,
} from "@/utils/customer/getFirestoreCustomers";

interface CustomerAppState {
  customers: CustomerType[];
  isLoading: boolean;
  loadCustomers: (userId: string) => Promise<void>;
  addCustomer: (userId: string, newCustomer: CustomerType) => Promise<void>;
  updateCustomer: (
    userId: string,
    id: string,
    updatedFields: Partial<CustomerType>
  ) => Promise<void>;
  deleteCustomer: (userId: string, id: string) => Promise<void>;
  getCustomerById: (userId: string, id: string) => Promise<CustomerType | null>;
}

export const useCustomerStore = create<CustomerAppState>((set, get) => ({
  customers: [],
  isLoading: false,

  loadCustomers: async (userId) => {
    set({ isLoading: true });
    try {
      const customers = await fbGetCustomers(userId);
      set({ customers });
    } catch (err) {
      console.error("Failed to load customers", err);
    } finally {
      set({ isLoading: false });
    }
  },

  addCustomer: async (userId, newCustomer) => {
    const newId = await fbAddCustomer(userId, newCustomer);
    set((state) => ({
      customers: [...state.customers, { ...newCustomer, id: newId }],
    }));
  },

  updateCustomer: async (userId, id, updatedFields) => {
    await fbUpdateCustomer(userId, id, updatedFields);
    set((state) => ({
      customers: state.customers.map((cust) =>
        cust.id === id ? { ...cust, ...updatedFields } : cust
      ),
    }));
  },

  deleteCustomer: async (userId, id) => {
    await fbDeleteCustomer(userId, id);
    set((state) => ({
      customers: state.customers.filter((cust) => cust.id !== id),
    }));
  },

  getCustomerById: async (userId, id) => {
    const local = get().customers.find((c) => c.id === id);
    if (local) return local;
    try {
      const customer = await fbGetCustomerById(userId, id);
      return customer || null;
    } catch (error) {
      console.error("Failed to fetch customer by ID:", error);
      return null;
    }
  },
}));
