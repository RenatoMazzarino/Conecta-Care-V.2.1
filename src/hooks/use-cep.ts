import { useState } from 'react';
import { toast } from "sonner";

interface CepData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export function useCep() {
  const [loading, setLoading] = useState(false);

  const fetchCep = async (cep: string): Promise<CepData | null> => {
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return null;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);

      if (!response.ok) {
        throw new Error('CEP não encontrado');
      }

      const data = await response.json();

      return {
        street: data.street,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
      };
    } catch (error) {
      toast.error("Erro ao buscar CEP. Verifique se o número está correto.");
      console.error(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchCep, loading };
}
