// src/store/cartStore.ts
import { create } from "zustand";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  status: "LIVRE" | "OCUPADO" | "FECHADO";
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  setStatus: (status: CartState["status"]) => void;
  getTotal: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  status: "LIVRE",

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        toast.success(`+1 ${item.name}`);
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      toast.success(`${item.name} adicionado!`);
      return { items: [...state.items, { ...item, quantity: 1 }] };
    });
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantity } : i
      ),
    }));
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }));
    toast.info("Item removido");
  },

  clear: () => {
    set({ items: [], status: "LIVRE" });
    toast.success("Carrinho limpo!");
  },

  setStatus: (status) => set({ status }),

  getSubtotal: () => {
    return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  getDiscount: () => {
    const subtotal = get().getSubtotal();
    // Ex: Compre 3, pague 2
    const freeItems = get().items.reduce((sum, i) => sum + Math.floor(i.quantity / 3), 0);
    return freeItems > 0 ? get().items.reduce((sum, i) => sum + i.price * Math.floor(i.quantity / 3), 0) : 0;
  },

  getTotal: () => {
    return get().getSubtotal() - get().getDiscount();
  },
}));