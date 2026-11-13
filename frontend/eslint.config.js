import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: [
      'src/components/categories/CategoryFormDialog.jsx',
      'src/components/contact/ContactFormDialog.jsx',
      'src/components/expenses/ExpensesFormDialog.jsx',
      'src/components/inventory/StockAdjustDialog.jsx',
      'src/components/pos/PaymentDialog.jsx',
      'src/components/products/ProductFormDialog.jsx',
      'src/components/ui/carousel.jsx',
      'src/components/ui/use-responsive-image.jsx',
      'src/hooks/use-mobile.jsx',
      'src/lib/AuthContext.jsx',
      'src/pages/Settings.jsx',
    ],
    rules: {
      // These components intentionally reset local form/UI state when their
      // controlling props change (for example, when a dialog is reopened).
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/components/ui/**/*.jsx', 'src/lib/AuthContext.jsx'],
    rules: {
      // UI primitives and the auth module export related helpers alongside
      // components as part of their public API.
      'react-refresh/only-export-components': 'off',
    },
  },
])
