import * as React from "react";
import { cn } from "../../lib/utils";
const Form = ({ className, ...props }: React.HTMLAttributes<HTMLFormElement>) => ( <form className={cn("space-y-4", className)} {...props} /> );
Form.displayName = "Form";
const FormField = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => ( <div className={cn("space-y-2", className)} {...props} /> );
FormField.displayName = "FormField";
export { Form, FormField };