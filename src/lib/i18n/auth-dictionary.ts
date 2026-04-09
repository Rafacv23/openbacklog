import type { SupportedLocale } from "@/lib/locales"

export type AuthFormMode = "login" | "register"

export type AuthPageDictionary = {
  common: {
    backToHome: string
    dividerText: string
  }
  providers: {
    google: string
    github: string
    unavailable: string
  }
  form: {
    emailLabel: string
    emailPlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    confirmPasswordLabel: string
    confirmPasswordPlaceholder: string
  }
  states: {
    submitting: string
    sending: string
    resetting: string
  }
  errors: {
    generic: string
    invalidCredentials: string
    emailAlreadyInUse: string
    passwordTooShort: string
    passwordTooLong: string
    passwordMismatch: string
    providerNotEnabled: string
    emailNotVerified: string
    invalidResetToken: string
  }
  messages: {
    verificationEmailSent: string
    registrationCheckInbox: string
    passwordResetEmailSent: string
    passwordResetSuccess: string
    emailVerifiedSuccess: string
  }
  login: {
    metaTitle: string
    metaDescription: string
    title: string
    subtitle: string
    submit: string
    alternatePrompt: string
    alternateAction: string
    forgotPassword: string
    resendVerification: string
  }
  register: {
    metaTitle: string
    metaDescription: string
    title: string
    subtitle: string
    submit: string
    alternatePrompt: string
    alternateAction: string
  }
  forgotPassword: {
    metaTitle: string
    metaDescription: string
    title: string
    subtitle: string
    submit: string
    backToLogin: string
  }
  resetPassword: {
    metaTitle: string
    metaDescription: string
    title: string
    subtitle: string
    submit: string
    requestNewLink: string
  }
}

