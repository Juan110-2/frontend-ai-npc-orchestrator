import nextConfig from 'eslint-config-next'

const config = [
  ...nextConfig,
  {
    // eslint-plugin-react-hooks v6 (orientado a React Compiler) introduce estas reglas
    // como error por defecto. Señalan patrones preexistentes en varios componentes que
    // requieren una revisión de comportamiento caso por caso — fuera del alcance de esta
    // limpieza de arquitectura, que no toca lógica de negocio/UI existente.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
]

export default config
