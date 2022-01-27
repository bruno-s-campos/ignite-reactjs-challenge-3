import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stockResponse = await api.get(`stock/${productId}`);
      const stock = stockResponse.data as Stock;

      const productIndexInCart = cart.findIndex((product) => product.id === productId);

      if (productIndexInCart >= 0) {
        const product = cart[productIndexInCart];
        if (stock.amount > product.amount) {
          product.amount += 1;
          const newCart = [
            ...cart.slice(0, productIndexInCart),
            product,
            ...cart.slice(productIndexInCart + 1),
          ];
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }

        return;
      }

      const productResponse = await api.get(`products/${productId}`);
      const product = productResponse.data as Product;
      product.amount = 0;

      if (stock.amount > product.amount) {
        product.amount += 1;
        const newCart = [
          ...cart,
          product,
        ];
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

        return;
      }

      toast.error('Quantidade solicitada fora de estoque');
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    const productIndexInCart = cart.findIndex((product) => product.id === productId);
    if (productIndexInCart >= 0) {
      const newCart = [
        ...cart.filter((productInCart) => productInCart.id !== productId),
      ];
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

      return;
    }

    toast.error('Erro na remoção do produto');
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount <= 0) {
      return;
    }

    try {
      const stockResponse = await api.get(`stock/${productId}`);
      const stock = stockResponse.data as Stock;

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');

        return;
      }

      const productIndexInCart = cart.findIndex((product) => product.id === productId);
      if (productIndexInCart >= 0) {
        const product = cart[productIndexInCart];

        product.amount = amount;
        const newCart = [
          ...cart.slice(0, productIndexInCart),
          product,
          ...cart.slice(productIndexInCart + 1),
        ];
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

        return;
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
