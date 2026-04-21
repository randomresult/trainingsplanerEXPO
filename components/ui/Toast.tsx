import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner-native';

export const Toaster = SonnerToaster;

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast(message),
  dismiss: () => sonnerToast.dismiss(),
};
