import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { supabase } from '../app/lib-server/supabaseClient';

export interface SignUpFormInputs {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const useSignup = () => {
  const t = useTranslations('SignupPage');
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors, isValid } 
  } = useForm<SignUpFormInputs>({
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit: SubmitHandler<SignUpFormInputs> = async (data) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    try {
      // Create a user in Supabase Auth
      const { error, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          }
        }
      });
      
      if (error) {
        setErrorMsg(error.message);
      } else {
        // If email confirmation is required
        if (authData?.user?.identities?.length === 0) {
          setSuccessMsg(t('registrationSuccess') + ' ' + t('emailConfirmationSent', { email: data.email }));
          // Wait 3 seconds before redirecting to login
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          // If email confirmation is not required, auto-login and redirect to dashboard
          setSuccessMsg(t('redirectingToDashboard'));
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    register,
    handleSubmit,
    watch,
    errors,
    isValid,
    errorMsg,
    isLoading,
    successMsg,
    onSubmit
  };
}; 