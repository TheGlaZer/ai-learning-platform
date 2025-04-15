import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { supabase } from '../app/lib-server/supabaseClient';

export interface LoginFormInputs {
  email: string;
  password: string;
}

export const useLogin = () => {
  const t = useTranslations('LoginPage');
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormInputs>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: ''
    }
  });
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      const response = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      const { error } = response;
      
      if (error) {
        setErrorMsg(error.message);
      } else {
        // Redirect to dashboard after successful login
        router.push('/dashboard');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    errorMsg,
    isLoading,
    onSubmit
  };
}; 