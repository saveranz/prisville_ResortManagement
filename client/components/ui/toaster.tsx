import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  const getIcon = (variant?: string) => {
    switch (variant) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />;
      case "destructive":
        return <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />;
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="flex items-start gap-3 w-full">
              {getIcon(props.variant)}
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
