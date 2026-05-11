import { useRef, useState } from 'react';
import { Modal, Input, Button } from '../common';
import { getUserByCredentials, registerUser, isErrorResponse } from '../../services/api';
import { useUser } from '../../hooks/useUser';
import toast from 'react-hot-toast';

interface UserIdentificationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserIdentification = ({ isOpen, onClose, onSuccess }: UserIdentificationProps) => {
  const { setUser } = useUser();
  
  // Refs for uncontrolled inputs
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // UI state that requires re-renders
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Accessing values directly from refs
    const nameValue = nameRef.current?.value || '';
    const emailValue = emailRef.current?.value || '';

    if (!nameValue.trim() || !emailValue.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!validateEmail(emailValue.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const trimmedName = nameValue.trim();
      const trimmedEmail = emailValue.trim();

      if (isNewUser) {
        const result = await registerUser({ name: trimmedName, email: trimmedEmail });
        
        if (isErrorResponse(result)) {
          toast.error(result.details || result.error);
          return;
        }
        
        setUser(result);
        toast.success('Account created successfully!');
        onSuccess();
        onClose();
      } else {
        const result = await getUserByCredentials(trimmedName, trimmedEmail);
        
        if (isErrorResponse(result)) {
          toast.error('User not found. Please register or check your credentials.');
          setIsNewUser(true);
          return;
        }
        
        setUser(result);
        toast.success(`Welcome back, ${result.name}!`);
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.details || error.error || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Manually clearing refs if needed, though closing the modal 
    // usually unmounts/resets them anyway
    if (nameRef.current) nameRef.current.value = '';
    if (emailRef.current) emailRef.current.value = '';
    setIsNewUser(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isNewUser ? 'Create Account' : 'Sign In'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-star-white/70 text-sm mb-4">
          {isNewUser
            ? 'Create an account to book your flight'
            : 'Enter your name and email to continue'}
        </p>

        {/* 
          Note: Ensure your 'Input' component forwards the ref 
          using React.forwardRef or accepts a 'ref' prop.
        */}
        <Input
          label="Name"
          type="text"
          placeholder="John Doe"
          ref={nameRef}
          required
        />

        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          ref={emailRef}
          required
        />

        <div className="flex flex-col gap-3 pt-4">
          <Button type="submit" isLoading={isLoading} className="w-full">
            {isNewUser ? 'Create Account' : 'Continue'}
          </Button>

          <button
            type="button"
            onClick={() => setIsNewUser(!isNewUser)}
            className="text-sm text-cosmic-purple hover:text-nebula-pink transition-colors"
          >
            {isNewUser
              ? 'Already have an account? Sign in'
              : "Don't have an account? Register"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
