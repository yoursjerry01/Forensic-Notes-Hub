export type CartItem = {
  id: string;
  title: string;
  subject: string;
  note_type: string | null;
  course: string | null;
  price: number;
  is_free: boolean;
  file_name: string | null;
};

const CART_KEY = "evidentia_cart";

export function getCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read cart:", error);
    return [];
  }
}

export function addToCart(item: CartItem): boolean {
  try {
    const cart = getCart();

    // Prevent duplicate notes
    if (cart.some(existingItem => existingItem.id === item.id)) {
      return false;
    }

    cart.push(item);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));

    // Notify Navbar and other components immediately
    window.dispatchEvent(new Event("cart-updated"));

    return true;
  } catch (error) {
    console.error("Failed to add item to cart:", error);
    return false;
  }
}

export function removeFromCart(id: string): void {
  try {
    const cart = getCart().filter(item => item.id !== id);

    localStorage.setItem(CART_KEY, JSON.stringify(cart));

    window.dispatchEvent(new Event("cart-updated"));
  } catch (error) {
    console.error("Failed to remove item from cart:", error);
  }
}

export function clearCart(): void {
  try {
    localStorage.removeItem(CART_KEY);

    window.dispatchEvent(new Event("cart-updated"));
  } catch (error) {
    console.error("Failed to clear cart:", error);
  }
}

export function getCartTotal(): number {
  return getCart().reduce((total, item) => {
    return total + (item.is_free ? 0 : item.price);
  }, 0);
}

export function getCartCount(): number {
  return getCart().length;
}