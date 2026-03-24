import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Link } from "react-router"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Войти в аккаунт</h1>
          <p className="text-sm text-balance text-muted-foreground">
           Введите ваш email ниже, чтобы войти в ваш аккаунт
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Почта</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Пароль</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Забыли пароль?
            </a>
          </div>
          <Input id="password" type="password" required />
        </Field>
        <Field>
          <Button type="submit">Войти</Button>
        </Field>
        <Field>
          <FieldDescription className="text-center">
            Нет аккаунта?{" "}
            <Link to="/register" className="underline underline-offset-4">
              Зарегистрироваться
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