const authDictionaries: Record<SupportedLocale, AuthPageDictionary> = {
  en: {
    common: {
      backToHome: "Back to home",
      dividerText: "or",
    },
    providers: {
      google: "Continue with Google",
      github: "Continue with GitHub",
      unavailable: "Social login is currently unavailable.",
    },
    form: {
      emailLabel: "Email",
      emailPlaceholder: "you@email.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      confirmPasswordLabel: "Confirm password",
      confirmPasswordPlaceholder: "Re-enter your password",
    },
    states: {
      submitting: "Processing...",
      sending: "Sending...",
      resetting: "Updating...",
    },
    errors: {
      generic: "We could not complete the request. Please try again.",
      invalidCredentials: "Invalid email or password.",
      emailAlreadyInUse: "That email is already registered.",
      passwordTooShort: "Password must be at least 10 characters.",
      passwordTooLong: "Password is too long.",
      passwordMismatch: "Passwords do not match.",
      providerNotEnabled: "This provider is not configured yet.",
      emailNotVerified:
        "Your email is not verified yet. Check your inbox to continue.",
      invalidResetToken: "This reset link is invalid or expired.",
    },
    messages: {
      verificationEmailSent: "Verification email sent. Check your inbox.",
      registrationCheckInbox:
        "Account created. Verify your email before signing in.",
      passwordResetEmailSent:
        "If the email exists, we just sent password reset instructions.",
      passwordResetSuccess:
        "Password updated. You can now sign in with your new password.",
      emailVerifiedSuccess: "Email verified. You can sign in now.",
    },
    login: {
      metaTitle: "Log In | OpenBacklog",
      metaDescription:
        "Access your OpenBacklog account and continue managing your game backlog.",
      title: "Welcome back",
      subtitle: "Sign in with your email and password.",
      submit: "Log in",
      alternatePrompt: "Don't have an account?",
      alternateAction: "Create account",
      forgotPassword: "Forgot your password?",
      resendVerification: "Resend verification email",
    },
    register: {
      metaTitle: "Create Account | OpenBacklog",
      metaDescription:
        "Create your OpenBacklog account to start tracking and finishing more games.",
      title: "Create your account",
      subtitle: "Use your email and password to get started.",
      submit: "Create account",
      alternatePrompt: "Already have an account?",
      alternateAction: "Log in",
    },
    forgotPassword: {
      metaTitle: "Recover Password | OpenBacklog",
      metaDescription:
        "Request a secure password reset link for your OpenBacklog account.",
      title: "Recover your password",
      subtitle: "We will send you a link to set a new password.",
      submit: "Send reset link",
      backToLogin: "Back to login",
    },
    resetPassword: {
      metaTitle: "Set New Password | OpenBacklog",
      metaDescription:
        "Set a new password for your OpenBacklog account using your recovery token.",
      title: "Set a new password",
      subtitle: "Choose a strong password with at least 10 characters.",
      submit: "Update password",
      requestNewLink: "Request a new reset link",
    },
  },
  es: {
    common: {
      backToHome: "Volver al inicio",
      dividerText: "o",
    },
    providers: {
      google: "Continuar con Google",
      github: "Continuar con GitHub",
      unavailable: "El acceso social no esta disponible ahora mismo.",
    },
    form: {
      emailLabel: "Correo electronico",
      emailPlaceholder: "tu@email.com",
      passwordLabel: "Contrasena",
      passwordPlaceholder: "Introduce tu contrasena",
      confirmPasswordLabel: "Confirmar contrasena",
      confirmPasswordPlaceholder: "Repite tu contrasena",
    },
    states: {
      submitting: "Procesando...",
      sending: "Enviando...",
      resetting: "Actualizando...",
    },
    errors: {
      generic: "No hemos podido completar la solicitud. Intentalo de nuevo.",
      invalidCredentials: "Correo o contrasena incorrectos.",
      emailAlreadyInUse: "Ese correo ya esta registrado.",
      passwordTooShort: "La contrasena debe tener al menos 10 caracteres.",
      passwordTooLong: "La contrasena es demasiado larga.",
      passwordMismatch: "Las contrasenas no coinciden.",
      providerNotEnabled: "Este proveedor aun no esta configurado.",
      emailNotVerified:
        "Tu correo aun no esta verificado. Revisa tu bandeja de entrada.",
      invalidResetToken: "Este enlace de recuperacion es invalido o ha caducado.",
    },
    messages: {
      verificationEmailSent:
        "Correo de verificacion enviado. Revisa tu bandeja de entrada.",
      registrationCheckInbox:
        "Cuenta creada. Verifica tu correo antes de iniciar sesion.",
      passwordResetEmailSent:
        "Si el correo existe, acabamos de enviar instrucciones para recuperar la contrasena.",
      passwordResetSuccess:
        "Contrasena actualizada. Ya puedes iniciar sesion con la nueva.",
      emailVerifiedSuccess: "Correo verificado. Ya puedes iniciar sesion.",
    },
    login: {
      metaTitle: "Iniciar Sesion | OpenBacklog",
      metaDescription:
        "Accede a tu cuenta de OpenBacklog y sigue gestionando tu backlog de juegos.",
      title: "Bienvenido de nuevo",
      subtitle: "Inicia sesion con tu correo y contrasena.",
      submit: "Iniciar sesion",
      alternatePrompt: "No tienes cuenta?",
      alternateAction: "Crear cuenta",
      forgotPassword: "Olvidaste tu contrasena?",
      resendVerification: "Reenviar correo de verificacion",
    },
    register: {
      metaTitle: "Crear Cuenta | OpenBacklog",
      metaDescription:
        "Crea tu cuenta de OpenBacklog para empezar a organizar y terminar mas juegos.",
      title: "Crea tu cuenta",
      subtitle: "Empieza con tu correo y una contrasena.",
      submit: "Crear cuenta",
      alternatePrompt: "Ya tienes cuenta?",
      alternateAction: "Iniciar sesion",
    },
    forgotPassword: {
      metaTitle: "Recuperar Contrasena | OpenBacklog",
      metaDescription:
        "Solicita un enlace seguro para restablecer la contrasena de tu cuenta OpenBacklog.",
      title: "Recupera tu contrasena",
      subtitle: "Te enviaremos un enlace para definir una nueva contrasena.",
      submit: "Enviar enlace",
      backToLogin: "Volver a iniciar sesion",
    },
    resetPassword: {
      metaTitle: "Nueva Contrasena | OpenBacklog",
      metaDescription:
        "Define una nueva contrasena para tu cuenta de OpenBacklog usando tu token de recuperacion.",
      title: "Define una nueva contrasena",
      subtitle: "Elige una contrasena segura de al menos 10 caracteres.",
      submit: "Actualizar contrasena",
      requestNewLink: "Solicitar un nuevo enlace",
    },
  },
}

export function getAuthDictionary(locale: SupportedLocale): AuthPageDictionary {
  return authDictionaries[locale]
}
