# Plantillas de correo de Supabase Auth

Se pegan a mano en Supabase → Authentication → Emails → Templates (el asunto
va en `*.subject.txt`). Los enlaces apuntan a `/auth/confirm/` del sitio, que
valida el token en el servidor: así funcionan en cualquier dispositivo.

| Archivo | Plantilla en Supabase |
|---|---|
| `confirmar-cuenta.html` | Confirm signup |
| `restablecer-contrasena.html` | Reset Password |
| `cambio-correo.html` | Change Email Address |
| `enlace-acceso.html` | Magic Link |

Los correos salen por SMTP de Resend (smtp.resend.com:465, usuario `resend`)
desde `Aforiq <no-reply@aforiq.cl>`.
