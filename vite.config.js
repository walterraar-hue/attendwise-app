import { defineConfig } from 'vite'
import { avatarkitVitePlugin } from '@spatius/avatarkit/vite'
export default defineConfig({ plugins:[avatarkitVitePlugin()], build:{outDir:'dist'} })
