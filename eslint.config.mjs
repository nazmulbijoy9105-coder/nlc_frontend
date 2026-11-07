const config = [
  {
    ignores: ['node_modules/', '.next/', 'out/', 'build/'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-location-assign-relative-destination': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  },
];

export default config;
