'use strict'

import antfu from '@antfu/eslint-config'

export default antfu({}, {
  rules: {
    'jsdoc/require-property-description': ['off'],
    'jsdoc/require-returns-description': ['off'],
    'vitest/no-import-node-test': ['off'],
  },
})
