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
| `invitacion-productora.html` | Invite user |

Los correos salen por SMTP de Resend (smtp.resend.com:465, usuario `resend`)
desde `Aforiq <no-reply@aforiq.cl>`.

La invitación es la única que usa `{{ .RedirectTo }}` en vez de `{{ .SiteURL }}`:
la envía el panel admin y vuelve a `admin.aforiq.cl/auth/confirm/` (o
`localhost:3001` en local). Por eso `https://admin.aforiq.cl/**` y
`http://localhost:3001/**` deben estar en Authentication → URL Configuration →
Redirect URLs.
