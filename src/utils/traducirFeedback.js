export const traducirFeedback = (feedback) => {
    if (!feedback) return "";
  
    // Traducciones manuales
    
  const traducciones = {
    "This is a top-10 common password": "Esta es una de las 10 contraseñas más comunes",
    "This is a top-100 common password": "Esta es una de las 100 contraseñas más comunes",
    "This is a very common password": "Esta es una contraseña muy común",
    "This is similar to a commonly used password": "Esta contraseña es similar a una muy usada",
    "A word by itself is easy to guess": "Una sola palabra es fácil de adivinar",
    "Names and surnames by themselves are easy to guess": "Los nombres y apellidos solos son fáciles de adivinar",
    "Dates are often easy to guess": "Las fechas son muy fáciles de adivinar",
    "Repeats like \"aaa\" are easy to guess": "Repeticiones como \"aaa\" son fáciles de adivinar",
    "Sequences like abc or 6543 are easy to guess": "Secuencias como abc o 6543 son fáciles de adivinar",
    "Recent years are easy to guess": "Los años recientes son fáciles de adivinar",
    "Straight rows of keys are easy to guess": "Filas rectas del teclado son fáciles de adivinar",
    "Short keyboard patterns are easy to guess": "Patrones cortos de teclado son fáciles de adivinar",
    "Use a longer keyboard pattern with more turns": "Usa un patrón de teclado más largo con más giros",
    "Common names and surnames are easy to guess": "Los nombres y apellidos comunes son fáciles de adivinar",
    "Add another word or two. Uncommon words are better": "Agrega otra palabra o dos. Es mejor usar palabras poco comunes",
    "Use a few words, avoid common phrases": "Usa varias palabras, evita frases comunes",
    "No need for symbols, digits, or uppercase letters": "No hace falta usar símbolos, dígitos o letras mayúsculas",
    "Capitalization doesn't help very much": "El uso de mayúsculas no ayuda demasiado",
    "All-uppercase is almost as easy to guess as all-lowercase": "Todo en mayúsculas es casi tan fácil de adivinar como todo en minúsculas",
    "Reversed words aren't much harder to guess": "Las palabras invertidas no son mucho más difíciles de adivinar",
    "Substitutions like '@' instead of 'a' don't help very much": "Sustituciones como '@' en lugar de 'a' no ayudan mucho"
  };
  
    return traducciones[feedback] || feedback; // Si no la encuentra, devuelve el feedback original
  };


export const firebaseErrorMessages = (msj) => {
  const traducciones = {
    "Firebase: Error (auth/invalid-credential).": "Credenciales incorrectas",
    "Firebase: Error (auth/user-not-found).": "No existe un usuario con ese correo electrónico",
    "Firebase: Error (auth/wrong-password).": "Contraseña incorrecta",
    "Firebase: Error (auth/invalid-email).": "Correo electrónico inválido",
    "Firebase: Error (auth/user-disabled).": "Usuario deshabilitado",
    "Firebase: Error (auth/too-many-requests).": "Demasiados intentos. Intenta más tarde",
    "Firebase: Error (auth/network-request-failed).": "Error de red. Verifica tu conexión a internet",
    "Firebase: Error (auth/operation-not-allowed).": "Tipo de autenticación no habilitado",
    "Firebase: Error (auth/internal-error).": "Error interno. Intenta nuevamente",
    "Firebase: Error (auth/missing-email).": "Debes ingresar un correo electrónico",
    "Firebase: Error (auth/missing-password).": "Debes ingresar una contraseña",
    "Firebase: Error (auth/invalid-password).": "Contraseña inválida",
    "Firebase: Error (auth/email-already-in-use).": "El correo ya está registrado",
    "Firebase: Error (auth/weak-password).": "La contraseña es demasiado débil"
  };

  return traducciones[msj] || "Error inesperado";
}
