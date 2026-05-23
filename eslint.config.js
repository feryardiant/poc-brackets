'use strict'

import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['test/reports'],
}, {
  rules: {
    'jsdoc/require-property-description': ['off'],
    'jsdoc/require-returns-description': ['off'],
    'node/prefer-global/process': ['off'],
  },
})
