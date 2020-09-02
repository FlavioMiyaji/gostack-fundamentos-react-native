import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      try {
        const products = await AsyncStorage.getItem('products');
        if (products !== null) {
          setProducts(JSON.parse(products));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadProducts();
  }, []);

  const updateProducts = useCallback(async () => {
    try {
      await AsyncStorage.setItem('products', JSON.stringify(products));
    } catch (err) {
      console.error(err);
    }
  }, [products]);

  const addToCart = useCallback(async product => {
    setProducts(prev => ([
      ...prev,
      { ...product, quantity: 1 },
    ]));
    updateProducts();
  }, [updateProducts]);

  const increment = useCallback(async id => {
    setProducts(prev => {
      const product = prev.find(product => product.id === id) || {} as Product;
      return [
        ...prev.filter(product => product.id !== id),
        { ...product, quantity: product.quantity + 1 },
      ];
    });
    updateProducts();
  }, [updateProducts]);

  const decrement = useCallback(async id => {
    setProducts(prev => {
      const product = prev.find(product => product.id === id) || {} as Product;
      return [
        ...prev.filter(product => product.id !== id),
        { ...product, quantity: product.quantity - 1 },
      ];
    });
    updateProducts();
  }, [updateProducts]);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
