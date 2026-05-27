/**
 * index.ts — Entry point do app Expo
 *
 * Registra o componente raiz (App) usando registerRootComponent.
 * Isso garante que o app funciona tanto no Expo Go quanto em builds nativos.
 */
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
