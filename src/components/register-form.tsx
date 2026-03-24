import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "react-router";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Создайте аккаунт</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Заполните форму, чтобы создать новый аккаунт. Это займет всего несколько минут.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="name">Фамилия и Имя</FieldLabel>
          <Input id="name" type="text" placeholder="Майкл Джексон" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Почта</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Пароль</FieldLabel>
          <Input id="password" type="password" required />
          <FieldDescription>
            Минимум 8 символов, включая заглавные буквы, цифры и специальные символы.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">Подтвердите пароль</FieldLabel>
          <Input id="confirm-password" type="password" required />
          <FieldDescription>Пожалуйста, подтвердите ваш пароль.</FieldDescription>
        </Field>
        <Field>
          <Button type="submit" className="cursor-pointer">Создать аккаунт</Button>
        </Field>
				<Field>
          <FieldDescription className="px-6 text-center">
            Уже есть аккаунт? <Link to="/login" className="underline underline-offset-4">Войти</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
