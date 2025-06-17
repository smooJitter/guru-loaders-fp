export default {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      modules: false
    }]
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-transform-modules-commonjs'
  ],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: 'commonjs'
        }]
      ],
      plugins: [
        '@babel/plugin-transform-modules-commonjs'
      ]
    }
  }
}; 