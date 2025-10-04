import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-plugin-prettier'

export default [
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
        process: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      prettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      
      // React rules
      'react/react-in-jsx-scope': 'off', // Not needed for React 17+
      'react/prop-types': 'warn',
      'react/jsx-uses-react': 'off', // Not needed for React 17+
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-undef': 'error',
      'react/no-unused-state': 'warn',
      'react/no-direct-mutation-state': 'error',
      
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // General rules
      'no-unused-vars': 'warn',
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Prettier integration
      'prettier/prettier': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ignores: ['build/**', 'dist/**', 'node_modules/**'],
  },
]
